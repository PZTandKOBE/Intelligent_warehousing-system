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
 * 获取仪表盘图表数据 (库存趋势等)
 * @param {Object} params
 * @param {string} params.type
 */
export function getDashboardCharts(params) {
  return request({
    url: '/api/v1/dashboard/charts',
    method: 'get',
    params
  })
}

/**
 * ✅ [新增] 获取出入库数据
 * 对应文档: GET /api/v1/dashboard/inbound-outbound
 */
export function getDashboardInboundOutbound(params) {
  return request({
    url: '/api/v1/dashboard/inbound-outbound',
    method: 'get',
    params
  })
}

/**
 * 获取热力图数据
 */
export function getDashboardHeatmap(params) {
  return request({
    url: '/api/v1/dashboard/heatmap',
    method: 'get',
    params
  })
}