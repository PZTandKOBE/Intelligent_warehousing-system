<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">补货建议详情</span>
      </template>
      <template #extra>
        <el-button type="primary" :icon="Download" @click="handleExport">导出补货报告</el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📋 建议概要 (Summary)</div>
      </template>
      <el-descriptions :column="3" border class="custom-desc">
        <el-descriptions-item label="关联物料ID">{{ recData.goods_id || '-' }}</el-descriptions-item>
        
        <el-descriptions-item label="所属仓库">{{ getWarehouseName(recData.warehouse_id) }}</el-descriptions-item>
        
        <el-descriptions-item label="建议补货量">
          <span class="text-primary font-bold">{{ recData.recommended_quantity || 0 }}</span>
        </el-descriptions-item>
        
        <el-descriptions-item label="当前库存">{{ recData.current_stock || 0 }}</el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ recData.safety_stock || 0 }}</el-descriptions-item>
        
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyType(recData.urgency)" effect="dark" size="small">
            {{ getUrgencyLabel(recData.urgency) }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="预测天数">{{ recData.prediction_days || '-' }} 天</el-descriptions-item>
        <el-descriptions-item label="状态">{{ recData.status || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never" class="detail-card mb-20" id="report-area">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><Document /></el-icon> 补货分析报告</span>
            </div>
          </template>
          
          <div class="iframe-container" v-if="reportData.content_html">
            <iframe 
              :srcdoc="reportData.content_html" 
              class="report-iframe"
              width="100%"
              height="100%"
            ></iframe>
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

// 🟢 1. 引入 Store (解决 getWarehouseName 报错的关键)
import { useWarehouseStore } from '@/stores/warehouse';

// 🟢 2. 引入 API (请确保你在 api/replenishment.js 里定义了 getReplenishmentReport)
// 如果没有这个文件，请看代码下方的“补充说明”
import { getReplenishmentReport } from '@/api/replenishment'; 
import { exportReport } from '@/api/report';
import { downloadFileFromUrl } from '@/utils/exportReport';

const route = useRoute();
const warehouseStore = useWarehouseStore(); // 初始化 store
const recId = route.params.id; // 获取路由里的 id

const loading = ref(false);
const recData = ref({});    // 建议详情数据
const reportData = ref({}); // 报告内容数据

// --- Helper Functions (修复报错的核心) ---

// 1. 获取仓库名称
const getWarehouseName = (id) => {
  if (!id) return '-';
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

// 2. 紧急程度标签颜色
const getUrgencyType = (urgency) => {
  if (urgency === 'HIGH') return 'danger';
  if (urgency === 'MEDIUM') return 'warning';
  return 'info';
};

// 3. 紧急程度中文翻译
const getUrgencyLabel = (urgency) => {
  const map = { 'HIGH': '紧急', 'MEDIUM': '一般', 'LOW': '低' };
  return map[urgency] || urgency;
};

// --- API Calls ---

const loadData = async () => {
  if (!recId) {
    ElMessage.error('参数错误：未获取到建议ID');
    return;
  }
  
  loading.value = true;
  try {
    // 调用 API 获取详情
    const res = await getReplenishmentReport(recId);
    
    if (res.code === 200) {
      // 结构通常是: data: { recommendation: {...}, report: {...} }
      recData.value = res.data.recommendation || {};
      reportData.value = res.data.report || {};
    } else {
      ElMessage.warning(res.message || '获取详情失败');
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
    ElMessage.warning('该建议尚未生成报告，无法导出');
    return;
  }

  try {
    ElMessage.info('正在请求下载...');
    const res = await exportReport(targetId, 'PDF');
    if (res.code === 200 && res.data && res.data.download_url) {
      downloadFileFromUrl(res.data.download_url);
    } else {
      ElMessage.warning('后端未返回有效的下载链接');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('导出请求失败');
  }
};

onMounted(() => {
  // 确保仓库列表已加载
  if (warehouseStore.warehouseList.length === 0) {
    warehouseStore.fetchWarehouses();
  }
  loadData();
});
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mr-5 { margin-right: 5px; }
.font-bold { font-weight: bold; }

/* 文本颜色 */
.text-primary { color: #409EFF; }

.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }

.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }

/* 描述列表适配深色模式 */
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }

/* Iframe 容器样式 (解决白屏/闪烁/样式污染) */
.iframe-container {
  width: 100%;
  height: 800px;
  background-color: #fff;
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