import request from '@/utils/request'

const USE_MOCK = true; 

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 获取仪表盘热力图数据
 * @param {string} zone - 库区编号 (e.g., 'A', 'B')
 */
export async function getDashboardHeatmap(zone = 'A') {
  if (USE_MOCK) {
    await sleep(600); 
    
    const mockData = [];
    let rows, cols, aisles;

    // 模拟不同库区的布局差异
    if (zone === 'A') {
      // Zone A: 24列 x 12行，双过道
      rows = 12; cols = 24;
      aisles = [6, 7, 18, 19];
    } else {
      // Zone B: 20列 x 16行，单过道 (更加密集)
      rows = 16; cols = 20;
      aisles = [10, 11];
    }

    for (let y = 1; y <= rows; y++) {
      for (let x = 1; x <= cols; x++) {
        if (aisles.includes(x)) continue;

        // --- 核心修改：调整库存随机生成逻辑 ---
        let value = Math.floor(Math.random() * 60); // 基础 0~60
        
        // 1. 随机增加积压概率
        if (Math.random() > 0.7) value += 30; 

        // 2. 强制生成爆仓 (Zone A: 5% 概率, Zone B: 10% 概率)
        // 阈值是 90，所以我们生成 91~100 的数
        const criticalChance = zone === 'A' ? 0.05 : 0.1;
        if (Math.random() < criticalChance) {
           value = 91 + Math.floor(Math.random() * 9); 
        }

        mockData.push({
          x: x,
          y: y,
          value: value,
          storage_code: `${zone}-${String(x).padStart(2, '0')}-${String(y).padStart(2, '0')}`
        });
      }
    }
    return { code: 200, data: mockData };
  }

  // 真实请求带上参数
  return request({
    url: '/api/v1/dashboard/heatmap',
    method: 'get',
    params: { zone }
  })
}

export async function getStorageDetail(storageCode) {
  if (USE_MOCK) {
    await sleep(300);
    
    const materials = [
      { name: 'STM32F103C8T6 芯片', code: 'MAT-IC-001', unit: 'pcs' },
      { name: '57步进电机套装', code: 'MAT-MOT-57', unit: '台' },
      { name: '工业级电源 24V/10A', code: 'MAT-PWR-2410', unit: '个' }
    ];
    const mat = materials[Math.floor(Math.random() * materials.length)];
    
    // 详情里的数据也随机一下，配合爆仓
    const usage = Math.floor(Math.random() * 100);
    
    return {
      code: 200,
      data: {
        storage_code: storageCode,
        material_name: mat.name,
        material_code: mat.code,
        quantity: Math.floor(Math.random() * 5000),
        unit: mat.unit,
        usage_rate: usage,
        last_updated: '2025-05-20 14:30:00',
        x: parseInt(storageCode.split('-')[1]),
        y: parseInt(storageCode.split('-')[2])
      }
    };
  }

  return request({
    url: `/api/v1/warehouses/storage/${storageCode}/detail`,
    method: 'get'
  })
}