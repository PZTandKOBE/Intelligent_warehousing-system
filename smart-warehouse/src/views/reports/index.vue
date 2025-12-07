<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select v-model="filters.warehouse" placeholder="全部仓库" style="width: 160px" clearable>
            <el-option label="Zone A (电子区)" value="A" />
            <el-option label="Zone B (五金区)" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item label="报告类型">
          <el-select v-model="filters.type" placeholder="全部类型" style="width: 160px" clearable>
             <el-option label="运营日报" value="DAILY" />
             <el-option label="运营周报" value="WEEKLY" />
             <el-option label="运营月报" value="MONTHLY" />
             <el-option label="优化报告" value="OPTIMIZATION" />
             <el-option label="补货报告" value="REPLENISHMENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
           <el-date-picker 
             v-model="filters.dateRange" 
             type="daterange" 
             range-separator="至" 
             start-placeholder="开始日期" 
             end-placeholder="结束日期" 
             style="width: 260px"
           />
        </el-form-item>
        <el-form-item>
           <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
           <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card">
      <el-table :data="reportList" style="width: 100%" class="custom-table" border>
        <el-table-column prop="id" label="报告ID" width="140" fixed show-overflow-tooltip />
        
        <el-table-column prop="reportCode" label="报告编号" width="160" show-overflow-tooltip />

        <el-table-column prop="type" label="类型" width="120" align="center">
           <template #default="{ row }">
              <el-tag :type="getReportTypeTag(row.type)" effect="dark" size="small">{{ getReportTypeLabel(row.type) }}</el-tag>
           </template>
        </el-table-column>

        <el-table-column prop="title" label="报告标题" min-width="250" show-overflow-tooltip />
        
        <el-table-column prop="status" label="状态" width="100" align="center">
           <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'COMPLETED' ? 'success' : 'info'" effect="plain">
                {{ row.status === 'COMPLETED' ? '已生成' : '生成中' }}
              </el-tag>
           </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="180" align="center" />
        
        <el-table-column label="操作" width="180" fixed="right" align="center">
           <template #default="{ row }">
              <el-button link type="primary" :icon="View" @click="goDetail(row)">查看</el-button>
              <el-button link type="primary" :icon="Download" @click="handleExport(row)">导出</el-button>
           </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

const filters = reactive({
  warehouse: '',
  type: '',
  dateRange: []
});

// 模拟数据 (Strict Mode: 严格对应字段)
const reportList = reactive([
  { 
    id: 'RPT-1001', 
    reportCode: '20240501-D-A', 
    title: '5月1日 Zone A 运营日报', 
    type: 'DAILY', 
    status: 'COMPLETED',
    createTime: '2024-05-01 18:00:00' 
  },
  { 
    id: 'RPT-1002', 
    reportCode: '202404-M-ALL', 
    title: '4月份全仓运营月报', 
    type: 'MONTHLY', 
    status: 'COMPLETED',
    createTime: '2024-05-01 09:00:00' 
  },
  { 
    id: 'RPT-1003', 
    reportCode: 'OPT-20240430-B', 
    title: 'Zone B 空间优化专项报告', 
    type: 'OPTIMIZATION', 
    status: 'COMPLETED',
    createTime: '2024-04-30 14:20:00' 
  },
  { 
    id: 'RPT-1004', 
    reportCode: 'REP-20240428-A', 
    title: 'Zone A 紧急补货建议书', 
    type: 'REPLENISHMENT', 
    status: 'COMPLETED',
    createTime: '2024-04-28 09:15:00' 
  },
]);

// 类型映射
const getReportTypeLabel = (type) => {
  const map = { 
    'DAILY': '运营日报', 
    'WEEKLY': '运营周报', 
    'MONTHLY': '运营月报', 
    'OPTIMIZATION': '优化报告', 
    'REPLENISHMENT': '补货报告' 
  };
  return map[type] || type;
};

const getReportTypeTag = (type) => {
  if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) return 'info';
  if (type === 'OPTIMIZATION') return 'primary';
  if (type === 'REPLENISHMENT') return 'warning';
  return 'info';
};

const handleSearch = () => {
  ElMessage.success('查询已触发');
};

const resetSearch = () => {
  filters.warehouse = '';
  filters.type = '';
  filters.dateRange = [];
};

const goDetail = (row) => {
  // 核心修复：添加 /detail/ 路径段，匹配 router/index.js 中的配置
  router.push(`/reports/detail/${row.id}`);
};

const handleExport = (row) => {
  ElMessage.success(`正在导出报告: ${row.reportCode}`);
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }

/* 搜索卡片 */
.search-card { background: #1d1e1f; border: 1px solid #333; }

/* 暗黑输入框适配 */
:deep(.el-form-item__label) { color: #cfd3dc; padding-right: 8px; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) {
  background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; color: #fff;
}
:deep(.el-input__inner) { color: #fff; }
:deep(.el-range-input) { color: #fff; background: transparent; }
:deep(.el-range-separator) { color: #909399; }

/* 列表卡片 */
.list-card { background: #1d1e1f; border: 1px solid #333; }

/* 表格样式 */
:deep(.el-table) {
  background-color: transparent !important; color: #cfd3dc; --el-table-border-color: #333;
  --el-table-header-bg-color: #262729; --el-table-row-hover-bg-color: #2c3e50;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  border-bottom: 1px solid #333 !important;
  border-right: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; font-weight: bold; }
</style>