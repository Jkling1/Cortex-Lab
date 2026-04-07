import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { UserState, LessonProgress, GeneratedLesson, TierProgress, LabProgress, LabSubmission, ContentArticle, ContentFeedFilters, ContentStats, ContentSourceConfig, ProjectTrackProgress, ReviewCard, DashboardStats, SkillTreeNode } from '../../curriculum/types'
import { tiers } from '../../curriculum/tiers'

let db: Database.Database

export function initDatabase(): void {
  const dbPath = path.join(app.getPath('userData'), 'cortex-lab.db')
  db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  migrate()
}

function migrate(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_state (
      id INTEGER PRIMARY KEY DEFAULT 1,
      current_tier_id INTEGER DEFAULT 1,
      current_lesson_order INTEGER DEFAULT 1,
      streak_days INTEGER DEFAULT 0,
      last_active_date TEXT,
      api_key TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_def_id TEXT NOT NULL UNIQUE,
      tier_id INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      completed_at TEXT,
      mastery_score INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS generated_lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_def_id TEXT NOT NULL,
      content TEXT NOT NULL,
      key_takeaways TEXT,
      review_questions TEXT,
      generated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS lab_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id TEXT NOT NULL UNIQUE,
      tier_id INTEGER NOT NULL,
      status TEXT DEFAULT 'not_started',
      exercises_completed INTEGER DEFAULT 0,
      total_exercises INTEGER NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS lab_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lab_id TEXT NOT NULL,
      exercise_index INTEGER NOT NULL,
      code TEXT NOT NULL,
      passed INTEGER DEFAULT 0,
      output TEXT,
      errors TEXT,
      submitted_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS content_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL,
      external_id TEXT NOT NULL,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      authors TEXT DEFAULT '[]',
      url TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      published_at TEXT,
      fetched_at TEXT DEFAULT (datetime('now')),
      relevance_score REAL DEFAULT 0,
      bookmarked INTEGER DEFAULT 0,
      dismissed INTEGER DEFAULT 0,
      UNIQUE(source, external_id)
    );

    CREATE TABLE IF NOT EXISTS content_sources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      source TEXT NOT NULL UNIQUE,
      enabled INTEGER DEFAULT 1,
      topics TEXT DEFAULT '[]',
      last_fetched_at TEXT
    );

    INSERT OR IGNORE INTO content_sources (source, topics) VALUES
      ('arxiv', '["machine learning", "deep learning", "neural networks", "computer vision", "natural language processing", "reinforcement learning"]'),
      ('huggingface', '["text-generation", "image-classification", "object-detection", "transformers"]');

    CREATE TABLE IF NOT EXISTS review_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lesson_def_id TEXT NOT NULL,
      concept TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      next_review_at TEXT NOT NULL,
      interval_days INTEGER DEFAULT 1,
      ease_factor REAL DEFAULT 2.5,
      review_count INTEGER DEFAULT 0,
      last_reviewed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS project_track_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL UNIQUE,
      active INTEGER DEFAULT 0,
      current_milestone_order INTEGER DEFAULT 1,
      completed_milestone_ids TEXT DEFAULT '[]',
      started_at TEXT,
      completed_at TEXT
    );

    INSERT OR IGNORE INTO user_state (id) VALUES (1);
  `)

  // FTS5 virtual table for full-text search over content
  db.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS content_fts USING fts5(
      title, summary, tags, authors,
      content='content_articles',
      content_rowid='id'
    );
  `)

  // Triggers to keep FTS in sync
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS content_ai AFTER INSERT ON content_articles BEGIN
      INSERT INTO content_fts(rowid, title, summary, tags, authors)
      VALUES (new.id, new.title, new.summary, new.tags, new.authors);
    END;
  `)

  db.exec(`
    CREATE TRIGGER IF NOT EXISTS content_ad AFTER DELETE ON content_articles BEGIN
      INSERT INTO content_fts(content_fts, rowid, title, summary, tags, authors)
      VALUES ('delete', old.id, old.title, old.summary, old.tags, old.authors);
    END;
  `)
}

export function getUserState(): UserState {
  const row = db.prepare('SELECT * FROM user_state WHERE id = 1').get() as Record<string, unknown>
  return {
    currentTierId: row.current_tier_id as number,
    currentLessonOrder: row.current_lesson_order as number,
    streakDays: row.streak_days as number,
    lastActiveDate: row.last_active_date as string | null,
    apiKey: row.api_key as string | null
  }
}

export function updateStreak(): void {
  const state = getUserState()
  const today = new Date().toISOString().split('T')[0]

  if (state.lastActiveDate === today) return

  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  const newStreak = state.lastActiveDate === yesterday ? state.streakDays + 1 : 1

  db.prepare('UPDATE user_state SET streak_days = ?, last_active_date = ? WHERE id = 1')
    .run(newStreak, today)
}

export function saveApiKey(key: string): void {
  db.prepare('UPDATE user_state SET api_key = ? WHERE id = 1').run(key)
}

export function getLessonProgress(lessonDefId: string): LessonProgress | null {
  const row = db.prepare('SELECT * FROM lesson_progress WHERE lesson_def_id = ?').get(lessonDefId) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    lessonDefId: row.lesson_def_id as string,
    tierId: row.tier_id as number,
    status: row.status as LessonProgress['status'],
    completedAt: row.completed_at as string | null
  }
}

export function markLessonComplete(lessonDefId: string, tierId: number): void {
  const now = new Date().toISOString()

  db.prepare(`
    INSERT INTO lesson_progress (lesson_def_id, tier_id, status, completed_at)
    VALUES (?, ?, 'completed', ?)
    ON CONFLICT(lesson_def_id) DO UPDATE SET status = 'completed', completed_at = ?
  `).run(lessonDefId, tierId, now, now)

  // Advance to next lesson
  const state = getUserState()
  const tier = tiers.find(t => t.id === state.currentTierId)
  if (!tier) return

  const nextOrder = state.currentLessonOrder + 1
  if (nextOrder <= tier.lessons.length) {
    db.prepare('UPDATE user_state SET current_lesson_order = ? WHERE id = 1').run(nextOrder)
  } else {
    // Tier complete — advance to next tier if available
    const nextTier = tiers.find(t => t.id === state.currentTierId + 1)
    if (nextTier) {
      db.prepare('UPDATE user_state SET current_tier_id = ?, current_lesson_order = 1 WHERE id = 1')
        .run(nextTier.id)
    }
  }

  updateStreak()
}

export function saveGeneratedLesson(lesson: GeneratedLesson): number {
  const result = db.prepare(`
    INSERT INTO generated_lessons (lesson_def_id, content, key_takeaways, review_questions)
    VALUES (?, ?, ?, ?)
  `).run(
    lesson.lessonDefId,
    lesson.content,
    JSON.stringify(lesson.keyTakeaways),
    JSON.stringify(lesson.reviewQuestions)
  )
  return result.lastInsertRowid as number
}

export function getLatestGeneratedLesson(lessonDefId: string): GeneratedLesson | null {
  const row = db.prepare(
    'SELECT * FROM generated_lessons WHERE lesson_def_id = ? ORDER BY generated_at DESC LIMIT 1'
  ).get(lessonDefId) as Record<string, unknown> | undefined

  if (!row) return null
  return {
    id: row.id as number,
    lessonDefId: row.lesson_def_id as string,
    content: row.content as string,
    keyTakeaways: JSON.parse((row.key_takeaways as string) || '[]'),
    reviewQuestions: JSON.parse((row.review_questions as string) || '[]'),
    generatedAt: row.generated_at as string
  }
}

export function getTierProgress(tierId: number): TierProgress {
  const tier = tiers.find(t => t.id === tierId)
  if (!tier) return { tierId, tierName: 'Unknown', totalLessons: 0, completedLessons: 0 }

  const count = db.prepare(
    "SELECT COUNT(*) as count FROM lesson_progress WHERE tier_id = ? AND status = 'completed'"
  ).get(tierId) as { count: number }

  return {
    tierId,
    tierName: tier.name,
    totalLessons: tier.lessons.length,
    completedLessons: count.count
  }
}

// Lab functions

export function getLabProgress(labId: string): LabProgress | null {
  const row = db.prepare('SELECT * FROM lab_progress WHERE lab_id = ?').get(labId) as Record<string, unknown> | undefined
  if (!row) return null
  return {
    labId: row.lab_id as string,
    tierId: row.tier_id as number,
    status: row.status as LabProgress['status'],
    exercisesCompleted: row.exercises_completed as number,
    totalExercises: row.total_exercises as number,
    completedAt: row.completed_at as string | null
  }
}

export function updateLabProgress(labId: string, tierId: number, exercisesCompleted: number, totalExercises: number): LabProgress {
  const isComplete = exercisesCompleted >= totalExercises
  const status = isComplete ? 'completed' : exercisesCompleted > 0 ? 'in_progress' : 'not_started'
  const now = isComplete ? new Date().toISOString() : null

  db.prepare(`
    INSERT INTO lab_progress (lab_id, tier_id, status, exercises_completed, total_exercises, completed_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(lab_id) DO UPDATE SET
      status = ?, exercises_completed = ?, completed_at = COALESCE(completed_at, ?)
  `).run(labId, tierId, status, exercisesCompleted, totalExercises, now, status, exercisesCompleted, now)

  if (isComplete) updateStreak()

  return { labId, tierId, status, exercisesCompleted, totalExercises, completedAt: now }
}

export function saveLabSubmission(submission: LabSubmission): number {
  const result = db.prepare(`
    INSERT INTO lab_submissions (lab_id, exercise_index, code, passed, output, errors)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    submission.labId,
    submission.exerciseIndex,
    submission.code,
    submission.passed ? 1 : 0,
    submission.output,
    submission.errors
  )
  return result.lastInsertRowid as number
}

