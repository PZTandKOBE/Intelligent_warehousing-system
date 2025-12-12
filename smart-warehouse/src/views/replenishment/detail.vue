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
        
        <el-descriptions-item label="所属仓库">{{ recData.warehouse_name || getWarehouseName(recData.warehouse_id) }}</el-descriptions-item>
        
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
import { useWarehouseStore } from '@/stores/warehouse';
import { getReplenishmentReport } from '@/api/replenishment'; 
// 🔴 注意：不再需要 getInventoryDetail 了，因为我们直接从父页面拿 ID
import { exportReport } from '@/api/report';
import { downloadFileFromUrl } from '@/utils/exportReport';

const route = useRoute();
const warehouseStore = useWarehouseStore();
const recId = route.params.id;

const loading = ref(false);
const recData = ref({});    
const reportData = ref({}); 

// --- Helper Functions ---

const getWarehouseName = (id) => {
  if (!id) return '-';
  // 确保类型匹配 (路由传过来的是字符串，store里通常是数字)
  const targetId = Number(id);
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === targetId);
  return found ? found.warehouse_name : `WH-${id}`;
};

const getUrgencyType = (urgency) => {
  if (urgency === 'HIGH' || urgency === 'CRITICAL') return 'danger';
  if (urgency === 'MEDIUM') return 'warning';
  return 'info';
};

const getUrgencyLabel = (urgency) => {
  const map = { 'CRITICAL': '极高', 'HIGH': '紧急', 'MEDIUM': '一般', 'LOW': '低' };
  return map[urgency] || urgency || '-';
};

// --- API Calls ---

const loadData = async () => {
  if (!recId) {
    ElMessage.error('参数错误：未获取到建议ID');
    return;
  }
  
  loading.value = true;
  try {
    const res = await getReplenishmentReport(recId);
    
    if (res.code === 200) {
      const flatData = res.data || {};
      reportData.value = flatData.report || flatData;

      let tempRecData = {};
      
      // 兼容各种后端结构
      if (flatData.recommendation) {
        tempRecData = flatData.recommendation;
      } else if (flatData.content_json) {
        tempRecData = {
          ...flatData.content_json,
          status: flatData.status
        };
      } else {
        tempRecData = flatData;
      }

      // 🟢 核心修改：父传子逻辑
      // 如果后端没返回 warehouse_id，就优先用路由参数里的 ID
      if (!tempRecData.warehouse_id && route.query.warehouse_id) {
        tempRecData.warehouse_id = Number(route.query.warehouse_id);
      }

      recData.value = tempRecData;

    } else {
      ElMessage.warning(res.message || '获取详情失败');
    }
  } catch (err) {
    console.error('API Error:', err);
    ElMessage.error('数据加载失败，请检查网络');
  } finally {
    loading.value = false;
  }
};

const handleExport = async () => {
  const targetId = reportData.value.report_id || reportData.value.id;
  
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
  if (warehouseStore.warehouseList.length === 0) {
    warehouseStore.fetchWarehouses();
  }
  loadData();
});
</script>

<style scoped>
/* 样式部分保持不变，直接用之前的即可 */
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mr-5 { margin-right: 5px; }
.font-bold { font-weight: bold; }
.text-primary { color: #409EFF; }
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }
.iframe-container { width: 100%; height: 800px; background-color: #fff; border-radius: 4px; overflow: hidden; }
.report-iframe { width: 100%; height: 100%; border: none; display: block; }
</style>