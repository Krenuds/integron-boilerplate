import { Box, Heading, VStack, FormControl, FormLabel, Input, Button, Text } from '@chakra-ui/react'

export default function Settings(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Settings
      </Heading>
      <Box bg="gray.800" p={4} borderRadius="md" maxW="400px">
        <VStack spacing={4} align="stretch">
          <FormControl>
            <FormLabel>Client ID</FormLabel>
            <Input placeholder="Twitch Client ID" />
          </FormControl>
          <FormControl>
            <FormLabel>Client Secret</FormLabel>
            <Input type="password" placeholder="Twitch Client Secret" />
          </FormControl>
          <Button colorScheme="purple" size="sm">
            Save Credentials
          </Button>
          <Box borderTop="1px" borderColor="gray.700" pt={4} mt={2}>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Status: Not connected
            </Text>
            <Button colorScheme="green" size="sm" isDisabled>
              Connect to Twitch
            </Button>
          </Box>
        </VStack>
      </Box>
    </Box>
  )
}
