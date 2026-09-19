import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173, // 指定前端端口
    proxy: {
      // 关键配置：告诉 Vite 把 /api 的请求转发给后端
      '/api': {
        target: 'http://localhost:8080', // 后端地址
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})