import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/command': 'http://localhost:3000',
      '/employees': 'http://localhost:3000',
      '/shifts': 'http://localhost:3000'
    }
  }
})
