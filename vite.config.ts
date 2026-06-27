import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Firebase is large but well under the limit once gzipped; we manage it via chunking below
    // rather than re-downloading it each deploy, so the default 500 kB advisory is just noise.
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Firebase is the largest dependency. Split it by product so the Firestore SDK — only needed
        // once a session is authenticated — lands in its own chunk and stays out of the login bundle,
        // while the small auth/core chunks load eagerly. Each chunk also caches across app-code
        // deploys instead of being re-downloaded every release.
        manualChunks(id) {
          if (
            id.includes('node_modules/firebase/firestore') ||
            id.includes('node_modules/@firebase/firestore')
          ) {
            return 'firebase-firestore'
          }
          if (
            id.includes('node_modules/firebase/auth') ||
            id.includes('node_modules/@firebase/auth')
          ) {
            return 'firebase-auth'
          }
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'firebase-core'
          }
        },
      },
    },
  },
})
