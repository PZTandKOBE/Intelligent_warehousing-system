import request from '@/utils/request'

/**
 * 获取仪表盘 KPI 指标
 * @param {Object} params
 * @param {string|number} params.warehouse_id - 仓库ID (可选)
 */
export function getDashboardKPI(params) {
  return request({
    url: '/api/v1/dashboard/kpi',
    method: 'get',
    params
  })
}

/**
 * 获取仪表盘图表数据
 * @param {Object} params
 * @param {string} params.type - 图表类型 (inventory_trend / space_utilization / inbound / outbound 等)
 * @param {string} params.period - 时间周期 (7d / 30d)
 * @param {string|number} params.warehouse_id - 仓库ID (可选)
 */
export function getDashboardCharts(params) {
  return request({
    url: '/api/v1/dashboard/charts',
    method: 'get',
    params
  })
}

/**
 * 获取热力图数据
 * @param {Object} params
 * @param {string|number} params.warehouse_id - 仓库ID (必填)
 * @param {string} params.type - 类型 (frequency / inventory_value / stagnant)
 */
export function getDashboardHeatmap(params) {
  return request({
    url: '/api/v1/dashboard/heatmap',
    method: 'get',
    params
  })
}