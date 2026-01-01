import { useState, useMemo } from 'react'
import { Box, Heading, Text, Table, Input, HStack, Badge, Checkbox } from '@chakra-ui/react'
import { useEvents } from '../contexts/EventContext'
import type { EventType, TwitchEvent } from '../../../shared/event-types'

const EVENT_TYPES: EventType[] = [
  'chat',
  'sub',
  'resub',
  'gift_sub',
  'bits',
  'follow',
  'raid',
  'redemption',
  'hype_train_begin',
  'hype_train_end',
  'poll_begin',
  'poll_end',
  'prediction_begin',
  'prediction_end',
  'shoutout'
]

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function getEventDetails(event: TwitchEvent): string {
  switch (event.type) {
    case 'chat':
      return (event.data as { message: string }).message
    case 'sub':
      return `Tier ${(event.data as { tier: string }).tier.charAt(0)} sub`
    case 'resub':
      return `Tier ${(event.data as { tier: string }).tier.charAt(0)} - ${(event.data as { months: number }).months} months`
    case 'gift_sub':
      return `Gifted ${(event.data as { amount: number }).amount} sub(s)`
    case 'bits':
      return `${(event.data as { amount: number }).amount} bits`
    case 'follow':
      return 'New follower'
    case 'raid':
      return `${(event.data as { viewers: number }).viewers} viewers`
    case 'redemption':
      return (event.data as { rewardTitle: string }).rewardTitle
    case 'hype_train_begin':
    case 'hype_train_end':
      return `Level ${(event.data as { level: number }).level}`
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
    redemption: 'cyan',
    hype_train_begin: 'yellow',
    hype_train_end: 'yellow',
    poll_begin: 'blue',
    poll_end: 'blue',
    prediction_begin: 'teal',
    prediction_end: 'teal',
    shoutout: 'pink'
  }
  return colors[type] || 'gray'
}

export default function Events(): React.JSX.Element {
  const { events, isLoading } = useEvents()
  const [search, setSearch] = useState('')
  const [selectedTypes, setSelectedTypes] = useState<Set<EventType>>(new Set(EVENT_TYPES))

  const toggleType = (type: EventType): void => {
    setSelectedTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const selectAll = (): void => setSelectedTypes(new Set(EVENT_TYPES))
  const selectNone = (): void => setSelectedTypes(new Set())

  // Filter events by type and search
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Type filter
      if (!selectedTypes.has(event.type)) return false
      // Search filter (case insensitive)
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesUser =
          event.username.toLowerCase().includes(searchLower) ||
          event.displayName.toLowerCase().includes(searchLower)
        const details = getEventDetails(event).toLowerCase()
        if (!matchesUser && !details.includes(searchLower)) {
          return false
        }
      }
      return true
    })
  }, [events, selectedTypes, search])

  return (
    <Box>
      <Heading size="md" mb={4}>
        Event Log
      </Heading>

      {/* Filters */}
      <Box bg="gray.800" p={4} borderRadius="md" mb={4}>
        <HStack mb={3} gap={4}>
          <Input
            placeholder="Search by username or content..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            size="sm"
            maxW="300px"
            bg="gray.900"
            borderColor="gray.600"
          />
          <Text fontSize="sm" color="gray.400">
            {filteredEvents.length} events
          </Text>
        </HStack>
        <HStack gap={4} flexWrap="wrap">
          <HStack gap={2}>
            <Text
              fontSize="xs"
              color="blue.400"
              cursor="pointer"
              onClick={selectAll}
              _hover={{ textDecoration: 'underline' }}
            >
              All
            </Text>
            <Text fontSize="xs" color="gray.500">
              |
            </Text>
            <Text
              fontSize="xs"
              color="blue.400"
              cursor="pointer"
              onClick={selectNone}
              _hover={{ textDecoration: 'underline' }}
            >
              None
            </Text>
          </HStack>
          {EVENT_TYPES.map((type) => (
            <Checkbox.Root
              key={type}
              size="sm"
              checked={selectedTypes.has(type)}
              onCheckedChange={() => toggleType(type)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label>
                <Badge colorPalette={getEventColor(type)} size="sm">
                  {type}
                </Badge>
              </Checkbox.Label>
            </Checkbox.Root>
          ))}
        </HStack>
      </Box>

      {/* Event Table */}
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="gray.700">
              <Table.ColumnHeader color="gray.300" borderColor="gray.600" width="100px">
                Time
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600" width="100px">
                Type
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600" width="150px">
                User
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">
                Details
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row bg="gray.800">
                <Table.Cell colSpan={4} borderColor="gray.700">
                  <Text color="gray.500" textAlign="center" py={4}>
                    Loading events...
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : filteredEvents.length === 0 ? (
              <Table.Row bg="gray.800">
                <Table.Cell colSpan={4} borderColor="gray.700">
                  <Text color="gray.500" textAlign="center" py={4}>
                    {events.length === 0 ? 'No events yet' : 'No events match filters'}
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredEvents.map((event) => (
                <Table.Row key={event.id} bg="gray.800" _hover={{ bg: 'gray.750' }}>
                  <Table.Cell borderColor="gray.700" color="gray.400" fontSize="xs">
                    {formatTime(event.createdAt)}
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700">
                    <Badge colorPalette={getEventColor(event.type)} size="sm">
                      {event.type}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700" color="gray.100" fontWeight="medium">
                    {event.displayName}
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700" color="gray.300" fontSize="sm">
                    <Text truncate maxW="400px">
                      {getEventDetails(event)}
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  )
}
