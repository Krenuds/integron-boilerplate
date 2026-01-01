import { shell } from 'electron'
import { createServer, Server } from 'http'
import { parse } from 'url'
import {
  getCredentials,
  setTokens,
  clearTokens,
  setBroadcaster,
  clearBroadcaster,
  getBroadcaster,
  getTokens
} from '../store'
import { createAuthProvider, destroyAuthProvider, getAuthProvider } from './twurple'

const REDIRECT_PORT = 9848
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}/callback`

const SCOPES = [
  'chat:read',
  'chat:edit',
  'channel:read:subscriptions',
  'channel:read:redemptions',
  'bits:read',
  'moderator:read:followers',
  'channel:read:hype_train',
  'channel:read:polls',
  'channel:read:predictions',
  'channel:manage:raids',
  'moderator:read:shoutouts'
]

let callbackServer: Server | null = null

export interface AuthStatus {
  authenticated: boolean
  broadcasterLogin: string | null
  broadcasterId: string | null
}

export function getAuthStatus(): AuthStatus {
  const tokens = getTokens()
  const authProvider = getAuthProvider()
  const broadcaster = getBroadcaster()

  if (!tokens || !authProvider) {
    return {
      authenticated: false,
      broadcasterLogin: null,
      broadcasterId: null
    }
  }

  return {
    authenticated: true,
    broadcasterLogin: broadcaster?.login ?? null,
    broadcasterId: broadcaster?.id ?? null
  }
}

export async function startOAuthFlow(): Promise<void> {
  const credentials = getCredentials()

  if (!credentials) {
    throw new Error('No credentials configured. Please set Client ID and Secret first.')
  }

  // Start callback server
  await startCallbackServer()

  // Build authorization URL
  const params = new URLSearchParams({
    client_id: credentials.clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' ')
  })

  const authUrl = `https://id.twitch.tv/oauth2/authorize?${params.toString()}`

  // Open browser
  await shell.openExternal(authUrl)
}

function startCallbackServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (callbackServer) {
      resolve()
      return
    }

    callbackServer = createServer(async (req, res) => {
      const parsedUrl = parse(req.url ?? '', true)

      if (parsedUrl.pathname === '/callback') {
        const code = parsedUrl.query.code as string
        const error = parsedUrl.query.error as string

        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' })
          res.end(`
            <!DOCTYPE html>
            <html>
              <head><meta charset="utf-8"></head>
              <body style="background:#1a1a2e;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                <div style="text-align:center;">
                  <div style="font-size:48px;margin-bottom:16px;color:#ef4444;">&#10007;</div>
                  <h1 style="margin:0 0 8px 0;">Authorization Failed</h1>
                  <p style="color:#f87171;">${error}</p>
                  <p style="color:#9ca3af;">You can close this window.</p>
                </div>
              </body>
            </html>
          `)
          stopCallbackServer()
          return
        }

        if (code) {
          try {
            await exchangeCodeForTokens(code)
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><meta charset="utf-8"></head>
                <body style="background:#1a1a2e;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                  <div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;color:#22c55e;">&#10003;</div>
                    <h1 style="margin:0 0 8px 0;">Authorization Successful</h1>
                    <p style="color:#9ca3af;">You can close this window and return to Integron.</p>
                  </div>
                </body>
              </html>
            `)
          } catch (err) {
            res.writeHead(500, { 'Content-Type': 'text/html; charset=utf-8' })
            res.end(`
              <!DOCTYPE html>
              <html>
                <head><meta charset="utf-8"></head>
                <body style="background:#1a1a2e;color:#fff;font-family:system-ui;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
                  <div style="text-align:center;">
                    <div style="font-size:48px;margin-bottom:16px;color:#ef4444;">&#10007;</div>
                    <h1 style="margin:0 0 8px 0;">Token Exchange Failed</h1>
                    <p style="color:#f87171;">${err instanceof Error ? err.message : 'Unknown error'}</p>
                    <p style="color:#9ca3af;">You can close this window.</p>
                  </div>
                </body>
              </html>
            `)
          }
          stopCallbackServer()
          return
        }
      }

      res.writeHead(404)
      res.end('Not found')
    })

    callbackServer.listen(REDIRECT_PORT, () => {
      resolve()
    })

    callbackServer.on('error', (err) => {
      callbackServer = null
      reject(err)
    })
  })
}

function stopCallbackServer(): void {
  if (callbackServer) {
    callbackServer.close()
    callbackServer = null
  }
}

async function exchangeCodeForTokens(code: string): Promise<void> {
  const credentials = getCredentials()

  if (!credentials) {
    throw new Error('No credentials available')
  }

  const response = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Token exchange failed: ${errorText}`)
  }

  const data = await response.json()

  setTokens({
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
    obtainmentTimestamp: Date.now(),
    scope: data.scope
  })

  // Fetch user info to get broadcaster ID and login
  await fetchAndStoreBroadcasterInfo(data.access_token, credentials.clientId)

  // Initialize auth provider with new tokens
  createAuthProvider()
}

async function fetchAndStoreBroadcasterInfo(accessToken: string, clientId: string): Promise<void> {
  const response = await fetch('https://api.twitch.tv/helix/users', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Client-Id': clientId
    }
  })

  if (!response.ok) {
    throw new Error('Failed to fetch user info')
  }

  const data = await response.json()
  const user = data.data[0]

  if (user) {
    setBroadcaster(user.id, user.login)
  }
}

export function logout(): void {
  destroyAuthProvider()
  clearTokens()
  clearBroadcaster()
}

export function initializeAuth(): boolean {
  const tokens = getTokens()
  const credentials = getCredentials()

  if (tokens && credentials) {
    const provider = createAuthProvider()
    return provider !== null
  }

  return false
}
