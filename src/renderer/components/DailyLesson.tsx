import React, { useState, useEffect, useRef, useCallback } from 'react'
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

interface Recommendation {
  relatedLab: { id: string; title: string } | null
  relatedProjectMilestones: { trackId: string; trackName: string; milestoneTitle: string }[]
  reviewCardsDue: number
  nextLesson: { id: string; title: string; tierId: number } | null
}

interface CurrentLesson {
  definition?: LessonDef
  generated?: Generated | null
  tierName: string
  note?: string
  // Dynamic tier generation needed
  needsGeneration?: boolean
  tierId?: number
  tierDescription?: string
}

interface Props {
  onComplete: () => void
  onNavigate?: (view: string) => void
}

export default function DailyLesson({ onComplete, onNavigate }: Props) {
  const [lesson, setLesson] = useState<CurrentLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [generatingTier, setGeneratingTier] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendations, setRecommendations] = useState<Recommendation | null>(null)
  const [showRecs, setShowRecs] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [showNotes, setShowNotes] = useState(false)
  const noteTimerRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadLesson()
  }, [])

  async function loadLesson() {
    setLoading(true)
    setError(null)
    setShowRecs(false)
    setRecommendations(null)
    try {
      const current = await window.api.getCurrentLesson()
      setLesson(current)
      if (current?.note !== undefined) {
        setNoteContent(current.note)
      }
    } catch (err) {
      setError(String(err))
    }
    setLoading(false)
  }

  async function handleGenerateTier() {
    if (!lesson?.tierId) return
    setGeneratingTier(true)
    setError(null)
    try {
      await window.api.generateTierCurriculum(lesson.tierId)
      onComplete() // Refresh curriculum data
      await loadLesson()
    } catch (err) {
      setError(String(err))
    }
    setGeneratingTier(false)
  }

  async function handleGenerate() {
    if (!lesson?.definition) return
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
    if (!lesson?.definition) return
    try {
      const result = await window.api.markComplete(lesson.definition.id)
      setRecommendations(result.recommendations)
      setShowRecs(true)
      onComplete()
    } catch (err) {
      setError(String(err))
    }
  }

  function handleContinueToNext() {
    setShowRecs(false)
    loadLesson()
  }

  const handleNoteChange = useCallback((value: string) => {
    setNoteContent(value)
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current)
    noteTimerRef.current = setTimeout(() => {
      if (lesson?.definition) {
        window.api.saveLessonNote(lesson.definition.id, value)
      }
    }, 1000)
  }, [lesson?.definition])

  if (loading) {
    return <div className="lesson-loading">Loading your lesson...</div>
  }

  // Tier needs curriculum generation
  if (lesson?.needsGeneration) {
    return (
      <div className="daily-lesson">
        <div className="tier-generation-prompt">
          <div className="tier-gen-icon">{'\u{1F680}'}</div>
          <h2>Ready for Tier {lesson.tierId}: {lesson.tierName}</h2>
          <p className="tier-gen-description">{lesson.tierDescription}</p>
          <p className="tier-gen-info">
            Cortex will generate a personalized curriculum for this tier — 8-12 lessons and 2-3 hands-on labs tailored to this topic. This uses Claude to design the lesson plan.
          </p>
          {error && <div className="error-banner">{error}</div>}
          {!generatingTier ? (
            <button className="btn-primary btn-lg" onClick={handleGenerateTier}>
              Generate Tier {lesson.tierId} Curriculum
            </button>
          ) : (
            <div className="generating">
              <div className="spinner" />
              <p>Generating curriculum for {lesson.tierName}...</p>
              <p className="generating-sub">This may take 30-60 seconds</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (!lesson?.definition) {
    return (
      <div className="lesson-empty">
        <h2>Congratulations!</h2>
        <p>You've completed all available lessons.</p>
      </div>
    )
  }

  // Show recommendations after completing
  if (showRecs && recommendations) {
    return (
      <div className="daily-lesson">
        <div className="recs-panel">
          <div className="recs-header">
            <span className="recs-icon">{'\u2705'}</span>
            <h2>Lesson Complete!</h2>
            <p>Great work. Here's what you can do next:</p>
          </div>
          <div className="recs-cards">
            {recommendations.nextLesson && (
              <button className="rec-card" onClick={handleContinueToNext}>
                <span className="rec-card-icon">{'\u{1F4D6}'}</span>
                <div>
                  <h4>Next Lesson</h4>
                  <p>{recommendations.nextLesson.title}</p>
                </div>
              </button>
            )}
            {recommendations.relatedLab && onNavigate && (
              <button className="rec-card" onClick={() => onNavigate('labs')}>
                <span className="rec-card-icon">{'\u{1F9EA}'}</span>
                <div>
                  <h4>Practice Lab</h4>
                  <p>{recommendations.relatedLab.title}</p>
                </div>
              </button>
            )}
            {recommendations.reviewCardsDue > 0 && onNavigate && (
              <button className="rec-card" onClick={() => onNavigate('review')}>
                <span className="rec-card-icon">{'\u{1F4DD}'}</span>
                <div>
                  <h4>Review Due</h4>
                  <p>{recommendations.reviewCardsDue} concept{recommendations.reviewCardsDue !== 1 ? 's' : ''} to review</p>
                </div>
              </button>
            )}
            {recommendations.relatedProjectMilestones.map((pm, i) => (
              <button key={i} className="rec-card" onClick={() => onNavigate?.('projects')}>
                <span className="rec-card-icon">{'\u{1F3AF}'}</span>
                <div>
                  <h4>{pm.trackName}</h4>
                  <p>{pm.milestoneTitle}</p>
                </div>
              </button>
            ))}
          </div>
          {!recommendations.nextLesson && (
            <button className="btn-primary" onClick={handleContinueToNext} style={{ marginTop: '1rem' }}>
              Continue
            </button>
          )}
        </div>
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

      {error && <div className="error-banner">{error}</div>}

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

          {/* Notes section */}
          <div className="lesson-notes-section">
            <button
              className="notes-toggle"
              onClick={() => setShowNotes(!showNotes)}
            >
              {showNotes ? '\u25B2' : '\u25BC'} My Notes
              {noteContent && !showNotes && <span className="notes-indicator">{'\u2022'}</span>}
            </button>
            {showNotes && (
              <textarea
                className="notes-editor"
                value={noteContent}
                onChange={e => handleNoteChange(e.target.value)}
                placeholder="Write your notes here... (auto-saved)"
                rows={5}
              />
            )}
          </div>

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
