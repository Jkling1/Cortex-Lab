import React, { useState, useEffect } from 'react'
import LessonContent from './LessonContent'
import ProgressBar from './ProgressBar'

interface LessonDef {
  id: string
  tierId: number
  title: string
  description: string
  order: number
  concepts: string[]
  estimatedMinutes: number
}

interface Generated {
  content: string
  keyTakeaways: string[]
  reviewQuestions: string[]
  generatedAt: string
}

interface CurrentLesson {
  definition: LessonDef
  generated: Generated | null
  tierName: string
}

interface Props {
  onComplete: () => void
}

export default function DailyLesson({ onComplete }: Props) {
  const [lesson, setLesson] = useState<CurrentLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadLesson()
  }, [])

  async function loadLesson() {
    setLoading(true)
    setError(null)
    try {
      const current = await window.api.getCurrentLesson()
      setLesson(current)
    } catch (err) {
      setError(String(err))
    }
    setLoading(false)
  }

  async function handleGenerate() {
    if (!lesson) return
    setGenerating(true)
    setError(null)
    try {
      const generated = await window.api.generateLesson(lesson.definition.id)
      setLesson({ ...lesson, generated })
    } catch (err) {
      setError(String(err))
    }
    setGenerating(false)
  }

  async function handleComplete() {
    if (!lesson) return
    try {
      await window.api.markComplete(lesson.definition.id)
      onComplete()
      // Reload to show next lesson
      const current = await window.api.getCurrentLesson()
      setLesson(current)
    } catch (err) {
      setError(String(err))
    }
  }

  if (loading) {
    return <div className="lesson-loading">Loading your lesson...</div>
  }

  if (!lesson) {
    return (
      <div className="lesson-empty">
        <h2>Congratulations!</h2>
        <p>You've completed all available lessons. More content is coming soon.</p>
      </div>
    )
  }

  return (
    <div className="daily-lesson">
      <div className="lesson-header">
        <div className="lesson-meta">
          <span className="tier-badge-inline">Tier {lesson.definition.tierId}: {lesson.tierName}</span>
          <span className="lesson-number">Lesson {lesson.definition.order}</span>
          <span className="lesson-time">{lesson.definition.estimatedMinutes} min</span>
        </div>
        <h1>{lesson.definition.title}</h1>
        <p className="lesson-description">{lesson.definition.description}</p>
        <ProgressBar tierId={lesson.definition.tierId} />
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      {!lesson.generated && !generating && (
        <div className="generate-prompt">
          <h3>Ready to learn?</h3>
          <p>Today's lesson covers: {lesson.definition.concepts.join(', ')}</p>
          <button className="btn-primary" onClick={handleGenerate}>
            Generate Today's Lesson
          </button>
        </div>
      )}

      {generating && (
        <div className="generating">
          <div className="spinner" />
          <p>Cortex is preparing your lesson...</p>
          <p className="generating-sub">This usually takes 15-30 seconds</p>
        </div>
      )}

      {lesson.generated && (
        <>
          <LessonContent content={lesson.generated.content} />
          <div className="lesson-actions">
            <button className="btn-primary" onClick={handleComplete}>
              Mark Complete & Continue
            </button>
            <button className="btn-secondary" onClick={handleGenerate}>
              Regenerate Lesson
            </button>
          </div>
        </>
      )}
    </div>
  )
}
