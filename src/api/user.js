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