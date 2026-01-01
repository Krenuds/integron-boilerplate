import { Tray, Menu, BrowserWindow, shell, nativeImage, app } from 'electron'
import { logger } from './logger'
import iconPath from '../../resources/icon.png?asset'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null

// Server port for overlay URLs
const OVERLAY_PORT = 9847

export function createTray(window: BrowserWindow): Tray {
  mainWindow = window

  // Load tray icon (use smaller size for tray)
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })

  tray = new Tray(icon)
  tray.setToolTip('Integron')

  updateTrayMenu()

  // Click to show/hide window
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide()
      } else {
        mainWindow.show()
        mainWindow.focus()
      }
    }
  })

  logger.info('System tray created')
  return tray
}

export function updateTrayMenu(connected = false): void {
  if (!tray) return

  const contextMenu = Menu.buildFromTemplate([
    {
      label: mainWindow?.isVisible() ? 'Hide Window' : 'Show Window',
      click: (): void => {
        if (mainWindow) {
          if (mainWindow.isVisible()) {
            mainWindow.hide()
          } else {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: `Status: ${connected ? 'Connected' : 'Disconnected'}`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Overlay URLs',
      submenu: [
        {
          label: 'Feed Overlay',
          click: (): void => {
            shell.openExternal(`http://localhost:${OVERLAY_PORT}/overlay/feed.html`)
          }
        },
        {
          label: 'Alerts Overlay',
          click: (): void => {
            shell.openExternal(`http://localhost:${OVERLAY_PORT}/overlay/alerts.html`)
          }
        },
        {
          label: 'Chat Overlay',
          click: (): void => {
            shell.openExternal(`http://localhost:${OVERLAY_PORT}/overlay/chat.html`)
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: (): void => {
        app.quit()
      }
    }
  ])

  tray.setContextMenu(contextMenu)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
    logger.info('System tray destroyed')
  }
}

export function setTrayConnected(connected: boolean): void {
  updateTrayMenu(connected)
}
