import Store from 'electron-store'

interface Credentials {
  clientId: string
  clientSecret: string
}

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresIn: number
  obtainmentTimestamp: number
  scope: string[]
}

interface StoreSchema {
  credentials: Credentials | null
  tokens: TokenData | null
  broadcasterId: string | null
  broadcasterLogin: string | null
}

const store = new Store<StoreSchema>({
  name: 'integron-credentials',
  defaults: {
    credentials: null,
    tokens: null,
    broadcasterId: null,
    broadcasterLogin: null
  }
})

export function getCredentials(): Credentials | null {
  return store.get('credentials')
}

export function setCredentials(credentials: Credentials): void {
  store.set('credentials', credentials)
}

export function clearCredentials(): void {
  store.delete('credentials')
}

export function getTokens(): TokenData | null {
  return store.get('tokens')
}

export function setTokens(tokens: TokenData): void {
  store.set('tokens', tokens)
}

export function clearTokens(): void {
  store.delete('tokens')
}

export function getBroadcaster(): { id: string; login: string } | null {
  const id = store.get('broadcasterId')
  const login = store.get('broadcasterLogin')
  if (id && login) {
    return { id, login }
  }
  return null
}

export function setBroadcaster(id: string, login: string): void {
  store.set('broadcasterId', id)
  store.set('broadcasterLogin', login)
}

export function clearBroadcaster(): void {
  store.delete('broadcasterId')
  store.delete('broadcasterLogin')
}

export function clearAll(): void {
  store.clear()
}

export { store }
