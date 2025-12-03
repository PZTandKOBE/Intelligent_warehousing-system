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

    <el-card shadow="never" class="box-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="🔴 紧急补货" name="urgent"></el-tab-pane>
        <el-tab-pane label="🟠 常规补货" name="normal"></el-tab-pane>
      </el-tabs>

      <el-table :data="replenishList" style="width: 100%" class="custom-table">
        <el-table-column prop="name" label="物料名称" min-width="150" />
        <el-table-column prop="supplier" label="推荐供应商" width="150" />
        <el-table-column label="库存分析" width="200">
          <template #default="{ row }">
             <div>现存: {{ row.stock }} | 警戒: {{ row.limit }}</div>
             <el-progress :percentage="30" status="exception" :stroke-width="6" />
          </template>
        </el-table-column>
        <el-table-column prop="suggestQty" label="建议补货量" width="120" align="center">
          <template #default="{ row }">
            <span style="color: #409EFF; font-weight: bold">{{ row.suggestQty }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
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

const replenishList = reactive([
  { name: 'STM32 芯片', supplier: 'ST原厂', stock: 50, limit: 100, suggestQty: 500 },
  { name: '工业轴承 608ZZ', supplier: '哈尔滨轴承', stock: 12, limit: 50, suggestQty: 200 },
  { name: '散热硅脂', supplier: '道康宁代理', stock: 5, limit: 20, suggestQty: 50 },
]);
</script>

<style scoped>
/* 同样复用暗黑样式 */
.page-container { height: 100%; padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.kpi-card { background: #1d1e1f; border: 1px solid #333; color: #fff; text-align: center; }
.kpi-card .value { font-size: 24px; font-weight: bold; margin-top: 10px; }
.kpi-card .value.danger { color: #F56C6C; }
.box-card { background: #1d1e1f; border: 1px solid #333; color: #fff; }

:deep(.el-table), :deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; color: #cfd3dc; border-bottom: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: #2c3e50 !important; }
:deep(.el-table__inner-wrapper::before) { display: none !important; }
/* Tabs 样式微调 */
:deep(.el-tabs__item) { color: #cfd3dc; }
:deep(.el-tabs__item.is-active) { color: #409EFF; }
</style>