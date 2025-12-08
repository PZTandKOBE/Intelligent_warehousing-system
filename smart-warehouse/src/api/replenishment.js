import request from '@/utils/request'

/**
 * 获取补货建议列表
 */
export function getReplenishmentList(params) {
  return request({
    url: '/api/v1/replenishment/recommendations',
    method: 'get',
    params
  })
}

/**
 * 获取补货建议详情与报告
 */
export function getReplenishmentReport(id) {
  return request({
    url: `/api/v1/replenishment/recommendations/${id}/report`,
    method: 'get'
  })
}

/**
 * 获取补货计划 (用于日历)
 * 必填参数: start_date, end_date, warehouse_id, page, page_size
 */
export function getReplenishmentPlans(params) {
  return request({
    url: '/api/v1/replenishment/plans',
    method: 'get',
    params
  })
}