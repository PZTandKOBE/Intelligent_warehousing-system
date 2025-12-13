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
            <el-option label="自定义报告" value="CUSTOM" />
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
                <el-tag size="small" :type="getReportStatusTag(row.status)" effect="plain">
                  {{ getReportStatusLabel(row.status) }}
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

    <div 
      ref="reportHiddenRef" 
      class="report-hidden-container"
      v-html="exportHtmlContent"
    ></div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getReportList, getReportDetail } from '@/api/report';
import { useWarehouseStore } from '@/stores/warehouse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';

const router = useRouter();
const warehouseStore = useWarehouseStore();

const loading = ref(false);
const total = ref(0);
const reportList = ref([]);
const reportHiddenRef = ref(null);
const exportHtmlContent = ref('');

const filters = reactive({
  warehouse_id: '',
  type: '',
  dateRange: [],
  page: 1,
  page_size: 10
});

// --- Helpers ---
const getReportTypeLabel = (type) => {
  const map = { 
    'DAILY': '运营日报', 'WEEKLY': '运营周报', 'MONTHLY': '运营月报', 
    'OPTIMIZATION': '优化报告', 'REPLENISHMENT': '补货报告', 'CUSTOM': '自定义报告' 
  };
  return map[type] || type;
};

const getReportTypeTag = (type) => {
  if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) return 'warning';
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
  if (status === 'COMPLETED') return 'success';
  if (status === 'PUBLISHED') return '';
  if (status === 'FAILED') return 'danger';
  if (status === 'GENERATING' || status === 'PROCESSING') return 'primary';
  if (status === 'PENDING') return 'warning';
  return 'info';
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

const processHtml = (html) => {
  if (!html) return '';
  let processed = html.replace(/body\s*\{/g, '.report-hidden-container {');
  processed = processed.replace(/width:\s*[\d]+px/g, 'width: 100%');
  return processed;
};

// --- API ---

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

const addContentToPdf = (doc, canvas, startY, margin) => {
  const contentWidth = canvas.width;
  const contentHeight = canvas.height;
  const pdfPageWidth = doc.internal.pageSize.getWidth();
  const pdfPageHeight = doc.internal.pageSize.getHeight();
  const pdfContentWidth = pdfPageWidth - (margin * 2);
  const pdfContentHeight = (contentHeight * pdfContentWidth) / contentWidth;
  
  let heightLeft = pdfContentHeight;
  let position = 0;
  
  const firstPageHeightAvailable = pdfPageHeight - startY - margin;
  let isFirstPage = true;
  
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

const handleExport = async (row) => {
  if (row.downloading) return;
  row.downloading = true;
  try {
    ElMessage.info('正在准备数据...');
    const detailRes = await getReportDetail(row.report_id);
    let htmlContent = '';
    
    // 如果详情接口有数据，就用详情的，否则降级使用列表的 row
    let reportInfo = { ...row }; 
    
    if (detailRes.code === 200) {
      // 合并详情数据（确保 report_code 等字段是最新的）
      reportInfo = { ...row, ...detailRes.data };
      
      htmlContent = detailRes.data.content_html;
      if (!htmlContent && detailRes.data.content && detailRes.data.content.content_html) {
        htmlContent = detailRes.data.content.content_html;
      }
    }

    if (!htmlContent) {
      ElMessage.warning('该报告暂无详细内容，仅导出摘要信息');
    }

    exportHtmlContent.value = processHtml(htmlContent);
    await nextTick();

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

    autoTable(doc, {
      startY: 30,
      styles: { font: 'SimHei', fontStyle: 'normal' },
      head: [['属性', '内容']],
      body: [
        ['报告ID', String(reportInfo.report_id || '-')],
        ['报告编号', reportInfo.report_code || '-'], // 现在应该能取到值了
        ['报告标题', reportInfo.title || '-'],
        ['报告类型', getReportTypeLabel(reportInfo.report_type)],
        ['创建时间', reportInfo.created_at || '-'],
        ['状态', getReportStatusLabel(reportInfo.status)]
      ]
    });

    if (htmlContent && reportHiddenRef.value) {
      let finalY = doc.lastAutoTable.finalY + 15;
      doc.setFontSize(14);
      doc.text("报告正文:", 14, finalY);
      finalY += 5;

      const canvas = await html2canvas(reportHiddenRef.value, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      addContentToPdf(doc, canvas, finalY, 14);
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`管理报告_${reportInfo.report_code || reportInfo.report_id}_${dateStr}.pdf`);
    ElMessage.success('导出成功');

  } catch (error) {
    console.error('导出失败:', error);
    ElMessage.error('导出失败: ' + error.message);
  } finally {
    row.downloading = false;
    exportHtmlContent.value = ''; 
  }
};

onMounted(() => {
  warehouseStore.fetchWarehouses();
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

.search-card {
  background: #1d1e1f;
  border: 1px solid #333;
}

:deep(.el-form-item__label) {
  color: #cfd3dc;
  padding-right: 8px;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper),
:deep(.el-date-editor) {
  background-color: #262729;
  box-shadow: 0 0 0 1px #4c4d4f inset;
  color: #fff;
}

:deep(.el-input__inner) {
  color: #fff;
}

:deep(.el-range-input) {
  color: #fff;
  background: transparent;
}

:deep(.el-range-separator) {
  color: #909399;
}

.list-card {
  background: #1d1e1f;
  border: 1px solid #333;
}

:deep(.el-table) {
  background-color: transparent !important;
  color: #cfd3dc;
  --el-table-border-color: #333;
  --el-table-header-bg-color: #262729;
  --el-table-row-hover-bg-color: #2c3e50;
}

:deep(.el-table tr),
:deep(.el-table th.el-table__cell),
:deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  border-bottom: 1px solid #333 !important;
  border-right: 1px solid #333 !important;
}

:deep(.el-table th.el-table__cell) {
  background-color: #262729 !important;
  color: #fff;
  font-weight: bold;
}

:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) {
  background-color: #262729;
  color: #cfd3dc;
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #409EFF;
  color: #fff;
}

:deep(.el-pagination.is-background .btn-prev),
:deep(.el-pagination.is-background .btn-next) {
  background-color: #262729;
  color: #cfd3dc;
}

.report-hidden-container {
  position: absolute;
  top: 0;
  left: -9999px;
  width: 794px;
  /* A4 width */
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