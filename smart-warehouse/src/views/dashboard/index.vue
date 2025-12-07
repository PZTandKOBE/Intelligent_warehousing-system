<template>
  <div class="analysis-container">
    <div class="header-controls">
      <div class="left-controls">
        <h2 class="page-title">📊 运营数据概览</h2>
        <el-select 
          v-model="warehouse" 
          placeholder="选择仓库" 
          size="default" 
          style="width: 160px; margin-left: 20px;"
          @change="handleFilterChange"
        >
          <el-option label="全部仓库" value="ALL" />
          <el-option label="Zone A (电子区)" value="A" />
          <el-option label="Zone B (五金区)" value="B" />
        </el-select>
      </div>

      <div class="right-controls">
        <el-radio-group v-model="timeRange" size="small" @change="handleFilterChange">
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
              <el-tag type="success" size="small" effect="dark">+12%</el-tag>
            </div>
          </template>
          <div class="kpi-body">
            <div class="number">¥ {{ kpiData.totalValue.toLocaleString() }}</div>
            <div class="desc">
              环比上月 <span class="trend up"><el-icon><Top /></el-icon> 12%</span>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card shadow="hover" class="kpi-card">
          <template #header>
            <div class="card-header">
              <span class="card-title">⚠️ 呆滞物料 (Stagnant)</span>
              <el-tooltip content="超过 90 天无变动的物料种类" placement="top">
                 <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </div>
          </template>
          <div class="kpi-body">
            <div class="number danger">{{ kpiData.stagnantCount }}</div>
            <div class="desc">
              占库存总量 <span class="text-warning">1.5%</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card shadow="hover" class="kpi-card">
          <template #header>
             <div class="card-header">
              <span class="card-title">📦 空间利用率 (Space Util)</span>
              <el-tag :type="getUtilStatus(kpiData.spaceUtil)" effect="dark" size="small">
                {{ kpiData.spaceUtil }}%
              </el-tag>
             </div>
          </template>
          <div class="progress-wrapper">
             <el-progress 
                type="dashboard" 
                :percentage="kpiData.spaceUtil" 
                :color="progressColors"
                :width="100" 
                :stroke-width="8" 
              >
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
      <el-col :span="16">
        <el-card shadow="never" class="chart-card">
          <template #header>📈 库存金额趋势 ({{ timeRange }})</template>
          <BaseChart :options="amountTrendOptions" height="320px" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header>🍩 物料活跃度分布</template>
          <BaseChart :options="categoryPieOptions" height="320px" />
        </el-card>
      </el-col>
    </el-row>

    <el-row>
      <el-col :span="24">
        <el-card shadow="never" class="chart-card">
          <template #header>⚖️ 出入库数量对比</template>
          <BaseChart :options="inOutBarOptions" height="300px" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Top, InfoFilled } from '@element-plus/icons-vue';
import BaseChart from '@/components/BaseChart.vue';

// 筛选状态
const warehouse = ref('ALL');
const timeRange = ref('7d');

// KPI 数据
const kpiData = reactive({
  totalValue: 1245000,
  stagnantCount: 145,
  spaceUtil: 78
});

// 进度条颜色规则
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

// 模拟数据源
const dataMap = {
  '7d': {
    xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    amount: [820, 932, 901, 934, 1290, 1330, 1320],
    in: [120, 132, 101, 134, 90, 230, 210],
    out: [220, 182, 191, 234, 290, 330, 310]
  },
  '30d': {
    xAxis: Array.from({length: 30}, (_, i) => `Day ${i+1}`), 
    amount: Array.from({length: 30}, () => Math.floor(Math.random() * 1000 + 800)),
    in: Array.from({length: 30}, () => Math.floor(Math.random() * 200 + 50)),
    out: Array.from({length: 30}, () => Math.floor(Math.random() * 200 + 50))
  }
};

// 图表配置 Options
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

