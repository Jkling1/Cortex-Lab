import { app, BrowserWindow } from 'electron'
import path from 'path'
import { initDatabase } from './database'
import { registerIpcHandlers } from './ipc-handlers'
import { startContentScheduler, stopContentScheduler } from './content-pulls/scheduler'

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: 'Cortex Lab',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  initDatabase()
  registerIpcHandlers()
  startContentScheduler()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopContentScheduler()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
