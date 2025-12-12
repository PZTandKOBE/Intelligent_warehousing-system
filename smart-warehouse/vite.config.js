import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://10.11.6.98:8000', // 修改为真实后端地址
        changeOrigin: true
        // rewrite: (path) => path.replace(/^\/api/, '') // 如果后端不需要 /api 前缀请取消注释，但通常保留
      }
    }
  }
})