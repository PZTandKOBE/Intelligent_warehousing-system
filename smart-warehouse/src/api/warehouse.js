import request from '@/utils/request'

// ⚡️ 改为 false，正式对接后端
const USE_MOCK = false; 

/**
 * ✅ [新增] 获取仓库列表
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
  // 真实请求
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
 * 获取库位详情 (根据文档，可能是库存查询筛选)
 */
export async function getStorageDetail(storageCode) {
  return request({
    url: `/api/v1/inventory`, 
    method: 'get',
    params: { storage_code: storageCode, page_size: 1 }
  })
}