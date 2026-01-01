import { useState, useEffect, useCallback } from 'react'
import { Box, Heading, Text, Table, Button, HStack, Badge, Avatar } from '@chakra-ui/react'
import type { User, UserListParams } from '../../../shared/ipc-types'

type SortBy = 'lastSeen' | 'messageCount' | 'bitsTotal' | 'subMonths'
type SortDir = 'asc' | 'desc'

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateString)
}

const ITEMS_PER_PAGE = 20

export default function Users(): React.JSX.Element {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<SortBy>('lastSeen')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    try {
      const params: UserListParams = {
        page,
        limit: ITEMS_PER_PAGE,
        sortBy,
        sortDir
      }
      const result = await window.api.getUsers(params)
      setUsers(result.users)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch users:', err)
    } finally {
      setIsLoading(false)
    }
  }, [page, sortBy, sortDir])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const handleDelete = async (userId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this user?')) return
    setDeleteLoading(userId)
    try {
      await window.api.deleteUser(userId)
      await fetchUsers()
    } catch (err) {
      console.error('Failed to delete user:', err)
    } finally {
      setDeleteLoading(null)
    }
  }

  const handleSort = (column: SortBy): void => {
    if (sortBy === column) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
    setPage(1)
  }

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const getSortIndicator = (column: SortBy): string => {
    if (sortBy !== column) return ''
    return sortDir === 'asc' ? ' ↑' : ' ↓'
  }

  return (
    <Box>
      <HStack justify="space-between" mb={4}>
        <Heading size="md">Users</Heading>
        <Text fontSize="sm" color="gray.400">
          {total} total users
        </Text>
      </HStack>

      {/* User Table */}
      <Box bg="gray.800" borderRadius="md" overflow="hidden">
        <Table.Root size="sm" variant="line">
          <Table.Header>
            <Table.Row bg="gray.700">
              <Table.ColumnHeader color="gray.300" borderColor="gray.600" width="200px">
                User
              </Table.ColumnHeader>
              <Table.ColumnHeader
                color="gray.300"
                borderColor="gray.600"
                cursor="pointer"
                onClick={() => handleSort('messageCount')}
                _hover={{ bg: 'gray.600' }}
              >
                Messages{getSortIndicator('messageCount')}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                color="gray.300"
                borderColor="gray.600"
                cursor="pointer"
                onClick={() => handleSort('bitsTotal')}
                _hover={{ bg: 'gray.600' }}
              >
                Bits{getSortIndicator('bitsTotal')}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                color="gray.300"
                borderColor="gray.600"
                cursor="pointer"
                onClick={() => handleSort('subMonths')}
                _hover={{ bg: 'gray.600' }}
              >
                Sub Months{getSortIndicator('subMonths')}
              </Table.ColumnHeader>
              <Table.ColumnHeader
                color="gray.300"
                borderColor="gray.600"
                cursor="pointer"
                onClick={() => handleSort('lastSeen')}
                _hover={{ bg: 'gray.600' }}
              >
                Last Seen{getSortIndicator('lastSeen')}
              </Table.ColumnHeader>
              <Table.ColumnHeader color="gray.300" borderColor="gray.600" width="80px">
                Actions
              </Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {isLoading ? (
              <Table.Row bg="gray.800">
                <Table.Cell colSpan={6} borderColor="gray.700">
                  <Text color="gray.500" textAlign="center" py={4}>
                    Loading users...
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : users.length === 0 ? (
              <Table.Row bg="gray.800">
                <Table.Cell colSpan={6} borderColor="gray.700">
                  <Text color="gray.500" textAlign="center" py={4}>
                    No users tracked yet
                  </Text>
                </Table.Cell>
              </Table.Row>
            ) : (
              users.map((user) => (
                <Table.Row key={user.id} bg="gray.800" _hover={{ bg: 'gray.750' }}>
                  <Table.Cell borderColor="gray.700">
                    <HStack gap={2}>
                      <Avatar.Root size="xs">
                        <Avatar.Image src={user.profileImageUrl ?? undefined} />
                        <Avatar.Fallback>{user.displayName.charAt(0)}</Avatar.Fallback>
                      </Avatar.Root>
                      <Box>
                        <Text fontWeight="medium" color="gray.100" fontSize="sm">
                          {user.displayName}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          @{user.username}
                        </Text>
                      </Box>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700" color="gray.300">
                    {user.messageCount.toLocaleString()}
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700">
                    {user.bitsTotal > 0 ? (
                      <Badge colorPalette="orange" size="sm">
                        {user.bitsTotal.toLocaleString()}
                      </Badge>
                    ) : (
                      <Text color="gray.500">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700">
                    {user.subMonths > 0 ? (
                      <Badge colorPalette="purple" size="sm">
                        {user.subMonths}
                      </Badge>
                    ) : (
                      <Text color="gray.500">-</Text>
                    )}
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700" color="gray.400" fontSize="sm">
                    {formatRelativeTime(user.lastSeen)}
                  </Table.Cell>
                  <Table.Cell borderColor="gray.700">
                    <Button
                      size="xs"
                      colorPalette="red"
                      variant="ghost"
                      onClick={() => handleDelete(user.id)}
                      loading={deleteLoading === user.id}
                    >
                      Delete
                    </Button>
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Pagination */}
      {totalPages > 1 && (
        <HStack justify="center" mt={4} gap={2}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Text fontSize="sm" color="gray.400">
            Page {page} of {totalPages}
          </Text>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </HStack>
      )}
    </Box>
  )
}
