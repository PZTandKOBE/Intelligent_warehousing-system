<template>
  <div class="dashboard-container">
    <div class="header">
      <h2>🚀 智能仓储监控中心 (WMS Monitor)</h2>
      <el-button 
        :type="store.isRunning ? 'danger' : 'primary'" 
        size="small" 
        @click="toggleMove"
      >
        {{ store.isRunning ? '停止模拟 (Stop)' : '启动夜间模式 (Start)' }}
      </el-button>
    </div>

    <div class="chart-wrapper">
      <BaseChart :options="chartOptions" height="100%" />
    </div>
    
    <el-row :gutter="20" class="status-row">
      <el-col :span="6" class="status-col">
        <el-card shadow="hover" class="data-card">
          <template #header>AGV 在线状态</template>
          <div class="content-box">
            <el-tag type="success">空闲 5</el-tag>
            <el-tag type="primary">工作中 6</el-tag>
            <el-tag type="danger">维护 1</el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6" class="status-col">
        <el-card shadow="hover" class="data-card">
          <template #header>今日吞吐量</template>
          <div class="content-box">
             <h3 style="color: #409EFF">3,450 件</h3>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6" class="status-col">
        <el-card shadow="hover" class="data-card">
          <template #header>预测准确率</template>
          <div class="content-box">
             <h3 style="color: #E6A23C">94.5%</h3>
          </div>
        </el-card>
      </el-col>

      <el-col :span="6" class="status-col">
        <el-card shadow="hover" class="data-card">
          <template #header>空间利用率</template>
          <div class="content-box">
             <h3 style="color: #F56C6C">82%</h3>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue';
import BaseChart from '@/components/BaseChart.vue';
import { useWarehouseStore } from '@/stores/warehouse'; 

const store = useWarehouseStore();

const shelvesData = [];
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 10; x++) {
    if (x !== 4 && x !== 5) shelvesData.push([x, y]);
  }
}

const chartOptions = reactive({
  backgroundColor: 'transparent',
  title: { 
    text: 'Zone A - 实时作业热力图', 
    left: 'center', 
    textStyle: { color: '#fff' } 
  },
  // 修改点：bottom 改为 0，让图表内容紧贴容器底部
  grid: { left: '2%', right: '2%', top: '10%', bottom: '0%', containLabel: true },
  tooltip: { trigger: 'item' },
  xAxis: { type: 'value', show: false, min: -1, max: 11 },
  yAxis: { type: 'value', show: false, min: -1, max: 11 },
  animationDurationUpdate: 1000,
  animationEasingUpdate: 'cubicOut',
  series: [
    {
      type: 'scatter',
      symbol: 'rect',
      symbolSize: [45, 45],
      itemStyle: { color: '#2c3e50', opacity: 0.6 },
      data: shelvesData,
      silent: true
    },
    {
      name: 'AGV',
      type: 'scatter',
      symbol: 'circle', 
      symbolSize: 25,
      itemStyle: { 
        color: '#e74c3c', 
        shadowBlur: 20, 
        shadowColor: '#e74c3c' 
      },
      data: [[0, 0]], 
      z: 10
    }
  ]
});

watch(
  () => store.agvPosition,
  (newPos) => {
    chartOptions.series[1].data = [newPos];
  },
  { deep: true }
);

const toggleMove = () => {
  if (store.isRunning) {
    store.stopSimulation();
  } else {
    store.startSimulation();
  }
};
</script>

<style scoped>
.dashboard-container {
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  padding: 10px;
  overflow: hidden; /* 防止滚动条 */
  display: flex;
  flex-direction: column;
  background-color: #141414; 
}

.header {
  flex-shrink: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #fff;
  margin-bottom: 5px;
}

/* 
  核心修改：
  1. 不使用 flex: 1，而是指定高度 65vh (占屏幕65%)
  2. 这样图表足够大，但下方会留出固定空间给卡片
*/
.chart-wrapper {
  height: 65vh; 
  width: 100%;
  min-height: 400px; /* 保证在超扁的屏幕上也不会太小 */
}

/* 
  核心修改：
  margin-top 设为 10px，让卡片紧跟在图表下面
*/
.status-row {
  margin-top: 10px; 
  flex-shrink: 0; /* 防止卡片被压缩 */
  display: flex; 
  align-items: stretch; 
}

.status-col {
  display: flex;
  flex-direction: column;
}

.data-card {
  flex: 1; 
  display: flex;
  flex-direction: column;
  border: 1px solid #333;
  background-color: #1d1e1f;
  color: #fff;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center; 
  align-items: center; 
  padding: 10px;
  box-sizing: border-box;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #333;
  padding: 8px 15px;
  text-align: center;
  font-weight: bold;
}

.content-box {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.content-box h3 {
  margin: 0;
  font-size: 24px;
}
</style>