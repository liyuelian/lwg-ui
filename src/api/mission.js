import request, { TX_TIMEOUT } from '../utils/request'

// 1. 获取任务列表 (对应后端 MissionController 的 /list)
export function getMissionList(data, options = {}) {
    return request({
        url: '/mission/list',
        method: 'post',
        data: data,
        ...options
    })
}

// 2. 获取我的任务 (type: 1-我发布的, 2-我接取的)
// 原在 api/user.js；按接口归属（/mission/my-missions）迁到本文件
export function getMyMissions(params, options = {}) {
    return request({
        url: '/mission/my-missions', // 对应后端 MissionController
        method: 'get',
        params, // { userId: 1, type: 1 }
        ...options
    })
}

// 3. 发布任务 (对应后端 /publish) —— 事务类接口，超时放宽
export function publishMission(data) {
    return request({
        url: '/mission/publish',
        method: 'post',
        data: data,
        timeout: TX_TIMEOUT
    })
}

// 4. 抢单 (对应后端 /accept)
// options.inlineError = true → 失败不弹 toast，由卡片就地反馈
export function acceptMission(data, options = {}) {
    return request({
        url: '/mission/accept',
        method: 'post',
        data: data,
        timeout: TX_TIMEOUT,
        ...options
    })
}

// 5. 提交任务 (结算)
export function submitMission(data) {
    return request({
        url: '/mission/submit',
        method: 'post',
        data: data,
        timeout: TX_TIMEOUT
    })
}

// 6. 审核任务 (验收/驳回)
export function auditMission(data) {
    return request({
        url: '/mission/audit',
        method: 'post',
        data: data, // { missionId, userId, pass, remark }
        timeout: TX_TIMEOUT
    })
}

// 7. 撤榜 (取消任务)
// 仅发布者本人可调用，且后端要求任务处于「待接单(status=0)」状态，否则返回 400
export function cancelMission(data, options = {}) {
    return request({
        url: '/mission/cancel',
        method: 'post',
        data: data, // { missionId, userId, cancelReason }
        timeout: TX_TIMEOUT,
        ...options
    })
}
