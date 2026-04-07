import { ipcMain } from 'electron'
import {
  getUserState,
  saveApiKey,
  markLessonComplete,
  getTierProgress,
  getLatestGeneratedLesson,
  saveGeneratedLesson,
  getLabProgress,
  updateLabProgress,
  saveLabSubmission,
  getLatestSubmissionForExercise,
  getContentFeed,
  toggleBookmark,
  dismissArticle,
  getContentStats,
  getContentSources,
  updateContentSource,
  getTrackProgress,
  activateTrack,
  deactivateTrack,
  completeMilestone,
  getAllTrackProgress,
  addReviewCards,
  getDueReviewCards,
  reviewCard,
  getDashboardStats,
  getSkillTree,
  hasReviewCardsForLesson,
  getDynamicTierContent,
  saveDynamicTierContent,
  hasDynamicContent,
  getNote,
  saveNote,
  getLessonRecommendations,
  getEffectiveLessonsForTier
} from './database'
import { generateLesson, generateReviewCardsFromContent } from './lesson-generator'
import { generateTierCurriculum } from './curriculum-generator'
import { runPythonLab } from './lab-runner'
import { runContentPull } from './content-pulls/scheduler'
import { tiers } from '../../curriculum/tiers'
import { projectTracks } from '../../curriculum/project-tracks'
import { LessonDefinition, LabDefinition, ContentFeedFilters } from '../../curriculum/types'

function findLessonDef(lessonDefId: string): LessonDefinition | undefined {
  // Check static tiers first
  for (const tier of tiers) {
    const lesson = tier.lessons.find(l => l.id === lessonDefId)
    if (lesson) return lesson
  }
  // Check dynamic content
  for (const tier of tiers) {
    const dynamic = getDynamicTierContent(tier.id)
    if (dynamic) {
      const lesson = dynamic.lessons.find(l => l.id === lessonDefId)
      if (lesson) return lesson
    }
  }
  return undefined
}

function findLabDef(labId: string): LabDefinition | undefined {
  for (const tier of tiers) {
    const lab = tier.labs.find(l => l.id === labId)
    if (lab) return lab
  }
  // Check dynamic content
  for (const tier of tiers) {
    const dynamic = getDynamicTierContent(tier.id)
    if (dynamic) {
      const lab = dynamic.labs.find(l => l.id === labId)
      if (lab) return lab
    }
  }
  return undefined
}

