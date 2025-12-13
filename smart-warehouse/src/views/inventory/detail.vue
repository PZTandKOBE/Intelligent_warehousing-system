<template>
  <div class="page-container" v-loading="loading">
    <div class="header-bar mb-20">
      <el-page-header @back="goBack" :icon="ArrowLeft" title="返回列表" class="custom-header">
        <template #content>
          <span style="color: #fff; font-weight: bold;">库存详情 / {{ itemInfo.goods_code || '-' }}</span>
        </template>
        <template #extra>
          <el-button type="success" :icon="Refresh" @click="handleRefresh">刷新库存</el-button>
        </template>
      </el-page-header>
    </div>

    <el-card shadow="never" class="info-card mb-20">
      <el-row :gutter="40" style="align-items: center;">
        <el-col :span="4">
          <div class="img-box">
             <el-icon size="60" color="#909399"><Box /></el-icon>
          </div>
        </el-col>
        <el-col :span="20">
          <div class="item-header">
            <h2>{{ itemInfo.goods_name || '未知商品' }}</h2>
            <el-tag effect="dark" type="success" class="ml-10">正常</el-tag>
            <el-tag effect="dark" type="info" class="ml-10">ID: {{ itemInfo.goods_id }}</el-tag>
          </div>
          
          <el-descriptions :column="4" class="custom-desc" border>
            <el-descriptions-item label="规格型号">{{ itemInfo.spec || '-' }}</el-descriptions-item>
            <el-descriptions-item label="计量单位">{{ itemInfo.unit || 'pcs' }}</el-descriptions-item>
            <el-descriptions-item label="单价">¥ {{ itemInfo.price || '-' }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ itemInfo.supplier || '-' }}</el-descriptions-item>
            
            <el-descriptions-item label="仓库">{{ getWarehouseName(itemInfo.warehouse_id) }}</el-descriptions-item>
            <el-descriptions-item label="库位">{{ itemInfo.storage_code || '暂无' }}</el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">当前物理库存</div>
          <div class="value primary">{{ stockInfo.total_number }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">可用库存</div>
          <div class="value success">{{ stockInfo.available_total_number }}</div>
          <div class="sub">锁定: {{ stockInfo.frozen_total_number }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">冻结库存</div>
          <div class="value warning">{{ stockInfo.frozen_total_number }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">本月周转率</div>
          <div class="value info">-</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="box-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        
        <el-tab-pane label="📍 库位分布" name="location">
          <el-table :data="[itemInfo]" style="width: 100%" class="custom-table">
            <el-table-column label="所属库区">
               <template #default="{ row }">{{ getWarehouseName(row.warehouse_id) }}</template>
            </el-table-column>
            <el-table-column prop="storage_code" label="库位编码" />
            <el-table-column label="当前数量">
              <template #default>
                <span style="font-weight: bold; color: #409EFF">{{ stockInfo.total_number }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="📈 库存趋势" name="trend">
          <div 
            class="trend-chart-container" 
            style="padding: 10px;" 
            v-if="activeTab === 'trend'"
          >
            <div class="chart-controls mb-20" style="display:flex; justify-content:flex-end;">
              <el-radio-group v-model="trendPeriod" size="small" @change="loadHistory">
                <el-radio-button label="7d">近7天</el-radio-button>
                <el-radio-button label="30d">近30天</el-radio-button>
              </el-radio-group>
            </div>
            <BaseChart :options="chartOptions" height="350px" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="🕒 出入库历史" name="history">
          <el-timeline style="padding: 20px;">
            <el-timeline-item
              v-for="(item, index) in historyList"
              :key="index"
              :type="item.transaction_type === 'IN' ? 'success' : 'warning'"
              :timestamp="item.transaction_time"
              placement="top"
            >
              <el-card class="history-card">
                <h4>{{ item.transaction_type === 'IN' ? '入库' : '出库' }}操作</h4>
                <p>操作人: {{ item.operator || 'System' }} | 变动数量: 
                  <span :class="item.transaction_type === 'IN' ? 'text-success' : 'text-danger'">
                    {{ item.transaction_type === 'IN' ? '+' : '-' }}{{ item.quantity }}
                  </span>
                </p>
                <p style="font-size:12px; color:#909399">流水号: {{ item.transaction_code }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>

      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Edit, Refresh, Box } from '@element-plus/icons-vue';
import { getInventoryDetail, getInventoryTransactions, getInventoryHistory } from '@/api/inventory';
import { useWarehouseStore } from '@/stores/warehouse'; // 🟢 1. 引入 Store
import { ElMessage } from 'element-plus';
import BaseChart from '@/components/BaseChart.vue'; 
import dayjs from 'dayjs';

const router = useRouter();
const route = useRoute();
const warehouseStore = useWarehouseStore(); // 🟢 2. 初始化 Store
const activeTab = ref('location');
const loading = ref(false);
const trendPeriod = ref('7d');

// 数据对象
const itemInfo = ref({
  goods_id: '',
  goods_code: '',
  goods_name: '',
  warehouse_id: '', 
  storage_code: ''
});

const stockInfo = ref({
  total_number: 0,
  available_total_number: 0,
  frozen_total_number: 0
});

const historyList = ref([]);

// 图表配置
const chartOptions = reactive({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { 
    type: 'category', 
    boundaryGap: false, 
    data: [], 
    axisLabel: { color: '#cfd3dc' },
    axisLine: { lineStyle: { color: '#4c4d4f' } }
  },
  yAxis: { 
    type: 'value', 
    splitLine: { lineStyle: { color: '#333' } }, 
    axisLabel: { color: '#cfd3dc' } 
  },
  series: [{
    name: '库存总量',
    type: 'line',
    smooth: true,
    itemStyle: { color: '#409EFF' },
    areaStyle: { color: 'rgba(64, 158, 255, 0.2)' },
    data: []
  }]
});

// 🟢 3. 修改：使用 Store 查找仓库名，替代硬编码 map
const getWarehouseName = (id) => {
  if (!id) return '-';
  const targetId = Number(id); // 确保类型一致
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === targetId);
  return found ? found.warehouse_name : `WH-${id}`;
};

// 加载基础数据
const loadData = async () => {
  const id = route.params.id;
  if (!id || id === 'undefined') {
    ElMessage.error('无效的商品ID参数');
    return;
  }

  loading.value = true;
  try {
    // 1. 获取详情
    const detailRes = await getInventoryDetail(id);
    if (detailRes.code === 200) {
      itemInfo.value = detailRes.data;
      
      // 🟢 4. 核心逻辑：优先使用路由传过来的 warehouse_id (父传子)
      // 如果后端没返回，或者我们想强制用列表页传过来的 ID
      if (route.query.warehouse_id) {
        itemInfo.value.warehouse_id = Number(route.query.warehouse_id);
      }

      // 处理嵌套的 current_stock
      if (detailRes.data.current_stock) {
        stockInfo.value = detailRes.data.current_stock;
      }
    }

    // 2. 获取流水 (如果后端流水接口404还没修好，这里可能会报错，已加 try-catch 保护)
    try {
        const transRes = await getInventoryTransactions({ goods_id: id, page: 1, page_size: 10 });
        if (transRes.code === 200) {
          historyList.value = transRes.data.items || [];
        }
    } catch (e) {
        console.warn('流水接口暂不可用或请求失败');
    }
    
    // 3. 如果当前是趋势图 Tab，加载历史
    if (activeTab.value === 'trend') {
      await loadHistory();
    }

  } catch (err) {
    console.error('获取详情失败:', err);
  } finally {
    loading.value = false;
  }
};

// 加载历史趋势数据
const loadHistory = async () => {
  const id = route.params.id;
  if (!id) return;

  const end = dayjs().format('YYYY-MM-DD');
  let start;
  if (trendPeriod.value === '7d') {
    start = dayjs().subtract(7, 'day').format('YYYY-MM-DD');
  } else {
    start = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
  }

  try {
    const res = await getInventoryHistory(id, {
      start_date: start,
      end_date: end
    });

    // 🟢 调试：你可以取消注释下面这行，在控制台看看真实数据
    // console.log('历史趋势数据:', res);

    if (res.code === 200 && res.data) {
      // 🟢 修复点 1：兼容两种结构
      // 优先取 res.data.snapshots.items (你刚才发的结构)
      // 如果没有，再尝试 res.data.items (旧结构)
      // 如果都没有，给个空数组
      let items = [];
      if (res.data.snapshots && res.data.snapshots.items) {
        items = res.data.snapshots.items;
      } else if (res.data.items) {
        items = res.data.items;
      }

      if (items.length === 0) {
        // 如果没数据，清空图表
        chartOptions.xAxis.data = [];
        chartOptions.series[0].data = [];
        return;
      }

      // 🟢 修复点 2：简单的日期格式化，让 X 轴好看点
      const dates = items.map(i => dayjs(i.snapshot_time).format('MM-DD HH:mm'));
      const values = items.map(i => i.total_number);
      
      chartOptions.xAxis.data = dates;
      chartOptions.series[0].data = values;
    }
  } catch (e) {
    console.error('加载历史趋势失败:', e);
  }
};
const handleRefresh = () => {
  loadData();
};

const handleTabChange = (name) => {
  // 切换 tab 时，如果切到了趋势图，才去加载数据
  // v-if 会在这里生效，DOM 创建后 ECharts 会自动初始化
  if (name === 'trend') {
    loadHistory();
  }
};

const goBack = () => {
  router.push('/inventory/list');
};

onMounted(() => {
  // 🟢 5. 确保 Store 有数据，否则仓库名显示 ID
  if (warehouseStore.warehouseList.length === 0) {
    warehouseStore.fetchWarehouses();
  }
  loadData();
});
</script>

<style scoped>
/* 样式保留 */
.page-container {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.ml-10 {
  margin-left: 10px;
}

.header-bar {
  color: #fff;
}

:deep(.el-page-header__left) {
  color: #fff !important;
}

:deep(.el-page-header__left:hover) {
  color: #409EFF !important;
}

:deep(.el-page-header__content) {
  color: #fff !important;
}

.info-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
}

.img-box {
  background: #262729;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.item-header h2 {
  margin: 0;
}

:deep(.el-descriptions__body) {
  background: transparent !important;
}

:deep(.el-descriptions__label) {
  background: #262729 !important;
  color: #909399 !important;
  font-weight: bold;
}

:deep(.el-descriptions__content) {
  background: transparent !important;
  color: #fff !important;
}

.kpi-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  text-align: center;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.kpi-card .label {
  color: #909399;
  font-size: 13px;
}

.kpi-card .value {
  font-size: 28px;
  font-weight: bold;
  margin: 5px 0;
}

.kpi-card .sub {
  font-size: 12px;
  color: #909399;
  margin-top: -5px;
}

.value.primary {
  color: #409EFF;
}

.value.success {
  color: #67C23A;
}

.value.warning {
  color: #E6A23C;
}

.value.info {
  color: #909399;
}

.box-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
}

.history-card {
  background: #262729;
  border: 1px solid #333;
  color: #cfd3dc;
  padding: 10px;
}

.text-success {
  color: #67C23A;
  font-weight: bold;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

:deep(.el-tabs__item) {
  color: #cfd3dc;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
}

:deep(.el-table),
:deep(.el-table tr),
:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  color: #cfd3dc;
  border-bottom: 1px solid #333 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #262729 !important;
  color: #fff;
}

:deep(.el-table__inner-wrapper::before) {
  display: none !important;
}

/* 单选按钮样式适配 */
:deep(.el-radio-button__inner) {
  background: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
  box-shadow: none;
}

:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
  color: #fff;
}
</style>