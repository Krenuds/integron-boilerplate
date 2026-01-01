import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { initializeIpc } from './ipc/handlers'
import { initDatabase, closeDatabase } from './db'
import { overlayServer } from './server'
import { logger } from './logger'
import { createTray, destroyTray } from './tray'

// Track if we're really quitting or just hiding to tray
let isQuitting = false

function createWindow(): BrowserWindow {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    logger.info('Main window ready')
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      logger.debug('Window hidden to tray')
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return mainWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  logger.info('Integron starting...')

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.integron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize database and IPC handlers
  initDatabase()
  logger.info('Database initialized')

  initializeIpc()
  logger.info('IPC handlers registered')

  // Create main window and system tray
  const mainWindow = createWindow()
  createTray(mainWindow)

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      const newWindow = createWindow()
      createTray(newWindow)
    }
  })

  logger.info('Integron ready')
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // Don't quit - we have a tray icon. Only quit via tray menu or Cmd+Q on macOS
  if (process.platform !== 'darwin' && isQuitting) {
    app.quit()
  }
})

// Set quitting flag when user initiates quit
app.on('before-quit', () => {
  isQuitting = true
  logger.info('Integron shutting down...')
})

// Cleanup on quit
app.on('quit', async () => {
  destroyTray()
  await overlayServer.stop()
  closeDatabase()
  logger.info('Integron stopped')
})
