import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Project pages live under /<repository>/ on github.io.
// On GitHub Actions GITHUB_REPOSITORY is available; VITE_BASE can override it.
export default defineConfig(({ command }) => {
  const repository = process.env.GITHUB_REPOSITORY?.split('/')[1]
  const productionBase =
    process.env.VITE_BASE ?? (repository ? `/${repository}/` : '/sizzle-and-chaos/')

  return {
    plugins: [react()],
    base: command === 'build' ? productionBase : '/',
  }
})
