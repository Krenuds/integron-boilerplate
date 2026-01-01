import { Box, Heading, Text, Table } from '@chakra-ui/react'

export default function Events(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Event Log
      </Heading>
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="gray.700">
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Time</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Type</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">User</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Details</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row bg="gray.800">
              <Table.Cell colSpan={4} borderColor="gray.700" color="gray.100">
                <Text color="gray.500" textAlign="center" py={4}>
                  No events yet
                </Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  )
}