export function registerIpcHandlers(): void {
  ipcMain.handle('get-user-state', () => {
    return getUserState()
  })

  ipcMain.handle('get-curriculum', () => {
    return tiers.map(t => {
      const effLessons = getEffectiveLessonsForTier(t.id)
      return {
        id: t.id,
        name: t.name,
        description: t.description,
        estimatedHours: t.estimatedHours,
        lessonCount: effLessons.length,
        prerequisites: t.prerequisites,
        hasDynamic: hasDynamicContent(t.id)
      }
    })
  })

  ipcMain.handle('get-current-lesson', () => {
    const state = getUserState()
    const tier = tiers.find(t => t.id === state.currentTierId)
    if (!tier) return null

    // Check static lessons first, then dynamic
    const effLessons = getEffectiveLessonsForTier(state.currentTierId)

    if (effLessons.length === 0) {
      // No lessons for this tier — need to generate curriculum
      return {
        needsGeneration: true,
        tierId: state.currentTierId,
        tierName: tier.name,
        tierDescription: tier.description
      }
    }

    const lessonDef = effLessons.find(l => l.order === state.currentLessonOrder)
    if (!lessonDef) return null

    const cached = getLatestGeneratedLesson(lessonDef.id)
    const note = getNote(lessonDef.id)
    return {
      definition: lessonDef,
      generated: cached,
      tierName: tier.name,
      note: note?.content || ''
    }
  })

  ipcMain.handle('generate-lesson', async (_event, lessonDefId: string) => {
    const state = getUserState()
    if (!state.apiKey) {
      throw new Error('No API key configured. Please add your Claude API key in Settings.')
    }

    const lessonDef = findLessonDef(lessonDefId)
    if (!lessonDef) {
      throw new Error(`Lesson definition not found: ${lessonDefId}`)
    }

    const generated = await generateLesson(lessonDef, state, state.apiKey)
    saveGeneratedLesson(generated)
    return generated
  })

  ipcMain.handle('mark-complete', async (_event, lessonDefId: string) => {
    const lessonDef = findLessonDef(lessonDefId)
    if (!lessonDef) {
      throw new Error(`Lesson definition not found: ${lessonDefId}`)
    }

    markLessonComplete(lessonDefId, lessonDef.tierId)

    // Generate AI-powered review cards from lesson content
    if (!hasReviewCardsForLesson(lessonDefId)) {
      const state = getUserState()
      const cached = getLatestGeneratedLesson(lessonDefId)
      if (cached && state.apiKey) {
        try {
          const cards = await generateReviewCardsFromContent(
            cached.content, lessonDef.concepts, lessonDef.title, state.apiKey
          )
          if (cards.length > 0) addReviewCards(lessonDefId, cards)
        } catch {
          // Fallback to template cards
          const cards = lessonDef.concepts.map(c => ({
            concept: c,
            question: `Explain "${c}" and why it matters in ML.`,
            answer: `From "${lessonDef.title}": ${c}`
          }))
          addReviewCards(lessonDefId, cards)
        }
      } else {
        const cards = lessonDef.concepts.map(c => ({
          concept: c,
          question: `Explain "${c}" and why it matters in ML.`,
          answer: `From "${lessonDef.title}": ${c}`
        }))
        addReviewCards(lessonDefId, cards)
      }
    }

    // Return state + recommendations
    const newState = getUserState()
    const recommendations = getLessonRecommendations(lessonDefId, lessonDef.tierId)
    return { state: newState, recommendations }
  })

  ipcMain.handle('get-tier-progress', (_event, tierId: number) => {
    return getTierProgress(tierId)
  })

  ipcMain.handle('save-api-key', (_event, key: string) => {
    saveApiKey(key)
    return { success: true }
  })

  // Lab handlers

  ipcMain.handle('get-labs-for-tier', (_event, tierId: number) => {
    const tier = tiers.find(t => t.id === tierId)
    if (!tier) return []
    // Use static labs if available, otherwise dynamic
    let labsList = tier.labs
    if (labsList.length === 0) {
      const dynamic = getDynamicTierContent(tierId)
      if (dynamic) labsList = dynamic.labs
    }
    return labsList.map(lab => {
      const progress = getLabProgress(lab.id)
      return {
        id: lab.id,
        title: lab.title,
        description: lab.description,
        difficulty: lab.difficulty,
        estimatedMinutes: lab.estimatedMinutes,
        exerciseCount: lab.exercises.length,
        relatedLessonIds: lab.relatedLessonIds,
        prerequisites: lab.prerequisites,
        progress: progress || {
          labId: lab.id,
          tierId: lab.tierId,
          status: 'not_started',
          exercisesCompleted: 0,
          totalExercises: lab.exercises.length,
          completedAt: null
        }
      }
    })
  })

  ipcMain.handle('get-lab', (_event, labId: string) => {
    const lab = findLabDef(labId)
    if (!lab) return null

    const progress = getLabProgress(labId)

    // Get latest submission for each exercise
    const exerciseStates = lab.exercises.map((ex, idx) => {
      const submission = getLatestSubmissionForExercise(labId, idx)
      return {
        ...ex,
        lastSubmission: submission
      }
    })

    return {
      ...lab,
      exercises: exerciseStates,
      progress: progress || {
        labId: lab.id,
        tierId: lab.tierId,
        status: 'not_started',
        exercisesCompleted: 0,
        totalExercises: lab.exercises.length,
        completedAt: null
      }
    }
  })

  ipcMain.handle('run-lab-exercise', async (_event, labId: string, exerciseIndex: number, code: string) => {
    const lab = findLabDef(labId)
    if (!lab) throw new Error(`Lab not found: ${labId}`)
    if (exerciseIndex < 0 || exerciseIndex >= lab.exercises.length) {
      throw new Error(`Invalid exercise index: ${exerciseIndex}`)
    }

    const exercise = lab.exercises[exerciseIndex]
    const result = await runPythonLab(code, exercise.validationCode)

    // Save submission
    saveLabSubmission({
      labId,
      exerciseIndex,
      code,
      passed: result.passed,
      output: result.output,
      errors: result.errors,
      submittedAt: new Date().toISOString()
    })

    // Update lab progress if passed
    if (result.passed) {
      // Count total passed exercises (unique)
      let passedCount = 0
      for (let i = 0; i < lab.exercises.length; i++) {
        if (i === exerciseIndex) {
          passedCount++
          continue
        }
        const sub = getLatestSubmissionForExercise(labId, i)
        if (sub?.passed) passedCount++
      }
      updateLabProgress(labId, lab.tierId, passedCount, lab.exercises.length)
    }

    return result
  })

  ipcMain.handle('get-exercise-hint', (_event, labId: string, exerciseIndex: number, hintIndex: number) => {
    const lab = findLabDef(labId)
    if (!lab) throw new Error(`Lab not found: ${labId}`)

    const exercise = lab.exercises[exerciseIndex]
    if (!exercise) throw new Error(`Exercise not found: ${exerciseIndex}`)

    if (hintIndex >= exercise.hints.length) return null
    return exercise.hints[hintIndex]
  })

  ipcMain.handle('get-exercise-solution', (_event, labId: string, exerciseIndex: number) => {
    const lab = findLabDef(labId)
    if (!lab) throw new Error(`Lab not found: ${labId}`)

    const exercise = lab.exercises[exerciseIndex]
    if (!exercise) throw new Error(`Exercise not found: ${exerciseIndex}`)

    return exercise.solution
  })

  // Content pull handlers

  ipcMain.handle('get-content-feed', (_event, filters: ContentFeedFilters) => {
    return getContentFeed(filters)
  })

  ipcMain.handle('toggle-bookmark', (_event, articleId: number) => {
    return toggleBookmark(articleId)
  })

  ipcMain.handle('dismiss-article', (_event, articleId: number) => {
    dismissArticle(articleId)
    return { success: true }
  })

  ipcMain.handle('get-content-stats', () => {
    return getContentStats()
  })

  ipcMain.handle('get-content-sources', () => {
    return getContentSources()
  })

  ipcMain.handle('update-content-source', (_event, source: string, enabled: boolean, topics: string[]) => {
    updateContentSource(source, enabled, topics)
    return { success: true }
  })

  ipcMain.handle('refresh-content', async () => {
    return await runContentPull()
  })

  // Project track handlers

  ipcMain.handle('get-project-tracks', () => {
    const allProgress = getAllTrackProgress()
    return projectTracks.map(track => {
      const progress = allProgress.find(p => p.trackId === track.id)
      return {
        id: track.id,
        name: track.name,
        tagline: track.tagline,
        description: track.description,
        icon: track.icon,
        color: track.color,
        milestoneCount: track.milestones.length,
        progress: progress ? {
          ...progress,
          totalMilestones: track.milestones.length
        } : null
      }
    })
  })

  ipcMain.handle('get-project-track', (_event, trackId: string) => {
    const track = projectTracks.find(t => t.id === trackId)
    if (!track) return null

    const progress = getTrackProgress(trackId)
    const completedIds = progress?.completedMilestoneIds || []

    // For each milestone, look up related lesson/lab titles
    const milestones = track.milestones.map(m => {
      const relatedLessons = m.relatedLessonIds.map(lid => {
        for (const tier of tiers) {
          const lesson = tier.lessons.find(l => l.id === lid)
          if (lesson) return { id: lid, title: lesson.title, tierId: tier.id }
        }
        return { id: lid, title: lid, tierId: 0 }
      })

      const relatedLabs = m.relatedLabIds.map(lid => {
        for (const tier of tiers) {
          const lab = tier.labs.find(l => l.id === lid)
          if (lab) return { id: lid, title: lab.title, tierId: tier.id }
        }
        return { id: lid, title: lid, tierId: 0 }
      })

      const relatedTiers = m.relatedTierIds.map(tid => {
        const tier = tiers.find(t => t.id === tid)
        return { id: tid, name: tier?.name || `Tier ${tid}` }
      })

      return {
        ...m,
        completed: completedIds.includes(m.id),
        relatedLessons,
        relatedLabs,
        relatedTiers
      }
    })

    return {
      ...track,
      milestones,
      progress: progress ? {
        ...progress,
        totalMilestones: track.milestones.length
      } : null
    }
  })

  ipcMain.handle('activate-project-track', (_event, trackId: string) => {
    const track = projectTracks.find(t => t.id === trackId)
    if (!track) throw new Error(`Track not found: ${trackId}`)
    return activateTrack(trackId, track.milestones.length)
  })

  ipcMain.handle('deactivate-project-track', (_event, trackId: string) => {
    deactivateTrack(trackId)
    return { success: true }
  })

  ipcMain.handle('complete-milestone', (_event, trackId: string, milestoneId: string) => {
    const track = projectTracks.find(t => t.id === trackId)
    if (!track) throw new Error(`Track not found: ${trackId}`)
    return completeMilestone(trackId, milestoneId, track.milestones.length)
  })

  // Dashboard & review handlers

  ipcMain.handle('get-dashboard-stats', () => {
    return getDashboardStats()
  })

  ipcMain.handle('get-skill-tree', () => {
    return getSkillTree()
  })

  ipcMain.handle('get-due-review-cards', (_event, limit: number) => {
    return getDueReviewCards(limit || 10)
  })

  ipcMain.handle('submit-review', (_event, cardId: number, quality: number) => {
    reviewCard(cardId, quality)
    return { success: true }
  })

  ipcMain.handle('generate-review-cards', (_event, lessonDefId: string) => {
    if (hasReviewCardsForLesson(lessonDefId)) return { generated: 0 }

    const lessonDef = findLessonDef(lessonDefId)
    if (!lessonDef) return { generated: 0 }

    // Auto-generate review cards from lesson concepts and objectives
    const cards: { concept: string; question: string; answer: string }[] = []

    for (const concept of lessonDef.concepts) {
      cards.push({
        concept,
        question: `Explain the concept of "${concept}" in your own words.`,
        answer: `This relates to the lesson "${lessonDef.title}". Key concept: ${concept}.`
      })
    }

    for (let i = 0; i < Math.min(lessonDef.objectives.length, 3); i++) {
      cards.push({
        concept: lessonDef.concepts[0] || lessonDef.title,
        question: lessonDef.objectives[i],
        answer: `Objective from "${lessonDef.title}": ${lessonDef.objectives[i]}`
      })
    }

    addReviewCards(lessonDefId, cards)
    return { generated: cards.length }
  })

  // Phase 6: Dynamic curriculum & notes handlers

  ipcMain.handle('generate-tier-curriculum', async (_event, tierId: number) => {
    const state = getUserState()
    if (!state.apiKey) {
      throw new Error('No API key configured.')
    }

    const { lessons, labs } = await generateTierCurriculum(tierId, state.apiKey)
    saveDynamicTierContent(tierId, lessons, labs)
    return { lessons: lessons.length, labs: labs.length }
  })

  ipcMain.handle('save-lesson-note', (_event, lessonDefId: string, content: string) => {
    saveNote(lessonDefId, content)
    return { success: true }
  })

  ipcMain.handle('get-lesson-note', (_event, lessonDefId: string) => {
    return getNote(lessonDefId)
  })

  ipcMain.handle('get-lesson-recommendations', (_event, lessonDefId: string, tierId: number) => {
    return getLessonRecommendations(lessonDefId, tierId)
  })

  ipcMain.handle('get-whats-next', () => {
    const state = getUserState()
    const reviewStats = getDueReviewCards(1)
    const effLessons = getEffectiveLessonsForTier(state.currentTierId)
    const tier = tiers.find(t => t.id === state.currentTierId)

    const actions: { type: string; label: string; description: string }[] = []

    if (reviewStats.length > 0) {
      const dueCount = getDueReviewCards(100).length
      actions.push({
        type: 'review',
        label: `Review ${dueCount} concept${dueCount !== 1 ? 's' : ''}`,
        description: 'Strengthen your retention before learning new material.'
      })
    }

    if (effLessons.length === 0 && tier) {
      actions.push({
        type: 'generate-tier',
        label: `Generate Tier ${state.currentTierId} Curriculum`,
        description: `Unlock ${tier.name}: ${tier.description}`
      })
    } else if (effLessons.length > 0) {
      const nextLesson = effLessons.find(l => l.order === state.currentLessonOrder)
      if (nextLesson) {
        actions.push({
          type: 'lesson',
          label: `Continue: ${nextLesson.title}`,
          description: `Tier ${state.currentTierId}: ${tier?.name || ''} \u2022 Lesson ${nextLesson.order}`
        })
      }
    }

    // Check for active project tracks
    const allProgress = getAllTrackProgress()
    const activeTracks = allProgress.filter(p => p.activeTrack)
    if (activeTracks.length > 0) {
      const track = projectTracks.find(t => t.id === activeTracks[0].trackId)
      if (track) {
        actions.push({
          type: 'project',
          label: `${track.name}: Next Milestone`,
          description: track.tagline
        })
      }
    }

    return actions
  })
}
