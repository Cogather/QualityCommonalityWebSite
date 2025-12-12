import request from '../utils/request'

export function getMyTasks(userId) {
  return request({
    url: '/api/tasks',
    method: 'get',
    params: { userId }
  })
}

export function getTaskDetails(batchId) {
  return request({
    url: `/api/tasks/${batchId}`,
    method: 'get'
  })
}

export function verifyIssue(itemId, userId) {
  return request({
    url: `/api/tasks/items/${itemId}/verify`,
    method: 'post',
    params: { userId }
  })
}

export function correctIssue(itemId, data, userId) {
  return request({
    url: `/api/tasks/items/${itemId}/correct`,
    method: 'post',
    params: { userId },
    data // { categoryLarge, categorySub, reason }
  })
}

