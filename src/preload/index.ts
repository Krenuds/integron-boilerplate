import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { IpcChannel, IpcParams, IpcResult } from '../shared/ipc-types'

// Typed IPC invoke wrapper
function invoke<C extends IpcChannel>(
  channel: C,
  ...args: IpcParams<C> extends void ? [] : [IpcParams<C>]
): Promise<IpcResult<C>> {
  return ipcRenderer.invoke(channel, ...args)
}

// Custom APIs for renderer
const api = {
  // Auth
  getAuthStatus: () => invoke('auth:get-status'),
  startLogin: () => invoke('auth:start-login'),
  logout: () => invoke('auth:logout'),
  saveCredentials: (creds: IpcParams<'auth:save-credentials'>) =>
    invoke('auth:save-credentials', creds),
  getCredentials: () => invoke('auth:get-credentials'),

  // Events
  getRecentEvents: (params: IpcParams<'events:get-recent'>) => invoke('events:get-recent', params),
  testFireEvent: (params: IpcParams<'events:test-fire'>) => invoke('events:test-fire', params),

  // Users
  getUsers: (params: IpcParams<'users:get-all'>) => invoke('users:get-all', params),
  getUserById: (id: string) => invoke('users:get-by-id', id),
  deleteUser: (id: string) => invoke('users:delete', id),

  // Server
  getServerStatus: () => invoke('server:get-status'),
  getOverlays: () => invoke('server:get-overlays'),
  restartServer: () => invoke('server:restart'),

  // Twitch
  getTwitchStatus: () => invoke('twitch:get-status'),

  // Event queue (in-memory)
  getEventQueue: (count: number = 50) => invoke('events:get-queue', count),

  // Settings
  getSettings: () => invoke('settings:get'),
  updateSettings: (settings: IpcParams<'settings:update'>) => invoke('settings:update', settings),

  // Event subscription (for live updates)
  onEvent: (callback: (event: unknown) => void) => {
    const handler = (_: unknown, event: unknown) => callback(event)
    ipcRenderer.on('event:new', handler)
    return () => ipcRenderer.removeListener('event:new', handler)
  },

  onAuthChange: (callback: (status: unknown) => void) => {
    const handler = (_: unknown, status: unknown) => callback(status)
    ipcRenderer.on('auth:changed', handler)
    return () => ipcRenderer.removeListener('auth:changed', handler)
  }
}

export type Api = typeof api

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
