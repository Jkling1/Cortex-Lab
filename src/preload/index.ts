import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getUserState: () => ipcRenderer.invoke('get-user-state'),
  getCurriculum: () => ipcRenderer.invoke('get-curriculum'),
  getCurrentLesson: () => ipcRenderer.invoke('get-current-lesson'),
  generateLesson: (lessonDefId: string) => ipcRenderer.invoke('generate-lesson', lessonDefId),
  markComplete: (lessonDefId: string) => ipcRenderer.invoke('mark-complete', lessonDefId),
  getTierProgress: (tierId: number) => ipcRenderer.invoke('get-tier-progress', tierId),
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key),
  // Lab APIs
  getLabsForTier: (tierId: number) => ipcRenderer.invoke('get-labs-for-tier', tierId),
  getLab: (labId: string) => ipcRenderer.invoke('get-lab', labId),
  runLabExercise: (labId: string, exerciseIndex: number, code: string) =>
    ipcRenderer.invoke('run-lab-exercise', labId, exerciseIndex, code),
  getExerciseHint: (labId: string, exerciseIndex: number, hintIndex: number) =>
    ipcRenderer.invoke('get-exercise-hint', labId, exerciseIndex, hintIndex),
  getExerciseSolution: (labId: string, exerciseIndex: number) =>
    ipcRenderer.invoke('get-exercise-solution', labId, exerciseIndex)
}

contextBridge.exposeInMainWorld('api', api)

export type CortexAPI = typeof api
