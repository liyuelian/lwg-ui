import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. 创建 axios 实例
// 默认 5s；事务类接口（发布/审核/充值等）在调用处传 timeout: 15000 放宽
const DEFAULT_TIMEOUT = 5000
export const TX_TIMEOUT = 15000

const service = axios.create({
    baseURL: '/api', // 这里的 /api 会被 vite.config.js 代理到 8080
    timeout: DEFAULT_TIMEOUT
})

// 2. 请求拦截器（将来挂 token 的位置，结构已预留）
service.interceptors.request.use(
    config => {
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

/** 业务/网络错误的统一标记，便于调用方用 isRequestError 判定 */
function markError(error, message, code) {
    error.isRequestError = true
    error.serverMsg = message
    if (code !== undefined) error.code = code
    return error
}

/** 就地反馈场景下，调用方用这个函数取可读文案 */
export function errText(error, fallback = '操作失败，请稍后再试') {
    return error?.serverMsg || error?.message || fallback
}

const HTTP_TEXT = {
    400: '请求有误，请检查填写内容',
    401: '令牌已失效，请重新入阁',
    403: '道行不足，无权操作',
    404: '所求之物不存在',
    500: '宗门法器走火了，请稍后再试',
    502: '网关不通，请稍后再试',
    503: '服务暂不可用，请稍后再试'
}

// 3. 响应拦截器
service.interceptors.response.use(
    response => {
        const res = response.data
        // 约定：code !== 200 即后端报错。
        // config.inlineError = true 时不弹 toast，交由调用方就地渲染。
        if (res.code !== 200) {
            const msg = res.msg || '系统错误'
            if (!response.config?.inlineError) ElMessage.error(msg)
            return Promise.reject(markError(new Error(msg), msg, res.code))
        }
        return res.data
    },
    error => {
        const status = error.response?.status
        const msg = error.code === 'ECONNABORTED'
            ? '请求超时，请稍后再试'
            : (HTTP_TEXT[status]
                || error.response?.data?.msg
                || (error.response ? '请求失败' : '网络不通，请检查后端是否在运行'))
        if (!error.config?.inlineError) ElMessage.error(msg)
        console.error('API Error:', error)
        return Promise.reject(markError(error, msg, status))
    }
)

export default service
