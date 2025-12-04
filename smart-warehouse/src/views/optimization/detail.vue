<template>
  <div class="page-container">
    <el-page-header @back="goBack" title="返回列表" class="custom-header mb-20">
      <template #content>
        <div class="header-content">
          <span class="title">方案详情: {{ planId }}</span>
          <el-tag :type="statusType" effect="dark" class="ml-10">{{ planData.status }}</el-tag>
        </div>
      </template>
      <template #extra>
        <el-button type="primary" :icon="VideoPlay" v-if="planData.status === '待执行'">立即执行</el-button>
        <el-button :icon="Download">导出报告</el-button>
      </template>
    </el-page-header>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="never" class="detail-card mb-20 ai-card">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><MagicStick /></el-icon> AI 智能分析</span>
            </div>
          </template>
          <div class="ai-content">
            <p class="ai-text">{{ planData.aiAnalysis }}</p>
            <div class="ai-tags mt-10">
              <el-tag size="small" type="info" class="mr-5">#深度学习</el-tag>
              <el-tag size="small" type="info">#路径优化</el-tag>
            </div>
          </div>
        </el-card>

        <el-card shadow="never" class="detail-card">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><TrendCharts /></el-icon> 预期收益</span>
            </div>
          </template>
          <div class="metrics-box">
            <div class="metric-item">
              <div class="label">空间利用率</div>
              <div class="value up">+12%</div>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-item">
              <div class="label">拣选效率</div>
              <div class="value up">+8.5%</div>
            </div>
            <div class="metric-divider"></div>
            <div class="metric-item">
              <div class="label">AGV 能耗</div>
              <div class="value down">-5%</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card shadow="never" class="detail-card table-card">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><List /></el-icon> 任务执行序列 ({{ taskList.length }})</span>
            </div>
          </template>
          
          <el-table :data="taskList" style="width: 100%" height="500">
            <el-table-column prop="step" label="步骤" width="80" />
            <el-table-column prop="taskType" label="操作类型" width="100">
              <template #default="{ row }">
                <el-tag size="small" :type="row.taskType === '移库' ? 'warning' : 'primary'">{{ row.taskType }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="material" label="物料名称" show-overflow-tooltip />
            <el-table-column prop="from" label="源库位" width="120" />
            <el-table-column prop="to" label="目标库位" width="120">
               <template #default="{ row }">
                 <span class="highlight-text">{{ row.to }}</span>
               </template>
            </el-table-column>
            <el-table-column prop="agv" label="指派 AGV" width="100" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  VideoPlay, Download, MagicStick, TrendCharts, List 
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const planId = ref(route.params.id || 'OPT-UNKNOWN');

// 保持 router.back()，即返回上一级页面
const goBack = () => {
  router.back();
};

// 模拟数据：方案详情
const planData = ref({
  status: '待执行',
  aiAnalysis: '基于过去30天的出库频率分析，发现“Zone A”中存在大量低频物料占据黄金库位。AI 建议将这批物料迁移至高层货架，并将“Zone B”的高频电子元件移入 Zone A，预计可减少 AGV 行驶距离 15%。',
});

const statusType = computed(() => {
  return planData.value.status === '待执行' ? 'warning' : 'success';
});

// 模拟数据：任务列表
const taskList = ref([
  { step: 1, taskType: '移库', material: '304不锈钢螺丝 M4', from: 'A-01-01', to: 'C-05-12', agv: 'AGV-002' },
  { step: 2, taskType: '移库', material: '高频电容 10uF', from: 'B-02-04', to: 'A-01-01', agv: 'AGV-001' },
  { step: 3, taskType: '整理', material: '废旧纸箱', from: '通道-03', to: '回收站', agv: 'AGV-005' },
  { step: 4, taskType: '入库', material: '新到货-主板', from: '收货口', to: 'B-02-04', agv: 'AGV-003' },
  { step: 5, taskType: '移库', material: '散热片 40x40', from: 'A-01-02', to: 'C-05-13', agv: 'AGV-002' },
  { step: 6, taskType: '移库', material: 'CPU i5-12400F', from: 'B-03-01', to: 'A-01-02', agv: 'AGV-001' },
]);

onMounted(() => {
  console.log('Fetching detail for:', planId.value);
});
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mt-10 { margin-top: 10px; }
.mr-5 { margin-right: 5px; }
.ml-10 { margin-left: 10px; }

/* 页头样式 */
.custom-header {
  background: #1d1e1f;
  padding: 15px 20px;
  border: 1px solid #333;
  border-radius: 4px;
}
:deep(.el-page-header__content) { color: #fff; }
:deep(.el-page-header__title) { color: #cfd3dc; }
.header-content { display: flex; align-items: center; }
.title { font-weight: bold; font-size: 16px; color: #fff; }

/* 卡片通用样式 */
.detail-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  height: 40%;
}
.card-header { font-weight: bold; display: flex; align-items: center; }
:deep(.el-card__header) { border-bottom: 1px solid #333; padding: 15px 20px; }

/* AI 分析部分 */
.ai-card { background: linear-gradient(145deg, #1d1e1f 0%, #252a30 100%); }
.ai-text { font-size: 14px; line-height: 1.6; color: #cfd3dc; text-align: justify; }

/* 收益指标样式 */
.metrics-box { display: flex; justify-content: space-around; align-items: center; padding: 10px 0; }
.metric-item { text-align: center; }
.metric-item .label { font-size: 12px; color: #909399; margin-bottom: 5px; }
.metric-item .value { font-size: 20px; font-weight: bold; }
.metric-item .value.up { color: #67C23A; }
.metric-item .value.down { color: #409EFF; }
.metric-divider { width: 1px; height: 30px; background: #4c4d4f; }

/* 表格样式适配 */
.table-card { min-height: 500px; }
:deep(.el-table) { background-color: transparent; --el-table-tr-bg-color: transparent; color: #cfd3dc; }
:deep(.el-table th.el-table__cell) { background-color: #262729; color: #fff; border-bottom: 1px solid #333; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #333; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: #2c2d2f; }
.highlight-text { color: #409EFF; font-weight: bold; }
</style>