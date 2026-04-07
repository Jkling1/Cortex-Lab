import React, { useState, useEffect } from 'react'

interface Props {
  onSaved: () => void
}

export default function Settings({ onSaved }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [saved, setSaved] = useState(false)
  const [hasExisting, setHasExisting] = useState(false)

  useEffect(() => {
    window.api.getUserState().then(state => {
      if (state.apiKey) {
        setHasExisting(true)
        // Show masked version
        setApiKey('sk-ant-•••••••••' + state.apiKey.slice(-4))
      }
    })
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey || apiKey.startsWith('sk-ant-•')) return

    await window.api.saveApiKey(apiKey)
    setSaved(true)
    setHasExisting(true)
    setTimeout(() => {
      setSaved(false)
      onSaved()
    }, 1000)
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
        <button type="submit" className="btn-primary" disabled={!apiKey || apiKey.startsWith('sk-ant-•')}>
          {saved ? 'Saved!' : hasExisting ? 'Update API Key' : 'Save API Key'}
        </button>
      </form>
    </div>
  )
}
