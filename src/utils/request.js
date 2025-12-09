import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const service = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Proxy handles /api, or set base URL
  timeout: 5000
})

service.interceptors.request.use(
  config => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers['Authorization'] = 'Bearer ' + authStore.token
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  response => {
    const res = response.data
    // Assuming backend returns { code: 200, data: ..., message: ... }
    if (res.code !== 200) {
      ElMessage.error(res.message || 'Error')
      return Promise.reject(new Error(res.message || 'Error'))
    } else {
      return res.data
    }
  },
  error => {
    ElMessage.error(error.message || 'Request Error')
    return Promise.reject(error)
  }
)

export default service

