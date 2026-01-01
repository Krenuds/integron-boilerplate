import { Box, Flex } from '@chakra-ui/react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function Layout(): React.JSX.Element {
  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Box flex={1} overflow="auto" p={4} bg="gray.900">
        <Outlet />
      </Box>
    </Flex>
  )
}
