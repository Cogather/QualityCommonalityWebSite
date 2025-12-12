import request from '../utils/request'

export function getBatchList() {
  return request({
    url: '/api/batches',
    method: 'get'
  })
}

export function uploadBatch(file) {
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: '/api/batches/upload',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
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

export function deleteBatch(batchId) {
  return request({
    url: `/api/batches/${batchId}`,
    method: 'delete'
  })
}

