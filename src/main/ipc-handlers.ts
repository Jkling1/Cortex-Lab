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
  updateContentSource
} from './database'
import { generateLesson } from './lesson-generator'
import { runPythonLab } from './lab-runner'
import { runContentPull } from './content-pulls/scheduler'
import { tiers } from '../../curriculum/tiers'
import { LessonDefinition, LabDefinition, ContentFeedFilters } from '../../curriculum/types'

function findLessonDef(lessonDefId: string): LessonDefinition | undefined {
  for (const tier of tiers) {
    const lesson = tier.lessons.find(l => l.id === lessonDefId)
    if (lesson) return lesson
  }
  return undefined
}

function findLabDef(labId: string): LabDefinition | undefined {
  for (const tier of tiers) {
    const lab = tier.labs.find(l => l.id === labId)
    if (lab) return lab
  }
  return undefined
}

export function registerIpcHandlers(): void {
  ipcMain.handle('get-user-state', () => {
    return getUserState()
  })

  ipcMain.handle('get-curriculum', () => {
    return tiers.map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      estimatedHours: t.estimatedHours,
      lessonCount: t.lessons.length,
      prerequisites: t.prerequisites
    }))
  })

  ipcMain.handle('get-current-lesson', () => {
    const state = getUserState()
    const tier = tiers.find(t => t.id === state.currentTierId)
    if (!tier) return null

    const lessonDef = tier.lessons.find(l => l.order === state.currentLessonOrder)
    if (!lessonDef) return null

    const cached = getLatestGeneratedLesson(lessonDef.id)
    return {
      definition: lessonDef,
      generated: cached,
      tierName: tier.name
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

  ipcMain.handle('mark-complete', (_event, lessonDefId: string) => {
    const lessonDef = findLessonDef(lessonDefId)
    if (!lessonDef) {
      throw new Error(`Lesson definition not found: ${lessonDefId}`)
    }

    markLessonComplete(lessonDefId, lessonDef.tierId)
    return getUserState()
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
    return tier.labs.map(lab => {
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
}
