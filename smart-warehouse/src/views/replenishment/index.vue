<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select v-model="filters.warehouse" placeholder="全部" style="width: 120px" clearable>
            <el-option label="Zone A" value="A" />
            <el-option label="Zone B" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item label="物料">
          <el-input v-model="filters.keyword" placeholder="编码/名称" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="紧急度">
          <el-select v-model="filters.priority" placeholder="全部" style="width: 100px" clearable>
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" style="width: 100px" clearable>
            <el-option label="待处理" value="PENDING" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="-"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 220px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card">
      <el-table :data="tableData" style="width: 100%" class="custom-table" border>
        <el-table-column prop="id" label="建议ID" width="140" fixed show-overflow-tooltip />
        
        <el-table-column label="物料信息" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div><span class="text-primary font-bold">{{ row.materialCode }}</span></div>
            <div class="sub-text">{{ row.materialName }}</div>
          </template>
        </el-table-column>

        <el-table-column prop="warehouse" label="仓库" width="100" align="center" />

        <el-table-column label="库存概况 (现存/安全)" width="180">
          <template #default="{ row }">
            <div class="stock-compare">
              <span :class="row.currentStock < row.safeStock ? 'text-danger' : ''">{{ row.currentStock }}</span>
              <span class="divider">/</span>
              <span class="text-gray">{{ row.safeStock }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="suggestQty" label="推荐补货量" width="120" align="center">
          <template #default="{ row }">
            <span class="font-bold text-success">+{{ row.suggestQty }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="紧急程度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityTag(row.priority)" effect="dark" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 'PENDING' ? 'warning' : 'info'" effect="plain" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="goDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();

// 筛选数据
const filters = reactive({
  warehouse: '',
  keyword: '',
  priority: '',
  status: '',
  dateRange: []
});

// 模拟数据
const tableData = reactive([
  { 
    id: 'REC-20240501-01', 
    materialCode: 'M-2024003', materialName: '工业电源 24V', 
    warehouse: 'Zone A',
    currentStock: 5, safeStock: 20, suggestQty: 50,
    priority: 'HIGH', status: 'PENDING'
  },
  { 
    id: 'REC-20240501-02', 
    materialCode: 'M-2024012', materialName: 'M3 螺母', 
    warehouse: 'Zone B',
    currentStock: 100, safeStock: 500, suggestQty: 2000,
    priority: 'MEDIUM', status: 'PENDING'
  },
  { 
    id: 'REC-20240428-05', 
    materialCode: 'M-2024001', materialName: 'STM32 控制芯片', 
    warehouse: 'Zone A',
    currentStock: 220, safeStock: 200, suggestQty: 0,
    priority: 'LOW', status: 'COMPLETED'
  },
]);

// 汉化映射
const getPriorityLabel = (val) => {
  const map = { 'HIGH': '高', 'MEDIUM': '中', 'LOW': '低' };
  return map[val] || val;
};

const getPriorityTag = (val) => {
  const map = { 'HIGH': 'danger', 'MEDIUM': 'warning', 'LOW': 'info' };
  return map[val] || 'info';
};

const getStatusLabel = (val) => {
  const map = { 'PENDING': '待处理', 'COMPLETED': '已完成' };
  return map[val] || val;
};

const handleSearch = () => {
  ElMessage.success('查询已触发');
};

const resetSearch = () => {
  filters.warehouse = '';
  filters.keyword = '';
  filters.priority = '';
  filters.status = '';
  filters.dateRange = [];
};

const goDetail = (row) => {
  router.push(`/replenishment/recommendations/${row.id}`);
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }

/* 搜索卡片 - 回归 Inventory 模块的标准样式 */
.search-card { 
  background: #1d1e1f; 
  border: 1px solid #333; 
  /* 移除之前所有的 padding/height/flex 强制样式，使用 Element 默认值 */
}

/* 覆盖输入框背景色 (暗黑模式适配) */
:deep(.el-form-item__label) { color: #cfd3dc; padding-right: 8px; }
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

.text-primary { color: #409EFF; }
.text-danger { color: #F56C6C; }
.text-success { color: #67C23A; }
.text-gray { color: #909399; }
.font-bold { font-weight: bold; }
.sub-text { font-size: 12px; color: #909399; }
.divider { margin: 0 5px; color: #555; }
</style>