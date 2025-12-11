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
             value-format="YYYY-MM-DD"
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
      <el-table 
        :data="reportList" 
        style="width: 100%" 
        class="custom-table" 
        border 
        v-loading="loading"
      >
        <el-table-column prop="report_id" label="报告ID" width="100" fixed show-overflow-tooltip />
        
        <el-table-column prop="report_code" label="报告编号" width="160" show-overflow-tooltip />

        <el-table-column prop="report_type" label="类型" width="120" align="center">
           <template #default="{ row }">
              <el-tag :type="getReportTypeTag(row.report_type)" effect="dark" size="small">
                {{ getReportTypeLabel(row.report_type) }}
              </el-tag>
           </template>
        </el-table-column>

        <el-table-column prop="title" label="报告标题" min-width="250" show-overflow-tooltip />
        
        <el-table-column prop="status" label="状态" width="100" align="center">
           <template #default="{ row }">
              <el-tag size="small" :type="row.status === 'COMPLETED' ? 'success' : 'info'" effect="plain">
                {{ row.status === 'COMPLETED' ? '已生成' : (row.status || '生成中') }}
              </el-tag>
           </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" width="180" align="center" />
        
        <el-table-column label="操作" width="180" fixed="right" align="center">
           <template #default="{ row }">
              <el-button link type="primary" :icon="View" @click="goDetail(row)">查看</el-button>
              <el-button 
                link 
                type="primary" 
                :icon="Download" 
                @click="handleExport(row)"
                :loading="row.downloading"
              >
                下载
              </el-button>
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
import { Search, Refresh, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getReportList, exportReport } from '@/api/report';
import { downloadFileFromUrl } from '@/utils/exportReport';
import { useWarehouseStore } from '@/stores/warehouse'; // ✅ 引入 Store

const router = useRouter();
const warehouseStore = useWarehouseStore(); // ✅ 初始化 Store

const loading = ref(false);
const total = ref(0);
const reportList = ref([]);

const filters = reactive({
  warehouse_id: '',
  type: '',
  dateRange: [],
  page: 1,
  page_size: 10
});

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

const loadData = async () => {
  loading.value = true;
  try {
    let start_date, end_date;
    if (filters.dateRange && filters.dateRange.length === 2) {
      start_date = filters.dateRange[0];
      end_date = filters.dateRange[1];
    }

    const params = {
      page: filters.page,
      page_size: filters.page_size,
      type: filters.type || undefined,
      start_date,
      end_date
      // warehouse_id: filters.warehouse_id // 如后端支持则可解开注释
    };

    const res = await getReportList(params);
    if (res.code === 200) {
      reportList.value = res.data.items.map(item => ({
        ...item,
        downloading: false
      }));
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
  filters.type = '';
  filters.dateRange = [];
  handleSearch();
};

const goDetail = (row) => {
  router.push(`/reports/detail/${row.report_id}`);
};

const handleExport = async (row) => {
  if (row.downloading) return;
  row.downloading = true;

  try {
    ElMessage.info('正在请求下载链接...');
    const res = await exportReport(row.report_id, 'PDF');
    
    if (res.code === 200 && res.data && res.data.download_url) {
      downloadFileFromUrl(res.data.download_url);
    } else {
      ElMessage.warning('后端未返回有效的下载链接');
    }
  } catch (error) {
    console.error('下载失败:', error);
    ElMessage.error('导出请求失败');
  } finally {
    row.downloading = false;
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
:deep(.el-form-item__label) { color: #cfd3dc; padding-right: 8px; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) {
  background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; color: #fff;
}
:deep(.el-input__inner) { color: #fff; }
:deep(.el-range-input) { color: #fff; background: transparent; }
:deep(.el-range-separator) { color: #909399; }
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
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
</style>