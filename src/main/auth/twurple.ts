import { RefreshingAuthProvider } from '@twurple/auth'
import { getCredentials, getTokens, setTokens, getBroadcaster } from '../store'

let authProvider: RefreshingAuthProvider | null = null

export function getAuthProvider(): RefreshingAuthProvider | null {
  return authProvider
}

export function createAuthProvider(): RefreshingAuthProvider | null {
  const credentials = getCredentials()
  const tokens = getTokens()
  const broadcaster = getBroadcaster()

  if (!credentials || !tokens) {
    return null
  }

  authProvider = new RefreshingAuthProvider({
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret
  })

  authProvider.onRefresh((_userId, newTokenData) => {
    setTokens({
      accessToken: newTokenData.accessToken,
      refreshToken: newTokenData.refreshToken ?? '',
      expiresIn: newTokenData.expiresIn ?? 0,
      obtainmentTimestamp: newTokenData.obtainmentTimestamp,
      scope: newTokenData.scope
    })
  })

  // Add user with token data and intents for chat and eventsub
  const userId = broadcaster?.id ?? tokens.accessToken
  authProvider.addUser(userId, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
    obtainmentTimestamp: tokens.obtainmentTimestamp,
    scope: tokens.scope
  }, ['chat'])

  return authProvider
}

export function destroyAuthProvider(): void {
  authProvider = null
}
