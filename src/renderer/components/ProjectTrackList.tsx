import React, { useState, useEffect } from 'react'

interface TrackSummary {
  id: string
  name: string
  tagline: string
  description: string
  icon: string
  color: string
  milestoneCount: number
  progress: {
    activeTrack: boolean
    milestonesCompleted: number
    totalMilestones: number
    completedAt: string | null
  } | null
}

interface Props {
  onSelectTrack: (trackId: string) => void
}

export default function ProjectTrackList({ onSelectTrack }: Props) {
  const [tracks, setTracks] = useState<TrackSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.api.getProjectTracks().then((data: TrackSummary[]) => {
      setTracks(data)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="lesson-loading">Loading project tracks...</div>

  return (
    <div className="project-tracks">
      <div className="project-tracks-header">
        <h1>Project Tracks</h1>
        <p>Apply what you're learning to real projects you care about. Each track pulls lessons relevant to a specific build.</p>
      </div>

      <div className="track-cards">
        {tracks.map(track => {
          const pct = track.progress
            ? Math.round((track.progress.milestonesCompleted / track.progress.totalMilestones) * 100)
            : 0
          const isActive = track.progress?.activeTrack
          const isComplete = track.progress?.completedAt != null

          return (
            <button
              key={track.id}
              className={`track-card ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
              onClick={() => onSelectTrack(track.id)}
              style={{ '--track-color': track.color } as React.CSSProperties}
            >
              <div className="track-card-icon">{track.icon}</div>
              <div className="track-card-body">
                <div className="track-card-top">
                  <h3>{track.name}</h3>
                  {isActive && !isComplete && <span className="track-active-badge">Active</span>}
                  {isComplete && <span className="track-complete-badge">Complete</span>}
                </div>
                <p className="track-tagline">{track.tagline}</p>
                <p className="track-description">{track.description.slice(0, 150)}{track.description.length > 150 ? '...' : ''}</p>
                <div className="track-card-footer">
                  <span className="track-milestone-count">{track.milestoneCount} milestones</span>
                  {track.progress && (
                    <div className="track-progress-mini">
                      <div className="track-progress-bar" style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  {track.progress && (
                    <span className="track-pct">{pct}%</span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
