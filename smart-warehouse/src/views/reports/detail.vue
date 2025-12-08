<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="goBack" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">报告详情: {{ reportData.report_code || reportId }}</span>
      </template>
      <template #extra>
        <el-button type="primary" :icon="Download" @click="handleExport" :loading="exportLoading">
          导出报告
        </el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📄 报告元信息 (Meta Info)</div>
      </template>
      <el-descriptions :column="3" border class="custom-desc">
        <el-descriptions-item label="报告标题">{{ reportData.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报告ID">{{ reportData.report_id || '-' }}</el-descriptions-item>
        
        <el-descriptions-item label="报告类型">
          <el-tag :type="getReportTypeTag(reportData.report_type)" effect="dark" size="small">
            {{ getReportTypeLabel(reportData.report_type) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="所属仓库">{{ reportData.warehouse_id ? getWarehouseName(reportData.warehouse_id) : '-' }}</el-descriptions-item>
        
        <el-descriptions-item label="分析周期">
          {{ reportData.analysis_period_start || '-' }} ~ {{ reportData.analysis_period_end || '-' }}
        </el-descriptions-item>
        
        <el-descriptions-item label="生成状态">
          <el-tag :type="reportData.status === 'COMPLETED' ? 'success' : 'info'" effect="plain">
            {{ reportData.status === 'COMPLETED' ? '已生成' : '生成中' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="邮件通知">
          <span :class="reportData.email_sent ? 'text-success' : 'text-gray'">
            <el-icon><Message /></el-icon> {{ reportData.email_sent ? '已自动发送' : '未发送' }}
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row>
      <el-col :span="24">
        <el-card shadow="never" class="detail-card" id="report-content-area">
          <template #header>
            <div class="card-header">
              <span>📊 报告正文</span>
            </div>
          </template>
          
          <div v-if="reportHtml" class="report-html" v-html="reportHtml"></div>
          
          <div v-else-if="reportSummary" class="report-html">
            <h3>摘要</h3>
            <p>{{ reportSummary }}</p>
          </div>
          
          <el-empty v-else description="暂无详细内容" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Download, Message } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getReportDetail, exportReport } from '@/api/report'; // 引入API
import { downloadFileFromUrl } from '@/utils/exportReport';   // 引入下载工具

const route = useRoute();
const router = useRouter();
const reportId = route.params.id;
const loading = ref(false);
const exportLoading = ref(false);
const reportData = ref({});

// 字典映射
const getReportTypeLabel = (type) => {
  const map = { 'DAILY': '运营日报', 'WEEKLY': '运营周报', 'MONTHLY': '运营月报', 'OPTIMIZATION': '优化报告', 'REPLENISHMENT': '补货报告' };
  return map[type] || type || '未知';
};

const getReportTypeTag = (type) => {
  if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) return 'info';
  if (type === 'OPTIMIZATION') return 'primary';
  if (type === 'REPLENISHMENT') return 'warning';
  return 'info';
};

const getWarehouseName = (id) => {
  const map = { 1: 'Zone A (电子区)', 2: 'Zone B (五金区)' };
  return map[id] || `WH-${id}`;
};

// 计算属性：提取 HTML 内容
const reportHtml = computed(() => {
  if (!reportData.value.content) return '';
  // 兼容后端直接返回字符串或 JSON 对象
  if (typeof reportData.value.content === 'string') return reportData.value.content;
  return reportData.value.content.content_html || '';
});

// 计算属性：提取摘要
const reportSummary = computed(() => {
  if (reportData.value.content && reportData.value.content.summary) {
    return reportData.value.content.summary;
  }
  return '';
});

// 加载详情数据
const loadData = async () => {
  if (!reportId) return;
  loading.value = true;
  try {
    const res = await getReportDetail(reportId);
    if (res.code === 200) {
      reportData.value = res.data;
    }
  } catch (err) {
    console.error('加载详情失败:', err);
    ElMessage.error('无法获取报告详情');
  } finally {
    loading.value = false;
  }
};

// 导出功能
const handleExport = async () => {
  exportLoading.value = true;
  try {
    ElMessage.info('正在请求下载链接...');
    // 调用后端导出接口
    const res = await exportReport(reportId, 'PDF');
    
    if (res.code === 200 && res.data && res.data.download_url) {
      downloadFileFromUrl(res.data.download_url);
    } else {
      ElMessage.warning('后端未返回有效的下载链接');
    }
  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出请求失败');
  } finally {
    exportLoading.value = false;
  }
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }

/* 头部样式 */
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
:deep(.el-page-header__title) { color: #cfd3dc; }

/* 卡片样式 */
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }

/* 描述列表样式适配 */
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }

/* 文本样式 */
.text-success { color: #67C23A; }
.text-gray { color: #909399; }

/* HTML 内容样式 */
.report-html { line-height: 1.8; color: #cfd3dc; padding: 10px; }
/* 针对 v-html 内容的样式穿透 */
:deep(strong) { color: #409EFF; }
:deep(h1), :deep(h2), :deep(h3) { color: #fff; margin-top: 20px; margin-bottom: 10px; }
:deep(ul) { padding-left: 20px; }
:deep(li) { margin-bottom: 8px; }
:deep(p) { margin-bottom: 10px; }
</style>