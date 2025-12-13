<template>
  <div class="page-container" v-loading="loading">
    <el-page-header @back="goBack" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">报告详情: {{ reportData.report_code || reportData.title || reportId }}</span>
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
      <el-descriptions :column="2" border class="custom-desc">
        <el-descriptions-item label="报告标题">{{ reportData.title || '-' }}</el-descriptions-item>
        <el-descriptions-item label="报告ID">{{ reportData.report_id || '-' }}</el-descriptions-item>
        
        <el-descriptions-item label="报告类型">
          <el-tag :type="getReportTypeTag(reportData.report_type)" effect="dark" size="small">
            {{ getReportTypeLabel(reportData.report_type) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="当前状态">
            <el-tag :type="getReportStatusTag(reportData.status)" size="small">
              {{ getReportStatusLabel(reportData.status) }}
            </el-tag>
          </el-descriptions-item>

        <!-- <el-descriptions-item label="邮件通知">
          <span :class="reportData.email_sent ? 'text-success' : 'text-gray'">
            <el-icon><Message /></el-icon> {{ reportData.email_sent ? '已自动发送' : '未发送' }}
          </span>
        </el-descriptions-item> -->
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
          
          <div class="iframe-container" v-if="reportHtml">
            <iframe 
              :srcdoc="reportHtml" 
              class="report-iframe"
              width="100%"
              height="100%"
            ></iframe>
          </div>
          
          <div v-else-if="reportSummary" class="report-html">
            <h3>摘要</h3>
            <p>{{ reportSummary }}</p>
          </div>
          
          <el-empty v-else description="暂无详细内容" />
        </el-card>
      </el-col>
    </el-row>

    <div 
      ref="reportHiddenRef" 
      class="report-hidden-container"
      v-html="processedHtml"
    ></div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Download, Message } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getReportDetail } from '@/api/report'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const route = useRoute();
const router = useRouter();
const reportId = route.params.id;
const loading = ref(false);
const exportLoading = ref(false);
const reportData = ref({});
const reportHiddenRef = ref(null);

const getReportTypeLabel = (type) => {
  const map = { 
    'DAILY': '运营日报', 'WEEKLY': '运营周报', 'MONTHLY': '运营月报', 
    'OPTIMIZATION': '优化报告', 'REPLENISHMENT': '补货报告', 'CUSTOM': '自定义报告'
  };
  return map[type] || type;
};

const getReportTypeTag = (type) => {
  if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) return 'info';
  if (type === 'OPTIMIZATION') return 'primary';
  if (type === 'REPLENISHMENT') return 'warning';
  if (type === 'CUSTOM') return 'success';
  return 'info';
};

const getReportStatusLabel = (status) => {
  const map = {
    'PUBLISHED': '已发布', 'PENDING': '排队中', 'GENERATING': '生成中',
    'PROCESSING': '生成中', 'COMPLETED': '已生成', 'FAILED': '生成失败'
  };
  return map[status] || status;
};

const getReportStatusTag = (status) => {
  if (status === 'PUBLISHED') return '';
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'danger';
  if (status === 'GENERATING' || status === 'PROCESSING') return 'primary';
  if (status === 'PENDING') return 'warning';
  return 'info';
};

const reportHtml = computed(() => {
  if (reportData.value.content_html) return reportData.value.content_html;
  if (reportData.value.content) {
    if (typeof reportData.value.content === 'string') return reportData.value.content;
    return reportData.value.content.content_html || '';
  }
  return '';
});

