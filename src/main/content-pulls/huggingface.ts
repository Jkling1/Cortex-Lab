import { ContentArticle } from '../../curriculum/types'

const HF_API = 'https://huggingface.co/api'

interface HfModel {
  id: string
  modelId: string
  author: string
  sha: string
  lastModified: string
  tags: string[]
  pipeline_tag?: string
  downloads: number
  likes: number
  library_name?: string
}

export async function fetchHuggingFaceModels(topics: string[], maxResults: number = 20): Promise<Omit<ContentArticle, 'id' | 'bookmarked' | 'dismissed'>[]> {
  const articles: Omit<ContentArticle, 'id' | 'bookmarked' | 'dismissed'>[] = []

  // Fetch trending models
  try {
    const params = new URLSearchParams({
      sort: 'trending',
      direction: '-1',
      limit: String(maxResults)
    })

    const response = await fetch(`${HF_API}/models?${params}`)
    if (!response.ok) throw new Error(`HF API error: ${response.status}`)

    const models: HfModel[] = await response.json()

    for (const model of models) {
      const relevantTags = topics.filter(t =>
        model.tags?.some(mt => mt.toLowerCase().includes(t.toLowerCase())) ||
        model.pipeline_tag?.toLowerCase().includes(t.toLowerCase())
      )

      // Relevance: boost if tags match topics, weight by downloads/likes
      const tagBoost = relevantTags.length * 2
      const popularityBoost = Math.log10(Math.max(1, model.downloads)) * 0.5
      const relevanceScore = tagBoost + popularityBoost

      articles.push({
        source: 'huggingface',
        externalId: model.id || model.modelId,
        title: model.modelId || model.id,
        summary: buildModelSummary(model),
        authors: [model.author],
        url: `https://huggingface.co/${model.modelId || model.id}`,
        tags: model.tags?.slice(0, 10) || [],
        publishedAt: model.lastModified,
        fetchedAt: new Date().toISOString(),
        relevanceScore
      })
    }
  } catch (err) {
    console.error('HuggingFace fetch error:', err)
  }

  // Also fetch trending datasets
  try {
    const params = new URLSearchParams({
      sort: 'trending',
      direction: '-1',
      limit: String(Math.floor(maxResults / 2))
    })

    const response = await fetch(`${HF_API}/datasets?${params}`)
    if (!response.ok) throw new Error(`HF datasets API error: ${response.status}`)

    const datasets = await response.json() as Array<{
      id: string
      author: string
      lastModified: string
      tags: string[]
      downloads: number
      likes: number
      description?: string
    }>

    for (const ds of datasets) {
      const popularityBoost = Math.log10(Math.max(1, ds.downloads)) * 0.5
      articles.push({
        source: 'huggingface',
        externalId: `dataset:${ds.id}`,
        title: `[Dataset] ${ds.id}`,
        summary: ds.description?.slice(0, 500) || `Dataset by ${ds.author}. ${ds.downloads.toLocaleString()} downloads, ${ds.likes} likes. Tags: ${ds.tags?.slice(0, 5).join(', ') || 'none'}.`,
        authors: [ds.author],
        url: `https://huggingface.co/datasets/${ds.id}`,
        tags: ds.tags?.slice(0, 10) || [],
        publishedAt: ds.lastModified,
        fetchedAt: new Date().toISOString(),
        relevanceScore: popularityBoost
      })
    }
  } catch (err) {
    console.error('HuggingFace datasets fetch error:', err)
  }

  return articles
}

function buildModelSummary(model: HfModel): string {
  const parts: string[] = []
  if (model.pipeline_tag) parts.push(`Pipeline: ${model.pipeline_tag}.`)
  if (model.library_name) parts.push(`Library: ${model.library_name}.`)
  parts.push(`${model.downloads.toLocaleString()} downloads, ${model.likes} likes.`)
  if (model.tags?.length) parts.push(`Tags: ${model.tags.slice(0, 8).join(', ')}.`)
  return parts.join(' ')
}
