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

// Phase 3: Content Pulls

export type ContentSource = 'arxiv' | 'huggingface'

export interface ContentArticle {
  id?: number
  source: ContentSource
  externalId: string
  title: string
  summary: string
  authors: string[]
  url: string
  tags: string[]
  publishedAt: string
  fetchedAt: string
  relevanceScore: number
  bookmarked: boolean
  dismissed: boolean
}

export interface ContentFeedFilters {
  source?: ContentSource
  bookmarkedOnly?: boolean
  searchQuery?: string
  limit?: number
  offset?: number
}

export interface ContentSourceConfig {
  source: ContentSource
  enabled: boolean
  topics: string[]
}

export interface ContentStats {
  totalArticles: number
  arxivCount: number
  huggingfaceCount: number
  bookmarkedCount: number
  lastFetchedAt: string | null
}

// Phase 4: Project Tracks

export interface ProjectMilestone {
  id: string
  title: string
  description: string
  order: number
  relatedLessonIds: string[]
  relatedLabIds: string[]
  relatedTierIds: number[]
  deliverable: string
  checkpoints: string[]
}

export interface ProjectTrack {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  color: string
  milestones: ProjectMilestone[]
}

export interface ProjectTrackProgress {
  trackId: string
  activeTrack: boolean
  currentMilestoneOrder: number
  milestonesCompleted: number
  totalMilestones: number
  completedMilestoneIds: string[]
  startedAt: string | null
  completedAt: string | null
}

// Phase 5: Dashboard & Spaced Repetition

export interface ReviewCard {
  id?: number
  lessonDefId: string
  concept: string
  question: string
  answer: string
  nextReviewAt: string
  interval: number
  easeFactor: number
  reviewCount: number
  lastReviewedAt: string | null
}

export interface ReviewResult {
  cardId: number
  quality: number  // 0-5 (SM-2 scale)
}

export interface DashboardStats {
  currentTierId: number
  currentTierName: string
  currentLessonOrder: number
  totalLessonsInTier: number
  streakDays: number
  totalLessonsCompleted: number
  totalLabsCompleted: number
  totalHoursEstimated: number
  activeProjectTracks: number
  reviewCardsDue: number
  conceptsMastered: number
  conceptsInReview: number
}

export interface SkillTreeNode {
  id: number
  name: string
  description: string
  lessonsTotal: number
  lessonsCompleted: number
  labsTotal: number
  labsCompleted: number
  prerequisites: number[]
  status: 'locked' | 'available' | 'in_progress' | 'completed'
}

// Phase 6: Dynamic Curriculum & Adaptive Intelligence

export interface DynamicTierContent {
  tierId: number
  lessons: LessonDefinition[]
  labs: LabDefinition[]
  generatedAt: string
}

export interface LessonNote {
  id?: number
  lessonDefId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface LessonRecommendations {
  relatedLab: { id: string; title: string } | null
  relatedProjectMilestones: { trackId: string; trackName: string; milestoneTitle: string }[]
  reviewCardsDue: number
  nextLesson: { id: string; title: string; tierId: number } | null
}
