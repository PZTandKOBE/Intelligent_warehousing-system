<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="关键词">
          <el-input 
            v-model="searchForm.keyword" 
            placeholder="输入商品编码 或 名称" 
            :prefix-icon="Search"
            clearable 
            style="width: 220px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="物料分类">
          <el-select 
            v-model="searchForm.category" 
            placeholder="全部分类" 
            style="width: 160px" 
            clearable
            @change="handleSearch"
          >
            <el-option 
              v-for="item in categoryOptions"
              :key="item.goods_type"
              :label="item.goods_type_name"
              :value="item.goods_type" 
            />
          </el-select>
        </el-form-item>

        <el-form-item label="仓库">
          <el-select 
            v-model="searchForm.warehouse_id" 
            placeholder="全部仓库" 
            style="width: 160px" 
            clearable
            @change="handleSearch"
          >
            <el-option 
              v-for="item in warehouseStore.warehouseList"
              :key="item.warehouse_id"
              :label="item.warehouse_name"
              :value="item.warehouse_id"
            />
          </el-select>
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
        
        <el-table-column prop="goods_type_name" label="分类" width="120" show-overflow-tooltip />

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

        <el-table-column prop="snapshot_time" label="更新时间" width="170" align="center" show-overflow-tooltip />
        
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
// 引入新增的 getGoodsCategories
import { getInventoryList, getGoodsCategories } from '@/api/inventory';
import { useWarehouseStore } from '@/stores/warehouse';

const router = useRouter();
const warehouseStore = useWarehouseStore();

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);
const categoryOptions = ref([]); // 存储真实的分类数据

const searchForm = reactive({
  keyword: '',
  category: '',
  warehouse_id: '',
  page: 1,
  page_size: 10
});

const getWarehouseName = (id) => {
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

// 1. 加载分类列表
const loadCategories = async () => {
  try {
    const res = await getGoodsCategories();
    if (res.code === 200) {
      // 假设后端返回结构 { data: { items: [...] } }
      categoryOptions.value = res.data.items || [];
    }
  } catch (error) {
    console.error('获取分类失败:', error);
  }
};

// 2. 加载库存列表
const loadData = async () => {
  loading.value = true;
  try {
    // 处理关键词逻辑：如果没填，就是 undefined
    let codeParam = undefined;
    let nameParam = undefined;
    
    // 简单的智能判断：如果关键词存在
    if (searchForm.keyword) {
      // 如果看起来像编码（例如纯数字或包含特定前缀），传给 code
      // 这里简单假设：如果是纯数字或者以 'MAT-' 开头，可能是编码
      // 否则默认作为名称查询
      if (/^[0-9]+$/.test(searchForm.keyword) || searchForm.keyword.toUpperCase().startsWith('MAT-')) {
         codeParam = searchForm.keyword;
      } else {
         nameParam = searchForm.keyword;
      }
    }

    const params = {
      page: searchForm.page,
      page_size: searchForm.page_size,
      warehouse_id: searchForm.warehouse_id || undefined,
      goods_type: searchForm.category || undefined, // 传递选中的分类值
      goods_code: codeParam, // 对应后端 goods_code
      goods_name: nameParam  // 对应后端 goods_name
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
  searchForm.page_size = 10;
  handleSearch();
};

const handleSizeChange = (val) => {
  searchForm.page_size = val;
  searchForm.page = 1;
  loadData();
};

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
  router.push({
    path: `/inventory/detail/${id}`,
    query: {
      warehouse_id: row.warehouse_id
    }
  });
};

// Excel 导出逻辑
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
      '分类': item.goods_type_name || '-',
      '仓库': getWarehouseName(item.warehouse_id),
      '库位': item.storage_code || '-',
      '总库存': item.total_number,
      '可用库存': item.available_total_number,
      '冻结库存': item.frozen_total_number,
      '更新时间': item.snapshot_time || '-'
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

// PDF 导出逻辑
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

    const tableColumn = ["商品编码", "商品名称", "仓库", "总库存", "可用", "时间"];
    const tableRows = tableData.value.map(item => [
      item.goods_code,
      item.goods_name,
      getWarehouseName(item.warehouse_id),
      String(item.total_number),
      String(item.available_total_number),
      item.snapshot_time ? item.snapshot_time.substring(0, 10) : '-'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { font: 'SimHei', fontStyle: 'normal', fontSize: 10 },
      headStyles: { fillColor: [64, 158, 255], font: 'SimHei', textColor: 255 }
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
  warehouseStore.fetchWarehouses();
  loadCategories(); // ✅ 调用分类加载
  loadData();
});
</script>

<style scoped>
/* 样式保留 */
.page-container { padding: 20px; box-sizing: border-box; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }
.search-card { background: #1d1e1f; border: 1px solid #333; display: flex; align-items: center; padding: 18px 20px 0 20px; }
.search-form { display: flex; flex-wrap: wrap; align-items: center; width: 100%; gap: 10px; }
:deep(.el-form-item) { margin-bottom: 18px; margin-right: 0; }
:deep(.el-form-item__label) { color: #cfd3dc; padding-right: 8px; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) { 
  background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; color: #fff;
}
:deep(.el-input__inner) { color: #fff; }
.table-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-table) {
  --el-table-border-color: #333; --el-table-header-bg-color: #262729; --el-table-row-hover-bg-color: #2c3e50;
  background-color: transparent !important; color: #cfd3dc;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; border-bottom: 1px solid #333 !important; border-right: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; font-weight: bold; }
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }
.text-gray { color: #5c5c5c; }
.sub-text { font-size: 12px; color: #909399; margin-top: 2px; }
.link-text { color: #409EFF; cursor: pointer; text-decoration: underline; }
.link-text:hover { color: #79bbff; }
.link-text-sub { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.link-text-sub:hover { color: #409EFF; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination__sizes .el-select .el-input .el-input__wrapper) { background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; }
:deep(.el-pagination__editor.el-input .el-input__wrapper) { background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; }
</style>