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
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" style="width: 160px" clearable>
            <el-option label="待执行" value="PENDING" />
            <el-option label="执行中" value="EXECUTING" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card">
      <el-table 
        :data="planList" 
        style="width: 100%" 
        class="custom-table" 
        border 
        v-loading="loading"
      >
        <el-table-column prop="plan_code" label="方案编号" width="180" fixed show-overflow-tooltip />
        
        <el-table-column label="仓库" min-width="140" align="center">
          <template #default="{ row }">
            {{ getWarehouseName(row.warehouse_id) }}
          </template>
        </el-table-column>

        <el-table-column label="任务名称" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            {{ getOptimizationTypeLabel(row.optimization_type) }} - {{ row.plan_code }}
          </template>
        </el-table-column>

        <el-table-column prop="optimization_type" label="优化类型" min-width="140" align="center">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getPlanTypeTag(row.optimization_type)">
              {{ getOptimizationTypeLabel(row.optimization_type) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="created_at" label="创建时间" min-width="180" align="center" />
        
        <el-table-column prop="status" label="状态" min-width="120" align="center">
          <template #default="{ row }">
            <span class="status-dot" :class="getStatusClass(row.status)"></span> 
            {{ getStatusLabel(row.status) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="230" fixed="right" align="center">
          <template #default="{ row }">
              <el-button link type="primary" :icon="View" @click="goDetail(row)">查看详情</el-button>
              <el-button link type="primary" :icon="Download" @click="handleExport(row)"
              :title="row.status !== 'COMPLETED' ? '方案执行完成后方可导出报告' : ''">
                导出方案
              </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-20" style="display:flex; justify-content:flex-end;">
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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Download } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getOptimizationPlans, getOptimizationPlanReport } from '@/api/optimization';
import { useWarehouseStore } from '@/stores/warehouse'; 

const router = useRouter();
const warehouseStore = useWarehouseStore(); 

const loading = ref(false);
const total = ref(0);
const planList = ref([]);

const filters = reactive({
  warehouse_id: '',
  status: '',
  page: 1,
  page_size: 10
});

const getWarehouseName = (id) => {
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

const getOptimizationTypeLabel = (type) => {
  const map = { 'FULL': '全量优化', 'PARTIAL': '局部优化', 'INBOUND': '入库推荐', 'ORGANIZE': '库内整理' };
  return map[type] || type;
};

const getPlanTypeTag = (type) => {
  if (['FULL', 'INBOUND'].includes(type)) return 'primary';
  if (['PARTIAL', 'ORGANIZE'].includes(type)) return 'warning';
  return 'info';
};

const getStatusLabel = (status) => {
  const map = { 'PENDING': '待执行', 'EXECUTING': '执行中', 'COMPLETED': '已完成', 'FAILED': '失败' };
  return map[status] || status;
};

const getStatusClass = (status) => {
  if (status === 'EXECUTING') return 'processing';
  if (status === 'COMPLETED') return 'success';
  if (status === 'FAILED') return 'danger';
  return 'warning';
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: filters.page,
      page_size: filters.page_size,
      warehouse_id: filters.warehouse_id || undefined,
      status: filters.status || undefined
    };
    const res = await getOptimizationPlans(params);
    if (res.code === 200) {
      planList.value = res.data.items;
      total.value = res.data.total;
    }
  } catch (err) {
    console.error(err);
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
  filters.status = '';
  handleSearch();
};

const goDetail = (row) => {
  router.push(`/optimization/plans/${row.plan_id}`);
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

// 🟢 修复后的 stripHtml
const stripHtml = (html) => {
   if (!html) return "";
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   tmp.querySelectorAll('style, script').forEach(el => el.remove());
   let text = tmp.textContent || tmp.innerText || "";
   return text.replace(/\n\s*\n/g, '\n').trim();
}

// 🟢 新增：提取表格
const extractTableFromHtml = (html) => {
  if (!html) return null;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const headers = [];
  const body = [];

  const ths = table.querySelectorAll('thead th');
  if (ths.length > 0) {
    headers.push(Array.from(ths).map(th => th.innerText.trim()));
  } else {
    const firstRow = table.querySelector('tr');
    if (firstRow) {
      headers.push(Array.from(firstRow.children).map(c => c.innerText.trim()));
    }
  }

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

// 🟢 纯前端导出 PDF
const handleExport = async (row) => {
  let reportData = {};
  if (row.status === 'COMPLETED') {
    try {
      ElMessage.info('正在获取方案数据...');
      const detailRes = await getOptimizationPlanReport(row.plan_id);
      if (detailRes.code === 200) {
        reportData = detailRes.data.report || detailRes.data;
      }
    } catch (e) {
      console.warn('获取详细报告失败，仅导出基本信息');
    }
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

    doc.setFontSize(18);
    doc.text(`库存优化方案: ${row.plan_code}`, 14, 20);

    autoTable(doc, {
      startY: 30,
      styles: { font: 'SimHei', fontStyle: 'normal' },
      head: [['属性', '内容']],
      body: [
        ['方案编号', row.plan_code],
        ['所属仓库', getWarehouseName(row.warehouse_id)],
        ['优化类型', getOptimizationTypeLabel(row.optimization_type)],
        ['当前状态', getStatusLabel(row.status)],
        ['创建时间', row.created_at || '-'],
        ['报告标题', reportData.title || '无']
      ]
    });

    if (reportData.content_html) {
      let finalY = doc.lastAutoTable.finalY + 10;
      doc.text("报告详情:", 14, finalY);

      // 智能判断：表格还是文本
      const tableData = extractTableFromHtml(reportData.content_html);

      if (tableData && (tableData.headers.length > 0 || tableData.body.length > 0)) {
         autoTable(doc, {
            startY: finalY + 5,
            head: tableData.headers,
            body: tableData.body,
            styles: { font: 'SimHei', fontStyle: 'normal', fontSize: 8 },
            headStyles: { fillColor: [64, 158, 255] }
         });
      } else {
         const textContent = stripHtml(reportData.content_html);
         const splitText = doc.splitTextToSize(textContent, 180);
         doc.setFontSize(10);
         doc.text(splitText, 14, finalY + 10);
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`优化方案_${row.plan_code}_${dateStr}.pdf`);
    ElMessage.success('PDF 导出成功');

  } catch (error) {
    console.error('PDF 导出失败:', error);
    ElMessage.error('导出失败：' + error.message);
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

.status-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-right: 5px;
}

.status-dot.warning {
  background: #E6A23C;
}

.status-dot.processing {
  background: #409EFF;
  box-shadow: 0 0 4px #409EFF;
  animation: pulse 2s infinite;
}

.status-dot.success {
  background: #67C23A;
}

.status-dot.danger {
  background: #F56C6C;
}

@keyframes pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }

  70% {
    box-shadow: 0 0 0 6px rgba(64, 158, 255, 0);
  }

  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
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
</style>