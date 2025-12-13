//WS 连接类封装
import request from '@/utils/request'

/**
 * 获取仪表盘热力图数据
 */
export function getDashboardHeatmap() {
  return request({
    url: '/api/v1/dashboard/heatmap',
    method: 'get'
  })
}

/**
 * 获取单个库位的详细信息
 * @param {string} storageCode - 库位编码
 */
export function getStorageDetail(storageCode) {
  return request({
    url: `/api/v1/warehouses/storage/${storageCode}/detail`,
    method: 'get'
  })
}