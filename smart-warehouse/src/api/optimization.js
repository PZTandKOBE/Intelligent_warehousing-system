/* src/api/optimization.js */
import request from '@/utils/request'

/**
 * 获取优化方案列表
 * @param {Object} params { status, warehouse_id, page, page_size }
 */
export function getOptimizationPlans(params) {
  return request({
    url: '/api/v1/optimization/plans',
    method: 'get',
    params
  })
}

/**
 * 获取方案报告详情 (含 HTML 报告内容)
 * @param {string|number} planId
 */
export function getOptimizationPlanReport(planId) {
  return request({
    url: `/api/v1/optimization/plans/${planId}/report`,
    method: 'get'
  })
}

/**
 * 获取方案关联的任务列表
 * @param {Object} params { plan_id, status, page, page_size }
 */
export function getOptimizationPlanTasks(params) {
  const { plan_id, ...rest } = params
  return request({
    url: `/api/v1/optimization/plans/${plan_id}/tasks`,
    method: 'get',
    params: rest
  })
}

/**
 * 生成优化方案 (触发任务)
 * @param {Object} data { warehouse_id, optimization_type, constraints... }
 */
export function generateOptimizationPlan(data) {
  return request({
    url: '/api/v1/optimization/plans/generate',
    method: 'post',
    data
  })
}