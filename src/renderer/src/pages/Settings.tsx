import { Box, Heading, Stack, Field, Input, Button, Text } from '@chakra-ui/react'

export default function Settings(): React.JSX.Element {
  return (
    <Box>
      <Heading size="md" mb={4}>
        Settings
      </Heading>
      <Box bg="gray.800" p={4} borderRadius="md" maxW="400px">
        <Stack gap={4}>
          <Field.Root>
            <Field.Label>Client ID</Field.Label>
            <Input placeholder="Twitch Client ID" />
          </Field.Root>
          <Field.Root>
            <Field.Label>Client Secret</Field.Label>
            <Input type="password" placeholder="Twitch Client Secret" />
          </Field.Root>
          <Button colorPalette="purple" size="sm">
            Save Credentials
          </Button>
          <Box borderTop="1px solid" borderColor="gray.700" pt={4} mt={2}>
            <Text fontSize="sm" color="gray.500" mb={2}>
              Status: Not connected
            </Text>
            <Button colorPalette="green" size="sm" disabled>
              Connect to Twitch
            </Button>
          </Box>
        </Stack>
      </Box>
    </Box>
  )
}
