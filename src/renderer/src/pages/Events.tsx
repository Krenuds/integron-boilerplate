import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'

export default function Events(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Event Log
      </Heading>
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Time</Th>
              <Th>Type</Th>
              <Th>User</Th>
              <Th>Details</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td colSpan={4}>
                <Text color="gray.500" textAlign="center" py={4}>
                  No events yet
                </Text>
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}
