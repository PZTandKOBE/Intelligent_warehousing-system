<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card warning-bg">
          <div class="stat-content">
            <div class="stat-title">库存预警总数</div>
            <div class="stat-num text-danger">12</div>
          </div>
          <el-icon class="stat-icon text-danger"><Warning /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card info-bg">
          <div class="stat-content">
            <div class="stat-title">呆滞积压品</div>
            <div class="stat-num text-warning">5</div>
          </div>
          <el-icon class="stat-icon text-warning"><Box /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card success-bg">
          <div class="stat-content">
            <div class="stat-title">本月已处理</div>
            <div class="stat-num text-success">28</div>
          </div>
          <el-icon class="stat-icon text-success"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="main-card">
      <div class="filter-bar mb-20">
        <el-radio-group v-model="filterType" class="custom-radio-group">
          <el-radio-button label="all">全部预警</el-radio-button>
          <el-radio-button label="low">低库存 (Low)</el-radio-button>
          <el-radio-button label="high">积压/呆滞 (High)</el-radio-button>
        </el-radio-group>

        <div class="right-actions">
          <el-button type="primary" :icon="Refresh" @click="handleRefresh">刷新数据</el-button>
        </div>
      </div>

      <el-table :data="tableData" style="width: 100%" class="custom-table">
        <el-table-column prop="code" label="物料编码" width="140" />
        <el-table-column prop="name" label="物料名称" min-width="180" />
        <el-table-column prop="stock" label="当前库存" width="120">
          <template #default="{ row }">
            <span :class="row.type === 'low' ? 'text-danger' : 'text-warning'">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="预警阈值" width="120" />
        <el-table-column prop="type" label="预警类型" width="120">
           <template #default="{ row }">
            <el-tag :type="row.type === 'low' ? 'danger' : 'warning'" effect="dark">
              {{ row.type === 'low' ? '库存不足' : '呆滞积压' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastUpdate" label="最后变动" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">分析详情</el-button>
            <el-button link type="success">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      title="库存异常分析报告" 
      width="600px"
      class="dark-dialog" 
      append-to-body
    >
      <div v-if="currentDetail">
        <el-descriptions :column="2" border class="custom-desc">
          <el-descriptions-item label="物料名称">{{ currentDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="当前库存">{{ currentDetail.stock }}</el-descriptions-item>
          <el-descriptions-item label="安全库存线">{{ currentDetail.threshold }}</el-descriptions-item>
          <el-descriptions-item label="建议采购量">
             <span class="text-success font-bold">{{ currentDetail.type === 'low' ? 500 : 0 }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <h4 class="mt-20 section-title">最近出入库趋势</h4>
        <el-table :data="historyData" style="width: 100%" size="small" border class="dialog-table">
          <el-table-column prop="date" label="日期" width="150" />
          <el-table-column prop="type" label="类型" width="100" />
          <el-table-column prop="num" label="数量" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="dialogVisible = false">关闭</el-button>
        <el-button type="primary">生成采购申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Warning, Box, CircleCheck, Refresh } from '@element-plus/icons-vue';

const filterType = ref('all');
const dialogVisible = ref(false);
const currentDetail = ref(null);

const tableData = reactive([
  { code: 'M-2024003', name: '工业电源 24V', stock: 5, threshold: 'Min: 20', type: 'low', lastUpdate: '2025-12-05 10:00' },
  { code: 'M-2024008', name: '旧款连接器', stock: 2000, threshold: 'Max: 500', type: 'high', lastUpdate: '2025-10-01 09:00' },
  { code: 'M-2024012', name: 'M3螺母', stock: 100, threshold: 'Min: 500', type: 'low', lastUpdate: '2025-12-06 14:00' },
]);

const historyData = [
  { date: '2025-12-01', type: '出库', num: '-10' },
  { date: '2025-12-02', type: '出库', num: '-5' },
  { date: '2025-12-03', type: '入库', num: '+0' },
];

const handleRefresh = () => {
  // 模拟刷新逻辑
};

const openDetail = (row) => {
  currentDetail.value = row;
  dialogVisible.value = true;
};
</script>

<style scoped>
/* 这里的样式只负责页面内部布局，不负责弹窗 */
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.font-bold { font-weight: bold; }

/* 统计卡片样式 */
.stat-card {
  background-color: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
}
.stat-card :deep(.el-card__body) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* width: 100%;  <-- 删除这一行，或者改为 auto */
  box-sizing: border-box; /* 确保 padding 包含在宽度内 */
  padding: 20px;
}

/* 建议同时也给图标加一个不被挤压的属性，防止屏幕变窄时图标变形 */
.stat-icon { 
  font-size: 40px; 
  opacity: 0.8; 
  flex-shrink: 0; /* 新增：防止空间不足时图标被压缩 */
}
.stat-title { font-size: 14px; color: #909399; }
.stat-num { font-size: 24px; font-weight: bold; margin-top: 5px; }

.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.text-success { color: #67C23A; }

.main-card {
  background-color: #1d1e1f;
  border: 1px solid #333;
  min-height: 500px;
}

/* Radio 按钮暗黑适配 */
:deep(.el-radio-button__inner) {
  background-color: #262729 !important;
  border-color: #4c4d4f !important;
  color: #cfd3dc !important;
  box-shadow: none !important;
}
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409EFF !important;
  border-color: #409EFF !important;
  color: #fff !important;
  box-shadow: -1px 0 0 0 #409EFF !important;
}
:deep(.el-radio-button__inner:hover) {
  color: #409EFF !important;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 页面主表格样式 */
:deep(.el-table) {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #262729;
  --el-table-border-color: #333;
  --el-table-text-color: #cfd3dc;
  --el-table-header-text-color: #fff;
  background-color: transparent !important;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
}
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: #2c3e50 !important;
}
</style>

<style>
/* 弹窗整体背景 - 使用我们在 el-dialog 上加的 dark-dialog 类名 */
.dark-dialog {
  --el-dialog-bg-color: #1d1e1f;
  background-color: #1d1e1f !important;
  border: 1px solid #4c4d4f;
}

.dark-dialog .el-dialog__title {
  color: #fff !important;
}

.dark-dialog .el-dialog__body {
  color: #cfd3dc !important;
}

/* 修复详情列表 (Descriptions) 的白色背景 */
.dark-dialog .el-descriptions__body {
  background-color: transparent !important;
  color: #cfd3dc !important;
}

.dark-dialog .el-descriptions__label {
  background-color: #262729 !important;
  color: #fff !important;
  border-color: #333 !important;
}

.dark-dialog .el-descriptions__content {
  background-color: #1d1e1f !important;
  color: #cfd3dc !important;
  border-color: #333 !important;
}

/* 修复弹窗内的小表格背景 */
.dark-dialog .el-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #262729;
  --el-table-border-color: #333;
  color: #cfd3dc;
  background-color: transparent !important;
}

.dark-dialog .el-table th.el-table__cell {
  background-color: #262729 !important;
  color: #fff;
  border-bottom: 1px solid #333 !important;
}

.dark-dialog .el-table td.el-table__cell {
  background-color: transparent !important;
  border-bottom: 1px solid #333 !important;
}

.dark-dialog .section-title {
  color: #fff;
  border-left: 3px solid #409EFF;
  padding-left: 10px;
}
</style>