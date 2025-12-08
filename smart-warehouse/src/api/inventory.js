/* src/api/inventory.js */
import request from '@/utils/request'

/**
 * 获取库存列表 (分页)
 */
export function getInventoryList(params) {
  return request({
    url: '/api/v1/inventory',
    method: 'get',
    params
  })
}

/**
 * 获取库存详情
 */
export function getInventoryDetail(goodsId) {
  return request({
    url: `/api/v1/inventory/${goodsId}/detail`,
    method: 'get'
  })
}

/**
 * 获取出入库记录 (流水)
 */
export function getInventoryTransactions(params) {
  return request({
    url: '/api/v1/inventory/transactions',
    method: 'get',
    params
  })
}

/**
 * 获取库存预警列表
 */
export function getInventoryAlerts(params) {
  return request({
    url: '/api/v1/inventory/alerts',
    method: 'get',
    params
  })
}

/**
 * 获取单条预警详情
 */
export function getInventoryAlertDetail(alertId) {
  return request({
    url: `/api/v1/inventory/alerts/${alertId}`,
    method: 'get'
  })
}

/**
 * [新增] 获取库存历史趋势
 * @param {string|number} goodsId 商品ID
 * @param {Object} params { start_date, end_date, warehouse_id }
 */
export function getInventoryHistory(goodsId, params) {
  return request({
    url: `/api/v1/inventory/${goodsId}/history`,
    method: 'get',
    params
  })
}