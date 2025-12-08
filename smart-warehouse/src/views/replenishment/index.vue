<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select v-model="filters.warehouse_id" placeholder="全部" style="width: 120px" clearable>
            <el-option label="Zone A" :value="1" />
            <el-option label="Zone B" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品ID">
          <el-input v-model="filters.goods_id" placeholder="输入ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="紧急度">
          <el-select v-model="filters.urgency" placeholder="全部" style="width: 100px" clearable>
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="custom-table" 
        border 
        v-loading="loading"
      >
        <el-table-column prop="recommendation_id" label="建议ID" width="100" fixed show-overflow-tooltip />
        
        <el-table-column label="物料信息" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            <div><span class="text-primary font-bold">{{ row.goods_code || `ID: ${row.goods_id}` }}</span></div>
            <div class="sub-text">{{ row.goods_name || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="仓库" width="100" align="center">
          <template #default="{ row }">
            {{ getWarehouseName(row.warehouse_id) }}
          </template>
        </el-table-column>

        <el-table-column label="库存概况 (现存/安全)" width="180">
          <template #default="{ row }">
            <div class="stock-compare">
              <span :class="row.current_stock < row.safety_stock ? 'text-danger' : ''">{{ row.current_stock }}</span>
              <span class="divider">/</span>
              <span class="text-gray">{{ row.safety_stock }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="recommended_quantity" label="推荐补货量" width="120" align="center">
          <template #default="{ row }">
            <span class="font-bold text-success">+{{ row.recommended_quantity }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="urgency" label="紧急程度" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getUrgencyTag(row.urgency)" effect="dark" size="small">
              {{ getUrgencyLabel(row.urgency) }}
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

      <div class="pagination-container mt-20" style="display:flex; justify-content:flex-end; padding-top:10px;">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="filters.page_size"
          v-model:current-page="filters.page"
          @current-change="loadData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { getReplenishmentList } from '@/api/replenishment';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const tableData = ref([]);

// 筛选数据
const filters = reactive({
  warehouse_id: '',
  goods_id: '',
  urgency: '',
  page: 1,
  page_size: 10
});

const getWarehouseName = (id) => {
  const map = { 1: 'Zone A', 2: 'Zone B' };
  return map[id] || `WH-${id}`;
};

const getUrgencyLabel = (val) => {
  const map = { 'HIGH': '高', 'MEDIUM': '中', 'LOW': '低' };
  return map[val] || val;
};

const getUrgencyTag = (val) => {
  const map = { 'HIGH': 'danger', 'MEDIUM': 'warning', 'LOW': 'info' };
  return map[val] || 'info';
};

const getStatusLabel = (val) => {
  const map = { 'PENDING': '待处理', 'COMPLETED': '已完成' };
  return map[val] || val;
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: filters.page,
      page_size: filters.page_size,
      warehouse_id: filters.warehouse_id || undefined,
      goods_id: filters.goods_id || undefined,
      urgency: filters.urgency || undefined
    };
    
    const res = await getReplenishmentList(params);
    if (res.code === 200) {
      tableData.value = res.data.items;
      total.value = res.data.total;
    }
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  filters.page = 1;
  loadData();
};

const resetSearch = () => {
  filters.warehouse_id = '';
  filters.goods_id = '';
  filters.urgency = '';
  handleSearch();
};

const goDetail = (row) => {
  // 注意：使用 recommendation_id
  router.push(`/replenishment/recommendations/${row.recommendation_id}`);
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 样式保留 */
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.search-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-form-item__label) { color: #cfd3dc; padding-right: 8px; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
  color: #fff;
}
:deep(.el-input__inner) { color: #fff; }
.list-card { background: #1d1e1f; border: 1px solid #333; }
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
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
</style>