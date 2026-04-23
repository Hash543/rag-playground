import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 4300,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4100',
        changeOrigin: true,
      },
    },
  },
})
