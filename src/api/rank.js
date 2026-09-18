import request from '../utils/request'

// 天道碑排行榜。契约见 LWG docs/requirement-ranking.md 第 4 节。
// 注意：period=month 依赖后端 t_mission.finish_time 落库（D1），
// 未启用前后端会以 400 拒绝，调用处需置灰月榜 Tab 而不是让它报错。

/**
 * 榜单查询
 * GET /api/rank/board?type=reputation|acceptor&period=all|month&limit=20
 * @param {{type?: string, period?: string, limit?: number}} params
 */
export function getRankBoard(params, options = {}) {
    return request({
        url: '/rank/board',
        method: 'get',
        params: {
            type: 'reputation',
            period: 'all',
            limit: 20,
            ...params
        },
        ...options
    })
}

/**
 * 我的排名
 * GET /api/rank/me?userId=1&type=reputation&period=all
 * ranked=false 时后端仍返回 200，调用方按引导文案渲染，不应报错。
 */
export function getMyRank(params, options = {}) {
    return request({
        url: '/rank/me',
        method: 'get',
        params: {
            type: 'reputation',
            period: 'all',
            ...params
        },
        ...options
    })
}