export function getLabSubmissions(labId: string): LabSubmission[] {
  const rows = db.prepare(
    'SELECT * FROM lab_submissions WHERE lab_id = ? ORDER BY submitted_at DESC'
  ).all(labId) as Record<string, unknown>[]

  return rows.map(row => ({
    id: row.id as number,
    labId: row.lab_id as string,
    exerciseIndex: row.exercise_index as number,
    code: row.code as string,
    passed: (row.passed as number) === 1,
    output: row.output as string,
    errors: row.errors as string,
    submittedAt: row.submitted_at as string
  }))
}

export function getLatestSubmissionForExercise(labId: string, exerciseIndex: number): LabSubmission | null {
  const row = db.prepare(
    'SELECT * FROM lab_submissions WHERE lab_id = ? AND exercise_index = ? ORDER BY submitted_at DESC LIMIT 1'
  ).get(labId, exerciseIndex) as Record<string, unknown> | undefined

  if (!row) return null
  return {
    id: row.id as number,
    labId: row.lab_id as string,
    exerciseIndex: row.exercise_index as number,
    code: row.code as string,
    passed: (row.passed as number) === 1,
    output: row.output as string,
    errors: row.errors as string,
    submittedAt: row.submitted_at as string
  }
}

// Content pull functions

function rowToArticle(row: Record<string, unknown>): ContentArticle {
  return {
    id: row.id as number,
    source: row.source as ContentArticle['source'],
    externalId: row.external_id as string,
    title: row.title as string,
    summary: row.summary as string,
    authors: JSON.parse((row.authors as string) || '[]'),
    url: row.url as string,
    tags: JSON.parse((row.tags as string) || '[]'),
    publishedAt: row.published_at as string,
    fetchedAt: row.fetched_at as string,
    relevanceScore: row.relevance_score as number,
    bookmarked: (row.bookmarked as number) === 1,
    dismissed: (row.dismissed as number) === 1
  }
}

