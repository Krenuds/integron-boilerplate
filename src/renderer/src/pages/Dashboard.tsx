import { Box, Heading, Text, SimpleGrid, Stat } from '@chakra-ui/react'

export default function Dashboard(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Dashboard
      </Heading>
      <SimpleGrid columns={3} gap={4} mb={6}>
        <Stat.Root bg="gray.800" p={4} borderRadius="md">
          <Stat.Label>Status</Stat.Label>
          <Stat.ValueText color="red.400">Disconnected</Stat.ValueText>
        </Stat.Root>
        <Stat.Root bg="gray.800" p={4} borderRadius="md">
          <Stat.Label>Total Users</Stat.Label>
          <Stat.ValueText>0</Stat.ValueText>
        </Stat.Root>
        <Stat.Root bg="gray.800" p={4} borderRadius="md">
          <Stat.Label>Events Today</Stat.Label>
          <Stat.ValueText>0</Stat.ValueText>
        </Stat.Root>
      </SimpleGrid>
      <Box bg="gray.800" p={4} borderRadius="md">
        <Text color="gray.500">No recent events</Text>
      </Box>
    </Box>
  )
}
