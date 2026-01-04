import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前模式下的环境变量 (默认读取 .env, .env.development, .env.production)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    server: {
      port: 3000,
      proxy: {
        '/api': {
          // 读取环境变量中的 VITE_API_TARGET，如果没有则默认 http://localhost:8080
          target: env.VITE_API_TARGET || 'http://localhost:8080',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/service/api')
        }
      }
    }
  }
})

