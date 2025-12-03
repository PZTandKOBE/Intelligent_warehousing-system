<template>
  <div class="task-container">
    <el-row :gutter="20" style="height: 100%;">
      
      <el-col :span="8" style="height: 100%;">
        <el-card shadow="never" class="box-card timeline-card">
          <template #header>
            <div class="card-header">
              <span>🔔 实时作业流 (Live)</span>
              <el-tag effect="dark" :type="store.isRunning ? 'success' : 'info'" size="small">
                {{ store.isRunning ? '运行中' : '待机' }}
              </el-tag>
            </div>
          </template>
          
          <el-scrollbar height="calc(100vh - 200px)">
            <el-timeline>
              <el-timeline-item
                v-for="(log, index) in store.logs"
                :key="index"
                :type="log.type"
                :color="getLogColor(log.type)"
                :timestamp="log.time"
                placement="top"
              >
                <el-card class="timeline-item-card">
                  <h4>{{ log.title }}</h4>
                  <p>{{ log.content }}</p>
                </el-card>
              </el-timeline-item>
            </el-timeline>
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :span="16" style="height: 100%;" id="report-area">
        <el-card shadow="never" class="box-card">
          <template #header>
            <div class="card-header">
              <span>🤖 Dify 智能体决策记录</span>
              
              <div data-html2canvas-ignore="true">
                <el-button type="primary" size="small" plain @click="handleExport">
                  <el-icon style="margin-right:5px"><Document /></el-icon> 
                  生成分析报告 (PDF)
                </el-button>
                <el-button type="success" size="small">手动触发优化</el-button>
              </div>
            </div>
          </template>

          <el-table :data="taskList" style="width: 100%" class="custom-table">
            <el-table-column prop="taskId" label="任务ID" width="100" />
            <el-table-column label="任务类型" width="120">
              <template #default="scope">
                <el-tag :type="getTaskTypeTag(scope.row.type)">{{ scope.row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="操作描述" min-width="180" />
            <el-table-column label="AI 推荐理由 (Reasoning)" min-width="200">
              <template #default="scope">
                <span style="color: #67C23A; font-size: 12px; display: flex; align-items: center;">
                  <el-icon style="margin-right: 4px;"><MagicStick /></el-icon> 
                  {{ scope.row.reason }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="执行进度" width="150">
              <template #default="scope">
                <el-progress 
                  :percentage="scope.row.progress" 
                  :status="scope.row.progress === 100 ? 'success' : ''" 
                />
              </template>
            </el-table-column>
          </el-table>

          <div style="margin-top: 20px;">
             <el-alert
              title="预测模型摘要"
              description="根据历史数据分析，预测明日 '电子元器件' 类目出库量激增 15%，系统已自动将相关物料移至靠近出库口 (Zone A)。"
              type="info"
              effect="dark"
              :closable="false"
              show-icon
            />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { MagicStick, Check, Loading, VideoPause, Document } from '@element-plus/icons-vue';
// 1. 引入 Store
import { useWarehouseStore } from '@/stores/warehouse';
// 2. 引入导出工具 (注意这里改成了你新建的 exportReport)
import { downloadPDF } from '@/utils/exportReport';

// 初始化 Store
const store = useWarehouseStore();

// --- 导出逻辑 ---
const handleExport = () => {
  // 导出右侧 ID 为 report-area 的区域
  downloadPDF('智能仓储AI优化报告', '#report-area');
};

// --- 辅助函数：根据日志类型返回颜色 ---
const getLogColor = (type) => {
  const map = {
    success: '#67C23A',
    warning: '#E6A23C',
    error: '#F56C6C',
    primary: '#409EFF',
    info: '#909399'
  };
  return map[type] || '#909399';
};

// --- 右侧表格数据 (模拟) ---
const taskList = reactive([
  { taskId: 'T-8821', type: '移库优化', desc: '将 STM32 芯片从 Row-9 移至 Row-1', reason: '预测明日出库概率 > 80%', progress: 100 },
  { taskId: 'T-8822', type: '呆滞清理', desc: '将 过期润滑油 移至深堆区', reason: '超过 90 天未被调用', progress: 45 },
  { taskId: 'T-8823', type: '并库任务', desc: '合并 3 箱 螺丝钉 到同一货位', reason: '释放碎片化空间', progress: 10 },
  { taskId: 'T-8824', type: '充电调度', desc: 'AGV-005 电量低于 20%，回充', reason: '保障夜间续航', progress: 0 },
  { taskId: 'T-8825', type: '预先调度', desc: '将空托盘移动至入库口', reason: '预测明日早晨有大批量入库', progress: 0 },
]);

const getTaskTypeTag = (type) => {
  const map = {
    '移库优化': 'primary',
    '呆滞清理': 'warning',
    '并库任务': 'info',
    '充电调度': 'danger'
  };
  return map[type] || 'info';
};
</script>

<style scoped>
/* 容器 */
.task-container {
  height: 100%;
}

/* 卡片通用样式 */
.box-card {
  background-color: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 让右侧卡片内容撑满 */
:deep(.el-card__body) {
  flex: 1;
  overflow: hidden; /* 防止溢出 */
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 左侧时间轴卡片内部 */
.timeline-item-card {
  background-color: #262729;
  border: 1px solid #333;
  color: #cfd3dc;
  padding: 10px;
}
.timeline-item-card h4 {
  margin: 0 0 10px;
  color: #fff;
  font-size: 14px;
}
.timeline-item-card p {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

/* ==============================================
   表格核心样式覆盖 (与库存页保持一致的透明黑科技风)
   ============================================== */
:deep(.el-table) {
  --el-table-border-color: #333;
  --el-table-header-bg-color: #262729;
  --el-table-row-hover-bg-color: #2c3e50;
  --el-table-bg-color: transparent !important;
  --el-table-tr-bg-color: transparent !important;
  background-color: transparent !important;
  color: #cfd3dc;
}

:deep(.el-table tr) {
  background-color: transparent !important;
}

:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  border-bottom: 1px solid #333 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #262729 !important;
  color: #fff;
  font-weight: bold;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: #2c3e50 !important;
}

:deep(.el-table__inner-wrapper::before) {
  display: none !important;
}
</style>