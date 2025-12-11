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
          <div class="iframe-container" v-if="reportData.content_html">
            <iframe :srcdoc="reportData.content_html" class="report-iframe" width="100%" height="100%"></iframe>
          </div>
          <el-empty v-else description="暂无报告内容" />
        </el-card>
      </el-col>
    </el-row>
    
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useWarehouseStore } from '@/stores/warehouse';
import { downloadFileFromUrl } from '@/utils/exportReport';
import { getOptimizationPlanReport } from '@/api/optimization'; // 删除了 tasks 接口引用
import { exportReport } from '@/api/report';

const route = useRoute();
const warehouseStore = useWarehouseStore();
const planId = route.params.id;

const loading = ref(false);
const planData = ref({});
const reportData = ref({});

// --- Helper Functions ---

const getWarehouseName = (id) => {
  if (!id) return '-';
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

const getStatusLabel = (status) => {
  const map = { 'PENDING': '待执行', 'EXECUTING': '执行中', 'COMPLETED': '已完成', 'FAILED': '失败' };
  return map[status] || status;
};

// --- API Calls ---

// 只加载详情和报告，不再加载任务
const loadData = async () => {
  if (!planId) {
    ElMessage.error('参数错误：未获取到方案ID');
    return;
  }
  
  loading.value = true;
  try {
    const reportRes = await getOptimizationPlanReport(planId);
    
    if (reportRes.code === 200) {
      // 🟢 修复点 1：直接把返回的 data 赋值给 reportData
      const rawData = reportRes.data || {};
      reportData.value = rawData; 

      // 🟢 修复点 2：手动构造 planData
      // 因为接口只返回了报告信息，我们需要从 content_json 或 report 字段里拼凑出方案信息用于头部展示
      const planInfo = rawData.content_json || {};
      
      planData.value = {
        plan_id: rawData.plan_id,
        // 优先从 content_json 里取 plan_code，没有的话用 report_code 顶替
        plan_code: planInfo.plan_code || rawData.report_code, 
        warehouse_id: planInfo.warehouse_id,
        status: rawData.status, // 这里的 status 是报告状态 (PUBLISHED)
        created_at: rawData.created_at
      };
      
    } else {
      ElMessage.warning(reportRes.message || '获取方案详情失败');
    }
    
  } catch (err) {
    console.error(err);
    ElMessage.error('数据加载失败，请检查网络');
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
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
  if (warehouseStore.warehouseList.length === 0) {
    warehouseStore.fetchWarehouses();
  }
  loadData();
});
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mr-5 {
  margin-right: 5px;
}

.custom-header {
  background: #1d1e1f;
  padding: 15px;
  border: 1px solid #333;
}

:deep(.el-page-header__content) {
  color: #fff;
}

.detail-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #cfd3dc;
}

.card-header {
  font-weight: bold;
  color: #fff;
}

:deep(.custom-desc .el-descriptions__label) {
  background: #262729 !important;
  color: #909399;
  width: 120px;
}

:deep(.custom-desc .el-descriptions__content) {
  background: #1d1e1f !important;
  color: #fff;
}

.report-html-content {
  line-height: 1.8;
  color: #cfd3dc;
  padding: 10px;
}

:deep(strong) {
  color: #409EFF;
}

:deep(ul) {
  padding-left: 20px;
}

:deep(li) {
  margin-bottom: 8px;
}

.iframe-container {
  width: 100%;
  height: 800px; /* 或者使用 min-height: 60vh */
  background-color: #fff; /* iframe 内部通常是白底文件，给个背景避免加载闪烁 */
  border-radius: 4px;
  overflow: hidden;
}

.report-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>