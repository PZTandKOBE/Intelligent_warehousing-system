/* src/api/replenishment.js */
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
    url: `/api/v1/replenishment/recommendation/${id}/report`,
    method: 'get'
  })
}

/**
 * 获取补货计划 (用于日历)
 */
export function getReplenishmentPlans(params) {
  return request({
    url: '/api/v1/replenishment/plans',
    method: 'get',
    params
  })
}

// ================= 新增配置接口 (待后端实现) =================

/**
 * 获取补货预测配置列表 (商品维度的配置)
 * @param {Object} params { warehouse_id, keyword, page, page_size }
 */
export function getReplenishmentConfigList(params) {
  // 暂时返回 Mock 接口，等后端好了改为 request
  return request({
    url: '/api/v1/replenishment/config/list', // 假设的路径
    method: 'get',
    params
  })
}

/**
 * 修改补货预测配置状态
 * @param {Object} data { goods_id, warehouse_id, enabled }
 */
export function updateReplenishmentConfig(data) {
  return request({
    url: '/api/v1/replenishment/config/update', // 假设的路径
    method: 'post',
    data
  })
}