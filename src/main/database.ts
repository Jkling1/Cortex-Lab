import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import { UserState, LessonProgress, GeneratedLesson, TierProgress } from '../../curriculum/types'
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

    INSERT OR IGNORE INTO user_state (id) VALUES (1);
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
