<template>
  <div class="analysis-container">
    <div class="header-controls">
      <div class="left-controls">
        <h2 class="page-title">📊 运营数据概览</h2>
        <el-select 
          v-model="warehouseId" 
          placeholder="选择仓库" 
          size="default" 
          style="width: 160px; margin-left: 20px;"
          @change="handleFilterChange" 
          clearable
        >
          <el-option 
            v-for="item in warehouseStore.warehouseList"
            :key="item.warehouse_id"
            :label="item.warehouse_name"
            :value="item.warehouse_id"
          />
        </el-select>
      </div>

      <div class="right-controls">
        <el-radio-group v-model="period" size="small" @change="handleFilterChange">
          <el-radio-button label="7d">近 7 天</el-radio-button>
          <el-radio-button label="30d">近 30 天</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="hover" class="kpi-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">💰 库存总价值 (Total Value)</span>
              <el-tag type="success" size="small" effect="dark">实时</el-tag>
            </div>
          </template>
          <div class="kpi-body">
            <div class="number">¥ {{ formatNumber(kpiData.total_inventory_value) }}</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="kpi-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">⚠️ 呆滞物料 (Stagnant)</span>
              <el-tooltip content="长期无变动的物料种类" placement="top">
                <el-icon>
                  <InfoFilled />
                </el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="kpi-body">
            <div class="number danger">{{ kpiData.stagnant_materials_count || 0 }}种</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="kpi-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">📦 空间利用率 (Space Util)</span>
              <el-tag :type="getUtilStatus(kpiData.space_utilization_rate)" effect="dark" size="small">
                {{ kpiData.space_utilization_rate || 0 }}%
              </el-tag>
            </div>
          </template>
          <div class="progress-wrapper">
            <el-progress type="dashboard" :percentage="Number(kpiData.space_utilization_rate || 0)"
              :color="progressColors" :width="100" :stroke-width="8">
              <template #default="{ percentage }">
                <div class="progress-content">
                  <span class="percentage-value">{{ percentage }}%</span>
                  <span class="percentage-label">已占用</span>
                </div>
              </template>
            </el-progress>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="24">
        <el-card shadow="never" class="chart-card" v-loading="loadingCharts">
          <template #header>📈 库存金额趋势 ({{ period }})</template>
          <BaseChart :options="amountTrendOptions" height="320px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
        <el-card shadow="never" class="chart-card" v-loading="loadingCharts">
          <template #header>⚖️ 出入库数量对比</template>
          <BaseChart :options="inOutBarOptions" height="300px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { InfoFilled } from '@element-plus/icons-vue';
import BaseChart from '@/components/BaseChart.vue';
import { getDashboardKPI, getDashboardCharts, getDashboardInboundOutbound } from '@/api/dashboard';
import { useWarehouseStore } from '@/stores/warehouse'; 

const warehouseStore = useWarehouseStore(); 

// --- 状态定义 ---
const warehouseId = ref(null); 
const period = ref('7d');
const loadingCharts = ref(false);

// KPI 数据对象
const kpiData = ref({
  total_inventory_value: 0,
  stagnant_materials_count: 0,
  space_utilization_rate: 0,
  replenishment_timeliness_rate: 0,
  optimization_task_progress: 0
});

const progressColors = [
  { color: '#67C23A', percentage: 60 },
  { color: '#E6A23C', percentage: 80 },
  { color: '#F56C6C', percentage: 100 },
];

const getUtilStatus = (val) => {
  if (val < 60) return 'success';
  if (val < 85) return 'warning';
  return 'danger';
};

const formatNumber = (num) => {
  return num ? num.toLocaleString() : '0';
};

const amountTrendOptions = reactive({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: [], axisLabel: { color: '#cfd3dc' } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#cfd3dc' } },
  series: [{
    name: '库存金额', type: 'line', smooth: true, itemStyle: { color: '#409EFF' }, areaStyle: { color: 'rgba(64,158,255,0.2)' },
    data: []
  }]
});

const inOutBarOptions = reactive({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  legend: { textStyle: { color: '#cfd3dc' }, right: 10 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: [], axisLabel: { color: '#cfd3dc' } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#cfd3dc' } },
  series: [
    { name: '入库量', type: 'bar', itemStyle: { color: '#67C23A' }, data: [] },
    { name: '出库量', type: 'bar', itemStyle: { color: '#F56C6C' }, data: [] }
  ]
});

// --- 数据请求 ---
const fetchData = async () => {
  try {
    const kpiRes = await getDashboardKPI({ warehouse_id: warehouseId.value });
    if (kpiRes.code === 200) {
      kpiData.value = kpiRes.data;
    }
  } catch (err) {
    console.error(err);
  }

  loadingCharts.value = true;
  try {
    // 1. 获取趋势图
    const trendRes = await getDashboardCharts({
      type: 'inventory_trend',
      period: period.value,
      warehouse_id: warehouseId.value
    });
    if (trendRes.code === 200 && trendRes.data && trendRes.data.data) {
      amountTrendOptions.xAxis.data = trendRes.data.data.map(i => i.date);
      amountTrendOptions.series[0].data = trendRes.data.data.map(i => i.value);
    }

    // 2. 获取出入库对比
    const ioRes = await getDashboardInboundOutbound({
      period: period.value,
      warehouse_id: warehouseId.value
    });

    if (ioRes.code === 200 && ioRes.data && ioRes.data.data) {
      const ioList = ioRes.data.data;
      inOutBarOptions.xAxis.data = ioList.map(i => i.date);
      inOutBarOptions.series[0].data = ioList.map(i => i.inbound);  // 入库
      inOutBarOptions.series[1].data = ioList.map(i => i.outbound); // 出库
    }

  } catch (err) {
    console.error('Chart fetch error:', err);
  } finally {
    loadingCharts.value = false;
  }
};

const handleFilterChange = () => {
  fetchData();
};

onMounted(() => {
  warehouseStore.fetchWarehouses();
  fetchData();
});
</script>

<style scoped>
.analysis-container {
  padding: 20px;
  box-sizing: border-box;
}

.header-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-controls {
  display: flex;
  align-items: center;
}

.page-title {
  margin: 0;
  color: #fff;
  font-size: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.kpi-card,
.chart-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
}

.kpi-card {
  height: 180px;
  display: flex;
  flex-direction: column;
}

.kpi-card :deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 0 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.card-title {
  font-weight: bold;
  font-size: 14px;
  color: #cfd3dc;
}

.number {
  font-size: 28px;
  font-weight: bold;
  margin: 0 0 10px 0;
  font-family: 'DIN', sans-serif;
}

.number.danger {
  color: #F56C6C;
}

.desc {
  font-size: 12px;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
}

.trend.up {
  color: #67C23A;
  font-weight: bold;
  display: flex;
  align-items: center;
}

.text-warning {
  color: #E6A23C;
  font-weight: bold;
}

.progress-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.progress-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  line-height: 1.2;
  transform: translateY(-8px);
}

.percentage-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: #fff;
  margin-bottom: 2px;
}

.percentage-label {
  font-size: 12px;
  color: #909399;
}

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

:deep(.el-select__wrapper) {
  background-color: #262729 !important;
  box-shadow: 0 0 0 1px #4c4d4f inset !important;
}

:deep(.el-select__placeholder) {
  color: #cfd3dc;
}
</style>