import { useState } from 'react'
import { Box, Heading, SimpleGrid, Button, Textarea, Text, Badge, VStack, HStack } from '@chakra-ui/react'
import { useEvents } from '../contexts/EventContext'
import type { EventType, TwitchEvent } from '../../../shared/event-types'

const TEST_EVENTS: { type: EventType; label: string; color: string }[] = [
  { type: 'chat', label: 'Chat Message', color: 'blue' },
  { type: 'sub', label: 'Subscription', color: 'purple' },
  { type: 'resub', label: 'Resub', color: 'purple' },
  { type: 'gift_sub', label: 'Gift Sub', color: 'pink' },
  { type: 'bits', label: 'Bits', color: 'orange' },
  { type: 'follow', label: 'Follow', color: 'green' },
  { type: 'raid', label: 'Raid', color: 'red' },
  { type: 'redemption', label: 'Redemption', color: 'cyan' }
]

function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function TestPanel(): React.JSX.Element {
  const { fireTestEvent, events } = useEvents()
  const [loading, setLoading] = useState<EventType | null>(null)
  const [customPayload, setCustomPayload] = useState('{\n  "type": "chat",\n  "data": {\n    "message": "Hello world!"\n  }\n}')
  const [customLoading, setCustomLoading] = useState(false)
  const [lastFired, setLastFired] = useState<string | null>(null)

  const handleFireEvent = async (type: EventType): Promise<void> => {
    setLoading(type)
    try {
      await fireTestEvent(type)
      setLastFired(`${type} event fired at ${new Date().toLocaleTimeString()}`)
    } catch (err) {
      console.error('Failed to fire event:', err)
      setLastFired(`Error: Failed to fire ${type} event`)
    } finally {
      setLoading(null)
    }
  }

  const handleFireCustom = async (): Promise<void> => {
    setCustomLoading(true)
    try {
      const payload = JSON.parse(customPayload)
      await fireTestEvent(payload.type, payload.data)
      setLastFired(`Custom ${payload.type} event fired at ${new Date().toLocaleTimeString()}`)
    } catch (err) {
      if (err instanceof SyntaxError) {
        setLastFired('Error: Invalid JSON payload')
      } else {
        setLastFired('Error: Failed to fire custom event')
      }
      console.error('Failed to fire custom event:', err)
    } finally {
      setCustomLoading(false)
    }
  }

  // Get recent events (last 5)
  const recentEvents = events.slice(0, 5)

  return (
    <Box>
      <Heading size="md" mb={4}>
        Test Panel
      </Heading>

      {/* Last fired indicator */}
      {lastFired && (
        <Box bg="gray.700" p={2} borderRadius="md" mb={4}>
          <Text fontSize="sm" color={lastFired.startsWith('Error') ? 'red.400' : 'green.400'}>
            {lastFired}
          </Text>
        </Box>
      )}

      <SimpleGrid columns={2} gap={4}>
        {/* Quick Fire Buttons */}
        <Box bg="gray.800" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={3}>
            Fire Test Event
          </Text>
          <SimpleGrid columns={2} gap={2}>
            {TEST_EVENTS.map((evt) => (
              <Button
                key={evt.type}
                size="sm"
                colorPalette={evt.color}
                onClick={() => handleFireEvent(evt.type)}
                loading={loading === evt.type}
              >
                {evt.label}
              </Button>
            ))}
          </SimpleGrid>
        </Box>

        {/* Custom Payload */}
        <Box bg="gray.800" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={3}>
            Custom Payload
          </Text>
          <Textarea
            value={customPayload}
            onChange={(e) => setCustomPayload(e.target.value)}
            size="sm"
            rows={6}
            mb={2}
            fontFamily="mono"
            fontSize="xs"
            bg="gray.900"
            borderColor="gray.600"
          />
          <Button
            size="sm"
            colorPalette="gray"
            onClick={handleFireCustom}
            loading={customLoading}
            width="full"
          >
            Send Custom Event
          </Button>
        </Box>
      </SimpleGrid>

      {/* Recent Events Preview */}
      <Box bg="gray.800" p={4} borderRadius="md" mt={4}>
        <Text fontWeight="bold" mb={3}>
          Recent Events (Live)
        </Text>
        {recentEvents.length === 0 ? (
          <Text color="gray.500" fontSize="sm">
            No events yet. Fire a test event above!
          </Text>
        ) : (
          <VStack align="stretch" gap={2}>
            {recentEvents.map((event: TwitchEvent) => (
              <HStack key={event.id} p={2} bg="gray.700" borderRadius="sm" gap={3}>
                <Badge colorPalette="blue" size="sm">
                  {event.type}
                </Badge>
                <Text fontSize="sm" fontWeight="medium">
                  {event.displayName}
                </Text>
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
