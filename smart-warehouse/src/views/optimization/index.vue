<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select 
            v-model="filters.warehouse_id" 
            placeholder="全部仓库" 
            style="width: 160px" 
            clearable
          >
            <el-option 
              v-for="item in warehouseStore.warehouseList"
              :key="item.warehouse_id"
              :label="item.warehouse_name"
              :value="item.warehouse_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" style="width: 160px" clearable>
            <el-option label="待执行" value="PENDING" />
            <el-option label="执行中" value="EXECUTING" />
            <el-option label="已完成" value="COMPLETED" />
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
        :data="planList" 
        style="width: 100%" 
        class="custom-table" 
        border 
        v-loading="loading"
      >
        <el-table-column prop="plan_code" label="方案编号" width="180" fixed show-overflow-tooltip />
        
        <el-table-column label="仓库" width="120" align="center">
          <template #default="{ row }">
            <el-tag effect="plain" type="info">{{ getWarehouseName(row.warehouse_id) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="任务名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getOptimizationTypeLabel(row.optimization_type) }} - {{ row.plan_code }}
          </template>
        </el-table-column>

        <el-table-column prop="optimization_type" label="优化类型" width="120" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getPlanTypeTag(row.optimization_type)">
              {{ getOptimizationTypeLabel(row.optimization_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="170" />
        
        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <span class="status-dot" :class="getStatusClass(row.status)"></span> 
            {{ getStatusLabel(row.status) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
              <el-button link type="primary" :icon="View" @click="goDetail(row)">查看详情</el-button>
              <el-button link type="primary" :icon="Download" @click="handleExport(row)"
                :disabled="row.status !== 'COMPLETED'" :title="row.status !== 'COMPLETED' ? '方案执行完成后方可导出报告' : ''">
                导出方案
              </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-20" style="display:flex; justify-content:flex-end;">
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
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getOptimizationPlans, getOptimizationPlanReport } from '@/api/optimization';
import { exportReport } from '@/api/report'; 
import { downloadFileFromUrl } from '@/utils/exportReport'; 
import { useWarehouseStore } from '@/stores/warehouse'; // ✅ 引入 Store

const router = useRouter();
const warehouseStore = useWarehouseStore(); // ✅ 初始化 Store

const loading = ref(false);
const total = ref(0);
const planList = ref([]);

const filters = reactive({
  warehouse_id: '',
  status: '',
  page: 1,
  page_size: 10
});

// ✅ 修改：从 Store 获取名称
const getWarehouseName = (id) => {
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

const getOptimizationTypeLabel = (type) => {
  const map = { 'FULL': '全量优化', 'PARTIAL': '局部优化', 'INBOUND': '入库推荐', 'ORGANIZE': '库内整理' };
  return map[type] || type;
};

const getPlanTypeTag = (type) => {
  if (['FULL', 'INBOUND'].includes(type)) return 'primary';
  if (['PARTIAL', 'ORGANIZE'].includes(type)) return 'warning';
  return 'info';
};

const getStatusLabel = (status) => {
  const map = { 'PENDING': '待执行', 'EXECUTING': '执行中', 'COMPLETED': '已完成', 'FAILED': '失败' };
  return map[status] || status;
};

const getStatusClass = (status) => {
  if (status === 'EXECUTING') return 'processing';
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'danger';
  return 'warning';
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: filters.page,
      page_size: filters.page_size,
      warehouse_id: filters.warehouse_id || undefined,
      status: filters.status || undefined
    };
    const res = await getOptimizationPlans(params);
    if (res.code === 200) {
      planList.value = res.data.items;
      total.value = res.data.total;
    }
  } catch (err) {
    console.error(err);
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
  filters.status = '';
  handleSearch();
};

const goDetail = (row) => {
  router.push(`/optimization/plans/${row.plan_id}`);
};

// src/views/optimization/index.vue

const handleExport = async (row) => {
  try {
    ElMessage.info('正在获取方案报告...');
    const detailRes = await getOptimizationPlanReport(row.plan_id);
    
    // 🔍 调试：你可以打印一下看看结构
    console.log('报告详情返回:', detailRes);

    // 🔴 [修改点 1]：修正判断逻辑
    // 原代码：if (detailRes.code !== 200 || !detailRes.data.report || !detailRes.data.report.report_id) {
    // 新代码：直接检查 data 下是否有 report_id (兼容 flat 结构)
    // 为了稳健，我们同时兼容“有 report 对象”和“无 report 对象”两种情况
    const reportData = detailRes.data.report || detailRes.data; // 优先取 report，取不到就取 data 本身

    if (detailRes.code !== 200 || !reportData || !reportData.report_id) {
      ElMessage.warning('该方案尚未生成分析报告，无法导出');
      return;
    }

    // 🔴 [修改点 2]：获取正确的 ID
    const reportId = reportData.report_id;

    ElMessage.info('正在请求下载链接...');
    const exportRes = await exportReport(reportId, 'PDF');
    
    if (exportRes.code === 200 && exportRes.data.download_url) {
      downloadFileFromUrl(exportRes.data.download_url);
    } else {
      ElMessage.warning('后端未返回有效的下载链接');
    }

  } catch (error) {
    console.error('导出流程失败:', error);
    ElMessage.error('导出失败，请检查网络或后端服务');
  }
};

onMounted(() => {
  // ✅ 加载仓库
  warehouseStore.fetchWarehouses();
  loadData();
});
</script>

<style scoped>
/* 样式保持不变 */
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.search-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-form-item__label) { color: #cfd3dc; }
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
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
.status-dot.warning { background: #E6A23C; }
.status-dot.processing { background: #409EFF; box-shadow: 0 0 4px #409EFF; animation: pulse 2s infinite; }
.status-dot.success { background: #67C23A; }
.status-dot.danger { background: #F56C6C; }
@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
</style>