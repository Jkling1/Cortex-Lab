import React, { useState, useEffect, useCallback } from 'react'

interface Article {
  id: number
  source: string
  title: string
  summary: string
  authors: string[]
  url: string
  tags: string[]
  publishedAt: string
  relevanceScore: number
  bookmarked: boolean
}

interface Stats {
  totalArticles: number
  arxivCount: number
  huggingfaceCount: number
  bookmarkedCount: number
  lastFetchedAt: string | null
}

type Filter = 'all' | 'arxiv' | 'huggingface' | 'bookmarked'

export default function ContentFeed() {
  const [articles, setArticles] = useState<Article[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filter, setFilter] = useState<Filter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    const filters: Record<string, unknown> = { limit: 50 }
    if (filter === 'arxiv') filters.source = 'arxiv'
    if (filter === 'huggingface') filters.source = 'huggingface'
    if (filter === 'bookmarked') filters.bookmarkedOnly = true
    if (searchQuery.trim()) filters.searchQuery = searchQuery.trim()

    const [feed, s] = await Promise.all([
      window.api.getContentFeed(filters),
      window.api.getContentStats()
    ])
    setArticles(feed)
    setStats(s)
    setLoading(false)
  }, [filter, searchQuery])

  useEffect(() => {
    loadFeed()
  }, [loadFeed])

  useEffect(() => {
    const cleanup = window.api.onContentUpdated(() => {
      loadFeed()
    })
    return cleanup
  }, [loadFeed])

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await window.api.refreshContent()
      await loadFeed()
    } catch (err) {
      console.error('Refresh failed:', err)
    }
    setRefreshing(false)
  }

  async function handleBookmark(id: number) {
    const newState = await window.api.toggleBookmark(id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, bookmarked: newState } : a))
    const s = await window.api.getContentStats()
    setStats(s)
  }

  async function handleDismiss(id: number) {
    await window.api.dismissArticle(id)
    setArticles(prev => prev.filter(a => a.id !== id))
    const s = await window.api.getContentStats()
    setStats(s)
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className="content-feed">
      <div className="content-feed-header">
        <div>
          <h1>AI World Feed</h1>
          <p className="content-feed-subtitle">
            Latest from arXiv and Hugging Face, indexed for your curriculum.
            {stats?.lastFetchedAt && (
              <span className="last-fetched"> Last updated: {formatDate(stats.lastFetchedAt)}</span>
            )}
          </p>
        </div>
        <button
          className={`btn-primary ${refreshing ? 'running' : ''}`}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Fetching...' : 'Refresh Now'}
        </button>
      </div>

      {stats && (
        <div className="content-stats">
          <div className="stat-chip" onClick={() => setFilter('all')}>
            <span className="stat-count">{stats.totalArticles}</span> Total
          </div>
          <div className="stat-chip" onClick={() => setFilter('arxiv')}>
            <span className="stat-count">{stats.arxivCount}</span> arXiv
          </div>
          <div className="stat-chip" onClick={() => setFilter('huggingface')}>
            <span className="stat-count">{stats.huggingfaceCount}</span> HuggingFace
          </div>
          <div className="stat-chip" onClick={() => setFilter('bookmarked')}>
            <span className="stat-count">{stats.bookmarkedCount}</span> Saved
          </div>
        </div>
      )}

      <div className="content-controls">
        <div className="content-filters">
          {(['all', 'arxiv', 'huggingface', 'bookmarked'] as Filter[]).map(f => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'All' : f === 'arxiv' ? 'arXiv' : f === 'huggingface' ? 'HuggingFace' : 'Saved'}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="content-search input"
          placeholder="Search articles..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {loading && <div className="lesson-loading">Loading feed...</div>}

      {!loading && articles.length === 0 && (
        <div className="content-empty">
          <h3>{searchQuery ? 'No results found' : 'No articles yet'}</h3>
          <p>{searchQuery ? 'Try a different search term.' : 'Click "Refresh Now" to fetch the latest from arXiv and Hugging Face.'}</p>
        </div>
      )}

      {!loading && articles.length > 0 && (
        <div className="content-articles">
          {articles.map(article => (
            <div key={article.id} className={`content-article ${article.bookmarked ? 'bookmarked' : ''}`}>
              <div className="article-header">
                <span className={`source-badge source-${article.source}`}>
                  {article.source === 'arxiv' ? 'arXiv' : 'HF'}
                </span>
                <span className="article-date">{formatDate(article.publishedAt)}</span>
                <div className="article-actions">
                  <button
                    className={`icon-btn ${article.bookmarked ? 'active' : ''}`}
                    onClick={() => handleBookmark(article.id)}
                    title={article.bookmarked ? 'Remove bookmark' : 'Bookmark'}
                  >
                    {article.bookmarked ? '\u2605' : '\u2606'}
                  </button>
                  <button
                    className="icon-btn dismiss"
                    onClick={() => handleDismiss(article.id)}
                    title="Dismiss"
                  >
                    \u2715
                  </button>
                </div>
              </div>
              <h3 className="article-title">
                <a href={article.url} target="_blank" rel="noopener noreferrer">
                  {article.title}
                </a>
              </h3>
              {article.authors.length > 0 && (
                <div className="article-authors">{article.authors.slice(0, 3).join(', ')}{article.authors.length > 3 ? ` +${article.authors.length - 3}` : ''}</div>
              )}
              <p className="article-summary">{article.summary.slice(0, 300)}{article.summary.length > 300 ? '...' : ''}</p>
              {article.tags.length > 0 && (
                <div className="article-tags">
                  {article.tags.slice(0, 5).map(tag => (
                    <span key={tag} className="article-tag">{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
