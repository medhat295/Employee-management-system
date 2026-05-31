import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // Windows Docker bind mounts don't fire inotify events — polling is required
      usePolling: true,
    },
  },
})
