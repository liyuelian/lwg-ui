import request from '../utils/request'

// 1. 获取用户信息 (头像、余额等)
export function getUserInfo(userId) {
    return request({
        url: '/user/info',
        method: 'get',
        params: {userId}
    })
}

// 2. 获取我的任务 (type: 1-我发布的, 2-我接取的)
export function getMyMissions(params) {
    return request({
        url: '/mission/my-missions', // 对应后端 MissionController
        method: 'get',
        params // { userId: 1, type: 1 }
    })
}

// 3. 获取资金流水
export function getMyTransactions(userId) {
    return request({
        url: '/user/transactions', // 对应后端 TransactionController
        method: 'get',
        params: {userId}
    })
}

// 4.充值接口
export function rechargeBalance(data) {
    return request({
        url: '/user/recharge',
        method: 'post',
        data: data // { userId, amount }
    })
}

// 5. 获取财务概览 (卡片数据)
export function getFinanceOverview(userId) {
    return request({
        url: '/user/finance/overview',
        method: 'get',
        params: { userId }
    })
}

// 6. 获取流水明细 (表格 + 筛选)
export function getTransactionList(data) {
    return request({
        url: '/user/transaction/list',
        method: 'post',
        data // 包含 userId, page, pageSize, category, startDate, endDate
    })
}

// 7. 获取图表数据 (折线图 + 饼图)
export function getFinanceCharts(userId) {
    return request({
        url: '/user/finance/charts',
        method: 'get',
        params: { userId }
    })
}

// 8.获取用户信誉流水
export function getUserReputationLogs(params) {
    return request({

        url: '/user/reputation/list',
        method: 'get',
        params
    })
}