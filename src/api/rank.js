import request from '../utils/request'

export function getRankBoard(params) {
    return request.get('/rank/board', { params, inlineError: true })
}
