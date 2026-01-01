import { useState, useEffect } from 'react'
import { Box, Heading, Text, SimpleGrid, Stat, Badge, HStack, VStack } from '@chakra-ui/react'
import { useEvents } from '../contexts/EventContext'
import { useAuth } from '../contexts/AuthContext'
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

  // Determine connection status
  const getConnectionStatus = (): { label: string; color: string } => {
    if (!authStatus.authenticated) {
      return { label: 'Not Authenticated', color: 'red.400' }
    }
    if (twitchStatus.chat && twitchStatus.eventsub) {
      return { label: 'Connected', color: 'green.400' }
    }
    if (twitchStatus.chat || twitchStatus.eventsub) {
      return { label: 'Partial', color: 'yellow.400' }
    }
    return { label: 'Disconnected', color: 'red.400' }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <Box>
      <Heading size="md" mb={4}>
        Dashboard
      </Heading>

      {/* Status Cards */}
      <SimpleGrid columns={3} gap={4} mb={6}>
        <Stat.Root bg="gray.800" p={4} borderRadius="md">
          <Stat.Label>Status</Stat.Label>
          <Stat.ValueText color={connectionStatus.color}>{connectionStatus.label}</Stat.ValueText>
          {authStatus.authenticated && twitchStatus.channel && (
            <Stat.HelpText color="gray.400">#{twitchStatus.channel}</Stat.HelpText>
          )}
        </Stat.Root>
        <Stat.Root bg="gray.800" p={4} borderRadius="md">
          <Stat.Label>Total Users</Stat.Label>
          <Stat.ValueText>{userCount}</Stat.ValueText>
        </Stat.Root>
        <Stat.Root bg="gray.800" p={4} borderRadius="md">
          <Stat.Label>Events Today</Stat.Label>
          <Stat.ValueText>{eventsToday}</Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>

      {/* Connection Details */}
      <SimpleGrid columns={3} gap={4} mb={6}>
        <Box bg="gray.800" p={3} borderRadius="md">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.400">
              Chat
            </Text>
            <Badge colorPalette={twitchStatus.chat ? 'green' : 'red'}>
              {twitchStatus.chat ? 'Connected' : 'Disconnected'}
            </Badge>
          </HStack>
        </Box>
        <Box bg="gray.800" p={3} borderRadius="md">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.400">
              EventSub
            </Text>
            <Badge colorPalette={twitchStatus.eventsub ? 'green' : 'red'}>
              {twitchStatus.eventsub ? 'Connected' : 'Disconnected'}
            </Badge>
          </HStack>
        </Box>
        <Box bg="gray.800" p={3} borderRadius="md">
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.400">
              Auth
            </Text>
            <Badge colorPalette={authStatus.authenticated ? 'green' : 'red'}>
              {authStatus.authenticated ? authStatus.broadcasterLogin : 'Not logged in'}
            </Badge>
          </HStack>
        </Box>
      </SimpleGrid>

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
