import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  base: '/overlay/',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, '../shared')
    }
  },
  build: {
    outDir: resolve(__dirname, '../../out/overlays'),
    emptyDirOnBuild: true,
    rollupOptions: {
      input: {
        feed: resolve(__dirname, 'feed.html'),
        alerts: resolve(__dirname, 'alerts.html'),
        chat: resolve(__dirname, 'chat.html')
      }
    }
  },
  server: {
    port: 9848
  }
})
