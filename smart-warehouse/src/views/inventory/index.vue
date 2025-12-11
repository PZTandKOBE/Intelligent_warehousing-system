<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="物料编码">
          <el-input 
            v-model="searchForm.code" 
            placeholder="请输入编码" 
            :prefix-icon="Search"
            clearable 
          />
        </el-form-item>
        <el-form-item label="物料名称">
          <el-input 
            v-model="searchForm.name" 
            placeholder="请输入名称" 
            :prefix-icon="Search"
            clearable 
          />
        </el-form-item>
        <el-form-item label="仓库/库区">
          <el-select v-model="searchForm.warehouse_id" placeholder="全部区域" style="width: 180px" clearable>
            <el-option 
              v-for="item in warehouseStore.warehouseList"
              :key="item.warehouse_id"
              :label="item.warehouse_name"
              :value="item.warehouse_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Download" plain>导出报表</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table :data="inventoryList" style="width: 100%" class="custom-table" v-loading="loading">
        <el-table-column prop="materialCode" label="物料编码" width="140" fixed />
        <el-table-column prop="materialName" label="物料名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="spec" label="规格型号" width="120" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100" />
        
        <el-table-column label="库存状态 (可视化)" width="240">
          <template #default="{ row }">
            <div class="stock-info">
              <span>现存: <span class="highlight-num">{{ row.currentQty }}</span></span>
              <el-divider direction="vertical" />
              <span class="sub-text">可用: {{ row.availableQty }}</span>
            </div>
            <el-progress 
              :percentage="calculateStockPercent(row)" 
              :status="getStockStatus(row)" 
              :stroke-width="8" 
              :show-text="false"
              class="mt-5"
            />
          </template>
        </el-table-column>

        <el-table-column prop="unit" label="单位" width="70" align="center" />
        <el-table-column prop="location" label="推荐库位" width="120" />
        
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleDetail(row)">详情</el-button>
            <el-button link type="warning" :icon="Histogram" @click="handleHistory(row)">流水</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-20">
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Download, View, Histogram } from '@element-plus/icons-vue';
import { useWarehouseStore } from '@/stores/warehouse'; // ✅ 引入 Store

const router = useRouter();
const warehouseStore = useWarehouseStore();
const loading = ref(false);

// 搜索表单数据
const searchForm = reactive({
  code: '',
  name: '',
  warehouse_id: '' // 保持与后端参数一致
});

// 模拟数据 (后续可替换为 api/inventory.js 中的 getInventoryList)
const inventoryList = reactive([
  { materialCode: 'M-1001', materialName: '32位微控制器', spec: 'STM32F103', category: '电子元器件', currentQty: 1500, availableQty: 1450, maxStock: 2000, unit: 'pcs', location: 'A-01-02' },
  { materialCode: 'M-1002', materialName: '工业级继电器', spec: '24V DC', category: '电气件', currentQty: 230, availableQty: 230, maxStock: 500, unit: '个', location: 'B-03-11' },
  { materialCode: 'M-1003', materialName: '伺服电机', spec: '400W 3000rpm', category: '动力件', currentQty: 12, availableQty: 5, maxStock: 50, unit: '台', location: 'C-01-01' },
  { materialCode: 'M-1004', materialName: 'M4不锈钢螺丝', spec: 'M4*12', category: '标准件', currentQty: 48000, availableQty: 48000, maxStock: 50000, unit: '颗', location: 'D-05-05' },
  { materialCode: 'M-1005', materialName: 'PLC控制模块', spec: 'FX3U-32MT', category: '控制器', currentQty: 45, availableQty: 40, maxStock: 100, unit: '套', location: 'A-02-01' },
]);

onMounted(() => {
  // ✅ 挂载时获取仓库列表
  warehouseStore.fetchWarehouses();
});

const calculateStockPercent = (row) => {
  if (!row.maxStock) return 0;
  let percent = (row.currentQty / row.maxStock) * 100;
  return percent > 100 ? 100 : percent;
};

const getStockStatus = (row) => {
  if (!row.maxStock) return 'success';
  const percent = row.currentQty / row.maxStock;
  if (percent < 0.2) return 'exception'; 
  if (percent > 0.9) return 'warning';  
  return 'success';                      
};

const handleSearch = () => {
  loading.value = true;
  console.log('Search params:', searchForm);
  setTimeout(() => loading.value = false, 500);
};

const resetSearch = () => {
  searchForm.code = '';
  searchForm.name = '';
  searchForm.warehouse_id = '';
};

const handleDetail = (row) => {
  router.push(`/inventory/detail/${row.materialCode}`);
};

const handleHistory = (row) => {
  console.log('查看流水', row);
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.mt-5 { margin-top: 5px; }

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

/* 悬停行高亮 */
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background-color: #262729 !important;
}

/* 库存信息文字 */
.stock-info { font-size: 13px; color: #909399; display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;}
.highlight-num { color: #409EFF; font-weight: bold; }
.sub-text { color: #67C23A; }

/* 分页暗黑化 */
.pagination-container { display: flex; justify-content: flex-end; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
</style>