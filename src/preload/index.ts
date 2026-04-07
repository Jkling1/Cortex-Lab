import { contextBridge, ipcRenderer } from 'electron'

const api = {
  getUserState: () => ipcRenderer.invoke('get-user-state'),
  getCurriculum: () => ipcRenderer.invoke('get-curriculum'),
  getCurrentLesson: () => ipcRenderer.invoke('get-current-lesson'),
  generateLesson: (lessonDefId: string) => ipcRenderer.invoke('generate-lesson', lessonDefId),
  markComplete: (lessonDefId: string) => ipcRenderer.invoke('mark-complete', lessonDefId),
  getTierProgress: (tierId: number) => ipcRenderer.invoke('get-tier-progress', tierId),
  saveApiKey: (key: string) => ipcRenderer.invoke('save-api-key', key)
}

contextBridge.exposeInMainWorld('api', api)

export type CortexAPI = typeof api
