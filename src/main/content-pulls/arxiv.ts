import { ContentArticle } from '../../curriculum/types'

const ARXIV_API = 'https://export.arxiv.org/api/query'

interface ArxivEntry {
  title: string
  summary: string
  authors: string[]
  id: string
  published: string
  categories: string[]
  links: { href: string; type?: string }[]
}

export async function fetchArxivPapers(topics: string[], maxResults: number = 20): Promise<Omit<ContentArticle, 'id' | 'bookmarked' | 'dismissed'>[]> {
  const query = topics.map(t => `all:"${t}"`).join(' OR ')
  const params = new URLSearchParams({
    search_query: query,
    start: '0',
    max_results: String(maxResults),
    sortBy: 'submittedDate',
    sortOrder: 'descending'
  })

  const url = `${ARXIV_API}?${params}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`)
  }

  const xml = await response.text()
  return parseArxivXml(xml)
}

function parseArxivXml(xml: string): Omit<ContentArticle, 'id' | 'bookmarked' | 'dismissed'>[] {
  const articles: Omit<ContentArticle, 'id' | 'bookmarked' | 'dismissed'>[] = []
  const entries = xml.split('<entry>').slice(1)

  for (const entry of entries) {
    try {
      const title = extractTag(entry, 'title').replace(/\s+/g, ' ').trim()
      const summary = extractTag(entry, 'summary').replace(/\s+/g, ' ').trim()
      const published = extractTag(entry, 'published')
      const arxivId = extractTag(entry, 'id')

      // Extract authors
      const authorMatches = entry.match(/<author>\s*<name>([^<]+)<\/name>/g) || []
      const authors = authorMatches.map(m => {
        const nameMatch = m.match(/<name>([^<]+)<\/name>/)
        return nameMatch ? nameMatch[1].trim() : ''
      }).filter(Boolean)

      // Extract categories as tags
      const categoryMatches = entry.match(/category\s+term="([^"]+)"/g) || []
      const tags = categoryMatches.map(m => {
        const match = m.match(/term="([^"]+)"/)
        return match ? match[1] : ''
      }).filter(Boolean)

      // Extract PDF link
      const pdfMatch = entry.match(/link[^>]+title="pdf"[^>]+href="([^"]+)"/)
      const absMatch = entry.match(/link[^>]+type="text\/html"[^>]+href="([^"]+)"/)
      const url = absMatch ? absMatch[1] : (pdfMatch ? pdfMatch[1] : arxivId)

      // Simple relevance scoring: newer papers with ML-related categories score higher
      const mlCategories = ['cs.LG', 'cs.AI', 'cs.CV', 'cs.CL', 'cs.NE', 'stat.ML']
      const relevanceBoost = tags.filter(t => mlCategories.includes(t)).length
      const daysOld = Math.max(0, (Date.now() - new Date(published).getTime()) / 86400000)
      const relevanceScore = Math.max(0, 10 + relevanceBoost * 2 - daysOld * 0.1)

      articles.push({
        source: 'arxiv',
        externalId: arxivId.replace('http://arxiv.org/abs/', '').replace('https://arxiv.org/abs/', ''),
        title,
        summary: summary.slice(0, 1000),
        authors,
        url,
        tags,
        publishedAt: published,
        fetchedAt: new Date().toISOString(),
        relevanceScore
      })
    } catch {
      // Skip malformed entries
    }
  }

  return articles
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}