const processedHtml = computed(() => {
  const html = reportHtml.value;
  if (!html) return '';
  let processed = html.replace(/body\s*\{/g, '.report-hidden-container {');
  processed = processed.replace(/width:\s*[\d]+px/g, 'width: 100%');
  return processed;
});

const reportSummary = computed(() => {
  if (reportData.value.summary) return reportData.value.summary;
  if (reportData.value.content && reportData.value.content.summary) {
    return reportData.value.content.summary;
  }
  return '';
});

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const loadData = async () => {
  if (!reportId) return;
  loading.value = true;
  try {
    const res = await getReportDetail(reportId);
    if (res.code === 200) {
      const rawData = res.data;
      let parsedJson = {};
      try {
        if (typeof rawData.content_json === 'string') {
          parsedJson = JSON.parse(rawData.content_json);
        } else {
          parsedJson = rawData.content_json || {};
        }
      } catch (e) {
        console.warn('JSON parsing error:', e);
      }
      reportData.value = {
        ...rawData,
        content_json: parsedJson,
        summary: rawData.summary || parsedJson.summary || '' 
      };
    } else {
      ElMessage.warning(res.message || '获取失败');
    }
  } catch (err) {
    console.error('加载详情失败:', err);
    ElMessage.error('无法获取报告详情');
  } finally {
    loading.value = false;
  }
};

//核心算法：长图切割分页
const addContentToPdf = (doc, canvas, startY, margin) => {
  const contentWidth = canvas.width;
  const contentHeight = canvas.height;
  
  const pdfPageWidth = doc.internal.pageSize.getWidth();
  const pdfPageHeight = doc.internal.pageSize.getHeight();
  const pdfContentWidth = pdfPageWidth - (margin * 2);
  const pdfContentHeight = (contentHeight * pdfContentWidth) / contentWidth;
  
  let heightLeft = pdfContentHeight;
  let position = 0;
  
  // 第一页剩余空间
  const firstPageHeightAvailable = pdfPageHeight - startY - margin;
  let isFirstPage = true;
  
  // 如果剩余空间太小（<4cm），直接换页
  if (firstPageHeightAvailable < 40) {
     doc.addPage();
     startY = margin; 
     isFirstPage = false; 
  }

  while (heightLeft > 0) {
    const pageAvailableH = isFirstPage ? (pdfPageHeight - startY - margin) : (pdfPageHeight - (margin * 2));
    const printHeight = Math.min(heightLeft, pageAvailableH);
    const ratio = canvas.width / pdfContentWidth;
    const sourceY = position * ratio;
    const sourceH = printHeight * ratio;

    const sliceCanvas = document.createElement('canvas');
    sliceCanvas.width = canvas.width;
    sliceCanvas.height = sourceH;
    const ctx = sliceCanvas.getContext('2d');
    ctx.drawImage(
      canvas, 
      0, sourceY, canvas.width, Math.min(sourceH, canvas.height - sourceY), 
      0, 0, canvas.width, sourceH
    );
    
    const sliceImgData = sliceCanvas.toDataURL('image/png');
    const printY = isFirstPage ? startY : margin;
    doc.addImage(sliceImgData, 'PNG', margin, printY, pdfContentWidth, printHeight);

    heightLeft -= printHeight;
    position += printHeight;
    isFirstPage = false;

    if (heightLeft > 0) doc.addPage();
  }
};

//纯前端导出逻辑
const handleExport = async () => {
  exportLoading.value = true;
  try {
    ElMessage.info('正在生成 PDF...');
    
    const doc = new jsPDF();
    const response = await fetch('/fonts/SimHei.ttf');
    if (!response.ok) throw new Error('字体加载失败');
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    
    doc.addFileToVFS('SimHei.ttf', fontBase64);
    doc.addFont('SimHei.ttf', 'SimHei', 'normal');
    doc.setFont('SimHei');

    doc.setFontSize(18);
    doc.text(`系统管理报告`, 14, 20);

    // 表头信息：直接使用当前 reportData
    autoTable(doc, {
      startY: 30,
      styles: { font: 'SimHei', fontStyle: 'normal' },
      head: [['属性', '内容']],
      body: [
        ['报告ID', String(reportData.value.report_id || '-')],
        ['报告编号', reportData.value.report_code || '-'],
        ['报告标题', reportData.value.title || '-'],
        ['报告类型', getReportTypeLabel(reportData.value.report_type)],
        ['创建时间', reportData.value.created_at || '-'],
        ['状态', getReportStatusLabel(reportData.value.status)]
      ]
    });

    if (processedHtml.value && reportHiddenRef.value) {
      let finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("报告正文:", 14, finalY);
      finalY += 5;

      await nextTick();

      // 截图
      const canvas = await html2canvas(reportHiddenRef.value, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      // 调用切割算法
      addContentToPdf(doc, canvas, finalY, 14);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`管理报告_${reportData.value.report_code || reportId}_${dateStr}.pdf`);
    ElMessage.success('导出成功');

  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败: ' + error.message);
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

.text-success { color: #67C23A; }
.text-gray { color: #909399; }
.report-html { line-height: 1.8; color: #cfd3dc; padding: 10px; }

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

/*隐藏容器 A4 样式 */
.report-hidden-container {
  position: absolute;
  top: 0;
  left: -9999px;
  width: 794px; /* A4 width (96dpi) */
  background-color: #fff;
  color: #333;
  padding: 40px;
  font-family: "SimHei", "Microsoft YaHei", sans-serif;
  line-height: 1.6;
  font-size: 14px;
  z-index: -1;
  box-sizing: border-box;
}
.report-hidden-container :deep(*) {
  color: #333 !important;
  background-color: transparent !important;
  max-width: 100% !important;
}
.report-hidden-container :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}
.report-hidden-container :deep(th),
.report-hidden-container :deep(td) {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
.report-hidden-container :deep(th) {
  background-color: #f5f7fa !important;
  font-weight: bold;
}
</style>