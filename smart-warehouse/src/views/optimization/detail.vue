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
// 引入前端导出库
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getOptimizationPlanReport } from '@/api/optimization';

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

const arrayBufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

// 🟢 修复后的 stripHtml：彻底移除 style/script 标签
const stripHtml = (html) => {
   if (!html) return "";
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   
   // 移除干扰标签
   tmp.querySelectorAll('style, script').forEach(el => el.remove());

   let text = tmp.textContent || tmp.innerText || "";
   return text.replace(/\n\s*\n/g, '\n').trim();
};

// 🟢 新增：提取表格数据用于 PDF 渲染
const extractTableFromHtml = (html) => {
  if (!html) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const headers = [];
  const body = [];

  // 提取表头
  const ths = table.querySelectorAll('thead th');
  if (ths.length > 0) {
    headers.push(Array.from(ths).map(th => th.innerText.trim()));
  } else {
    // 如果没有 thead，尝试取第一行
    const firstRow = table.querySelector('tr');
    if (firstRow) {
      headers.push(Array.from(firstRow.children).map(c => c.innerText.trim()));
    }
  }

  // 提取内容 (排除表头行)
  const rows = table.querySelectorAll('tr');
  rows.forEach((tr) => {
    if (tr.parentNode.tagName === 'THEAD' || tr.querySelector('th')) return;
    
    const tds = tr.querySelectorAll('td');
    if (tds.length > 0) {
      body.push(Array.from(tds).map(td => td.innerText.trim()));
    }
  });

  return { headers, body };
};

// --- API Calls ---

const loadData = async () => {
  if (!planId) {
    ElMessage.error('参数错误：未获取到方案ID');
    return;
  }
  
  loading.value = true;
  try {
    const reportRes = await getOptimizationPlanReport(planId);
    
    if (reportRes.code === 200) {
      const rawData = reportRes.data || {};
      reportData.value = rawData; 

      const planInfo = rawData.content_json || {};
      
      planData.value = {
        plan_id: rawData.plan_id,
        plan_code: planInfo.plan_code || rawData.report_code, 
        warehouse_id: planInfo.warehouse_id,
        status: rawData.status,
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

// 🟢 纯前端导出 PDF (含表格解析)
const handleExport = async () => {
  if (!planData.value.plan_code) {
    ElMessage.warning('数据尚未加载完成，请稍候');
    return;
  }

  const doc = new jsPDF();
  try {
    ElMessage.info('正在生成 PDF...');
    
    const response = await fetch('/fonts/SimHei.ttf');
    if (!response.ok) throw new Error('字体加载失败');
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    
    doc.addFileToVFS('SimHei.ttf', fontBase64);
    doc.addFont('SimHei.ttf', 'SimHei', 'normal');
    doc.setFont('SimHei');

    // Title
    doc.setFontSize(18);
    doc.text(`库存优化分析报告`, 14, 20);

    // Summary Table
    autoTable(doc, {
      startY: 30,
      styles: { font: 'SimHei', fontStyle: 'normal' },
      head: [['项目', '详情']],
      body: [
        ['方案编号', planData.value.plan_code],
        ['仓库', getWarehouseName(planData.value.warehouse_id)],
        ['生成时间', planData.value.created_at || '-'],
        ['报告标题', reportData.value.title || '-'],
        ['状态', getStatusLabel(planData.value.status)]
      ]
    });

    // Report Content
    if (reportData.value.content_html) {
      let finalY = doc.lastAutoTable.finalY + 15;
      
      // 1. 标题
      doc.setFontSize(14);
      doc.text("报告正文概要:", 14, finalY);
      
      // 2. 尝试提取表格
      const tableData = extractTableFromHtml(reportData.value.content_html);

      if (tableData && (tableData.headers.length > 0 || tableData.body.length > 0)) {
        // ✅ 渲染表格
        autoTable(doc, {
          startY: finalY + 5,
          head: tableData.headers,
          body: tableData.body,
          styles: { font: 'SimHei', fontStyle: 'normal', fontSize: 9, cellPadding: 2 },
          headStyles: { fillColor: [64, 158, 255], textColor: 255 },
          alternateRowStyles: { fillColor: [245, 247, 250] },
          margin: { top: 10 }
        });
      } else {
        // ❌ 没表格，渲染清洗后的纯文本
        const cleanText = stripHtml(reportData.value.content_html);
        const splitText = doc.splitTextToSize(cleanText, 180);
        doc.setFontSize(10);
        doc.text(splitText, 14, finalY + 10);
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`优化报告_${planData.value.plan_code}_${dateStr}.pdf`);
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
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }
.iframe-container { width: 100%; height: 800px; background-color: #fff; border-radius: 4px; overflow: hidden; }
.report-iframe { width: 100%; height: 100%; border: none; display: block; }
</style>