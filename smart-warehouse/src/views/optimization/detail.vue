<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">方案详情: {{ planData.plan_code || '-' }}</span>
      </template>
      <template #extra>
        <el-button type="primary" :icon="Download" @click="handleExport">导出方案报告</el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📋 方案概要 (Summary)</div>
      </template>
      <el-descriptions :column="3" border class="custom-desc">
        <el-descriptions-item label="方案编号">{{ planData.plan_code || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报告标题">{{ reportData.title || '未生成标题' }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ getWarehouseName(planData.warehouse_id) }}</el-descriptions-item>
        
        <el-descriptions-item label="创建人">System AI</el-descriptions-item>
        <el-descriptions-item label="生成时间">{{ planData.created_at || '-' }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="planData.status === 'PENDING' ? 'warning' : 'success'" effect="dark" size="small">
            {{ getStatusLabel(planData.status) }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never" class="detail-card mb-20" id="report-area">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><Document /></el-icon> 智能分析报告</span>
            </div>
          </template>
          <div v-if="reportData.content_html" class="report-html-content" v-html="reportData.content_html"></div>
          <el-empty v-else description="暂无报告内容" />
        </el-card>
      </el-col>
    </el-row>
    
    <el-card shadow="never" class="detail-card">
      <template #header>
        <div class="card-header">
          <span><el-icon class="mr-5"><List /></el-icon> 执行任务序列</span>
        </div>
      </template>
      <el-table :data="taskList" style="width: 100%" class="custom-table" border>
        <el-table-column prop="task_code" label="任务编号" width="140" />
        <el-table-column label="物料ID" width="100" prop="goods_id" align="center" />
        
        <el-table-column prop="quantity" label="数量" width="100" align="center" />
        
        <el-table-column label="移库路径" min-width="200">
          <template #default="{ row }">
            <span>{{ row.from_storage_code || '暂存区' }}</span>
            <el-icon class="mx-2"><Right /></el-icon>
            <span class="text-primary">{{ row.to_storage_code }}</span>
          </template>
        </el-table-column>

        <el-table-column label="优先级" width="100" align="center">
          <template #default>
            <el-tag type="info" effect="plain" size="small">Normal</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="120" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container mt-20" style="display:flex; justify-content:flex-end; padding-top:10px;">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="taskTotal"
          :page-size="10"
          @current-change="loadTasks"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document, List, Right } from '@element-plus/icons-vue';
// 替换引入
import { downloadFileFromUrl } from '@/utils/exportReport';
import { getOptimizationPlanReport, getOptimizationPlanTasks } from '@/api/optimization';
// 引入导出 API (复用 report 模块的接口)
import { exportReport } from '@/api/report';
import { ElMessage } from 'element-plus';

// ... (变量定义和 helper 函数保持不变) ...
const route = useRoute();
const planId = route.params.id;
const loading = ref(false);
const planData = ref({});
const reportData = ref({}); // 这里面应该有 report_id
const taskList = ref([]);
const taskTotal = ref(0);

const loadData = async () => {
  if (!planId) return;
  loading.value = true;
  try {
    const reportRes = await getOptimizationPlanReport(planId);
    if (reportRes.code === 200) {
      planData.value = reportRes.data.plan || {};
      // ⚠️ 关键：确保拿到 report 对象里的 report_id
      reportData.value = reportRes.data.report || {};
    }
    await loadTasks(1);
  } catch (err) {
    console.error(err);
    ElMessage.error('数据加载失败');
  } finally {
    loading.value = false;
  }
};

// ... (loadTasks 保持不变) ...

// ✅ 修改：对接后端导出
const handleExport = async () => {
  // 优先使用 reportData 中的 report_id
  const targetId = reportData.value.report_id;
  
  if (!targetId) {
    ElMessage.warning('该方案尚未生成报告，无法导出');
    return;
  }

  try {
    ElMessage.info('正在请求下载...');
    const res = await exportReport(targetId, 'PDF');
    if (res.code === 200 && res.data && res.data.download_url) {
      downloadFileFromUrl(res.data.download_url);
    } else {
      ElMessage.warning('暂无下载链接');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('导出请求失败');
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
/* 样式保留 */
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mx-2 { margin: 0 8px; }
.mr-5 { margin-right: 5px; }
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }
.text-primary { color: #409EFF; }
.text-gray { color: #909399; }
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }
.report-html-content { line-height: 1.8; color: #cfd3dc; padding: 10px; }
:deep(strong) { color: #409EFF; }
:deep(ul) { padding-left: 20px; }
:deep(li) { margin-bottom: 8px; }
:deep(.el-table) {
  background-color: transparent !important; color: #cfd3dc; --el-table-border-color: #333;
  --el-table-header-bg-color: #262729; --el-table-row-hover-bg-color: #2c3e50;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  border-bottom: 1px solid #333 !important;
  border-right: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
</style>