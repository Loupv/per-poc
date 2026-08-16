import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Servi sous https://<user>.github.io/per-poc/
  base: process.env.GITHUB_ACTIONS ? '/per-poc/' : '/',
})
