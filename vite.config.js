import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    // Send any /api request to the Spring Boot backend
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})