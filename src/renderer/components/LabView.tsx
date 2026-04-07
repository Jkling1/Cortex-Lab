import React, { useState, useEffect, useRef } from 'react'

interface Exercise {
  id: string
  instructions: string
  starterCode: string
  hints: string[]
  lastSubmission: {
    code: string
    passed: boolean
    output: string
    errors: string
  } | null
}

interface LabData {
  id: string
  title: string
  description: string
  difficulty: string
  setupInstructions: string
  exercises: Exercise[]
  progress: {
    status: string
    exercisesCompleted: number
    totalExercises: number
  }
}

interface Props {
  labId: string
  onBack: () => void
}

export default function LabView({ labId, onBack }: Props) {
  const [lab, setLab] = useState<LabData | null>(null)
  const [currentExercise, setCurrentExercise] = useState(0)
  const [code, setCode] = useState('')
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<{ passed: boolean; output: string; errors: string } | null>(null)
  const [hintsRevealed, setHintsRevealed] = useState(0)
  const [showSolution, setShowSolution] = useState(false)
  const [solution, setSolution] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    loadLab()
  }, [labId])

  useEffect(() => {
    if (lab) {
      const ex = lab.exercises[currentExercise]
      if (ex.lastSubmission) {
        setCode(ex.lastSubmission.code)
        setResult({
          passed: ex.lastSubmission.passed,
          output: ex.lastSubmission.output,
          errors: ex.lastSubmission.errors
        })
      } else {
        setCode(ex.starterCode)
        setResult(null)
      }
      setHintsRevealed(0)
      setShowSolution(false)
      setSolution(null)
    }
  }, [currentExercise, lab])

  async function loadLab() {
    const data = await window.api.getLab(labId)
    setLab(data)
    if (data) {
      const ex = data.exercises[0]
      if (ex.lastSubmission) {
        setCode(ex.lastSubmission.code)
        setResult({
          passed: ex.lastSubmission.passed,
          output: ex.lastSubmission.output,
          errors: ex.lastSubmission.errors
        })
      } else {
        setCode(ex.starterCode)
      }
    }
  }

  async function handleRun() {
    setRunning(true)
    setResult(null)
    try {
      const res = await window.api.runLabExercise(labId, currentExercise, code)
      setResult(res)
      // Refresh lab to update progress
      const updated = await window.api.getLab(labId)
      setLab(updated)
    } catch (err) {
      setResult({ passed: false, output: '', errors: String(err) })
    }
    setRunning(false)
  }

  async function handleHint() {
    if (!lab) return
    const hint = await window.api.getExerciseHint(labId, currentExercise, hintsRevealed)
    if (hint) {
      setHintsRevealed(hintsRevealed + 1)
    }
  }

  async function handleShowSolution() {
    const sol = await window.api.getExerciseSolution(labId, currentExercise)
    setSolution(sol)
    setShowSolution(true)
  }

  function handleReset() {
    if (!lab) return
    setCode(lab.exercises[currentExercise].starterCode)
    setResult(null)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.target as HTMLTextAreaElement
      const start = target.selectionStart
      const end = target.selectionEnd
      const newCode = code.substring(0, start) + '    ' + code.substring(end)
      setCode(newCode)
      // Set cursor position after React re-render
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4
      }, 0)
    }
    // Ctrl/Cmd + Enter to run
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      handleRun()
    }
  }

  if (!lab) return <div className="lesson-loading">Loading lab...</div>

  const exercise = lab.exercises[currentExercise]
  const exercisePassed = exercise.lastSubmission?.passed || result?.passed

  return (
    <div className="lab-view">
      <div className="lab-view-header">
        <button className="btn-back" onClick={onBack}>&larr; Back to Labs</button>
        <div className="lab-view-meta">
          <h1>{lab.title}</h1>
          <div className="lab-exercise-nav">
            {lab.exercises.map((ex, idx) => {
              const passed = ex.lastSubmission?.passed || (idx === currentExercise && result?.passed)
              return (
                <button
                  key={ex.id}
                  className={`exercise-tab ${idx === currentExercise ? 'active' : ''} ${passed ? 'passed' : ''}`}
                  onClick={() => setCurrentExercise(idx)}
                >
                  {passed ? '\u2713' : idx + 1}
                </button>
              )
            })}
          </div>
          <div className="lab-progress-summary">
            {lab.progress.exercisesCompleted}/{lab.progress.totalExercises} complete
          </div>
        </div>
      </div>

      <div className="lab-workspace">
        <div className="lab-instructions-panel">
          <h3>Exercise {currentExercise + 1}</h3>
          <div className="lab-instructions-text">{exercise.instructions}</div>

          {hintsRevealed > 0 && (
            <div className="lab-hints">
              <h4>Hints</h4>
              {exercise.hints.slice(0, hintsRevealed).map((hint, i) => (
                <div key={i} className="lab-hint">{hint}</div>
              ))}
            </div>
          )}

          <div className="lab-help-buttons">
            {hintsRevealed < exercise.hints.length && (
              <button className="btn-hint" onClick={handleHint}>
                Show Hint ({hintsRevealed}/{exercise.hints.length})
              </button>
            )}
            {!showSolution && (
              <button className="btn-hint" onClick={handleShowSolution}>
                Show Solution
              </button>
            )}
          </div>

          {showSolution && solution && (
            <div className="lab-solution">
              <h4>Solution</h4>
              <pre className="code-block"><code>{solution}</code></pre>
            </div>
          )}
        </div>

        <div className="lab-editor-panel">
          <div className="editor-toolbar">
            <span className="editor-label">Python</span>
            <div className="editor-actions">
              <button className="btn-secondary btn-sm" onClick={handleReset}>Reset</button>
              <button
                className={`btn-primary btn-sm ${running ? 'running' : ''}`}
                onClick={handleRun}
                disabled={running}
              >
                {running ? 'Running...' : 'Run & Check (Ctrl+Enter)'}
              </button>
            </div>
          </div>

          <textarea
            ref={textareaRef}
            className="code-editor"
            value={code}
            onChange={e => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
          />

          {running && (
            <div className="lab-running">
              <div className="spinner spinner-sm" />
              <span>Running your code...</span>
            </div>
          )}

          {result && !running && (
            <div className={`lab-result ${result.passed ? 'passed' : 'failed'}`}>
              <div className="lab-result-header">
                {result.passed ? '\u2705 All tests passed!' : '\u274C Tests failed'}
              </div>
              {result.output && (
                <div className="lab-result-section">
                  <h4>Output</h4>
                  <pre>{result.output}</pre>
                </div>
              )}
              {result.errors && (
                <div className="lab-result-section error">
                  <h4>Errors</h4>
                  <pre>{result.errors}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="lab-nav-buttons">
        {currentExercise > 0 && (
          <button className="btn-secondary" onClick={() => setCurrentExercise(currentExercise - 1)}>
            &larr; Previous Exercise
          </button>
        )}
        {currentExercise < lab.exercises.length - 1 && exercisePassed && (
          <button className="btn-primary" onClick={() => setCurrentExercise(currentExercise + 1)}>
            Next Exercise &rarr;
          </button>
        )}
        {currentExercise === lab.exercises.length - 1 && lab.progress.status === 'completed' && (
          <button className="btn-primary" onClick={onBack}>
            Lab Complete! Back to Labs
          </button>
        )}
      </div>
    </div>
  )
}
