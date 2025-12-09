import request from '../utils/request'

export function getBatchList() {
  return request({
    url: '/api/batches',
    method: 'get'
  })
}

export function uploadBatch(data) {
  return request({
    url: '/api/batches/upload',
    method: 'post',
    data // { fileName: '...' }
  })
}

export function distributeBatch(batchId, userId) {
  return request({
    url: `/api/batches/${batchId}/distribute`,
    method: 'post',
    data: { userId }
  })
}

export function getAssignableUsers() {
  return request({
    url: '/api/batches/users',
    method: 'get'
  })
}

