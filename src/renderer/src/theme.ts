import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false
}

const theme = extendTheme({
  config,
  styles: {
    global: {
      body: {
        bg: 'gray.900',
        color: 'gray.100'
      }
    }
  },
  colors: {
    brand: {
      50: '#e5e5ff',
      100: '#b8b8ff',
      200: '#8a8aff',
      300: '#5c5cff',
      400: '#2e2eff',
      500: '#1515e6',
      600: '#0f0fb4',
      700: '#0a0a82',
      800: '#050550',
      900: '#010120'
    }
  },
  components: {
    Button: {
      defaultProps: {
        size: 'sm'
      }
    },
    Input: {
      defaultProps: {
        size: 'sm'
      }
    },
    Select: {
      defaultProps: {
        size: 'sm'
      }
    },
    Table: {
      defaultProps: {
        size: 'sm'
      }
    }
  },
  fonts: {
    heading: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
    mono: 'Consolas, monospace'
  }
})

export default theme
