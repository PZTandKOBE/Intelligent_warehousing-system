<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="商品编码 / 名称" 
            :prefix-icon="Search"
            clearable 
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="物料分类">
          <el-select v-model="searchForm.category" placeholder="全部分类" style="width: 140px" clearable>
            <el-option label="电子元器件" value="Electronics" />
            <el-option label="机械配件" value="Mechanical" />
            <el-option label="辅料耗材" value="Consumables" />
          </el-select>
        </el-form-item>

        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse_id" placeholder="全部仓库" style="width: 140px" clearable>
            <el-option label="Zone A (电子区)" :value="1" />
            <el-option label="Zone B (五金区)" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item label="快照日期">
          <el-date-picker
            v-model="searchForm.snapshot_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 160px"
            @change="handleSearch"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button-group class="ml-10">
            <el-button type="success" :icon="Document" plain @click="handleExportExcel">Excel</el-button>
            <el-button type="danger" :icon="Download" plain @click="handleExportPDF">PDF</el-button>
          </el-button-group>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        v-loading="loading" 
        class="custom-table"
        border
      >
        <el-table-column prop="goods_code" label="商品编码" width="140" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <span class="link-text" @click="viewDetail(row)">{{ row.goods_code }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="goods_name" label="商品名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-weight: bold">{{ row.goods_name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="类型" width="120" show-overflow-tooltip>
           <template #default="{ row }">
             {{ row.goods_type || '-' }}
           </template>
        </el-table-column>
        
        <el-table-column label="位置信息" width="180">
          <template #default="{ row }">
            <div>{{ getWarehouseName(row.warehouse_id) }}</div>
            <div class="sub-text link-text-sub">
              <el-icon><Location /></el-icon> {{ row.storage_code || '-' }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="总数量" width="100" align="center">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #fff">{{ row.total_number }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="可用" width="100" align="center">
          <template #default="{ row }">
            <span class="text-success">{{ row.available_total_number }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="冻结" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.frozen_total_number > 0 ? 'text-warning' : 'text-gray'">
              {{ row.frozen_total_number }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="snapshot_time" label="快照时间" width="170" align="center" show-overflow-tooltip />
        
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          v-model:current-page="searchForm.page"
          v-model:page-size="searchForm.page_size"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          background
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Location, Download, Document } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as XLSX from 'xlsx'; 
import jsPDF from 'jspdf';     
import autoTable from 'jspdf-autotable'; 

import { getInventoryList } from '@/api/inventory';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const tableData = ref([]);

const searchForm = reactive({
  keyword: '',
  category: '',
  warehouse_id: '',
  snapshot_date: '',
  page: 1,
  page_size: 10
});

const getWarehouseName = (id) => {
  const map = { 1: 'Zone A (电子区)', 2: 'Zone B (五金区)' };
  return map[id] || `WH-${id}`;
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: searchForm.page,
      page_size: searchForm.page_size,
      warehouse_id: searchForm.warehouse_id || undefined,
      goods_name: searchForm.keyword || undefined,
      goods_type: searchForm.category || undefined,
      snapshot_date: searchForm.snapshot_date || undefined
    };

    const res = await getInventoryList(params);
    if (res.code === 200) {
      tableData.value = res.data.items;
      total.value = res.data.total;
    }
  } catch (error) {
    console.error("加载列表失败:", error);
  } finally {
    loading.value = false;
  }
};

const handleSearch = () => {
  searchForm.page = 1;
  loadData();
};

const resetSearch = () => {
  searchForm.keyword = '';
  searchForm.category = '';
  searchForm.warehouse_id = '';
  searchForm.snapshot_date = '';
  searchForm.page_size = 10; // 重置时也恢复默认每页数量
  handleSearch();
};

// ✅ 新增：处理每页条数变化
const handleSizeChange = (val) => {
  searchForm.page_size = val;
  searchForm.page = 1; // 改变每页条数时，通常回到第一页，防止数据为空
  loadData();
};

// ✅ 新增：处理翻页
const handleCurrentChange = (val) => {
  searchForm.page = val;
  loadData();
};

const viewDetail = (row) => {
  const id = row.goods_id; 
  if (!id) {
    ElMessage.error('无法获取商品ID，请检查列表数据');
    return;
  }
  router.push(`/inventory/detail/${id}`);
};

/**
 * 导出 Excel
 */
const handleExportExcel = async () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('当前暂无数据可导出');
    return;
  }

  try {
    ElMessage.info('正在生成 Excel 文件...');
    const exportData = tableData.value.map(item => ({
      '商品编码': item.goods_code,
      '商品名称': item.goods_name,
      '类型': item.goods_type || '-',
      '仓库': getWarehouseName(item.warehouse_id),
      '库位': item.storage_code || '-',
      '总库存': item.total_number,
      '可用库存': item.available_total_number,
      '冻结库存': item.frozen_total_number,
      '快照时间': item.snapshot_time || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '库存清单');

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    XLSX.writeFile(wb, `库存清单_${dateStr}.xlsx`);
    ElMessage.success('Excel 导出成功');
  } catch (error) {
    console.error('Excel 导出失败:', error);
    ElMessage.error('导出 Excel 失败');
  }
};

/**
 * 导出 PDF
 */
const handleExportPDF = async () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('当前暂无数据可导出');
    return;
  }

  const doc = new jsPDF();

  try {
    ElMessage.info('正在加载字体并生成 PDF...');

    const response = await fetch('/fonts/SimHei.ttf');
    if (!response.ok) {
      throw new Error('字体文件加载失败，请检查 public/fonts/SimHei.ttf 是否存在');
    }
    const fontBuffer = await response.arrayBuffer();
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    
    doc.addFileToVFS('SimHei.ttf', fontBase64);
    doc.addFont('SimHei.ttf', 'SimHei', 'normal');
    doc.setFont('SimHei');

    const tableColumn = ["商品编码", "商品名称", "类型", "仓库", "总库存", "可用", "快照时间"];
    const tableRows = tableData.value.map(item => [
      item.goods_code,
      item.goods_name,
      item.goods_type || '-',
      getWarehouseName(item.warehouse_id),
      String(item.total_number),
      String(item.available_total_number),
      item.snapshot_time || '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { 
        font: 'SimHei', 
        fontStyle: 'normal',
        fontSize: 10 
      },
      headStyles: {
        fillColor: [64, 158, 255],
        font: 'SimHei',
        textColor: 255
      }
    });

    doc.setFontSize(18);
    doc.text("库存清单报表", 14, 15);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`库存清单_${dateStr}.pdf`);
    
    ElMessage.success('PDF 导出成功');

  } catch (error) {
    console.error('PDF 导出失败:', error);
    ElMessage.error('PDF 导出失败：' + error.message);
  }
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

