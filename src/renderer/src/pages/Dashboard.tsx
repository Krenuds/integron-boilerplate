import { Box, Heading, Text, SimpleGrid, Stat, StatLabel, StatNumber } from '@chakra-ui/react'

export default function Dashboard(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Dashboard
      </Heading>
      <SimpleGrid columns={3} spacing={4} mb={6}>
        <Stat bg="gray.800" p={4} borderRadius="md">
          <StatLabel>Status</StatLabel>
          <StatNumber color="red.400">Disconnected</StatNumber>
        </Stat>
        <Stat bg="gray.800" p={4} borderRadius="md">
          <StatLabel>Total Users</StatLabel>
          <StatNumber>0</StatNumber>
        </Stat>
        <Stat bg="gray.800" p={4} borderRadius="md">
          <StatLabel>Events Today</StatLabel>
          <StatNumber>0</StatNumber>
        </Stat>
      </SimpleGrid>
      <Box bg="gray.800" p={4} borderRadius="md">
        <Text color="gray.500">No recent events</Text>
      </Box>
    </Box>
  )
}
