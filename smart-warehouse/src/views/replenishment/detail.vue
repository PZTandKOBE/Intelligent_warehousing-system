<template>
  <div class="replenishment-detail-container">
    <div class="header-section">
      <div class="title-group">
        <h2 class="page-title">补货计划详情</h2>
        <el-tag type="success" effect="dark" class="status-tag">进行中</el-tag>
      </div>
      <div class="action-group">
        <el-button type="danger" plain :icon="CircleClose">取消计划</el-button>
        <el-button type="primary" :icon="Download">导出清单</el-button>
        <el-button type="info" plain @click="$router.back()">返回列表</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="metrics-row">
      <el-col :span="16" class="col-stretch">
        <el-card class="info-card overview-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><DataBoard /></el-icon>
              <span>计划概况 (Plan Overview)</span>
            </div>
          </template>
          <div class="card-content-wrapper">
            <div class="overview-grid">
              <div class="info-item">
                <span class="label">计划编号</span>
                <span class="value">RP-20231204-001</span>
              </div>
              <div class="info-item">
                <span class="label">创建时间</span>
                <span class="value">2023-12-04 09:30:00</span>
              </div>
              <div class="info-item">
                <span class="label">负责人</span>
                <span class="value">张三 (仓储主管)</span>
              </div>
              <div class="info-item">
                <span class="label">预计完成</span>
                <span class="value highlight">2023-12-05 18:00:00</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="8" class="col-stretch">
        <el-card class="info-card progress-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><Timer /></el-icon>
              <span>执行进度</span>
            </div>
          </template>
          <div class="card-content-wrapper progress-wrapper">
            <div class="progress-content">
              <el-progress 
                type="dashboard" 
                :percentage="65" 
                :color="colors"
                :stroke-width="10"
                :width="110"
              >
                <template #default="{ percentage }">
                  <span class="progress-value">{{ percentage }}%</span>
                  <span class="progress-label">已完成</span>
                </template>
              </el-progress>
              <div class="progress-stats">
                <p>总任务数: 120</p>
                <p>待处理: 42</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="detail-list-card" shadow="hover">
      <template #header>
        <div class="list-header">
          <div class="left">
            <el-icon><List /></el-icon>
            <span>补货明细清单</span>
          </div>
          <div class="right">
            <el-input
              v-model="searchQuery"
              placeholder="搜索物料名称/编号"
              :prefix-icon="Search"
              class="search-input"
            />
          </div>
        </div>
      </template>

      <el-table 
        :data="tableData" 
        style="width: 100%" 
        height="100%"
        :header-cell-style="{ background: 'rgba(255,255,255,0.05)', color: '#fff' }"
        :row-class-name="tableRowClassName"
      >
        <el-table-column prop="materialId" label="物料编号" width="120" />
        <el-table-column prop="name" label="物料名称" width="180" />
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="currentStock" label="当前库存" width="120">
          <template #default="scope">
            <span class="text-danger">{{ scope.row.currentStock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="replenishAmount" label="补货数量" width="120">
          <template #default="scope">
            <span class="text-success">+{{ scope.row.replenishAmount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'" size="small">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next"
          :total="100"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { 
  CircleClose, 
  Download, 
  DataBoard, 
  Timer, 
  List, 
  Search 
} from '@element-plus/icons-vue'

const searchQuery = ref('')

const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 100 },
]

const tableData = ref([
  { materialId: 'M-1001', name: '高性能显卡 3080', category: '电子', currentStock: 5, replenishAmount: 50, supplier: 'NVIDIA专供', status: '待处理' },
  { materialId: 'M-1002', name: 'DDR5 内存条 16G', category: '电子', currentStock: 12, replenishAmount: 100, supplier: '金士顿', status: '已完成' },
  { materialId: 'M-1003', name: '机械键盘轴体', category: '外设', currentStock: 200, replenishAmount: 500, supplier: 'Cherry', status: '待处理' },
  { materialId: 'M-1004', name: '人体工学椅', category: '家具', currentStock: 2, replenishAmount: 20, supplier: 'Herman Miller', status: '待处理' },
  { materialId: 'M-1005', name: '4K 显示器', category: '电子', currentStock: 8, replenishAmount: 30, supplier: 'Dell', status: '已完成' },
  // 添加更多数据测试滚动
  { materialId: 'M-1006', name: '无线鼠标 G Pro', category: '外设', currentStock: 50, replenishAmount: 200, supplier: 'Logitech', status: '待处理' },
  { materialId: 'M-1007', name: 'Type-C 数据线', category: '配件', currentStock: 1000, replenishAmount: 5000, supplier: '绿联', status: '已完成' },
])

const tableRowClassName = ({ rowIndex }) => {
  return rowIndex % 2 === 0 ? 'even-row' : 'odd-row'
}
</script>

<style scoped lang="scss">
$bg-dark: #0a101f;
$card-bg: #111a2e;
$text-light: #e0e0e0;
$text-dim: #8b9bb4;
$border-color: rgba(255, 255, 255, 0.1);
$primary-color: #409eff;

/* === 核心布局修改 === */
.replenishment-detail-container {
  height: 100%; /* 锁定高度，不许溢出 */
  padding: 16px; /* 稍微减小内边距 */
  box-sizing: border-box;
  background-color: $bg-dark;
  color: $text-light;
  display: flex; /* 开启 Flex 布局 */
  flex-direction: column; /* 纵向排列 */
  overflow: hidden; /* 彻底干掉页面级滚动条 */
}

/* 顶部区域：固定高度，不许收缩 */
.header-section {
  flex-shrink: 0; 
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .title-group {
    display: flex;
    align-items: center;
    gap: 16px;
    .page-title {
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }
  }
}

/* 中间指标区域：固定高度，不许收缩 */
.metrics-row {
  flex-shrink: 0;
  display: flex;
  align-items: stretch; /* 强制左右卡片等高 */
  margin-bottom: 16px;
}

.col-stretch {
  display: flex; 
  flex-direction: column;
}

.info-card {
  background-color: $card-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  flex: 1; /* 撑满列高 */
  display: flex;
  flex-direction: column;
  overflow: hidden; 
  
  :deep(.el-card__header) {
    border-bottom: 1px solid $border-color;
    padding: 12px 20px;
    flex-shrink: 0;
  }
  
  :deep(.el-card__body) {
    background-color: $card-bg;
    color: $text-light;
    flex: 1; 
    display: flex;
    flex-direction: column;
    justify-content: center; 
    padding: 16px; 
    overflow: hidden; 
  }
}

/* === 底部列表卡片：占据剩余空间 === */
.detail-list-card {
  background-color: $card-bg;
  border: 1px solid $border-color;
  border-radius: 8px;
  
  /* 关键属性 */
  flex: 1; /* 自动填满剩余垂直空间 */
  min-height: 0; /* 防止被子元素撑大，这是 Flex 嵌套滚动的关键！ */
  display: flex;
  flex-direction: column;
  overflow: hidden;

  :deep(.el-card__header) {
    border-bottom: 1px solid $border-color;
    padding: 12px 20px;
    flex-shrink: 0; /* 头部固定 */
  }
  
  :deep(.el-card__body) {
    background-color: $card-bg;
    flex: 1; /* Body 撑满卡片剩余部分 */
    padding: 0; /* 表格贴边，去掉 padding 节省空间 */
    display: flex;
    flex-direction: column;
    overflow: hidden; /* 必须隐藏，交给表格去滚动 */
    position: relative; /* 定位基准 */
  }
}

/* 表格容器样式 */
:deep(.el-table) {
  flex: 1; /* 表格撑满 Body */
  background-color: transparent;
  color: $text-light;
  
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: rgba(255, 255, 255, 0.05);
  --el-table-row-hover-bg-color: rgba(64, 158, 255, 0.15); 
  --el-table-border-color: rgba(255, 255, 255, 0.05);
  
  th.el-table__cell {
    background-color: rgba(255, 255, 255, 0.05);
    border-bottom: 1px solid $border-color;
  }
  td.el-table__cell {
    border-bottom: 1px solid $border-color;
  }
  .el-table__empty-block { background-color: transparent; }
}

/* 内容样式微调 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
    .label { font-size: 13px; color: $text-dim; }
    .value { font-size: 15px; color: #fff; font-weight: 500; &.highlight { color: $primary-color; } }
  }
}

.progress-content {
  display: flex;
  justify-content: space-around;
  align-items: center;
  width: 100%;
  .progress-value { display: block; font-size: 20px; font-weight: bold; color: #fff; line-height: 1.4; }
  .progress-label { font-size: 12px; color: $text-dim; }
  .progress-stats { 
    display: flex; flex-direction: column; justify-content: center;
    p { margin: 6px 0; color: $text-light; font-size: 14px; }
  }
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  .left { display: flex; align-items: center; gap: 8px; color: #fff; font-weight: 600; }
}

.search-input {
  width: 240px;
  :deep(.el-input__wrapper) {
    background-color: rgba(255, 255, 255, 0.05);
    box-shadow: none;
    border: 1px solid $border-color;
    &.is-focus { border-color: $primary-color; }
  }
  :deep(.el-input__inner) { color: #fff; }
}

.card-header { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; color: #fff; }
.text-danger { color: #f56c6c; font-weight: bold; }
.text-success { color: #67c23a; font-weight: bold; }

.pagination-container {
  padding: 10px 16px;
  border-top: 1px solid $border-color;
  display: flex;
  justify-content: flex-end;
  background-color: $card-bg;
  flex-shrink: 0; /* 分页固定高度 */
  
  :deep(.el-pagination.is-background .el-pager li:not(.is-active)),
  :deep(.el-pagination.is-background .btn-prev),
  :deep(.el-pagination.is-background .btn-next) {
    background-color: rgba(255, 255, 255, 0.05);
    color: $text-dim;
  }
}
</style>