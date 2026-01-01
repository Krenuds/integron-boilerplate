import { Box, Heading, Text, Table } from '@chakra-ui/react'

export default function Events(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Event Log
      </Heading>
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Time</Table.ColumnHeader>
              <Table.ColumnHeader>Type</Table.ColumnHeader>
              <Table.ColumnHeader>User</Table.ColumnHeader>
              <Table.ColumnHeader>Details</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={4}>
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
