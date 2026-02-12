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