onMounted(() => {
  loadData();
});
</script>

<style scoped>
.page-container { padding: 20px; box-sizing: border-box; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }

/* 搜索卡片样式 */
.search-card { 
  background: #1d1e1f; 
  border: 1px solid #333; 
  display: flex;
  align-items: center;
  padding: 18px 20px 0 20px; 
}

/* Flex 布局优化 */
.search-form {
  display: flex;
  flex-wrap: wrap; 
  align-items: center;
  width: 100%;
  gap: 10px; 
}

:deep(.el-form-item) {
  margin-bottom: 18px; 
  margin-right: 0; 
}

:deep(.el-form-item__label) { color: #cfd3dc; padding-right: 8px; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
  color: #fff;
}
:deep(.el-input__inner) { color: #fff; }

/* 按钮组容器 */
.btn-wrapper {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 表格卡片样式 */
.table-card { background: #1d1e1f; border: 1px solid #333; }

:deep(.el-table) {
  --el-table-border-color: #333;
  --el-table-header-bg-color: #262729;
  --el-table-row-hover-bg-color: #2c3e50;
  background-color: transparent !important;
  color: #cfd3dc;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; 
  border-bottom: 1px solid #333 !important;
  border-right: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { 
  background-color: #262729 !important; 
  color: #fff; 
  font-weight: bold;
}
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }
.text-gray { color: #5c5c5c; }
.sub-text { font-size: 12px; color: #909399; margin-top: 2px; }
.link-text { color: #409EFF; cursor: pointer; text-decoration: underline; }
.link-text:hover { color: #79bbff; }
.link-text-sub { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.link-text-sub:hover { color: #409EFF; }

/* 分页样式 */
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
/* 分页输入框样式适配 */
:deep(.el-pagination__sizes .el-select .el-input .el-input__wrapper) { background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; }
:deep(.el-pagination__editor.el-input .el-input__wrapper) { background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; }
</style>