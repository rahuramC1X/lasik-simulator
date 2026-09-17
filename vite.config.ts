import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this repo from /lasik-simulator/, not from the
  // domain root — every asset URL the build emits needs that prefix.
  base: '/lasik-simulator/',
})
