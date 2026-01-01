import { useState, useEffect } from 'react'
import { Box, Heading, Text, HStack, VStack, Circle, IconButton, Clipboard } from '@chakra-ui/react'
import { LuRefreshCw } from 'react-icons/lu'
import type { OverlayInfo, ServerStatus } from '../../../shared/ipc-types'

export default function OverlayLinks(): React.JSX.Element {
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null)
  const [overlays, setOverlays] = useState<OverlayInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [status, overlayList] = await Promise.all([
        window.api.getServerStatus(),
        window.api.getOverlays()
      ])
      setServerStatus(status)
      setOverlays(overlayList)
    } catch (err) {
      console.error('Failed to fetch overlay data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenExternal = (url: string) => {
    window.open(url, '_blank')
  }

  return (
    <Box bg="gray.800" borderRadius="md" overflow="hidden">
      <HStack bg="gray.700" px={4} py={2} justify="space-between">
        <Heading size="sm">Overlay Pages</Heading>
        <HStack gap={2}>
          {serverStatus && (
            <HStack gap={2}>
              <Circle size="8px" bg={serverStatus.running ? 'green.400' : 'red.400'} />
              <Text fontSize="xs" color="gray.400">
                {serverStatus.running ? `Port ${serverStatus.port}` : 'Stopped'}
              </Text>
              {serverStatus.connections > 0 && (
                <Text fontSize="xs" color="gray.500">
                  ({serverStatus.connections} connected)
                </Text>
              )}
            </HStack>
          )}
          <IconButton aria-label="Refresh" size="xs" variant="ghost" onClick={fetchData}>
            <LuRefreshCw />
          </IconButton>
        </HStack>
      </HStack>

      <Box px={4} py={2}>
        {isLoading ? (
          <Text color="gray.400" fontSize="xs">
            Loading...
          </Text>
        ) : !serverStatus?.running ? (
          <Text color="red.400" fontSize="xs">
            Server is not running
          </Text>
        ) : overlays.length === 0 ? (
          <Text color="gray.400" fontSize="xs">
            No overlays found. Run npm run build:overlays first.
          </Text>
        ) : (
          <VStack align="stretch" gap={0}>
            {overlays.map((overlay) => (
              <HStack key={overlay.name} justify="space-between">
                <HStack gap={3}>
                  <Text fontSize="xs" color="gray.300" fontWeight="bold" minW="50px">
                    {overlay.displayName}
                  </Text>
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    fontFamily="mono"
                    cursor="pointer"
                    _hover={{ color: 'gray.300' }}
                    onClick={() => handleOpenExternal(overlay.url)}
                  >
                    {overlay.url}
                  </Text>
                </HStack>
                <Clipboard.Root value={overlay.url}>
                  <Clipboard.Trigger asChild>
                    <Box
                      as="span"
                      cursor="pointer"
                      color="gray.500"
                      _hover={{ color: 'gray.300' }}
                      title="Copy URL"
                    >
                      <Clipboard.Indicator />
                    </Box>
                  </Clipboard.Trigger>
                </Clipboard.Root>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}
