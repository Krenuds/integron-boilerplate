import { Box, Heading, SimpleGrid, Button, Textarea, Stack, Text } from '@chakra-ui/react'

export default function TestPanel(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Test Panel
      </Heading>
      <SimpleGrid columns={2} gap={4}>
        <Box bg="gray.800" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={3}>
            Fire Test Event
          </Text>
          <Stack gap={2}>
            <Button size="sm" colorPalette="blue">
              Chat Message
            </Button>
            <Button size="sm" colorPalette="purple">
              Subscription
            </Button>
            <Button size="sm" colorPalette="orange">
              Bits
            </Button>
            <Button size="sm" colorPalette="green">
              Follow
            </Button>
            <Button size="sm" colorPalette="red">
              Raid
            </Button>
          </Stack>
        </Box>
        <Box bg="gray.800" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={3}>
            Custom Payload
          </Text>
          <Textarea
            placeholder='{"type": "chat", "data": {...}}'
            size="sm"
            rows={6}
            mb={2}
            fontFamily="mono"
          />
          <Button size="sm" colorPalette="gray">
            Send Custom Event
          </Button>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
