import './assets/main.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { HashRouter } from 'react-router-dom'
import App from './App'
import { system } from './theme'
import { AuthProvider } from './contexts/AuthContext'
import { EventProvider } from './contexts/EventContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChakraProvider value={system}>
      <HashRouter>
        <AuthProvider>
          <EventProvider>
            <App />
          </EventProvider>
        </AuthProvider>
      </HashRouter>
    </ChakraProvider>
  </StrictMode>
)
