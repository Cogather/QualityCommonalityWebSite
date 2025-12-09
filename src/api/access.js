import request from '../utils/request'

export function applyAccess(data) {
  return request({
    url: '/api/access/apply',
    method: 'post',
    data // { userId, adminId, reason }
  })
}

export function getAdminRequests(adminId) {
  return request({
    url: `/api/access/admin/${adminId}`,
    method: 'get'
  })
}

export function approveRequest(id) {
  return request({
    url: `/api/access/${id}/approve`,
    method: 'post'
  })
}

export function rejectRequest(id) {
  return request({
    url: `/api/access/${id}/reject`,
    method: 'post'
  })
}


