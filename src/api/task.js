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

export function verifyIssue(itemId) {
  return request({
    url: `/api/tasks/items/${itemId}/verify`,
    method: 'post'
  })
}

export function correctIssue(itemId, data) {
  return request({
    url: `/api/tasks/items/${itemId}/correct`,
    method: 'post',
    data // { categoryLarge, categorySub, reason }
  })
}

