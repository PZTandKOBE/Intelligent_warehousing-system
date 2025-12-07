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
        <el-form-item label="方案日期">
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
      <el-table :data="planList" style="width: 100%" class="custom-table" border>
        <el-table-column prop="planCode" label="方案编号" width="180" fixed show-overflow-tooltip />
        
        <el-table-column prop="warehouse" label="仓库" width="120" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" type="info">{{ row.warehouse }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="name" label="任务名称" min-width="180" show-overflow-tooltip />

        <el-table-column prop="type" label="优化类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getPlanTypeTag(row.type)">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createTime" label="创建时间" width="170" />
        
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <span class="status-dot" :class="row.statusClass"></span> {{ row.status }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="goDetail(row)">查看详情</el-button>
            <el-button link type="primary" :icon="Download" @click="handleExport(row)">导出方案</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

// 筛选数据
const filters = reactive({
  warehouse: '',
  dateRange: []
});

// 列表数据
const planList = reactive([
  { 
    planCode: 'OPT-20240501-A', 
    name: 'Zone A 紧急入库推荐', 
    warehouse: 'Zone A',
    type: 'inbound', typeLabel: '入库推荐', 
    createTime: '2024-05-01 09:30', 
    status: '待执行', statusClass: 'warning' 
  },
  { 
    planCode: 'OPT-20240428-B', 
    name: '月底五金区碎片整理', 
    warehouse: 'Zone B',
    type: 'organize', typeLabel: '库内整理', 
    createTime: '2024-04-28 14:15', 
    status: '执行中', statusClass: 'processing' 
  },
  { 
    planCode: 'OPT-20240415-C', 
    name: 'Q1 呆滞品移库建议', 
    warehouse: 'Zone C',
    type: 'stagnant', typeLabel: '呆滞清理', 
    createTime: '2024-04-15 10:00', 
    status: '已完成', statusClass: 'success' 
  },
]);

const getPlanTypeTag = (type) => {
  if (type === 'inbound') return 'primary';
  if (type === 'organize') return 'warning';
  return 'danger';
};

const handleSearch = () => {
  ElMessage.success('列表已刷新 (Search)');
};

const resetSearch = () => {
  filters.warehouse = '';
  filters.dateRange = [];
};

const goDetail = (row) => {
  router.push(`/optimization/plans/${row.planCode}`);
};

const handleExport = (row) => {
  ElMessage.success(`正在导出方案: ${row.planCode}`);
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }

/* 搜索卡片 */
.search-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-form-item__label) { color: #cfd3dc; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
  color: #fff;
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

/* 状态点 */
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
.status-dot.warning { background: #E6A23C; }
.status-dot.processing { background: #409EFF; box-shadow: 0 0 4px #409EFF; animation: pulse 2s infinite; }
.status-dot.success { background: #67C23A; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}
</style>