import { useState, useEffect } from 'react'
import { Box, Heading, Text, Badge, HStack, VStack, Avatar, Circle } from '@chakra-ui/react'
import { Link as RouterLink } from 'react-router-dom'
import { useEvents } from '../contexts/EventContext'
import { useAuth } from '../contexts/AuthContext'
import OverlayLinks from '../components/OverlayLinks'
import type { TwitchEvent } from '../../../shared/event-types'

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function getEventSummary(event: TwitchEvent): string {
  switch (event.type) {
    case 'chat':
      return (event.data as { message: string }).message.slice(0, 50)
    case 'sub':
    case 'resub':
      return `Tier ${(event.data as { tier: string }).tier.charAt(0)} subscription`
    case 'gift_sub':
      return `Gifted ${(event.data as { amount: number }).amount} sub(s)`
    case 'bits':
      return `${(event.data as { amount: number }).amount} bits`
    case 'follow':
      return 'New follower'
    case 'raid':
      return `Raid with ${(event.data as { viewers: number }).viewers} viewers`
    case 'redemption':
      return (event.data as { rewardTitle: string }).rewardTitle
    default:
      return event.type
  }
}

function getEventColor(type: string): string {
  const colors: Record<string, string> = {
    chat: 'gray',
    sub: 'purple',
    resub: 'purple',
    gift_sub: 'pink',
    bits: 'orange',
    follow: 'green',
    raid: 'red',
    redemption: 'cyan'
  }
  return colors[type] || 'gray'
}

export default function Dashboard(): React.JSX.Element {
  const { events, twitchStatus, isLoading } = useEvents()
  const { status: authStatus } = useAuth()
  const [userCount, setUserCount] = useState(0)

  // Fetch user count on mount
  useEffect(() => {
    window.api.getUsers({ page: 1, limit: 1 }).then((result) => {
      setUserCount(result.total)
    })
  }, [])

  // Count events from today
  const today = new Date().toDateString()
  const eventsToday = events.filter((e) => new Date(e.createdAt).toDateString() === today).length

  // Get recent events (last 5)
  const recentEvents = events.slice(0, 5)

  return (
    <Box>
      {/* Status Panel */}
      <Box bg="gray.800" borderRadius="md" mb={6} overflow="hidden">
        <Box bg="gray.700" px={4} py={2}>
          <Heading size="sm">Status</Heading>
        </Box>
        <Box p={4}>
          {authStatus.authenticated ? (
            <>
              <HStack gap={4} align="center" mb={4}>
                {authStatus.profileImageUrl && (
                  <Avatar.Root size="xl">
                    <Avatar.Image src={authStatus.profileImageUrl} />
                    <Avatar.Fallback name={authStatus.broadcasterLogin ?? undefined} />
                  </Avatar.Root>
                )}
                {twitchStatus.channel && (
                  <Text fontSize="xl" fontWeight="bold">
                    #{twitchStatus.channel}
                  </Text>
                )}
              </HStack>
              <HStack gap={4} mb={4}>
                <HStack gap={2}>
                  <Circle size="10px" bg={authStatus.authenticated ? 'green.400' : 'red.400'} />
                  <Text fontSize="sm" color="gray.400">
                    Auth
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Circle size="10px" bg={twitchStatus.chat ? 'green.400' : 'red.400'} />
                  <Text fontSize="sm" color="gray.400">
                    Chat
                  </Text>
                </HStack>
                <HStack gap={2}>
                  <Circle size="10px" bg={twitchStatus.eventsub ? 'green.400' : 'red.400'} />
                  <Text fontSize="sm" color="gray.400">
                    EventSub
                  </Text>
                </HStack>
              </HStack>
              <HStack gap={6}>
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="xs" color="gray.500">
                    Users
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {userCount}
                  </Text>
                </VStack>
                <VStack align="flex-start" gap={0}>
                  <Text fontSize="xs" color="gray.500">
                    Events Today
                  </Text>
                  <Text fontSize="lg" fontWeight="bold">
                    {eventsToday}
                  </Text>
                </VStack>
              </HStack>
            </>
          ) : (
            <VStack align="flex-start" gap={2}>
              <Text color="red.400" fontWeight="medium">
                Disconnected
              </Text>
              <RouterLink to="/settings" style={{ color: '#A855F7', fontSize: '14px' }}>
                Go to Settings to connect your Twitch account →
              </RouterLink>
            </VStack>
          )}
        </Box>
      </Box>

      {/* Overlay Links */}
      <Box mb={6}>
        <OverlayLinks />
      </Box>

      {/* Recent Events */}
      <Box bg="gray.800" p={4} borderRadius="md">
        <Heading size="sm" mb={3}>
          Recent Events
        </Heading>
        {isLoading ? (
          <Text color="gray.500">Loading...</Text>
        ) : recentEvents.length === 0 ? (
          <Text color="gray.500">No events yet</Text>
        ) : (
          <VStack align="stretch" gap={2}>
            {recentEvents.map((event) => (
              <HStack key={event.id} justify="space-between" p={2} bg="gray.700" borderRadius="sm">
                <HStack gap={3}>
                  <Badge colorPalette={getEventColor(event.type)} size="sm">
                    {event.type}
                  </Badge>
                  <Text fontSize="sm" fontWeight="medium">
                    {event.displayName}
                  </Text>
                  <Text fontSize="sm" color="gray.400" truncate maxW="200px">
                    {getEventSummary(event)}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="gray.500">
                  {formatTime(event.createdAt)}
                </Text>
              </HStack>
            ))}
          </VStack>
        )}
      </Box>
    </Box>
  )
}