export function upsertArticle(article: Omit<ContentArticle, 'id' | 'bookmarked' | 'dismissed'>): number {
  const result = db.prepare(`
    INSERT INTO content_articles (source, external_id, title, summary, authors, url, tags, published_at, relevance_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(source, external_id) DO UPDATE SET
      title = excluded.title, summary = excluded.summary, authors = excluded.authors,
      tags = excluded.tags, relevance_score = excluded.relevance_score
  `).run(
    article.source,
    article.externalId,
    article.title,
    article.summary,
    JSON.stringify(article.authors),
    article.url,
    JSON.stringify(article.tags),
    article.publishedAt,
    article.relevanceScore
  )
  return result.lastInsertRowid as number
}

export function getContentFeed(filters: ContentFeedFilters): ContentArticle[] {
  const limit = filters.limit || 50
  const offset = filters.offset || 0
  let query: string
  let params: unknown[]

  if (filters.searchQuery) {
    query = `
      SELECT a.* FROM content_articles a
      JOIN content_fts f ON a.id = f.rowid
      WHERE f.content_fts MATCH ?
        AND a.dismissed = 0
        ${filters.source ? 'AND a.source = ?' : ''}
        ${filters.bookmarkedOnly ? 'AND a.bookmarked = 1' : ''}
      ORDER BY rank, a.relevance_score DESC, a.published_at DESC
      LIMIT ? OFFSET ?
    `
    params = [filters.searchQuery]
    if (filters.source) params.push(filters.source)
    params.push(limit, offset)
  } else {
    query = `
      SELECT * FROM content_articles
      WHERE dismissed = 0
        ${filters.source ? 'AND source = ?' : ''}
        ${filters.bookmarkedOnly ? 'AND bookmarked = 1' : ''}
      ORDER BY relevance_score DESC, published_at DESC
      LIMIT ? OFFSET ?
    `
    params = []
    if (filters.source) params.push(filters.source)
    params.push(limit, offset)
  }

  const rows = db.prepare(query).all(...params) as Record<string, unknown>[]
  return rows.map(rowToArticle)
}

