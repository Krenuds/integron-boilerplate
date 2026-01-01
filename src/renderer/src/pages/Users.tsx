import { Box, Heading, Text, Table } from '@chakra-ui/react'

export default function Users(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Users
      </Heading>
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table.Root size="sm">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Username</Table.ColumnHeader>
              <Table.ColumnHeader>Messages</Table.ColumnHeader>
              <Table.ColumnHeader>Bits</Table.ColumnHeader>
              <Table.ColumnHeader>Sub Months</Table.ColumnHeader>
              <Table.ColumnHeader>Last Seen</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={5}>
                <Text color="gray.500" textAlign="center" py={4}>
                  No users tracked yet
                </Text>
              </Table.Cell>
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  )
}
