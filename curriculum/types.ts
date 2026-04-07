export interface Tier {
  id: number
  name: string
  description: string
  prerequisites: number[]
  estimatedHours: number
  lessons: LessonDefinition[]
}

export interface LessonDefinition {
  id: string
  tierId: number
  title: string
  description: string
  order: number
  concepts: string[]
  objectives: string[]
  estimatedMinutes: number
}

export interface GeneratedLesson {
  id?: number
  lessonDefId: string
  content: string
  keyTakeaways: string[]
  reviewQuestions: string[]
  generatedAt: string
}

export interface UserState {
  currentTierId: number
  currentLessonOrder: number
  streakDays: number
  lastActiveDate: string | null
  apiKey: string | null
}

export interface LessonProgress {
  lessonDefId: string
  tierId: number
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt: string | null
}

export interface TierProgress {
  tierId: number
  tierName: string
  totalLessons: number
  completedLessons: number
}
