<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">待补货SKU</div>
          <div class="value danger">12</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">预估采购金额</div>
          <div class="value">¥ 45,200</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="box-card flex-col">
      <el-tabs v-model="activeTab" class="no-margin-bottom">
        <el-tab-pane label="🔴 紧急补货" name="urgent"></el-tab-pane>
        <el-tab-pane label="🟠 常规补货" name="normal"></el-tab-pane>
      </el-tabs>

      <el-table 
        :data="replenishList" 
        class="custom-table flex-table"
        height="100%"
      >
        <el-table-column prop="name" label="物料名称" min-width="200" show-overflow-tooltip />
        
        <el-table-column label="库存分析" min-width="280">
          <template #default="{ row }">
             <div class="stock-info">
               <span>现存: {{ row.stock }}</span>
               <span class="divider">|</span>
               <span>警戒: {{ row.limit }}</span>
             </div>
             <el-progress :percentage="30" status="exception" :stroke-width="6" :show-text="false" />
          </template>
        </el-table-column>
        
        <el-table-column prop="suggestQty" label="建议补货量" width="150" align="center">
          <template #default="{ row }">
            <span style="color: #409EFF; font-weight: bold">{{ row.suggestQty }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="150" fixed="right" align="center">
          <template #default>
            <el-button type="primary" size="small" plain>生成采购单</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const activeTab = ref('urgent');

// 去除了 supplier 字段
const replenishList = reactive([
  { name: 'STM32 芯片', stock: 50, limit: 100, suggestQty: 500 },
  { name: '工业轴承 608ZZ', stock: 12, limit: 50, suggestQty: 200 },
  { name: '散热硅脂', stock: 5, limit: 20, suggestQty: 50 },
  { name: 'M3 螺丝', stock: 1000, limit: 5000, suggestQty: 10000 },
  { name: 'Wi-Fi 模块 ESP32', stock: 8, limit: 30, suggestQty: 100 },
]);
</script>

<style scoped>
/* 页面容器：Flex 纵向布局 */
.page-container {
  height: 100%;
  /* 关键修改：加上 box-sizing: border-box 防止 padding 撑开高度 */
  box-sizing: border-box;
  padding: 10px;
  /* 减小内边距 */
  display: flex;
  flex-direction: column;
  overflow: hidden;
  /* 强制隐藏最外层滚动条 */
}

.mb-20 {
  margin-bottom: 10px;
}

/* 间距也相应调小 */

/* KPI 卡片 */
.kpi-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  text-align: center;
}

.kpi-card .value {
  font-size: 24px;
  font-weight: bold;
  margin-top: 10px;
}

.kpi-card .value.danger {
  color: #F56C6C;
}

/* 主体卡片 */
.box-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 穿透修改 el-card__body 撑开高度 */
:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 10px;
  /* 卡片内部也减小 padding */
  box-sizing: border-box;
  /* 同样加上这个 */
  overflow: hidden;
}

/* 表格自适应 */
.flex-table {
  width: 100%;
  flex: 1;
  margin-top: 10px;
}

.stock-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin-bottom: 4px;
  color: #909399;
}

.divider {
  margin: 0 4px;
  color: #555;
}

/* 样式覆盖 (暗黑模式) */
:deep(.el-table),
:deep(.el-table tr),
:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  color: #cfd3dc;
  border-bottom: 1px solid #333 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #262729 !important;
  color: #fff;
  font-weight: 600;
}

:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: #2c3e50 !important;
}

:deep(.el-table__inner-wrapper::before) {
  display: none !important;
}

:deep(.el-table__border-left-patch) {
  display: none !important;
}

/* Tabs */
:deep(.el-tabs__item) {
  color: #cfd3dc;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
}

:deep(.el-tabs__nav-wrap::after) {
  background-color: #333;
}
</style>