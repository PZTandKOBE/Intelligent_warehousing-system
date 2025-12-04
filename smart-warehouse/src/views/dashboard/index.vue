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
      <BaseChart :options="chartOptions" height="55vh" />
    </div>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>AGV 在线状态</template>
          <div class="content-box">
            <el-tag type="success">空闲 5</el-tag>
            <el-tag type="primary">工作中 6</el-tag>
            <el-tag type="danger">维护 1</el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>今日吞吐量</template>
          <div class="content-box">
             <h3 style="color: #409EFF">3,450 件</h3>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="data-card">
          <template #header>预测准确率</template>
          <div class="content-box">
             <h3 style="color: #E6A23C">94.5%</h3>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
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

// --- 生成 2D 货架数据 ---
const shelvesData = [];
for (let y = 0; y < 10; y++) {
  for (let x = 0; x < 10; x++) {
    // 留出通道
    if (x !== 4 && x !== 5) shelvesData.push([x, y]);
  }
}

// --- 2D 图表配置 ---
const chartOptions = reactive({
  backgroundColor: 'transparent',
  title: { 
    text: 'Zone A - 实时作业热力图', 
    left: 'center', 
    textStyle: { color: '#fff' } 
  },
  // 调整 grid 留白
  grid: { left: '5%', right: '5%', top: '10%', bottom: '5%' },
  tooltip: { trigger: 'item' },
  // 隐藏坐标轴
  xAxis: { type: 'value', show: false, min: -1, max: 11 },
  yAxis: { type: 'value', show: false, min: -1, max: 11 },
  animationDurationUpdate: 1000,
  animationEasingUpdate: 'cubicOut',
  series: [
    // Layer 1: 货架 (灰色方块)
    {
      type: 'scatter',
      symbol: 'rect',
      symbolSize: [40, 40],
      itemStyle: { color: '#2c3e50', opacity: 0.6 },
      data: shelvesData,
      silent: true
    },
    // Layer 2: AGV (红色圆点)
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

// --- 联动逻辑 ---
watch(
  () => store.agvPosition,
  (newPos) => {
    // 2D 模式下，直接修改 reactive 对象的 data 即可
    // 因为 BaseChart 加回了 deep: true，所以这里能自动更新
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
/* 请确保最外层的 class 名称与您 template 里的根元素一致 */
/* 如果您的根元素叫 class="dashboard-container"，请对应修改 */
.dashboard-container {
  height: 100%;
  width: 100%;
  
  /* 核心修复：防止 padding 撑出滚动条 */
  box-sizing: border-box;
  
  /* 减小内边距 */
  padding: 10px;
  
  /* 强制隐藏整个页面的滚动条 */
  overflow: hidden;
  
  /* 布局设置 */
  display: flex;
  flex-direction: column;
  background-color: #141414; /* 确保背景色 */
}

/* 如果内容区域（如图表）需要单独滚动，请给内容区加上 overflow-y: auto */
/* 如果希望完全不滚动，保持默认或 hidden 即可 */

/* 下面是针对暗黑模式下卡片去白边的通用修正，建议加上 */
:deep(.el-card) {
  border: 1px solid #333;
  background-color: #1d1e1f;
  color: #fff;
}

:deep(.el-card__header) {
  border-bottom: 1px solid #333;
  padding: 10px 15px; /* 头部紧凑一点 */
}

:deep(.el-card__body) {
  /* 确保卡片内部也不会随便撑开 */
  box-sizing: border-box; 
  padding: 10px;
}
</style>