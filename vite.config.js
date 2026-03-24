import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,          // permite conexiones externas
    allowedHosts: true   // permite cualquier dominio (LocalTunnel, etc.)
  }
})