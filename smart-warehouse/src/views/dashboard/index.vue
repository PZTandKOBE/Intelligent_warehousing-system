<template>
  <div class="analysis-container">
    <div class="header-controls">
      <div class="left-controls">
        <h2 class="page-title">📊 运营数据概览</h2>
        <el-select v-model="warehouseId" placeholder="选择仓库" size="default" style="width: 160px; margin-left: 20px;"
          @change="handleFilterChange" clearable>
          <el-option label="Zone A (电子区)" :value="1" />
          <el-option label="Zone B (五金区)" :value="2" />
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
            <div class="desc">
              优化任务进度
              <span class="trend up" style="margin-left:5px">
                {{ kpiData.optimization_task_progress || 0 }}%
              </span>
            </div>
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
            <div class="number danger">{{ kpiData.stagnant_materials_count || 0 }}</div>
            <div class="desc">
              补货及时率 <span class="text-warning">{{ kpiData.replenishment_timeliness_rate || 0 }}%</span>
            </div>
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
import { getDashboardKPI, getDashboardCharts } from '@/api/dashboard';
import { ElMessage } from 'element-plus';

// --- 状态定义 ---
const warehouseId = ref(null); // 默认全部
const period = ref('7d');
const loadingCharts = ref(false);

// KPI 数据对象 (对应后端字段)
const kpiData = ref({
  total_inventory_value: 0,
  stagnant_materials_count: 0,
  space_utilization_rate: 0,
  replenishment_timeliness_rate: 0,
  optimization_task_progress: 0
});

// 进度条颜色
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

// --- 图表 Options ---
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
  // 1. 获取 KPI
  try {
    const kpiRes = await getDashboardKPI({ warehouse_id: warehouseId.value });
    if (kpiRes.code === 200) {
      kpiData.value = kpiRes.data;
    }
  } catch (err) {
    console.error(err);
  }

  // 2. 获取图表
  loadingCharts.value = true;
  try {
    // 2.1 库存趋势图
    const trendRes = await getDashboardCharts({
      type: 'inventory_trend',
      period: period.value,
      warehouse_id: warehouseId.value
    });
    if (trendRes.code === 200 && trendRes.data && trendRes.data.data) {
      amountTrendOptions.xAxis.data = trendRes.data.data.map(i => i.date);
      amountTrendOptions.series[0].data = trendRes.data.data.map(i => i.value);
    }

    // 2.2 出入库对比 (并行请求)
    // 尝试请求 'inbound' 和 'outbound' 类型，如果后端不支持这两个类型，图表将为空
    const [inRes, outRes] = await Promise.all([
      getDashboardCharts({ type: 'inbound', period: period.value, warehouse_id: warehouseId.value }),
      getDashboardCharts({ type: 'outbound', period: period.value, warehouse_id: warehouseId.value })
    ]);

    // 处理入库
    if (inRes.code === 200 && inRes.data.data) {
      inOutBarOptions.xAxis.data = inRes.data.data.map(i => i.date); // 以入库日期为轴
      inOutBarOptions.series[0].data = inRes.data.data.map(i => i.value);
    }
    // 处理出库
    if (outRes.code === 200 && outRes.data.data) {
      inOutBarOptions.series[1].data = outRes.data.data.map(i => i.value);
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