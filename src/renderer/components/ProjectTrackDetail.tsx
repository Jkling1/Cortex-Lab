import React, { useState, useEffect } from 'react'

interface RelatedItem {
  id: string
  title: string
  tierId: number
}

interface RelatedTier {
  id: number
  name: string
}

interface Milestone {
  id: string
  title: string
  description: string
  order: number
  deliverable: string
  checkpoints: string[]
  completed: boolean
  relatedLessons: RelatedItem[]
  relatedLabs: RelatedItem[]
  relatedTiers: RelatedTier[]
}

interface TrackDetail {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  color: string
  milestones: Milestone[]
  progress: {
    activeTrack: boolean
    currentMilestoneOrder: number
    milestonesCompleted: number
    totalMilestones: number
    startedAt: string | null
    completedAt: string | null
  } | null
}

interface Props {
  trackId: string
  onBack: () => void
}

export default function ProjectTrackDetail({ trackId, onBack }: Props) {
  const [track, setTrack] = useState<TrackDetail | null>(null)
  const [expandedMilestone, setExpandedMilestone] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrack()
  }, [trackId])

  async function loadTrack() {
    setLoading(true)
    const data = await window.api.getProjectTrack(trackId)
    setTrack(data)
    setLoading(false)
    // Auto-expand first incomplete milestone
    if (data) {
      const firstIncomplete = data.milestones.find((m: Milestone) => !m.completed)
      if (firstIncomplete) setExpandedMilestone(firstIncomplete.id)
    }
  }

  async function handleActivate() {
    await window.api.activateProjectTrack(trackId)
    await loadTrack()
  }

  async function handleDeactivate() {
    await window.api.deactivateProjectTrack(trackId)
    await loadTrack()
  }

  async function handleCompleteMilestone(milestoneId: string) {
    await window.api.completeMilestone(trackId, milestoneId)
    await loadTrack()
  }

  if (loading || !track) return <div className="lesson-loading">Loading track...</div>

  const isActive = track.progress?.activeTrack
  const pct = track.progress
    ? Math.round((track.progress.milestonesCompleted / track.progress.totalMilestones) * 100)
    : 0

  return (
    <div className="track-detail" style={{ '--track-color': track.color } as React.CSSProperties}>
      <button className="btn-back" onClick={onBack}>&larr; Back to Projects</button>

      <div className="track-detail-header">
        <div className="track-detail-icon">{track.icon}</div>
        <div>
          <h1>{track.name}</h1>
          <p className="track-tagline">{track.tagline}</p>
        </div>
        <div className="track-detail-actions">
          {!isActive ? (
            <button className="btn-primary" onClick={handleActivate}>Start This Track</button>
          ) : (
            <button className="btn-secondary" onClick={handleDeactivate}>Pause Track</button>
          )}
        </div>
      </div>

      <p className="track-detail-description">{track.description}</p>

      {track.progress && (
        <div className="track-detail-progress">
          <div className="progress-info">
            <span>{track.progress.milestonesCompleted} of {track.progress.totalMilestones} milestones</span>
            <span>{pct}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: track.color }} />
          </div>
        </div>
      )}

      <div className="milestones-list">
        <h2>Milestones</h2>
        {track.milestones.map((milestone, idx) => {
          const isExpanded = expandedMilestone === milestone.id
          const isCurrent = isActive && !milestone.completed &&
            (idx === 0 || track.milestones[idx - 1].completed)
          const isLocked = !milestone.completed && idx > 0 && !track.milestones[idx - 1].completed

          return (
            <div
              key={milestone.id}
              className={`milestone-card ${milestone.completed ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
            >
              <button
                className="milestone-header"
                onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
              >
                <div className="milestone-status">
                  {milestone.completed ? (
                    <span className="milestone-check">{'\u2713'}</span>
                  ) : (
                    <span className="milestone-number">{milestone.order}</span>
                  )}
                </div>
                <div className="milestone-title-area">
                  <h3>{milestone.title}</h3>
                  <p>{milestone.description}</p>
                </div>
                <span className="milestone-expand">{isExpanded ? '\u25B2' : '\u25BC'}</span>
              </button>

              {isExpanded && (
                <div className="milestone-body">
                  <div className="milestone-section">
                    <h4>Deliverable</h4>
                    <p className="milestone-deliverable">{milestone.deliverable}</p>
                  </div>

                  <div className="milestone-section">
                    <h4>Checkpoints</h4>
                    <ul className="milestone-checkpoints">
                      {milestone.checkpoints.map((cp, i) => (
                        <li key={i}>{cp}</li>
                      ))}
                    </ul>
                  </div>

                  {(milestone.relatedLessons.length > 0 || milestone.relatedLabs.length > 0 || milestone.relatedTiers.length > 0) && (
                    <div className="milestone-section">
                      <h4>Related Curriculum</h4>
                      <div className="milestone-links">
                        {milestone.relatedTiers.map(t => (
                          <span key={`tier-${t.id}`} className="milestone-link tier">Tier {t.id}: {t.name}</span>
                        ))}
                        {milestone.relatedLessons.map(l => (
                          <span key={l.id} className="milestone-link lesson">{l.title}</span>
                        ))}
                        {milestone.relatedLabs.map(l => (
                          <span key={l.id} className="milestone-link lab">{l.title}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {isActive && !milestone.completed && !isLocked && (
                    <button
                      className="btn-primary milestone-complete-btn"
                      onClick={() => handleCompleteMilestone(milestone.id)}
                    >
                      Mark Milestone Complete
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
