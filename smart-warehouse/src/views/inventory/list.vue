<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="物料编码">
          <el-input v-model="searchForm.code" placeholder="请输入编码" clearable />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input v-model="searchForm.name" placeholder="请输入名称" clearable />
        </el-form-item>
        <el-form-item label="仓库/库区">
          <el-select v-model="searchForm.zone" placeholder="全部区域" style="width: 180px">
            <el-option label="A区 (电子区)" value="A" />
            <el-option label="B区 (五金区)" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Download" plain>导出</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="tableData" style="width: 100%" v-loading="loading" class="custom-table">
        <el-table-column prop="code" label="物料编码" width="120" />
        <el-table-column prop="name" label="物料名称" min-width="150" />
        <el-table-column prop="spec" label="规格型号" width="150" />
        <el-table-column prop="stock" label="当前库存" width="120">
          <template #default="{ row }">
            <span :class="getStockClass(row.stock)">{{ row.stock }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column prop="zone" label="所在库区" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
             <el-tag :type="row.status === '正常' ? 'success' : 'danger'" effect="dark" size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewDetail(row)">详情</el-button>
            <el-button link type="primary" :icon="Position">移库</el-button>
            <el-button link type="danger" :icon="Delete">报损</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="100"
          :page-size="10"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
// 关键修复：引入图标组件
import { Search, Refresh, Download, View, Position, Delete } from '@element-plus/icons-vue';

const router = useRouter();
const loading = ref(false);

const searchForm = reactive({
  code: '',
  name: '',
  zone: ''
});

const tableData = reactive([
  { code: 'M-2024001', name: 'STM32 控制芯片', spec: 'LQFP48', stock: 850, unit: 'pcs', zone: 'A区', status: '正常' },
  { code: 'M-2024002', name: '57步进电机', spec: '57HS22', stock: 120, unit: '台', zone: 'B区', status: '正常' },
  { code: 'M-2024003', name: '工业电源', spec: '24V 10A', stock: 15, unit: '台', zone: 'A区', status: '缺货' },
  { code: 'M-2024004', name: 'M4螺丝套装', spec: '304不锈钢', stock: 5000, unit: '包', zone: 'B区', status: '正常' },
]);

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => loading.value = false, 500);
};

const resetSearch = () => {
  searchForm.code = '';
  searchForm.name = '';
  searchForm.zone = '';
};

const viewDetail = (row) => {
  router.push('/inventory/detail');
};

const getStockClass = (val) => {
  if (val < 20) return 'text-danger';
  if (val > 1000) return 'text-warning';
  return 'text-success';
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }

/* 搜索卡片暗黑风 */
.search-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-form-item__label) { color: #cfd3dc; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
}
:deep(.el-input__inner) { color: #fff; }

/* 表格卡片暗黑风 */
.table-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-table), :deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; color: #cfd3dc; border-bottom: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; font-weight: bold;}
:deep(.el-table__inner-wrapper::before) { display: none !important; }

/* 悬停行高亮修复 */
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: #262729 !important;
}

.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
.text-success { color: #67C23A; font-weight: bold; }
.text-danger { color: #F56C6C; font-weight: bold; }
.text-warning { color: #E6A23C; font-weight: bold; }
</style>