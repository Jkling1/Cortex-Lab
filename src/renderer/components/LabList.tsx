import React, { useEffect, useState } from 'react'

interface LabSummary {
  id: string
  title: string
  description: string
  difficulty: 'guided' | 'build' | 'freeform'
  estimatedMinutes: number
  exerciseCount: number
  progress: {
    status: string
    exercisesCompleted: number
    totalExercises: number
  }
}

interface Props {
  tierId: number
  onSelectLab: (labId: string) => void
}

const difficultyLabels: Record<string, string> = {
  guided: 'Guided',
  build: 'Build',
  freeform: 'Free-form'
}

const difficultyColors: Record<string, string> = {
  guided: 'var(--success)',
  build: 'var(--accent)',
  freeform: 'var(--warning, #f59e0b)'
}

export default function LabList({ tierId, onSelectLab }: Props) {
  const [labs, setLabs] = useState<LabSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getLabsForTier(tierId).then((data: LabSummary[]) => {
      setLabs(data)
      setLoading(false)
    })
  }, [tierId])

  if (loading) return <div className="lesson-loading">Loading labs...</div>

  if (labs.length === 0) {
    return (
      <div className="lab-list-empty">
        <h2>No Labs Available Yet</h2>
        <p>Hands-on labs for this tier are coming soon.</p>
      </div>
    )
  }

  return (
    <div className="lab-list">
      <div className="lab-list-header">
        <h1>Hands-On Labs</h1>
        <p>Practice what you've learned with runnable Python exercises.</p>
      </div>

      <div className="lab-cards">
        {labs.map(lab => {
          const pct = lab.progress.totalExercises > 0
            ? Math.round((lab.progress.exercisesCompleted / lab.progress.totalExercises) * 100)
            : 0
          const isComplete = lab.progress.status === 'completed'

          return (
            <button
              key={lab.id}
              className={`lab-card ${isComplete ? 'complete' : ''}`}
              onClick={() => onSelectLab(lab.id)}
            >
              <div className="lab-card-header">
                <span
                  className="lab-difficulty"
                  style={{ color: difficultyColors[lab.difficulty] }}
                >
                  {difficultyLabels[lab.difficulty]}
                </span>
                <span className="lab-time">{lab.estimatedMinutes} min</span>
              </div>
              <h3>{lab.title}</h3>
              <p>{lab.description}</p>
              <div className="lab-card-footer">
                <div className="lab-exercise-count">
                  {lab.progress.exercisesCompleted}/{lab.exerciseCount} exercises
                </div>
                <div className="lab-card-progress-track">
                  <div className="lab-card-progress-fill" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {isComplete && <span className="lab-complete-badge">Complete</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
