<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select 
            v-model="filters.warehouse_id" 
            placeholder="全部" 
            style="width: 120px" 
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
        <el-form-item label="商品ID">
          <el-input v-model="filters.goods_id" placeholder="输入ID" clearable style="width: 140px" />
        </el-form-item>
        <el-form-item label="紧急度">
          <el-select v-model="filters.urgency" placeholder="全部" style="width: 100px" clearable>
            <el-option label="紧急" value="CRITICAL" />
            <el-option label="高" value="HIGH" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="低" value="LOW" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
          <el-button type="warning" :icon="Setting" plain @click="openConfigDialog">预测配置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="list-card">
      <el-table 
        :data="tableData" 
        style="width: 100%" 
        class="custom-table" 
        border 
        v-loading="loading"
      >
        <el-table-column prop="recommendation_id" label="建议ID" width="100" fixed show-overflow-tooltip />
        
        <el-table-column label="物料信息" min-width="220" show-overflow-tooltip>
          <template #default="{ row }">
            <div><span class="text-primary font-bold">{{ row.goods_code || `ID: ${row.goods_id}` }}</span></div>
            <div class="sub-text">{{ row.goods_name || '-' }}</div>
          </template>
        </el-table-column>

        <el-table-column label="仓库" min-width="140" align="center">
          <template #default="{ row }">
            {{ getWarehouseName(row.warehouse_id) }}
          </template>
        </el-table-column>

        <el-table-column label="库存概况 (现存/安全)" min-width="180" align="center">
          <template #default="{ row }">
            <div class="stock-compare">
              <span :class="row.current_stock < row.safety_stock ? 'text-danger' : ''">{{ row.current_stock }}</span>
              <span class="divider">/</span>
              <span class="text-gray">{{ row.safety_stock }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="recommended_quantity" label="推荐补货量" min-width="140" align="center">
          <template #default="{ row }">
            <span class="font-bold text-success">+{{ row.recommended_quantity }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="urgency" label="紧急程度" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="getUrgencyTag(row.urgency)" effect="dark" size="small">
              {{ getUrgencyLabel(row.urgency) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" min-width="120" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === '待处理' ? 'warning' : 'success'" effect="plain" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="goDetail(row)">查看详情</el-button>
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

    <el-dialog
      v-model="configDialogVisible"
      title="⚙️ 补货预测策略配置"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="config-container">
        <div class="mb-20 flex justify-between">
          <el-alert 
            title="关闭预测的商品将不再生成补货建议 (演示模式)" 
            type="warning" 
            effect="dark"
            show-icon 
            :closable="false"
            style="margin-bottom: 15px; flex: 1; margin-right: 20px;"
          />
          <el-form :inline="true" :model="configFilters" class="search-form" style="flex-shrink: 0;">
            <el-form-item>
              <el-input 
                v-model="configFilters.keyword" 
                placeholder="商品名称/编码" 
                :prefix-icon="Search" 
                clearable 
                @keyup.enter="loadConfigList"
              />
            </el-form-item>
            <el-form-item>
              <el-select 
                v-model="configFilters.warehouse_id" 
                placeholder="仓库" 
                style="width: 120px" 
                clearable 
                @change="loadConfigList"
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
              <el-button type="primary" @click="loadConfigList">搜索</el-button>
            </el-form-item>
          </el-form>
        </div>

        <el-table 
          :data="configTableData" 
          v-loading="configLoading" 
          border 
          height="400"
          style="width: 100%;margin-bottom: 20px;"
        >
          <el-table-column prop="goods_code" label="商品编码" width="140" show-overflow-tooltip />
          <el-table-column prop="goods_name" label="商品名称" min-width="150" show-overflow-tooltip />
          <el-table-column label="所属仓库" width="120" align="center">
            <template #default="{ row }">
              {{ getWarehouseName(row.warehouse_id) }}
            </template>
          </el-table-column>
          <el-table-column label="是否参与预测" width="150" align="center">
            <template #default="{ row }">
              <el-switch
                v-model="row.enabled"
                inline-prompt
                active-text="开启"
                inactive-text="关闭"
                :loading="row.switching"
                @change="handleConfigChange(row)"
              />
            </template>
          </el-table-column>
        </el-table>

        <div class="pagination-container mt-20" style="display:flex; justify-content:flex-end;">
          <el-pagination
            small
            background
            layout="prev, pager, next"
            :total="configTotal"
            :page-size="configFilters.page_size"
            v-model:current-page="configFilters.page"
            @current-change="loadConfigList"
          />
        </div>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button type="primary" @click="configDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Search, Refresh, View, Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getReplenishmentList } from '@/api/replenishment';
import { getInventoryList } from '@/api/inventory';
import { useWarehouseStore } from '@/stores/warehouse'; 

const router = useRouter();
const warehouseStore = useWarehouseStore(); 

const loading = ref(false);
const total = ref(0);
const tableData = ref([]);

const filters = reactive({
  warehouse_id: '',
  goods_id: '',
  urgency: '',
  page: 1,
  page_size: 10
});

// --- 配置弹窗相关状态 ---
const configDialogVisible = ref(false);
const configLoading = ref(false);
const configTotal = ref(0);
const configTableData = ref([]);
const configFilters = reactive({
  keyword: '',
  warehouse_id: '',
  page: 1,
  page_size: 10
});

const openConfigDialog = () => {
  configDialogVisible.value = true;
  // 打开时加载商品列表
  loadConfigList();
};

const loadConfigList = async () => {
  configLoading.value = true;
  try {
    // 构造查询参数 (复用库存列表的智能搜索逻辑)
    let codeParam = undefined;
    let nameParam = undefined;
    
    if (configFilters.keyword) {
      if (/^[0-9]+$/.test(configFilters.keyword) || configFilters.keyword.toUpperCase().startsWith('MAT-')) {
         codeParam = configFilters.keyword;
      } else {
         nameParam = configFilters.keyword;
      }
    }

    const params = {
      page: configFilters.page,
      page_size: configFilters.page_size,
      warehouse_id: configFilters.warehouse_id || undefined,
      goods_code: codeParam,
      goods_name: nameParam
    };

    const res = await getInventoryList(params);
    
    if (res.code === 200) {
      // 映射数据，并添加模拟的 enabled 状态
      configTableData.value = (res.data.items || []).map(item => ({
        id: item.goods_id,
        goods_code: item.goods_code,
        goods_name: item.goods_name,
        warehouse_id: item.warehouse_id,
        enabled: true,
        switching: false
      }));
      configTotal.value = res.data.total;
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('加载商品列表失败');
  } finally {
    configLoading.value = false;
  }
};

//开关切换 (纯前端模拟，不调后端)
const handleConfigChange = async (row) => {
  row.switching = true;
  try {
    // 模拟网络延迟效果
    await new Promise(resolve => setTimeout(resolve, 600));
    ElMessage.success(`${row.goods_name} 预测配置已更新`);
  } catch (error) {
    console.error(error);
    row.enabled = !row.enabled; // 回滚状态
    ElMessage.error('设置失败');
  } finally {
    row.switching = false;
  }
};

// --- 通用 Helper 函数 ---

const getWarehouseName = (id) => {
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

const getUrgencyLabel = (val) => {
  const map = { 'CRITICAL': '临界', 'HIGH': '高', 'MEDIUM': '中', 'LOW': '低' };
  return map[val] || val;
};

const getUrgencyTag = (val) => {
  const map = { 
    '高': 'danger', 
    '紧急': 'danger', 
    '中': 'warning', 
    '低': 'success' 
  };
  return map[val] || 'info';
};

const getStatusLabel = (val) => {
  const map = { 'PENDING': '待处理', 'COMPLETED': '已完成' };
  return map[val] || val;
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: filters.page,
      page_size: filters.page_size,
      warehouse_id: filters.warehouse_id || undefined,
      goods_id: filters.goods_id || undefined,
      urgency: filters.urgency || undefined
    };
    
    const res = await getReplenishmentList(params);
    if (res.code === 200) {
      tableData.value = res.data.items;
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
  filters.goods_id = '';
  filters.urgency = '';
  handleSearch();
};

const goDetail = (row) => {
  router.push({
    path: `/replenishment/recommendations/${row.recommendation_id}`,
    query: { 
      warehouse_id: row.warehouse_id 
    }
  });
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

.text-primary {
  color: #409EFF;
}

.text-danger {
  color: #F56C6C;
}

.text-success {
  color: #67C23A;
}

.text-gray {
  color: #636b7a;
}

.font-bold {
  font-weight: bold;
}

.sub-text {
  font-size: 12px;
  color: #909399;
}

.stock-compare {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

/* 居中对齐 */
.divider {
  margin: 0 5px;
  color: #555;
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

:deep(.el-dialog) {
  background-color: #1d1e1f;
  border: 1px solid #333;
}

:deep(.el-dialog__title) {
  color: #fff;
}

:deep(.el-dialog__body) {
  padding-top: 10px;
}
</style>