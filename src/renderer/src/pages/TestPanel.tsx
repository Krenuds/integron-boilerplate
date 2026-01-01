import { Box, Heading, SimpleGrid, Button, Textarea, VStack, Text } from '@chakra-ui/react'

export default function TestPanel(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Test Panel
      </Heading>
      <SimpleGrid columns={2} spacing={4}>
        <Box bg="gray.800" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={3}>
            Fire Test Event
          </Text>
          <VStack spacing={2} align="stretch">
            <Button size="sm" colorScheme="blue">
              Chat Message
            </Button>
            <Button size="sm" colorScheme="purple">
              Subscription
            </Button>
            <Button size="sm" colorScheme="orange">
              Bits
            </Button>
            <Button size="sm" colorScheme="green">
              Follow
            </Button>
            <Button size="sm" colorScheme="red">
              Raid
            </Button>
          </VStack>
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
          <Button size="sm" colorScheme="gray">
            Send Custom Event
          </Button>
        </Box>
      </SimpleGrid>
    </Box>
  )
}
