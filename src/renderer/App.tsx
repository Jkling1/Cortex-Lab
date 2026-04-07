import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import DailyLesson from './components/DailyLesson'
import LabList from './components/LabList'
import LabView from './components/LabView'
import ContentFeed from './components/ContentFeed'
import ProjectTrackList from './components/ProjectTrackList'
import ProjectTrackDetail from './components/ProjectTrackDetail'
import MasteryReview from './components/MasteryReview'
import Settings from './components/Settings'

type View = 'dashboard' | 'lesson' | 'labs' | 'feed' | 'projects' | 'review' | 'settings'

interface TierInfo {
  id: number
  name: string
  description: string
  estimatedHours: number
  lessonCount: number
  prerequisites: number[]
}

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [activeLabId, setActiveLabId] = useState<string | null>(null)
  const [activeTrackId, setActiveTrackId] = useState<string | null>(null)
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
        {view === 'dashboard' && (
          <Dashboard onNavigateReview={() => setView('review')} />
        )}
        {view === 'lesson' && (
          <DailyLesson onComplete={handleLessonComplete} />
        )}
        {view === 'labs' && !activeLabId && (
          <LabList
            tierId={userState.currentTierId}
            onSelectLab={(id) => setActiveLabId(id)}
          />
        )}
        {view === 'labs' && activeLabId && (
          <LabView
            labId={activeLabId}
            onBack={() => setActiveLabId(null)}
          />
        )}
        {view === 'feed' && (
          <ContentFeed />
        )}
        {view === 'projects' && !activeTrackId && (
          <ProjectTrackList onSelectTrack={(id) => setActiveTrackId(id)} />
        )}
        {view === 'projects' && activeTrackId && (
          <ProjectTrackDetail
            trackId={activeTrackId}
            onBack={() => setActiveTrackId(null)}
          />
        )}
        {view === 'review' && (
          <MasteryReview />
        )}
        {view === 'settings' && (
          <Settings onSaved={handleApiKeySaved} />
        )}
      </main>
    </div>
  )
}
