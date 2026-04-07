import React, { useEffect, useState } from 'react'

interface TierInfo {
  id: number
  name: string
  lessonCount: number
}

interface SidebarProps {
  curriculum: TierInfo[]
  currentTierId: number
  streakDays: number
  onNavigate: (view: 'lesson' | 'labs' | 'settings') => void
  activeView: string
}

export default function Sidebar({ curriculum, currentTierId, streakDays, onNavigate, activeView }: SidebarProps) {
  const [tierProgress, setTierProgress] = useState<Record<number, { completed: number; total: number }>>({})

  useEffect(() => {
    loadProgress()
  }, [currentTierId])

  async function loadProgress() {
    const progress: Record<number, { completed: number; total: number }> = {}
    for (const tier of curriculum) {
      const tp = await window.api.getTierProgress(tier.id)
      progress[tier.id] = { completed: tp.completedLessons, total: tp.totalLessons }
    }
    setTierProgress(progress)
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="logo">Cortex Lab</h1>
        {streakDays > 0 && (
          <div className="streak">{streakDays} day streak</div>
        )}
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeView === 'lesson' ? 'active' : ''}`}
          onClick={() => onNavigate('lesson')}
        >
          Today's Lesson
        </button>
        <button
          className={`nav-item ${activeView === 'labs' ? 'active' : ''}`}
          onClick={() => onNavigate('labs')}
        >
          Hands-On Labs
        </button>
        <button
          className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
          onClick={() => onNavigate('settings')}
        >
          Settings
        </button>
      </nav>

      <div className="tier-list">
        <h3>Curriculum</h3>
        {curriculum.map(tier => {
          const progress = tierProgress[tier.id]
          const isCurrent = tier.id === currentTierId
          const isLocked = tier.id > currentTierId
          const isComplete = progress && progress.total > 0 && progress.completed === progress.total

          return (
            <div
              key={tier.id}
              className={`tier-item ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''} ${isComplete ? 'complete' : ''}`}
            >
              <div className="tier-name">
                <span className="tier-number">{tier.id}.</span>
                {tier.name}
              </div>
              {progress && progress.total > 0 && (
                <div className="tier-progress-mini">
                  <div
                    className="tier-progress-bar"
                    style={{ width: `${(progress.completed / progress.total) * 100}%` }}
                  />
                </div>
              )}
              {isLocked && tier.lessonCount === 0 && (
                <span className="tier-badge">Coming Soon</span>
              )}
            </div>
          )
        })}
      </div>
    </aside>
  )
}
