/* src/api/report.js */
import request from '@/utils/request'

/**
 * 获取报告列表
 * @param {Object} params { type, start_date, end_date, page, page_size }
 */
export function getReportList(params) {
  return request({
    url: '/api/v1/reports',
    method: 'get',
    params
  })
}

/**
 * 获取报告详情
 * @param {string|number} reportId 
 */
export function getReportDetail(reportId) {
  return request({
    url: `/api/v1/reports/${reportId}`,
    method: 'get'
  })
}

/**
 * 触发报告生成
 * @param {Object} data { report_type, analysis_period, warehouse_id, ... }
 */
export function generateReport(data) {
  return request({
    url: '/api/v1/reports/generate',
    method: 'post',
    data
  })
}

/**
 * 导出报告 (获取下载链接)
 * @param {string|number} reportId
 * @param {string} format PDF/EXCEL/HTML
 */
export function exportReport(reportId, format = 'PDF') {
  return request({
    url: `/api/v1/reports/${reportId}/export`,
    method: 'get',
    params: { format }
  })
}