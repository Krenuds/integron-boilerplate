import { useState, useEffect } from 'react'
import { Box, Heading, Stack, Field, Input, Button, Text, Spinner, Badge } from '@chakra-ui/react'
import { useAuth } from '../contexts/AuthContext'

export default function Settings(): React.JSX.Element {
  const { status, credentials, isLoading, error, saveCredentials, startLogin, logout, refreshStatus } =
    useAuth()

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load saved credentials into form
  useEffect(() => {
    if (credentials) {
      setClientId(credentials.clientId)
      setClientSecret(credentials.clientSecret)
    }
  }, [credentials])

  const handleSave = async (): Promise<void> => {
    if (!clientId.trim() || !clientSecret.trim()) return

    setIsSaving(true)
    setSaveSuccess(false)
    try {
      await saveCredentials({ clientId: clientId.trim(), clientSecret: clientSecret.trim() })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const handleConnect = async (): Promise<void> => {
    setIsConnecting(true)
    try {
      await startLogin()
      // Poll for auth status change (callback may take a moment)
      const pollInterval = setInterval(async () => {
        await refreshStatus()
      }, 1000)
      // Stop polling after 60 seconds
      setTimeout(() => clearInterval(pollInterval), 60000)
    } catch {
      // Error is handled in context
    } finally {
      setIsConnecting(false)
    }
  }

  const handleDisconnect = async (): Promise<void> => {
    await logout()
  }

  if (isLoading) {
    return (
      <Box>
        <Spinner />
      </Box>
    )
  }

  const hasCredentials = credentials && credentials.clientId && credentials.clientSecret
  const canConnect = hasCredentials && !status.authenticated

  return (
    <Box>
      <Heading size="md" mb={4}>
        Settings
      </Heading>
      <Box bg="gray.800" p={4} borderRadius="md" maxW="400px">
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Client ID</Field.Label>
            <Input
              placeholder="Twitch Client ID"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              disabled={status.authenticated}
            />
          </Field.Root>
          <Field.Root>
            <Field.Label>Client Secret</Field.Label>
            <Input
              type="password"
              placeholder="Twitch Client Secret"
              value={clientSecret}
              onChange={(e) => setClientSecret(e.target.value)}
              disabled={status.authenticated}
            />
          </Field.Root>
          <Button
            colorPalette="purple"
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !clientId.trim() || !clientSecret.trim() || status.authenticated}
            loading={isSaving}
          >
            {saveSuccess ? 'Saved!' : 'Save Credentials'}
          </Button>

          {error && (
            <Text fontSize="sm" color="red.400">
              {error}
            </Text>
          )}

          <Box borderTop="1px solid" borderColor="gray.700" pt={4} mt={2}>
            <Stack gap={2}>
              <Box>
                <Text fontSize="sm" color="gray.400" mb={1}>
                  Status
                </Text>
                {status.authenticated ? (
                  <Badge colorPalette="green" size="sm">
                    Connected as {status.broadcasterLogin}
                  </Badge>
                ) : (
                  <Badge colorPalette="gray" size="sm">
                    Not connected
                  </Badge>
                )}
              </Box>

              {status.authenticated ? (
                <Button colorPalette="red" variant="outline" size="sm" onClick={handleDisconnect}>
                  Disconnect
                </Button>
              ) : (
                <Button
                  colorPalette="purple"
                  size="sm"
                  onClick={handleConnect}
                  disabled={!canConnect || isConnecting}
                  loading={isConnecting}
                >
                  Connect to Twitch
                </Button>
              )}

              {!hasCredentials && !status.authenticated && (
                <Text fontSize="xs" color="gray.500">
                  Enter Client ID and Secret, then click Save before connecting.
                </Text>
              )}
            </Stack>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
