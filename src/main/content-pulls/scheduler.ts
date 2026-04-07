import { fetchArxivPapers } from './arxiv'
import { fetchHuggingFaceModels } from './huggingface'
import { upsertArticle, getContentSources, markSourceFetched } from '../database'
import { BrowserWindow } from 'electron'

let intervalId: ReturnType<typeof setInterval> | null = null

export async function runContentPull(): Promise<{ arxiv: number; huggingface: number; errors: string[] }> {
  const sources = getContentSources()
  const result = { arxiv: 0, huggingface: 0, errors: [] as string[] }

  for (const source of sources) {
    if (!source.enabled) continue

    try {
      if (source.source === 'arxiv') {
        const articles = await fetchArxivPapers(source.topics, 25)
        for (const article of articles) {
          upsertArticle(article)
          result.arxiv++
        }
        markSourceFetched('arxiv')
      } else if (source.source === 'huggingface') {
        const articles = await fetchHuggingFaceModels(source.topics, 20)
        for (const article of articles) {
          upsertArticle(article)
          result.huggingface++
        }
        markSourceFetched('huggingface')
      }
    } catch (err) {
      const msg = `${source.source}: ${err instanceof Error ? err.message : String(err)}`
      result.errors.push(msg)
      console.error(`Content pull error (${source.source}):`, err)
    }
  }

  // Notify renderer that content was updated
  const windows = BrowserWindow.getAllWindows()
  for (const win of windows) {
    win.webContents.send('content-updated', result)
  }

  return result
}

export function startContentScheduler(intervalMinutes: number = 60 * 6): void {
  // Run immediately on first launch, then every intervalMinutes
  // Delay first pull by 10 seconds to not block app startup
  setTimeout(() => {
    runContentPull().catch(console.error)
  }, 10000)

  intervalId = setInterval(() => {
    runContentPull().catch(console.error)
  }, intervalMinutes * 60 * 1000)
}

export function stopContentScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}
