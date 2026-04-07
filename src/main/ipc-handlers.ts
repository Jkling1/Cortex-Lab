import { ipcMain } from 'electron'
import {
  getUserState,
  saveApiKey,
  markLessonComplete,
  getTierProgress,
  getLatestGeneratedLesson,
  saveGeneratedLesson
} from './database'
import { generateLesson } from './lesson-generator'
import { tiers } from '../../curriculum/tiers'
import { LessonDefinition } from '../../curriculum/types'

function findLessonDef(lessonDefId: string): LessonDefinition | undefined {
  for (const tier of tiers) {
    const lesson = tier.lessons.find(l => l.id === lessonDefId)
    if (lesson) return lesson
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
}
