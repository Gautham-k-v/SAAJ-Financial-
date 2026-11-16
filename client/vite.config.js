import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const pagesBase = '/SAAJ-Financial-/'

function githubPagesSpaFallback() {
  return {
    name: 'github-pages-spa-fallback',
    apply: 'build',
    closeBundle() {
      const dist = resolve('dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
      writeFileSync(resolve(dist, '.nojekyll'), '')
    },
  }
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? pagesBase : '/',
  plugins: [react(), tailwindcss(), githubPagesSpaFallback()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5050',
        changeOrigin: true,
      },
    },
  },
}))
