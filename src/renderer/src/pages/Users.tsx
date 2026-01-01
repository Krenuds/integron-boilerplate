import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'

export default function Users(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Users
      </Heading>
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Username</Th>
              <Th>Messages</Th>
              <Th>Bits</Th>
              <Th>Sub Months</Th>
              <Th>Last Seen</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td colSpan={5}>
                <Text color="gray.500" textAlign="center" py={4}>
                  No users tracked yet
                </Text>
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </Box>
    </Box>
  )
}
