import request from '../utils/request'

export function getAdminStats() {
  return request({
    url: '/api/dashboard/stats',
    method: 'get'
  })
}

export function getTopErrors() {
  return request({
    url: '/api/dashboard/chart/top-errors',
    method: 'get'
  })
}

export function getCategoryDistribution() {
  return request({
    url: '/api/dashboard/chart/category-dist',
    method: 'get'
  })
}

