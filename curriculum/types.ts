export interface Tier {
  id: number
  name: string
  description: string
  prerequisites: number[]
  estimatedHours: number
  lessons: LessonDefinition[]
  labs: LabDefinition[]
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

// Phase 2: Labs

export type LabDifficulty = 'guided' | 'build' | 'freeform'

export interface LabExercise {
  id: string
  instructions: string
  starterCode: string
  solution: string
  hints: string[]
  validationCode: string
}

export interface LabDefinition {
  id: string
  tierId: number
  title: string
  description: string
  difficulty: LabDifficulty
  relatedLessonIds: string[]
  estimatedMinutes: number
  prerequisites: string[]
  setupInstructions: string
  exercises: LabExercise[]
}

export interface LabSubmission {
  id?: number
  labId: string
  exerciseIndex: number
  code: string
  passed: boolean
  output: string
  errors: string
  submittedAt: string
}

export interface LabProgress {
  labId: string
  tierId: number
  status: 'not_started' | 'in_progress' | 'completed'
  exercisesCompleted: number
  totalExercises: number
  completedAt: string | null
}
