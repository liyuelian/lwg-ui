import request from '../utils/request'

// 1. 获取任务列表 (对应后端 MissionController 的 /list)
// 获取任务列表
export function getMissionList(data) {
    return request({
        url: '/mission/list',
        method: 'post',
        data: data
    })
}


// 2. 发布任务 (对应后端 /publish)
export function publishMission(data) {
    return request({
        url: '/mission/publish',
        method: 'post',
        data: data
    })
}

// 3. 抢单 (对应后端 /accept)
export function acceptMission(data) {
    return request({
        url: '/mission/accept',
        method: 'post',
        data: data
    })
}

// 4. 提交任务 (结算)
export function submitMission(data) {
    return request({
        url: '/mission/submit',
        method: 'post',
        data: data
    })
}

// 5. 审核任务 (验收/驳回)
export function auditMission(data) {
    return request({
        url: '/mission/audit',
        method: 'post',
        data: data // { missionId, userId, pass, remark }
    })
}

// 6. 撤榜 (取消任务)
// 仅发布者本人可调用，且后端要求任务处于「待接单(status=0)」状态，否则返回 400
export function cancelMission(data) {
    return request({
        url: '/mission/cancel',
        method: 'post',
        data: data // { missionId, userId, cancelReason }
    })
}