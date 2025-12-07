<template>
  <div class="page-container">
    <div class="header">
      <h2>📂 运营报告中心 (Report Hub)</h2>
    </div>

    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" class="demo-form-inline">
        <el-form-item label="报告类型">
          <el-select v-model="filters.type" placeholder="全部" style="width: 150px">
             <el-option label="全部" value="" />
             <el-option label="日报 (Daily)" value="DAILY" />
             <el-option label="优化报告 (Optimization)" value="OPT" />
             <el-option label="补货报告 (Replenishment)" value="REP" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
           <el-date-picker 
             v-model="filters.date" 
             type="daterange" 
             range-separator="至" 
             start-placeholder="开始日期" 
             end-placeholder="结束日期" 
             style="width: 260px"
           />
        </el-form-item>
        <el-form-item>
           <el-button type="primary" icon="Search">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="reportList" style="width: 100%" class="custom-table">
        <el-table-column prop="id" label="报告编号" width="160" />
        <el-table-column prop="title" label="报告标题" min-width="250" />
        <el-table-column prop="type" label="类型" width="120">
           <template #default="{ row }">
              <el-tag :type="getReportTypeTag(row.type)" effect="dark">{{ row.typeLabel }}</el-tag>
           </template>
        </el-table-column>
        <el-table-column prop="createTime" label="生成时间" width="180" />
        <el-table-column label="邮件状态" width="120">
           <template #default="{ row }">
              <el-tag size="small" :type="row.sent ? 'success' : 'info'">{{ row.sent ? '已发送' : '未发送' }}</el-tag>
           </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
           <template #default>
              <el-button link type="primary" icon="View">查看</el-button>
              <el-button link type="primary" icon="Download">下载</el-button>
           </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';

const filters = reactive({
  type: '',
  date: []
});

const reportList = reactive([
  { id: 'RPT-20240501', title: '5月1日 库存运营日报', type: 'DAILY', typeLabel: '日报', createTime: '2024-05-01 18:00', sent: true },
  { id: 'OPT-20240430', title: 'Zone A 空间优化分析报告', type: 'OPT', typeLabel: '优化报告', createTime: '2024-04-30 14:20', sent: true },
  { id: 'REP-20240428', title: '电子元器件紧急补货建议', type: 'REP', typeLabel: '补货报告', createTime: '2024-04-28 09:15', sent: false },
]);

const getReportTypeTag = (type) => {
  const map = { 'DAILY': 'info', 'OPT': 'primary', 'REP': 'warning' };
  return map[type] || 'info';
};
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.search-card {
  background: #1d1e1f;
  border: 1px solid #333;
}

.table-card {
  background: #1d1e1f;
  border: 1px solid #333;
}

.header {
  color: #fff;
  margin-bottom: 20px;
}

/* 暗黑输入框适配 */
:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-date-editor) {
  background-color: #262729;
  box-shadow: 0 0 0 1px #4c4d4f inset;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #cfd3dc;
}

/* 表格复用 */
:deep(.el-table),
:deep(.el-table th.el-table__cell),
:deep(.el-table tr),
:deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  color: #cfd3dc;
  border-bottom: 1px solid #333 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #262729 !important;
  color: #fff;
}
</style>