const categoryPieOptions = reactive({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'item' },
  legend: { bottom: '0%', textStyle: { color: '#cfd3dc' } },
  series: [{
    name: '活跃度', type: 'pie', radius: ['40%', '70%'], center: ['50%', '45%'],
    itemStyle: { borderRadius: 5, borderColor: '#1d1e1f', borderWidth: 2 },
    data: [
      { value: 1048, name: '高频物料', itemStyle: { color: '#409EFF' } },
      { value: 735, name: '中频物料', itemStyle: { color: '#E6A23C' } },
      { value: 580, name: '低频物料', itemStyle: { color: '#909399' } },
      { value: 145, name: '呆滞物料', itemStyle: { color: '#F56C6C' } }
    ]
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

// 联动逻辑
const handleFilterChange = () => {
  if (warehouse.value === 'A') {
    kpiData.totalValue = 850000;
    kpiData.stagnantCount = 45;
    kpiData.spaceUtil = 92; 
  } else if (warehouse.value === 'B') {
    kpiData.totalValue = 395000;
    kpiData.stagnantCount = 100;
    kpiData.spaceUtil = 45; 
  } else {
    kpiData.totalValue = 1245000;
    kpiData.stagnantCount = 145;
    kpiData.spaceUtil = 78;
  }

  const currentData = dataMap[timeRange.value];
  const factor = warehouse.value === 'ALL' ? 1 : 0.6;
  
  amountTrendOptions.xAxis.data = currentData.xAxis;
  amountTrendOptions.series[0].data = currentData.amount.map(v => Math.floor(v * factor));
  
  inOutBarOptions.xAxis.data = currentData.xAxis;
  inOutBarOptions.series[0].data = currentData.in.map(v => Math.floor(v * factor));
  inOutBarOptions.series[1].data = currentData.out.map(v => Math.floor(v * factor));
};

onMounted(() => {
  handleFilterChange();
});
</script>

<style scoped>
.analysis-container { padding: 20px; box-sizing: border-box; }

.header-controls { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 20px; 
}
.left-controls { display: flex; align-items: center; }
.page-title { margin: 0; color: #fff; font-size: 20px; }

.mb-20 { margin-bottom: 20px; }
.kpi-card, .chart-card { background: #1d1e1f; border: 1px solid #333; color: #fff; }

/* 关键修复 1: 移除 flex 布局，让 header 自然处于顶部，避免被 justify-content 居中导致错位 */
.kpi-card { 
  height: 180px; 
  display: flex;
  flex-direction: column;
  /* justify-content: center; <--- 已移除 */
}

/* 关键修复 2: 强制 card-body 撑满剩余高度，并在内部居中内容 */
.kpi-card :deep(.el-card__body) {
  flex: 1; /* 撑满剩余空间 */
  display: flex;
  flex-direction: column;
  justify-content: center; /* 内容在 body 区域内垂直居中 */
  padding: 0 20px; /* 适当内边距 */
}

.card-header { display: flex; justify-content: space-between; align-items: center; width: 100%; }
.card-title { font-weight: bold; font-size: 14px; color: #cfd3dc; }

/* KPI 数值样式 */
.number { font-size: 28px; font-weight: bold; margin: 0 0 10px 0; font-family: 'DIN', sans-serif; }
.number.danger { color: #F56C6C; }

.desc { font-size: 12px; color: #909399; display: flex; align-items: center; gap: 5px; }
.trend.up { color: #67C23A; font-weight: bold; display: flex; align-items: center; }
.trend.down { color: #F56C6C; font-weight: bold; display: flex; align-items: center; }
.text-warning { color: #E6A23C; font-weight: bold; }

/* 进度条容器 */
.progress-wrapper { 
  display: flex; 
  justify-content: center; 
  align-items: center; 
  height: 100%; 
}

/* 进度条文字微调 */
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

:deep(.el-radio-button__inner) { background: #262729; border-color: #4c4d4f; color: #cfd3dc; box-shadow: none; }
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { background-color: #409EFF; border-color: #409EFF; color: #fff; }
:deep(.el-select__wrapper) { background-color: #262729 !important; box-shadow: 0 0 0 1px #4c4d4f inset !important; }
:deep(.el-select__placeholder) { color: #cfd3dc; }
</style>