export function toggleBookmark(articleId: number): boolean {
  const row = db.prepare('SELECT bookmarked FROM content_articles WHERE id = ?').get(articleId) as { bookmarked: number } | undefined
  if (!row) return false
  const newVal = row.bookmarked === 1 ? 0 : 1
  db.prepare('UPDATE content_articles SET bookmarked = ? WHERE id = ?').run(newVal, articleId)
  return newVal === 1
}

export function dismissArticle(articleId: number): void {
  db.prepare('UPDATE content_articles SET dismissed = 1 WHERE id = ?').run(articleId)
}

export function getContentStats(): ContentStats {
  const total = db.prepare('SELECT COUNT(*) as c FROM content_articles WHERE dismissed = 0').get() as { c: number }
  const arxiv = db.prepare("SELECT COUNT(*) as c FROM content_articles WHERE source = 'arxiv' AND dismissed = 0").get() as { c: number }
  const hf = db.prepare("SELECT COUNT(*) as c FROM content_articles WHERE source = 'huggingface' AND dismissed = 0").get() as { c: number }
  const bookmarked = db.prepare('SELECT COUNT(*) as c FROM content_articles WHERE bookmarked = 1 AND dismissed = 0').get() as { c: number }
  const lastFetch = db.prepare('SELECT MAX(last_fetched_at) as t FROM content_sources').get() as { t: string | null }

  return {
    totalArticles: total.c,
    arxivCount: arxiv.c,
    huggingfaceCount: hf.c,
    bookmarkedCount: bookmarked.c,
    lastFetchedAt: lastFetch.t
  }
}

export function getContentSources(): ContentSourceConfig[] {
  const rows = db.prepare('SELECT * FROM content_sources').all() as Record<string, unknown>[]
  return rows.map(row => ({
    source: row.source as ContentSourceConfig['source'],
    enabled: (row.enabled as number) === 1,
    topics: JSON.parse((row.topics as string) || '[]')
  }))
}

export function updateContentSource(source: string, enabled: boolean, topics: string[]): void {
  db.prepare('UPDATE content_sources SET enabled = ?, topics = ? WHERE source = ?')
    .run(enabled ? 1 : 0, JSON.stringify(topics), source)
}

export function markSourceFetched(source: string): void {
  db.prepare('UPDATE content_sources SET last_fetched_at = datetime("now") WHERE source = ?').run(source)
}

export function searchContentForLesson(concepts: string[], limit: number = 5): ContentArticle[] {
  const searchTerms = concepts.map(c => `"${c.replace(/"/g, '""')}"`).join(' OR ')
  try {
    const rows = db.prepare(`
      SELECT a.* FROM content_articles a
      JOIN content_fts f ON a.id = f.rowid
      WHERE f.content_fts MATCH ? AND a.dismissed = 0
      ORDER BY rank
      LIMIT ?
    `).all(searchTerms, limit) as Record<string, unknown>[]
    return rows.map(rowToArticle)
  } catch {
    return []
  }
}

// Project track functions

export function getTrackProgress(trackId: string): ProjectTrackProgress | null {
  const row = db.prepare('SELECT * FROM project_track_progress WHERE track_id = ?').get(trackId) as Record<string, unknown> | undefined
  if (!row) return null

  const completedIds = JSON.parse((row.completed_milestone_ids as string) || '[]') as string[]
  return {
    trackId: row.track_id as string,
    activeTrack: (row.active as number) === 1,
    currentMilestoneOrder: row.current_milestone_order as number,
    milestonesCompleted: completedIds.length,
    totalMilestones: 0,
    completedMilestoneIds: completedIds,
    startedAt: row.started_at as string | null,
    completedAt: row.completed_at as string | null
  }
}

