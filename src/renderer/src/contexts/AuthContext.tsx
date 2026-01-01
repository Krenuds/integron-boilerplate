import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'

interface AuthStatus {
  authenticated: boolean
  broadcasterLogin: string | null
  broadcasterId: string | null
  profileImageUrl: string | null
}

interface Credentials {
  clientId: string
  clientSecret: string
}

interface AuthContextValue {
  status: AuthStatus
  credentials: Credentials | null
  isLoading: boolean
  error: string | null
  saveCredentials: (creds: Credentials) => Promise<void>
  startLogin: () => Promise<void>
  logout: () => Promise<void>
  refreshStatus: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [status, setStatus] = useState<AuthStatus>({
    authenticated: false,
    broadcasterLogin: null,
    broadcasterId: null,
    profileImageUrl: null
  })
  const [credentials, setCredentials] = useState<Credentials | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = useCallback(async () => {
    try {
      const [authStatus, creds] = await Promise.all([
        window.api.getAuthStatus(),
        window.api.getCredentials()
      ])
      setStatus(authStatus)
      setCredentials(creds)
    } catch (err) {
      console.error('Failed to refresh auth status:', err)
    }
  }, [])

  // Initial load
  useEffect(() => {
    refreshStatus().finally(() => setIsLoading(false))
  }, [refreshStatus])

  // Listen for auth changes from main process
  useEffect(() => {
    const unsubscribe = window.api.onAuthChange((newStatus) => {
      setStatus(newStatus as AuthStatus)
    })
    return () => {
      unsubscribe()
    }
  }, [])

  const saveCredentials = useCallback(async (creds: Credentials) => {
    setError(null)
    try {
      await window.api.saveCredentials(creds)
      setCredentials(creds)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save credentials'
      setError(message)
      throw err
    }
  }, [])

  const startLogin = useCallback(async () => {
    setError(null)
    try {
      await window.api.startLogin()
      // Status will update via onAuthChange callback
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start login'
      setError(message)
      throw err
    }
  }, [])

  const logout = useCallback(async () => {
    setError(null)
    try {
      await window.api.logout()
      // Status will update via onAuthChange callback
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to logout'
      setError(message)
      throw err
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        status,
        credentials,
        isLoading,
        error,
        saveCredentials,
        startLogin,
        logout,
        refreshStatus
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
