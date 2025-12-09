import request from '../utils/request'

export function getAdmins() {
  return request({
    url: '/api/users/admins',
    method: 'get'
  })
}

export function approveUser(userId) {
  return request({
    url: `/api/users/${userId}/approve`,
    method: 'post'
  })
}

export function revokeUser(userId) {
  return request({
    url: `/api/users/${userId}/revoke`,
    method: 'post'
  })
}

export function getUsers(role) {
  return request({
    url: '/api/users',
    method: 'get',
    params: role ? { role } : {}
  })
}
