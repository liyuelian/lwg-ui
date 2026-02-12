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