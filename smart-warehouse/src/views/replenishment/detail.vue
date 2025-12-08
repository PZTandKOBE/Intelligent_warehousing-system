<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <div class="header-content">
          <span class="title">建议详情: {{ recId }}</span>
        </div>
      </template>
      <template #extra>
         <el-button type="primary" :icon="Download" @click="handleExport">导出报告</el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📋 补货建议概要 (Summary)</div>
      </template>
      <el-descriptions :column="4" border class="custom-desc">
        <el-descriptions-item label="商品ID">
          <span class="text-primary font-bold">{{ recData.goods_id }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ getWarehouseName(recData.warehouse_id) }}</el-descriptions-item>
        
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getUrgencyTag(recData.urgency)" effect="dark">
            {{ getUrgencyLabel(recData.urgency) }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="处理状态">
          <el-tag :type="recData.status === 'PENDING' ? 'warning' : 'info'" effect="plain">
            {{ getStatusLabel(recData.status) }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="当前库存">
          <span :class="recData.current_stock < recData.safety_stock ? 'text-danger font-bold' : ''">
            {{ recData.current_stock }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ recData.safety_stock }}</el-descriptions-item>
        <el-descriptions-item label="库存缺口">
          <span class="text-danger">-{{ calculateGap(recData) }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="推荐数量">
          <span class="text-success font-bold">+{{ recData.recommended_quantity }}</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20">
       <el-col :span="24">
          <el-card shadow="never" class="detail-card" id="rep-report">
             <template #header>
               <div class="card-header">
                  <span><el-icon class="mr-5"><Document /></el-icon> 智能补货分析报告</span>
               </div>
             </template>
             <div v-if="reportData.content_html" class="html-content" v-html="reportData.content_html"></div>
             <el-empty v-else description="暂无分析报告" />
          </el-card>
       </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document, Message } from '@element-plus/icons-vue';
// 替换引入
import { downloadFileFromUrl } from '@/utils/exportReport';
import { getReplenishmentReport } from '@/api/replenishment';
// 引入导出 API
import { exportReport } from '@/api/report';
import { ElMessage } from 'element-plus';

// ... (变量定义和 helper 函数保持不变) ...
const route = useRoute();
const recId = route.params.id;
const loading = ref(false);
const recData = ref({});
const reportData = ref({});

const loadData = async () => {
  if (!recId) return;
  loading.value = true;
  try {
    const res = await getReplenishmentReport(recId);
    if (res.code === 200) {
      recData.value = res.data.recommendation || {};
      reportData.value = res.data.report || {};
    }
  } catch (err) {
    console.error(err);
    ElMessage.error('加载详情失败');
  } finally {
    loading.value = false;
  }
};

// ✅ 修改：对接后端导出
const handleExport = async () => {
  const targetId = reportData.value.report_id;
  
  if (!targetId) {
    ElMessage.warning('该建议尚未生成正式报告');
    return;
  }

  try {
    ElMessage.info('正在请求下载...');
    // 调用 report 模块的导出接口
    const res = await exportReport(targetId, 'PDF');
    if (res.code === 200 && res.data && res.data.download_url) {
      downloadFileFromUrl(res.data.download_url);
    } else {
      ElMessage.warning('暂无下载链接');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('导出失败');
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
.text-danger { color: #F56C6C; }
.text-success { color: #67C23A; }
.text-primary { color: #409EFF; }
.text-gray { color: #909399; }
.font-bold { font-weight: bold; }
.sub-text { font-size: 12px; color: #909399; }
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { display: flex; align-items: center; color: #fff; font-weight: bold; }
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 100px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }
.html-content { line-height: 1.6; color: #cfd3dc; padding: 10px; }
:deep(strong) { color: #409EFF; }
</style>