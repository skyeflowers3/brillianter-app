import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Use the automatic JSX runtime so test files don't need `import React`.
  esbuild: {
    jsx: 'automatic',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
