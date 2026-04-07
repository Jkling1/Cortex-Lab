import type { CortexAPI } from '../preload/index'

declare global {
  interface Window {
    api: CortexAPI
  }
}
