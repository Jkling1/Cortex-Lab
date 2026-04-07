import React, { useEffect, useState } from 'react'

interface Props {
  tierId: number
}

export default function ProgressBar({ tierId }: Props) {
  const [progress, setProgress] = useState({ completed: 0, total: 0, tierName: '' })

  useEffect(() => {
    window.api.getTierProgress(tierId).then(tp => {
      setProgress({ completed: tp.completedLessons, total: tp.totalLessons, tierName: tp.tierName })
    })
  }, [tierId])

  if (progress.total === 0) return null

  const pct = Math.round((progress.completed / progress.total) * 100)

  return (
    <div className="progress-bar-container">
      <div className="progress-info">
        <span>{progress.completed} of {progress.total} lessons complete</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
