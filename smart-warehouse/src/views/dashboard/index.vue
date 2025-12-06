<template>
  <div class="analysis-container">
    <div class="header-controls">
      <h2>📊 运营数据概览</h2>
      <el-radio-group v-model="timeRange" size="small" @change="handleTimeChange">
        <el-radio-button label="7d">近 7 天</el-radio-button>
        <el-radio-button label="30d">近 30 天</el-radio-button>
      </el-radio-group>
    </div>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <template #header><span class="card-title">💰 库存总金额</span></template>
          <div class="number">¥ 1,245,000</div>
          <div class="trend up">环比 +12% <el-icon><Top /></el-icon></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <template #header><span class="card-title">🚛 本月出库量</span></template>
          <div class="number">8,540</div>
          <div class="trend down">环比 -5% <el-icon><Bottom /></el-icon></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <template #header><span class="card-title">📥 本月入库量</span></template>
          <div class="number">9,200</div>
          <div class="trend up">环比 +8% <el-icon><Top /></el-icon></div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <template #header><span class="card-title">⚠️ 呆滞物料数</span></template>
          <div class="number danger">145</div>
          <div class="desc">占库存总量 1.5%</div>
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
import { ref, reactive } from 'vue';
import { Top, Bottom } from '@element-plus/icons-vue';
import BaseChart from '@/components/BaseChart.vue';

const timeRange = ref('7d');

// 模拟数据源
const dataMap = {
  '7d': {
    xAxis: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    amount: [820, 932, 901, 934, 1290, 1330, 1320],
    in: [120, 132, 101, 134, 90, 230, 210],
    out: [220, 182, 191, 234, 290, 330, 310]
  },
  '30d': {
    xAxis: Array.from({length: 15}, (_, i) => `Day ${i+1}`), 
    amount: Array.from({length: 15}, () => Math.floor(Math.random() * 1000 + 800)),
    in: Array.from({length: 15}, () => Math.floor(Math.random() * 200 + 50)),
    out: Array.from({length: 15}, () => Math.floor(Math.random() * 200 + 50))
  }
};

const amountTrendOptions = reactive({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: dataMap['7d'].xAxis, axisLabel: { color: '#cfd3dc' } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#cfd3dc' } },
  series: [{
    name: '库存金额', type: 'line', smooth: true, itemStyle: { color: '#409EFF' }, areaStyle: { color: 'rgba(64,158,255,0.2)' },
    data: dataMap['7d'].amount
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
  xAxis: { type: 'category', data: dataMap['7d'].xAxis, axisLabel: { color: '#cfd3dc' } },
  yAxis: { type: 'value', splitLine: { lineStyle: { color: '#333' } }, axisLabel: { color: '#cfd3dc' } },
  series: [
    { name: '入库量', type: 'bar', itemStyle: { color: '#67C23A' }, data: dataMap['7d'].in },
    { name: '出库量', type: 'bar', itemStyle: { color: '#F56C6C' }, data: dataMap['7d'].out }
  ]
});

const handleTimeChange = (val) => {
  const currentData = dataMap[val];
  amountTrendOptions.xAxis.data = currentData.xAxis;
  amountTrendOptions.series[0].data = currentData.amount;
  inOutBarOptions.xAxis.data = currentData.xAxis;
  inOutBarOptions.series[0].data = currentData.in;
  inOutBarOptions.series[1].data = currentData.out;
};
</script>

<style scoped>
.analysis-container { padding: 20px; box-sizing: border-box; }
.header-controls { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; color: #fff; }
.mb-20 { margin-bottom: 20px; }
.kpi-card, .chart-card { background: #1d1e1f; border: 1px solid #333; color: #fff; }
.card-title { font-weight: bold; font-size: 14px; }
.number { font-size: 24px; font-weight: bold; margin: 10px 0; }
.number.danger { color: #F56C6C; }
.trend { font-size: 13px; display: flex; align-items: center; }
.trend.up { color: #67C23A; }
.trend.down { color: #F56C6C; }
.desc { font-size: 12px; color: #909399; }
:deep(.el-radio-button__inner) { background: #262729; border-color: #4c4d4f; color: #cfd3dc; box-shadow: none; }
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { background-color: #409EFF; border-color: #409EFF; color: #fff; }
</style>