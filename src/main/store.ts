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
  broadcasterProfileImageUrl: string | null
}

const store = new Store<StoreSchema>({
  name: 'integron-credentials',
  defaults: {
    credentials: null,
    tokens: null,
    broadcasterId: null,
    broadcasterLogin: null,
    broadcasterProfileImageUrl: null
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

export function getBroadcaster(): {
  id: string
  login: string
  profileImageUrl: string | null
} | null {
  const id = store.get('broadcasterId')
  const login = store.get('broadcasterLogin')
  const profileImageUrl = store.get('broadcasterProfileImageUrl')
  if (id && login) {
    return { id, login, profileImageUrl }
  }
  return null
}

export function setBroadcaster(id: string, login: string, profileImageUrl?: string): void {
  store.set('broadcasterId', id)
  store.set('broadcasterLogin', login)
  if (profileImageUrl) {
    store.set('broadcasterProfileImageUrl', profileImageUrl)
  }
}

export function clearBroadcaster(): void {
  store.delete('broadcasterId')
  store.delete('broadcasterLogin')
  store.delete('broadcasterProfileImageUrl')
}

export function clearAll(): void {
  store.clear()
}

export { store }
