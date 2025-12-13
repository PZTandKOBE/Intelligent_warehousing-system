import request from '@/utils/request'

const USE_MOCK = false; 

/**获取仓库列表
 * 对应文档: GET /api/v1/common/warehouses
 */
export function getWarehouses() {
  return request({
    url: '/api/v1/common/warehouses',
    method: 'get'
  })
}

/**
 * 获取仪表盘热力图数据
 * @param {string|number} warehouseId - 仓库ID
 */
export async function getDashboardHeatmap(warehouseId) {
  return request({
    url: '/api/v1/dashboard/heatmap',
    method: 'get',
    params: { 
      warehouse_id: warehouseId, 
      type: 'inventory_value'
    }
  })
}

/**
 * 获取库位详情 
 */
export async function getStorageDetail(storageCode) {
  return request({
    url: `/api/v1/inventory`, 
    method: 'get',
    params: { storage_code: storageCode, page_size: 1 }
  })
}