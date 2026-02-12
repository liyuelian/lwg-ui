import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. 创建 axios 实例
const service = axios.create({
    baseURL: '/api', // 这里的 /api 会被 vite.config.js 代理到 8080
    timeout: 5000
})

// 2. 请求拦截器 (目前没做登录，先直接返回)
service.interceptors.request.use(
    config => {
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// 3. 响应拦截器
service.interceptors.response.use(
    response => {
        const res = response.data
        // 如果 code 不是 200，说明后端报错了
        if (res.code !== 200) {
            ElMessage.error(res.msg || '系统错误')
            return Promise.reject(new Error(res.msg || 'Error'))
        } else {
            return res.data
        }
    },
    error => {
        console.error('API Error:', error)
        ElMessage.error(error.message || '请求失败')
        return Promise.reject(error)
    }
)

export default service