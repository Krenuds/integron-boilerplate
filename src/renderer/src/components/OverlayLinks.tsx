import { useState, useEffect } from 'react'
import {
  Box,
  Heading,
  Text,
  HStack,
  VStack,
  Circle,
  IconButton,
  Clipboard
} from '@chakra-ui/react'
import { LuExternalLink, LuRefreshCw } from 'react-icons/lu'
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
          <IconButton
            aria-label="Refresh"
            size="xs"
            variant="ghost"
            onClick={fetchData}
          >
            <LuRefreshCw />
          </IconButton>
        </HStack>
      </HStack>

      <Box p={4}>
        {isLoading ? (
          <Text color="gray.500" fontSize="sm">Loading...</Text>
        ) : !serverStatus?.running ? (
          <Text color="red.400" fontSize="sm">Server is not running</Text>
        ) : overlays.length === 0 ? (
          <Text color="gray.500" fontSize="sm">No overlays found. Run npm run build:overlays first.</Text>
        ) : (
          <VStack align="stretch" gap={2}>
            {overlays.map((overlay) => (
              <HStack
                key={overlay.name}
                justify="space-between"
                p={2}
                bg="gray.700"
                borderRadius="sm"
              >
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="sm" fontWeight="medium">
                    {overlay.displayName}
                  </Text>
                  <Text fontSize="xs" color="gray.500" fontFamily="mono">
                    {overlay.url}
                  </Text>
                </VStack>
                <HStack gap={1}>
                  <Clipboard.Root value={overlay.url}>
                    <Clipboard.Trigger asChild>
                      <IconButton
                        aria-label="Copy URL"
                        size="xs"
                        variant="ghost"
                        title="Copy URL for OBS"
                      >
                        <Clipboard.Indicator />
                      </IconButton>
                    </Clipboard.Trigger>
                  </Clipboard.Root>
                  <IconButton
                    aria-label="Open in browser"
                    size="xs"
                    variant="ghost"
                    onClick={() => handleOpenExternal(overlay.url)}
                    title="Open in browser"
                  >
                    <LuExternalLink />
                  </IconButton>
                </HStack>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}
