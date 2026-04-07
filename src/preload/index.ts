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
    ipcRenderer.invoke('get-exercise-solution', labId, exerciseIndex),
  // Content pull APIs
  getContentFeed: (filters: Record<string, unknown>) => ipcRenderer.invoke('get-content-feed', filters),
  toggleBookmark: (articleId: number) => ipcRenderer.invoke('toggle-bookmark', articleId),
  dismissArticle: (articleId: number) => ipcRenderer.invoke('dismiss-article', articleId),
  getContentStats: () => ipcRenderer.invoke('get-content-stats'),
  getContentSources: () => ipcRenderer.invoke('get-content-sources'),
  updateContentSource: (source: string, enabled: boolean, topics: string[]) =>
    ipcRenderer.invoke('update-content-source', source, enabled, topics),
  refreshContent: () => ipcRenderer.invoke('refresh-content'),
  onContentUpdated: (callback: (result: unknown) => void) => {
    ipcRenderer.on('content-updated', (_event, result) => callback(result))
    return () => { ipcRenderer.removeAllListeners('content-updated') }
  },
  // Project track APIs
  getProjectTracks: () => ipcRenderer.invoke('get-project-tracks'),
  getProjectTrack: (trackId: string) => ipcRenderer.invoke('get-project-track', trackId),
  activateProjectTrack: (trackId: string) => ipcRenderer.invoke('activate-project-track', trackId),
  deactivateProjectTrack: (trackId: string) => ipcRenderer.invoke('deactivate-project-track', trackId),
  completeMilestone: (trackId: string, milestoneId: string) =>
    ipcRenderer.invoke('complete-milestone', trackId, milestoneId),
  // Dashboard & review APIs
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  getSkillTree: () => ipcRenderer.invoke('get-skill-tree'),
  getDueReviewCards: (limit?: number) => ipcRenderer.invoke('get-due-review-cards', limit || 10),
  submitReview: (cardId: number, quality: number) => ipcRenderer.invoke('submit-review', cardId, quality),
  generateReviewCards: (lessonDefId: string) => ipcRenderer.invoke('generate-review-cards', lessonDefId),
  // Phase 6: Dynamic curriculum & notes
  generateTierCurriculum: (tierId: number) => ipcRenderer.invoke('generate-tier-curriculum', tierId),
  saveLessonNote: (lessonDefId: string, content: string) =>
    ipcRenderer.invoke('save-lesson-note', lessonDefId, content),
  getLessonNote: (lessonDefId: string) => ipcRenderer.invoke('get-lesson-note', lessonDefId),
  getLessonRecommendations: (lessonDefId: string, tierId: number) =>
    ipcRenderer.invoke('get-lesson-recommendations', lessonDefId, tierId),
  getWhatsNext: () => ipcRenderer.invoke('get-whats-next')
}

contextBridge.exposeInMainWorld('api', api)

export type CortexAPI = typeof api
