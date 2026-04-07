import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import DailyLesson from './components/DailyLesson'
import Settings from './components/Settings'

type View = 'lesson' | 'settings'

interface TierInfo {
  id: number
  name: string
  description: string
  estimatedHours: number
  lessonCount: number
  prerequisites: number[]
}

export default function App() {
  const [view, setView] = useState<View>('lesson')
  const [curriculum, setCurriculum] = useState<TierInfo[]>([])
  const [userState, setUserState] = useState<{
    currentTierId: number
    currentLessonOrder: number
    streakDays: number
    apiKey: string | null
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const [state, tiers] = await Promise.all([
      window.api.getUserState(),
      window.api.getCurriculum()
    ])
    setUserState(state)
    setCurriculum(tiers)
  }

  function handleLessonComplete() {
    loadData()
  }

  function handleApiKeySaved() {
    loadData()
    setView('lesson')
  }

  if (!userState) {
    return <div className="loading">Loading Cortex Lab...</div>
  }

  // Prompt for API key on first launch
  if (!userState.apiKey && view !== 'settings') {
    return (
      <div className="app-layout">
        <div className="welcome">
          <h1>Welcome to Cortex Lab</h1>
          <p>Your personal AI tutor for mastering machine learning and artificial intelligence.</p>
          <p>To get started, you'll need a Claude API key from Anthropic.</p>
          <Settings onSaved={handleApiKeySaved} />
        </div>
      </div>
    )
  }

  return (
    <div className="app-layout">
      <Sidebar
        curriculum={curriculum}
        currentTierId={userState.currentTierId}
        streakDays={userState.streakDays}
        onNavigate={setView}
        activeView={view}
      />
      <main className="main-content">
        {view === 'lesson' && (
          <DailyLesson onComplete={handleLessonComplete} />
        )}
        {view === 'settings' && (
          <Settings onSaved={handleApiKeySaved} />
        )}
      </main>
    </div>
  )
}
