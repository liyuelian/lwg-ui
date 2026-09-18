import request, { TX_TIMEOUT } from '../utils/request'

// 1. 获取用户信息 (头像、余额等)
export function getUserInfo(userId) {
    return request({
        url: '/user/info',
        method: 'get',
        params: {userId}
    })
}

// 2. 获取资金流水
export function getMyTransactions(userId) {
    return request({
        url: '/user/transactions', // 对应后端 TransactionController
        method: 'get',
        params: {userId}
    })
}

// 3. 充值接口（事务类：放宽超时）
export function rechargeBalance(data) {
    return request({
        url: '/user/recharge',
        method: 'post',
        data: data, // { userId, amount }
        timeout: TX_TIMEOUT
    })
}

// 4. 获取财务概览 (卡片数据)
export function getFinanceOverview(userId) {
    return request({
        url: '/user/finance/overview',
        method: 'get',
        params: { userId }
    })
}

// 5. 获取流水明细 (表格 + 筛选)
export function getTransactionList(data) {
    return request({
        url: '/user/transaction/list',
        method: 'post',
        data // 包含 userId, page, pageSize, category, startDate, endDate
    })
}

// 6. 获取图表数据 (折线图 + 饼图)
export function getFinanceCharts(userId) {
    return request({
        url: '/user/finance/charts',
        method: 'get',
        params: { userId }
    })
}

// 7. 获取用户信誉流水
export function getUserReputationLogs(params) {
    return request({
        url: '/user/reputation/list',
        method: 'get',
        params
    })
}

/* ============================================================
   冻结资金明细化。契约见 LWG docs/requirement-frozen-detail.md 第 5 节。
   接口尚未在后端落地（会返回错误），调用处必须就地降级为引导态。
   ============================================================ */

// 8. 当前冻结中的资金明细 + 账户冻结总额与明细合计的自洽校验
export function getFrozenList(userId, options = {}) {
    return request({
        url: '/user/frozen/list',
        method: 'get',
        params: { userId },
        ...options
    })
}

// 9. 解冻历史（P0 可选 / P1 必做）
export function getFrozenHistory(params, options = {}) {
    return request({
        url: '/user/frozen/history',
        method: 'get',
        params: {
            page: 1,
            size: 10,
            ...params
        },
        ...options
    })
}

// 10. 对账断言（诊断接口）
// 不平衡时后端仍返回 200 且 balanced=false，由前端就地渲染对账结果；
// 接口本身报错（如未上线 / 未开启）时也不能吞成 toast，需展示在区块内。
export function getReconcile(userId, options = {}) {
    return request({
        url: '/admin/reconcile',
        method: 'get',
        params: { userId },
        timeout: TX_TIMEOUT,
        ...options
    })
}
