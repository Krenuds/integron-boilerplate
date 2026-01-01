import { Box, Heading, Text, Table } from '@chakra-ui/react'

export default function Users(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Users
      </Heading>
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="gray.700">
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Username</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Messages</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Bits</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Sub Months</Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600">Last Seen</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            <Table.Row>
              <Table.Cell colSpan={5} borderColor="gray.700">
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