export function activateTrack(trackId: string, totalMilestones: number): ProjectTrackProgress {
  const now = new Date().toISOString()
  db.prepare(`
    INSERT INTO project_track_progress (track_id, active, current_milestone_order, started_at)
    VALUES (?, 1, 1, ?)
    ON CONFLICT(track_id) DO UPDATE SET active = 1, started_at = COALESCE(started_at, ?)
  `).run(trackId, now, now)

  return {
    trackId,
    activeTrack: true,
    currentMilestoneOrder: 1,
    milestonesCompleted: 0,
    totalMilestones,
    completedMilestoneIds: [],
    startedAt: now,
    completedAt: null
  }
}

export function deactivateTrack(trackId: string): void {
  db.prepare('UPDATE project_track_progress SET active = 0 WHERE track_id = ?').run(trackId)
}

export function completeMilestone(trackId: string, milestoneId: string, totalMilestones: number): ProjectTrackProgress {
  const existing = getTrackProgress(trackId)
  const completedIds = existing?.completedMilestoneIds || []

  if (!completedIds.includes(milestoneId)) {
    completedIds.push(milestoneId)
  }

  const isTrackComplete = completedIds.length >= totalMilestones
  const nextOrder = (existing?.currentMilestoneOrder || 1) + 1

  db.prepare(`
    INSERT INTO project_track_progress (track_id, active, current_milestone_order, completed_milestone_ids, completed_at)
    VALUES (?, 1, ?, ?, ?)
    ON CONFLICT(track_id) DO UPDATE SET
      current_milestone_order = ?, completed_milestone_ids = ?,
      completed_at = CASE WHEN ? THEN datetime('now') ELSE completed_at END
  `).run(
    trackId, nextOrder, JSON.stringify(completedIds), isTrackComplete ? new Date().toISOString() : null,
    nextOrder, JSON.stringify(completedIds), isTrackComplete ? 1 : 0
  )

  if (isTrackComplete) updateStreak()

  return {
    trackId,
    activeTrack: true,
    currentMilestoneOrder: isTrackComplete ? totalMilestones : nextOrder,
    milestonesCompleted: completedIds.length,
    totalMilestones,
    completedMilestoneIds: completedIds,
    startedAt: existing?.startedAt || null,
    completedAt: isTrackComplete ? new Date().toISOString() : null
  }
}

export function getAllTrackProgress(): ProjectTrackProgress[] {
  const rows = db.prepare('SELECT * FROM project_track_progress').all() as Record<string, unknown>[]
  return rows.map(row => {
    const completedIds = JSON.parse((row.completed_milestone_ids as string) || '[]') as string[]
    return {
      trackId: row.track_id as string,
      activeTrack: (row.active as number) === 1,
      currentMilestoneOrder: row.current_milestone_order as number,
      milestonesCompleted: completedIds.length,
      totalMilestones: 0,
      completedMilestoneIds: completedIds,
      startedAt: row.started_at as string | null,
      completedAt: row.completed_at as string | null
    }
  })
}

// Spaced repetition functions

export function addReviewCards(lessonDefId: string, cards: { concept: string; question: string; answer: string }[]): void {
  const now = new Date().toISOString()
  const stmt = db.prepare(`
    INSERT INTO review_cards (lesson_def_id, concept, question, answer, next_review_at)
    VALUES (?, ?, ?, ?, ?)
  `)
  for (const card of cards) {
    stmt.run(lessonDefId, card.concept, card.question, card.answer, now)
  }
}

export function getDueReviewCards(limit: number = 10): ReviewCard[] {
  const now = new Date().toISOString()
  const rows = db.prepare(
    'SELECT * FROM review_cards WHERE next_review_at <= ? ORDER BY next_review_at ASC LIMIT ?'
  ).all(now, limit) as Record<string, unknown>[]

  return rows.map(rowToReviewCard)
}

