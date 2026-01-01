import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        brand: {
          50: { value: '#e5e5ff' },
          100: { value: '#b8b8ff' },
          200: { value: '#8a8aff' },
          300: { value: '#5c5cff' },
          400: { value: '#2e2eff' },
          500: { value: '#1515e6' },
          600: { value: '#0f0fb4' },
          700: { value: '#0a0a82' },
          800: { value: '#050550' },
          900: { value: '#010120' }
        }
      }
    }
  }
})

export const system = createSystem(defaultConfig, config)
