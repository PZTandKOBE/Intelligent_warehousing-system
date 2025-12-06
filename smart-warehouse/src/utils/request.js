import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const service = axios.create({
  // 如果有环境变量配置，可改为 import.meta.env.VITE_BASE_API
  baseURL: '', 
  timeout: 5000 
})

// 请求拦截器
service.interceptors.request.use(
  config => {
    // 可以在这里添加 Token，例如: config.headers['Authorization'] = ...
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 这里可以根据后端约定的 code 判断业务成功/失败
    return res
  },
  error => {
    console.error('Request Error:', error)
    ElMessage({
      message: error.message || '请求失败',
      type: 'error',
      duration: 5 * 1000
    })
    return Promise.reject(error)
  }
)

// 关键：必须默认导出
export default service