import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',  // 允许外部访问
    port: 5173,
    strictPort: true,
    // 添加代理配置
    proxy: {
      '/api': {
        target: 'http://localhost:8082',  // 你的 API 服务地址
        changeOrigin: true,  // 修改请求头中的 Origin
        // rewrite: (path) => path.replace(/^\/api/, '')  // 重写路径，去掉 /api 前缀 - Removed because backend routes INCLUDE /api prefix
      }
    }
  }
})