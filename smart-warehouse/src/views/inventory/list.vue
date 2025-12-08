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
            style="width: 220px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        
        <el-form-item label="物料分类">
          <el-select v-model="searchForm.category" placeholder="全部分类" style="width: 150px" clearable>
            <el-option label="电子元器件" value="Electronics" />
            <el-option label="机械配件" value="Mechanical" />
            <el-option label="辅料耗材" value="Consumables" />
          </el-select>
        </el-form-item>

        <el-form-item label="仓库">
          <el-select v-model="searchForm.warehouse_id" placeholder="全部仓库" style="width: 150px" clearable>
            <el-option label="Zone A (电子区)" :value="1" />
            <el-option label="Zone B (五金区)" :value="2" />
          </el-select>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          
          <el-button-group class="ml-10">
            <el-button type="success" :icon="Document" plain @click="handleExportExcel">导出 Excel</el-button>
            <el-button type="danger" :icon="Download" plain @click="handleExportPDF">导出 PDF</el-button>
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

        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          background
          layout="total, prev, pager, next"
          :total="total"
          :page-size="searchForm.page_size"
          v-model:current-page="searchForm.page"
          @current-change="loadData"
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
import * as XLSX from 'xlsx'; // Excel 库
import jsPDF from 'jspdf';     // PDF 库
import autoTable from 'jspdf-autotable'; // PDF 表格插件

// 引入 API
import { getInventoryList /*, exportInventoryData */ } from '@/api/inventory';

const router = useRouter();
const loading = ref(false);
const total = ref(0);
const tableData = ref([]);

const searchForm = reactive({
  keyword: '',
  category: '',
  warehouse_id: '',
  page: 1,
  page_size: 10
});

// 辅助函数：ID转名称
const getWarehouseName = (id) => {
  const map = { 1: 'Zone A (电子区)', 2: 'Zone B (五金区)' };
  return map[id] || `WH-${id}`;
};

// 加载数据列表
const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: searchForm.page,
      page_size: searchForm.page_size,
      warehouse_id: searchForm.warehouse_id || undefined,
      goods_name: searchForm.keyword || undefined,
      goods_type: searchForm.category || undefined
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
  handleSearch();
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
      '冻结库存': item.frozen_total_number
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
 * 导出 PDF (核心修改部分)
 */
const handleExportPDF = async () => {
  if (tableData.value.length === 0) {
    ElMessage.warning('当前暂无数据可导出');
    return;
  }

  const doc = new jsPDF();

  try {
    ElMessage.info('正在加载字体并生成 PDF...');

    // 1. 读取 public/fonts/SimHei.ttf 字体文件
    // 注意：这里的路径必须相对于 public 目录
    const response = await fetch('/fonts/SimHei.ttf');
    if (!response.ok) {
      throw new Error('字体文件加载失败，请检查 public/fonts/SimHei.ttf 是否存在');
    }
    const fontBuffer = await response.arrayBuffer();

    // 2. 将字体添加到 jsPDF 虚拟文件系统
    // addFileToVFS(文件名, Base64字符串)
    // 这里我们将 ArrayBuffer 转为 Base64
    const fontBase64 = arrayBufferToBase64(fontBuffer);
    doc.addFileToVFS('SimHei.ttf', fontBase64);

    // 3. 注册字体 (字体名, 样式, 内部调用名)
    doc.addFont('SimHei.ttf', 'SimHei', 'normal');
    
    // 4. 设置当前字体
    doc.setFont('SimHei');

    // 5. 准备表格数据
    const tableColumn = ["商品编码", "商品名称", "类型", "仓库", "库位", "总库存", "可用", "冻结"];
    const tableRows = tableData.value.map(item => [
      item.goods_code,
      item.goods_name,
      item.goods_type || '-',
      getWarehouseName(item.warehouse_id),
      item.storage_code || '-',
      String(item.total_number),
      String(item.available_total_number),
      String(item.frozen_total_number)
    ]);

    // 6. 生成表格
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { 
        font: 'SimHei', // 关键：指定表格内容使用我们刚才注册的字体
        fontStyle: 'normal',
        fontSize: 10 
      },
      headStyles: {
        fillColor: [64, 158, 255], // Element Plus Primary Color
        font: 'SimHei', // 表头也要指定字体
        textColor: 255
      }
    });

    // 7. 添加标题
    doc.setFontSize(18);
    doc.text("库存清单报表", 14, 15);

    // 8. 保存文件
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`库存清单_${dateStr}.pdf`);
    
    ElMessage.success('PDF 导出成功');

  } catch (error) {
    console.error('PDF 导出失败:', error);
    ElMessage.error('PDF 导出失败：' + error.message);
  }
};

// 工具函数：ArrayBuffer 转 Base64
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
.ml-10 { margin-left: 10px; } /* 新增间距样式 */

/* 搜索卡片样式 */
.search-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-form-item__label) { color: #cfd3dc; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
}
:deep(.el-input__inner) { color: #fff; }

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
</style>