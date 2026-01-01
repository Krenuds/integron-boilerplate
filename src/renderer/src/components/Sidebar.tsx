import { Box, Stack, Button, Text, Separator } from '@chakra-ui/react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NavItem {
  path: string
  label: string
}

const navItems: NavItem[] = [
  { path: '/', label: 'Dashboard' },
  { path: '/events', label: 'Events' },
  { path: '/users', label: 'Users' },
  { path: '/test', label: 'Test Panel' },
  { path: '/settings', label: 'Settings' }
]

export default function Sidebar(): React.JSX.Element {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <Box w="180px" h="100vh" bg="gray.800" borderRight="1px solid" borderColor="gray.700" p={3}>
      <Text fontSize="lg" fontWeight="bold" mb={4} color="gray.100">
        Integron
      </Text>
      <Separator mb={4} borderColor="gray.700" />
      <Stack gap={1}>
        {navItems.map((item) => (
          <Button
            key={item.path}
            variant={location.pathname === item.path ? 'solid' : 'ghost'}
            colorPalette={location.pathname === item.path ? 'purple' : 'gray'}
            justifyContent="flex-start"
            size="sm"
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </Button>
        ))}
      </Stack>
    </Box>
  )
}
