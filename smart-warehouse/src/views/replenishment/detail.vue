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

    <div 
      ref="reportHiddenRef" 
      class="report-hidden-container"
      v-html="processedHtml"
    ></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { useWarehouseStore } from '@/stores/warehouse';
import { getReplenishmentReport } from '@/api/replenishment'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// 🟢 1. 引入 html2canvas 用于截图
import html2canvas from 'html2canvas';

const route = useRoute();
const warehouseStore = useWarehouseStore();
const recId = route.params.id;

const loading = ref(false);
const recData = ref({});    
const reportData = ref({}); 
// 🟢 2. 新增 ref 用于获取 DOM
const reportHiddenRef = ref(null);

// --- Helper Functions ---

const getWarehouseName = (id) => {
  if (!id) return '-';
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
  const map = { 'CRITICAL': '临界', 'HIGH': '紧急', 'MEDIUM': '一般', 'LOW': '低' };
  return map[urgency] || urgency || '-';
};

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// 🟢 3. 处理 HTML：替换 body 样式，防止污染全局，并确保截图样式正确
const processedHtml = computed(() => {
  const html = reportData.value.content_html;
  if (!html) return '';
  // 将 body 选择器替换为我们的容器类名，防止全局污染
  // 同时确保背景色为白，字体为黑
  let processed = html.replace(/body\s*\{/g, '.report-hidden-container {');
  // 移除可能存在的固定宽度限制，改用 100% 以适应截图容器
  processed = processed.replace(/width:\s*[\d]+px/g, 'width: 100%');
  return processed;
});

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
      if (flatData.recommendation) {
        tempRecData = flatData.recommendation;
      } else if (flatData.content_json) {
        tempRecData = { ...flatData.content_json, status: flatData.status };
      } else {
        tempRecData = flatData;
      }

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

// 🟢 4. 混合导出：头部用表格，详情用 HTML 截图
const handleExport = async () => {
  const doc = new jsPDF();
  try {
    ElMessage.info('正在生成 PDF...');
    
    // 加载字体
    const response = await fetch('/fonts/SimHei.ttf');
    if (!response.ok) throw new Error('字体加载失败');
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    
    doc.addFileToVFS('SimHei.ttf', fontBase64);
    doc.addFont('SimHei.ttf', 'SimHei', 'normal');
    doc.setFont('SimHei');

    // 绘制标题
    doc.setFontSize(18);
    doc.text(`补货建议报告`, 14, 20);

    // 绘制基本信息表格 (保持矢量清晰度)
    autoTable(doc, {
      startY: 30,
      styles: { font: 'SimHei', fontStyle: 'normal' },
      head: [['指标', '数值/详情']],
      body: [
        ['物料ID', recData.value.goods_id || '-'],
        ['仓库', getWarehouseName(recData.value.warehouse_id)],
        ['建议补货量', String(recData.value.recommended_quantity || 0)],
        ['当前库存', String(recData.value.current_stock || 0)],
        ['安全库存', String(recData.value.safety_stock || 0)],
        ['紧急度', getUrgencyLabel(recData.value.urgency)],
        ['状态', recData.value.status || '-']
      ]
    });

    // 处理 HTML 详情 (截图方案)
    if (processedHtml.value && reportHiddenRef.value) {
      let finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("详细说明:", 14, finalY);
      finalY += 5;

      // 等待 DOM 更新
      await nextTick();

      // 生成截图
      const canvas = await html2canvas(reportHiddenRef.value, {
        scale: 2, // 提高清晰度 (2倍图)
        useCORS: true, // 允许跨域图片
        backgroundColor: '#ffffff' // 强制白底，防止透明
      });

      const imgData = canvas.toDataURL('image/png');
      const imgProps = doc.getImageProperties(imgData);
      
      // 计算图片在 PDF 中的尺寸
      const pdfPageWidth = doc.internal.pageSize.getWidth();
      const pdfPageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const contentWidth = pdfPageWidth - (margin * 2);
      // 按比例缩放高度
      const contentHeight = (imgProps.height * contentWidth) / imgProps.width;

      // 检查是否需要分页
      if (finalY + contentHeight > pdfPageHeight) {
        doc.addPage();
        finalY = 20; // 新页面的起始高度
      }

      doc.addImage(imgData, 'PNG', margin, finalY, contentWidth, contentHeight);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`补货建议_${recData.value.goods_id}_${dateStr}.pdf`);
    ElMessage.success('导出成功');

  } catch (error) {
    console.error(error);
    ElMessage.error('导出失败: ' + error.message);
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

/* 🟢 5. 隐藏的截图容器样式 */
.report-hidden-container {
  position: absolute;
  top: 0;
  left: -9999px; /* 移出可视区域 */
  width: 750px; /* 模拟 A4 纸宽度，确保布局正常 */
  background-color: #fff;
  color: #000;
  padding: 30px;
  font-family: "SimHei", sans-serif; /* 确保字体一致 */
  z-index: -1;
}
/* 强制容器内的元素使用黑色字体，防止暗黑模式变量影响 */
.report-hidden-container :deep(*) {
  color: #000 !important;
  background-color: transparent;
  border-color: #eee;
}
</style>