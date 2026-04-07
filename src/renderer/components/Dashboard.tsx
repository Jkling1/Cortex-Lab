import React, { useEffect, useState } from 'react'

interface Stats {
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

interface SkillNode {
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

interface Props {
  onNavigateReview: () => void
}

export default function Dashboard({ onNavigateReview }: Props) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [tree, setTree] = useState<SkillNode[]>([])

  useEffect(() => {
    Promise.all([
      window.api.getDashboardStats(),
      window.api.getSkillTree()
    ]).then(([s, t]) => {
      setStats(s)
      setTree(t)
    })
  }, [])

  if (!stats) return <div className="lesson-loading">Loading dashboard...</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Your AI mastery journey at a glance.</p>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-card accent">
          <div className="stat-value">{stats.streakDays}</div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalLessonsCompleted}</div>
          <div className="stat-label">Lessons Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalLabsCompleted}</div>
          <div className="stat-label">Labs Done</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalHoursEstimated}h</div>
          <div className="stat-label">Estimated Hours</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.activeProjectTracks}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.conceptsMastered}</div>
          <div className="stat-label">Concepts Mastered</div>
        </div>
      </div>

      {/* Current position */}
      <div className="dashboard-section">
        <h2>Current Position</h2>
        <div className="current-position">
          <div className="position-tier">
            <span className="position-label">Tier</span>
            <span className="position-value">{stats.currentTierId}. {stats.currentTierName}</span>
          </div>
          <div className="position-lesson">
            <span className="position-label">Lesson</span>
            <span className="position-value">{stats.currentLessonOrder} of {stats.totalLessonsInTier}</span>
          </div>
          {stats.reviewCardsDue > 0 && (
            <button className="review-due-btn" onClick={onNavigateReview}>
              {stats.reviewCardsDue} reviews due
            </button>
          )}
        </div>
      </div>

      {/* Skill tree */}
      <div className="dashboard-section">
        <h2>Skill Tree</h2>
        <div className="skill-tree">
          {tree.map(node => {
            const lessonPct = node.lessonsTotal > 0 ? Math.round((node.lessonsCompleted / node.lessonsTotal) * 100) : 0
            const statusClass = `skill-node-${node.status}`

            return (
              <div key={node.id} className={`skill-node ${statusClass}`}>
                <div className="skill-node-header">
                  <div className="skill-node-id">{node.id}</div>
                  <div className="skill-node-info">
                    <h3>{node.name}</h3>
                    <p>{node.description.slice(0, 80)}{node.description.length > 80 ? '...' : ''}</p>
                  </div>
                  <div className="skill-node-status-badge">
                    {node.status === 'completed' && '\u2713'}
                    {node.status === 'in_progress' && '\u25B6'}
                    {node.status === 'available' && '\u25CB'}
                    {node.status === 'locked' && '\u{1F512}'}
                  </div>
                </div>
                {node.lessonsTotal > 0 && (
                  <div className="skill-node-progress">
                    <div className="skill-node-bar-track">
                      <div className="skill-node-bar-fill" style={{ width: `${lessonPct}%` }} />
                    </div>
                    <span className="skill-node-counts">
                      {node.lessonsCompleted}/{node.lessonsTotal} lessons
                      {node.labsTotal > 0 && ` \u00B7 ${node.labsCompleted}/${node.labsTotal} labs`}
                    </span>
                  </div>
                )}
                {node.prerequisites.length > 0 && (
                  <div className="skill-node-prereqs">
                    Requires: {node.prerequisites.map(p => {
                      const prereq = tree.find(n => n.id === p)
                      return prereq?.name || `Tier ${p}`
                    }).join(', ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
