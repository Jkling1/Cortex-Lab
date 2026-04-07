import React, { useState, useEffect } from 'react'

interface Props {
  onSaved: () => void
}

interface SourceConfig {
  source: string
  enabled: boolean
  topics: string[]
}

export default function Settings({ onSaved }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)
  const [sources, setSources] = useState<SourceConfig[]>([])
  const [sourcesSaved, setSourcesSaved] = useState(false)

  useEffect(() => {
    window.api.getUserState().then(state => {
      if (state.apiKey) {
        setHasExisting(true)
        setApiKey('sk-ant-\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022' + state.apiKey.slice(-4))
      }
    })
    window.api.getContentSources().then(setSources)
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || apiKey.startsWith('sk-ant-\u2022')) return

    await window.api.saveApiKey(apiKey)
    setSaved(true)
    setHasExisting(true)
    setTimeout(() => {
      setSaved(false)
      onSaved()
    }, 1000)
  }

  function handleToggleSource(source: string) {
    setSources(prev => prev.map(s =>
      s.source === source ? { ...s, enabled: !s.enabled } : s
    ))
  }

  function handleTopicChange(source: string, topicsStr: string) {
    const topics = topicsStr.split(',').map(t => t.trim()).filter(Boolean)
    setSources(prev => prev.map(s =>
      s.source === source ? { ...s, topics } : s
    ))
  }

  async function handleSaveSources() {
    for (const s of sources) {
      await window.api.updateContentSource(s.source, s.enabled, s.topics)
    }
    setSourcesSaved(true)
    setTimeout(() => setSourcesSaved(false), 1500)
  }

  const sourceLabels: Record<string, string> = {
    arxiv: 'arXiv Papers',
    huggingface: 'Hugging Face'
  }

  return (
    <div className="settings">
      <h2>Settings</h2>

      <form onSubmit={handleSave} className="settings-form">
        <div className="form-group">
          <label htmlFor="api-key">Claude API Key</label>
          <p className="form-help">
            Get your API key from console.anthropic.com. Your key is stored locally and never sent anywhere except Anthropic's API.
          </p>
          <input
            id="api-key"
            type="password"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="input"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={!apiKey || apiKey.startsWith('sk-ant-\u2022')}>
          {saved ? 'Saved!' : hasExisting ? 'Update API Key' : 'Save API Key'}
        </button>
      </form>

      <div className="settings-section">
        <h3>Content Sources</h3>
        <p className="form-help">
          Configure which sources to pull from. Content is fetched automatically every 6 hours and indexed for your lessons.
        </p>

        {sources.map(s => (
          <div key={s.source} className="source-config">
            <div className="source-header">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={s.enabled}
                  onChange={() => handleToggleSource(s.source)}
                  className="toggle-input"
                />
                <span className="toggle-switch" />
                <span>{sourceLabels[s.source] || s.source}</span>
              </label>
            </div>
            {s.enabled && (
              <div className="source-topics">
                <label className="form-label-sm">Topics (comma-separated)</label>
                <input
                  type="text"
                  className="input"
                  value={s.topics.join(', ')}
                  onChange={e => handleTopicChange(s.source, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}

        <button className="btn-primary" onClick={handleSaveSources}>
          {sourcesSaved ? 'Saved!' : 'Save Content Settings'}
        </button>
      </div>
    </div>
  )
}
