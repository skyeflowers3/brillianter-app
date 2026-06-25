import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Firebase (auth + firestore) is the largest dependency. Isolating it in its own chunk
        // keeps it cached across app-code deploys instead of being re-downloaded each release.
        manualChunks(id) {
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'firebase'
          }
        },
      },
    },
  },
})
