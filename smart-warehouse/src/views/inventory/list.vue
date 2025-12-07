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
          />
        </el-form-item>
        <el-form-item label="物料分类">
          <el-select v-model="searchForm.category" placeholder="全部分类" style="width: 150px" clearable>
            <el-option label="电子元器件" value="Electronics" />
            <el-option label="机械配件" value="Mechanical" />
            <el-option label="辅料耗材" value="Consumables" />
          </el-select>
        </el-form-item>
        <el-form-item label="仓库/库区">
          <el-select v-model="searchForm.zone" placeholder="全部区域" style="width: 150px" clearable>
            <el-option label="Zone A (电子区)" value="A" />
            <el-option label="Zone B (五金区)" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="success" :icon="Download" plain>导出</el-button>
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
        <el-table-column prop="code" label="商品编码" width="140" fixed show-overflow-tooltip>
          <template #default="{ row }">
            <span class="link-text" @click="viewDetail(row)">{{ row.code }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="name" label="商品名称" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-weight: bold">{{ row.name }}</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="category" label="类型" width="120" show-overflow-tooltip />
        
        <el-table-column label="位置信息" width="180">
          <template #default="{ row }">
            <div>{{ row.zone }}</div>
            <div class="sub-text link-text-sub" @click="viewLocation(row.location)">
              <el-icon><Location /></el-icon> {{ row.location }}
            </div>
          </template>
        </el-table-column>

        <el-table-column label="总数量" width="100" align="center">
          <template #default="{ row }">
            <span style="font-weight: bold; color: #fff">{{ row.totalQty }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="可用" width="100" align="center">
          <template #default="{ row }">
            <span class="text-success">{{ row.availableQty }}</span>
          </template>
        </el-table-column>
        
        <el-table-column label="冻结" width="100" align="center">
          <template #default="{ row }">
            <span :class="row.frozenQty > 0 ? 'text-warning' : 'text-gray'">{{ row.frozenQty }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="unit" label="单位" width="70" align="center" />
        
        <el-table-column prop="updateTime" label="最新快照" width="160" show-overflow-tooltip />
        
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
          :total="100"
          :page-size="10"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, Download, View, Location } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const loading = ref(false);

const searchForm = reactive({
  keyword: '',
  category: '',
  zone: ''
});

// 模拟数据：匹配文档要求的字段结构
const tableData = reactive([
  { 
    code: 'M-2024001', name: 'STM32 控制芯片', category: '电子元器件', 
    zone: 'Zone A', location: 'A-01-04', 
    totalQty: 850, availableQty: 800, frozenQty: 50, 
    unit: 'pcs', updateTime: '2024-05-20 10:30' 
  },
  { 
    code: 'M-2024002', name: '57步进电机', category: '机械配件', 
    zone: 'Zone B', location: 'B-03-12', 
    totalQty: 120, availableQty: 120, frozenQty: 0, 
    unit: '台', updateTime: '2024-05-19 16:00' 
  },
  { 
    code: 'M-2024003', name: '工业电源 24V', category: '辅料耗材', 
    zone: 'Zone A', location: 'A-02-01', 
    totalQty: 15, availableQty: 15, frozenQty: 0, 
    unit: '台', updateTime: '2024-05-20 09:15' 
  },
  { 
    code: 'M-2024004', name: 'M4不锈钢螺丝', category: '辅料耗材', 
    zone: 'Zone B', location: 'B-05-05', 
    totalQty: 5000, availableQty: 4800, frozenQty: 200, 
    unit: '包', updateTime: '2024-05-18 14:20' 
  },
  { 
    code: 'M-2024005', name: '无线通讯模块 ESP32', category: '电子元器件', 
    zone: 'Zone A', location: 'A-01-06', 
    totalQty: 200, availableQty: 150, frozenQty: 50, 
    unit: 'pcs', updateTime: '2024-05-20 11:00' 
  }
]);

const handleSearch = () => {
  loading.value = true;
  setTimeout(() => loading.value = false, 500);
};

const resetSearch = () => {
  searchForm.keyword = '';
  searchForm.category = '';
  searchForm.zone = '';
};

// 跳转详情
const viewDetail = (row) => {
  router.push(`/inventory/detail/${row.code}`);
};

// 模拟查看库位详情
const viewLocation = (locCode) => {
  ElMessage.info(`查看库位详情: ${locCode} (功能待开发)`);
};
</script>

<style scoped>
.page-container { padding: 20px; box-sizing: border-box; }
.mb-20 { margin-bottom: 20px; }

/* 搜索卡片 */
.search-card { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-form-item__label) { color: #cfd3dc; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
}
:deep(.el-input__inner) { color: #fff; }

/* 表格卡片 */
.table-card { background: #1d1e1f; border: 1px solid #333; }

/* 表格样式穿透 */
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

/* 文字颜色工具类 */
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }
.text-gray { color: #5c5c5c; }
.sub-text { font-size: 12px; color: #909399; margin-top: 2px; }

/* 链接样式 */
.link-text { color: #409EFF; cursor: pointer; text-decoration: underline; }
.link-text:hover { color: #79bbff; }
.link-text-sub { cursor: pointer; display: flex; align-items: center; gap: 4px; }
.link-text-sub:hover { color: #409EFF; }

.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }

/* 分页暗黑适配 */
:deep(.el-pagination.is-background .el-pager li:not(.is-disabled)) { background-color: #262729; color: #cfd3dc; }
:deep(.el-pagination.is-background .el-pager li.is-active) { background-color: #409EFF; color: #fff; }
:deep(.el-pagination.is-background .btn-prev), :deep(.el-pagination.is-background .btn-next) { background-color: #262729; color: #cfd3dc; }
</style>