export function reviewCard(cardId: number, quality: number): void {
  const row = db.prepare('SELECT * FROM review_cards WHERE id = ?').get(cardId) as Record<string, unknown> | undefined
  if (!row) return

  let ef = row.ease_factor as number
  const count = (row.review_count as number) + 1
  let interval = row.interval_days as number

  // SM-2 algorithm
  ef = Math.max(1.3, ef + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  if (quality < 3) {
    interval = 1
  } else if (count === 1) {
    interval = 1
  } else if (count === 2) {
    interval = 6
  } else {
    interval = Math.round(interval * ef)
  }

  const nextReview = new Date(Date.now() + interval * 86400000).toISOString()
  const now = new Date().toISOString()

  db.prepare(`
    UPDATE review_cards SET
      ease_factor = ?, interval_days = ?, review_count = ?,
      next_review_at = ?, last_reviewed_at = ?
    WHERE id = ?
  `).run(ef, interval, count, nextReview, now, cardId)
}

export function getReviewStats(): { due: number; mastered: number; inReview: number } {
  const now = new Date().toISOString()
  const due = db.prepare('SELECT COUNT(*) as c FROM review_cards WHERE next_review_at <= ?').get(now) as { c: number }
  const mastered = db.prepare('SELECT COUNT(*) as c FROM review_cards WHERE interval_days >= 21').get() as { c: number }
  const total = db.prepare('SELECT COUNT(*) as c FROM review_cards').get() as { c: number }

  return {
    due: due.c,
    mastered: mastered.c,
    inReview: total.c - mastered.c
  }
}

function rowToReviewCard(row: Record<string, unknown>): ReviewCard {
  return {
    id: row.id as number,
    lessonDefId: row.lesson_def_id as string,
    concept: row.concept as string,
    question: row.question as string,
    answer: row.answer as string,
    nextReviewAt: row.next_review_at as string,
    interval: row.interval_days as number,
    easeFactor: row.ease_factor as number,
    reviewCount: row.review_count as number,
    lastReviewedAt: row.last_reviewed_at as string | null
  }
}

// Dashboard functions

export function getDashboardStats(): DashboardStats {
  const state = getUserState()
  const tier = tiers.find(t => t.id === state.currentTierId)

  const totalLessons = db.prepare("SELECT COUNT(*) as c FROM lesson_progress WHERE status = 'completed'").get() as { c: number }
  const totalLabs = db.prepare("SELECT COUNT(*) as c FROM lab_progress WHERE status = 'completed'").get() as { c: number }
  const activeTracks = db.prepare('SELECT COUNT(*) as c FROM project_track_progress WHERE active = 1').get() as { c: number }
  const reviewStats = getReviewStats()

  let totalHours = 0
  for (const t of tiers) {
    const completed = db.prepare(
      "SELECT COUNT(*) as c FROM lesson_progress WHERE tier_id = ? AND status = 'completed'"
    ).get(t.id) as { c: number }
    if (completed.c > 0) {
      totalHours += (completed.c / Math.max(1, t.lessons.length)) * t.estimatedHours
    }
  }

  return {
    currentTierId: state.currentTierId,
    currentTierName: tier?.name || 'Unknown',
    currentLessonOrder: state.currentLessonOrder,
    totalLessonsInTier: tier?.lessons.length || 0,
    streakDays: state.streakDays,
    totalLessonsCompleted: totalLessons.c,
    totalLabsCompleted: totalLabs.c,
    totalHoursEstimated: Math.round(totalHours),
    activeProjectTracks: activeTracks.c,
    reviewCardsDue: reviewStats.due,
    conceptsMastered: reviewStats.mastered,
    conceptsInReview: reviewStats.inReview
  }
}

export function getSkillTree(): SkillTreeNode[] {
  const state = getUserState()

  return tiers.map(tier => {
    const lessonsCompleted = db.prepare(
      "SELECT COUNT(*) as c FROM lesson_progress WHERE tier_id = ? AND status = 'completed'"
    ).get(tier.id) as { c: number }

    const labsCompleted = db.prepare(
      "SELECT COUNT(*) as c FROM lab_progress WHERE tier_id = ? AND status = 'completed'"
    ).get(tier.id) as { c: number }

    let status: SkillTreeNode['status']
    if (lessonsCompleted.c === tier.lessons.length && tier.lessons.length > 0) {
      status = 'completed'
    } else if (tier.id === state.currentTierId) {
      status = 'in_progress'
    } else if (tier.id < state.currentTierId) {
      status = 'completed'
    } else {
      const prereqsMet = tier.prerequisites.every(pid => pid < state.currentTierId || pid === state.currentTierId)
      status = prereqsMet && tier.lessons.length > 0 ? 'available' : 'locked'
    }

    return {
      id: tier.id,
      name: tier.name,
      description: tier.description,
      lessonsTotal: tier.lessons.length,
      lessonsCompleted: lessonsCompleted.c,
      labsTotal: tier.labs.length,
      labsCompleted: labsCompleted.c,
      prerequisites: tier.prerequisites,
      status
    }
  })
}

export function hasReviewCardsForLesson(lessonDefId: string): boolean {
  const row = db.prepare('SELECT COUNT(*) as c FROM review_cards WHERE lesson_def_id = ?').get(lessonDefId) as { c: number }
  return row.c > 0
}
