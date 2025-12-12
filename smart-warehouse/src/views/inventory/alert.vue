<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card warning-bg">
          <div class="stat-content">
            <div class="stat-title">库存预警总数</div>
            <div class="stat-num text-danger">{{ totalAlerts }}</div>
          </div>
          <el-icon class="stat-icon text-danger"><Warning /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="main-card">
      <div class="filter-bar mb-20">
        <div class="left-filters">
          <el-select 
            v-model="filters.warehouse_id" 
            placeholder="选择仓库" 
            style="width: 160px; margin-right: 15px" 
            clearable 
            @change="loadData"
          >
            <el-option 
              v-for="item in warehouseStore.warehouseList"
              :key="item.warehouse_id"
              :label="item.warehouse_name"
              :value="item.warehouse_id"
            />
          </el-select>
          
          <el-radio-group v-model="filters.alert_type" class="custom-radio-group" @change="loadData">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button label="LOW_STOCK">📉 库存不足</el-radio-button>
            <el-radio-button label="STAGNANT">📦 呆滞积压</el-radio-button>
          </el-radio-group>
        </div>

        <div class="right-actions">
          <el-button type="primary" :icon="Refresh" @click="loadData">刷新数据</el-button>
        </div>
      </div>

      <el-table :data="alertList" style="width: 100%" class="custom-table" border v-loading="loading">
        <el-table-column prop="alert_id" label="预警ID" width="100" show-overflow-tooltip />
        <el-table-column prop="level" label="级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.level)" effect="dark" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_type" label="预警类型" width="120" align="center">
           <template #default="{ row }">
            <el-tag :type="row.alert_type === 'LOW_STOCK' ? 'danger' : 'warning'" effect="plain">
              {{ row.alert_type === 'LOW_STOCK' ? '库存不足' : '呆滞积压' }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="物料信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div><span class="text-primary font-bold">{{ row.goods_code }}</span></div>
            <div class="sub-text">{{ row.goods_name }}</div>
          </template>
        </el-table-column>

        <el-table-column label="库存概况 (现存 vs 安全)" width="220">
          <template #default="{ row }">
            <div class="stock-compare">
              <span>{{ row.current_stock }}</span>
              <span class="divider">/</span>
              <span class="text-gray">安全线: {{ row.safety_stock }}</span>
            </div>
            <el-progress 
              v-if="row.alert_type === 'LOW_STOCK' && row.safety_stock > 0"
              :percentage="Math.min((row.current_stock / row.safety_stock) * 100, 100)" 
              status="exception"
              :stroke-width="6" 
              :show-text="false"
            />
          </template>
        </el-table-column>

        <el-table-column label="仓库" width="100" align="center">
          <template #default="{ row }">
            {{ getWarehouseName(row.warehouse_id) }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="触发时间" width="160">
          <template #default="{ row }">
             {{ formatTime(row.created_at) }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDrawer(row)">分析详情</el-button>
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

    <el-drawer
      v-model="drawerVisible"
      title="预警详细分析报告"
      size="600px"
      :destroy-on-close="true"
      class="alert-drawer"
    >
      <div v-if="currentAlert" class="drawer-content" v-loading="drawerLoading">
        <div class="alert-header mb-20">
          <div class="header-row">
            <h2 class="alert-title">{{ currentAlert.goods_name }}</h2>
            <el-tag :type="getLevelTag(currentAlert.level)" effect="dark">{{ currentAlert.level }} 级预警</el-tag>
          </div>
          <div class="sub-row">
            <span>预警ID: {{ currentAlert.alert_id }}</span>
            <el-divider direction="vertical" />
            <span>触发时间: {{ formatTime(currentAlert.created_at) }}</span>
          </div>
        </div>

        <el-card shadow="never" class="detail-card mb-20">
          <template #header>📸 库存快照 (Snapshot)</template>
          <el-descriptions :column="2" border class="custom-desc">
            <el-descriptions-item label="当前库存">
              <span class="text-highlight">{{ currentAlert.current_stock }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="安全库存">
              {{ currentAlert.safety_stock }}
            </el-descriptions-item>
            <el-descriptions-item label="缺口/冗余">
              <span class="text-danger font-bold">{{ currentAlert.gap }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="分析结论">
              <span class="text-warning">{{ currentAlert.reason || '库存异常' }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <div class="suggestion-section">
          <h4 class="section-title"><el-icon><MagicStick /></el-icon> AI 智能决策建议</h4>
          
          <div v-if="currentAlert.suggestions && currentAlert.suggestions.action" class="ai-suggestion-box">
            
            <div class="suggestion-header">
              <span class="suggestion-action">
                <el-icon class="mr-5"><VideoPlay /></el-icon> 
                {{ currentAlert.suggestions.action }}
              </span>
              <el-tag :type="getUrgencyTag(currentAlert.suggestions.urgency)" effect="dark" size="small">
                {{ getUrgencyLabel(currentAlert.suggestions.urgency) }} 级
              </el-tag>
            </div>

            <div class="suggestion-body">
              <p class="suggestion-reason">{{ currentAlert.suggestions.reason }}</p>
              
              <div class="suggestion-metrics">
                
                <template v-if="currentAlert.alert_type === 'LOW_STOCK'">
                  <div class="metric-item">
                    <div class="label">推荐补货量</div>
                    <div class="value text-success">+{{ currentAlert.suggestions.recommended_quantity || '-' }}</div>
                  </div>
                  <div class="metric-item">
                    <div class="label">预计耗时</div>
                    <div class="value">{{ currentAlert.suggestions.estimated_days || '-' }} 天</div>
                  </div>
                </template>

                <template v-else-if="currentAlert.alert_type === 'STAGNANT'">
                  <div class="metric-item" v-if="currentAlert.suggestions.discount">
                    <div class="label">建议折扣</div>
                    <div class="value text-warning">{{ currentAlert.suggestions.discount }}</div>
                  </div>
                  <div class="metric-item">
                    <div class="label">预计清理周期</div>
                    <div class="value">{{ currentAlert.suggestions.estimated_days || '3' }} 天内</div>
                  </div>
                </template>

              </div>
              
              </div>

            <div class="suggestion-footer">
               <el-button type="primary" size="default" @click="handleAction(currentAlert.suggestions)">
                 执行: {{ currentAlert.suggestions.action }}
               </el-button>
            </div>

          </div>
          
          <div v-else class="empty-suggestion">
            <el-empty description="暂无智能建议" :image-size="60" />
          </div>

        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Warning, Refresh, MagicStick, VideoPlay } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { getInventoryAlerts, getInventoryAlertDetail } from '@/api/inventory';
import { useWarehouseStore } from '@/stores/warehouse';

const warehouseStore = useWarehouseStore();

const loading = ref(false);
const drawerLoading = ref(false);
const filters = reactive({
  warehouse_id: '',
  alert_type: '', 
  page: 1,
  page_size: 10
});

const total = ref(0);
const totalAlerts = ref(0); 
const alertList = ref([]);
const drawerVisible = ref(false);
const currentAlert = ref(null);

const getWarehouseName = (id) => {
  const found = warehouseStore.warehouseList.find(w => w.warehouse_id === id);
  return found ? found.warehouse_name : `WH-${id}`;
};

const getLevelTag = (level) => {
  if (level === 'HIGH') return 'danger';
  if (level === 'MEDIUM') return 'warning';
  return 'info';
};

// 紧急度中文映射
const getUrgencyLabel = (val) => {
  const map = { 
    'CRITICAL': '临界', 
    'HIGH': '高', 
    'MEDIUM': '中', 
    'LOW': '低' 
  };
  return map[val] || val;
};

// 紧急度颜色映射
const getUrgencyTag = (val) => {
  if (val === 'CRITICAL' || val === 'HIGH') return 'danger';
  if (val === 'MEDIUM') return 'warning';
  return 'info';
};

const formatTime = (timeStr) => {
  if(!timeStr) return '-';
  return timeStr.replace('T', ' ').substring(0, 19);
};

const loadData = async () => {
  loading.value = true;
  try {
    const params = {
      page: filters.page,
      page_size: filters.page_size,
      warehouse_id: filters.warehouse_id || undefined,
      alert_type: filters.alert_type || undefined
    };
    const res = await getInventoryAlerts(params);
    if (res.code === 200) {
      alertList.value = res.data.items;
      total.value = res.data.total;
      totalAlerts.value = res.data.total; 
    }
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
};

const openDrawer = async (row) => {
  drawerVisible.value = true;
  drawerLoading.value = true;
  currentAlert.value = null;
  try {
    const res = await getInventoryAlertDetail(row.alert_id);
    if (res.code === 200) {
      // 直接使用后端返回的扁平结构
      currentAlert.value = res.data;
    }
  } catch (e) {
    console.error(e);
    ElMessage.error('获取详情失败');
  } finally {
    drawerLoading.value = false;
  }
};

const handleAction = (suggestion) => {
  ElMessage.success(`已发起: ${suggestion.action}`);
};

onMounted(() => {
  warehouseStore.fetchWarehouses();
  loadData();
});
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mr-5 { margin-right: 5px; }

/* 统计卡片 */
.stat-card { background-color: #1d1e1f; border: 1px solid #333; color: #fff; }
.stat-card :deep(.el-card__body) { display: flex; justify-content: space-between; align-items: center; padding: 20px; }
.stat-icon { font-size: 40px; opacity: 0.8; }
.stat-title { font-size: 14px; color: #909399; }
.stat-num { font-size: 24px; font-weight: bold; margin-top: 5px; }

/* 筛选与列表 */
.main-card { background-color: #1d1e1f; border: 1px solid #333; min-height: 500px; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }
.left-filters { display: flex; align-items: center; }
.custom-radio-group { margin-left: 10px; }
.custom-radio-group :deep(.el-radio-button__inner) { background-color: #262729 !important; border-color: #4c4d4f !important; color: #cfd3dc !important; box-shadow: none !important; }
.custom-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { background-color: #409EFF !important; border-color: #409EFF !important; color: #fff !important; box-shadow: -1px 0 0 0 #409EFF !important; }

/* 表格样式 */
:deep(.el-table) { background-color: transparent !important; color: #cfd3dc; --el-table-border-color: #333; --el-table-header-bg-color: #262729; --el-table-row-hover-bg-color: #2c3e50; }
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) { background-color: transparent !important; }
:deep(.el-table th.el-table__cell) { color: #fff; font-weight: bold; }
.text-primary { color: #409EFF; }
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.text-success { color: #67C23A; }
.text-gray { color: #909399; }
.font-bold { font-weight: bold; }
.sub-text { font-size: 12px; color: #909399; }
.stock-compare { display: flex; align-items: center; gap: 5px; margin-bottom: 5px; }

/* 详情抽屉样式 */
:deep(.alert-drawer) { background-color: #1d1e1f !important; border-left: 1px solid #333; }
:deep(.alert-drawer .el-drawer__header) { margin-bottom: 0; border-bottom: 1px solid #333; color: #fff; }
:deep(.alert-drawer .el-drawer__title) { color: #fff; font-weight: bold; }
.drawer-content { padding: 0 10px; }
.alert-header { border-bottom: 1px solid #333; padding-bottom: 15px; }
.header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.alert-title { margin: 0; font-size: 20px; color: #fff; }
.sub-row { font-size: 12px; color: #909399; display: flex; align-items: center; }

/* 快照卡片 */
.detail-card { background: #262729; border: 1px solid #333; color: #fff; }
:deep(.detail-card .el-card__header) { border-bottom: 1px solid #333; padding: 10px 15px; font-size: 14px; font-weight: bold; }
:deep(.custom-desc .el-descriptions__label) { background: #1d1e1f !important; color: #909399; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }
.text-highlight { color: #fff; font-size: 16px; font-weight: bold; }

/* AI 建议卡片 */
.section-title { margin: 10px 0 15px 0; color: #fff; font-size: 15px; display: flex; align-items: center; gap: 5px; }
.ai-suggestion-box {
  background: linear-gradient(145deg, #1f2a38, #161b22);
  border: 1px solid #3a4d63;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.suggestion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px dashed #3a4d63;
  padding-bottom: 10px;
}

.suggestion-action {
  font-size: 16px;
  font-weight: bold;
  color: #409EFF;
  display: flex;
  align-items: center;
}

.suggestion-reason {
  font-size: 14px;
  color: #cfd3dc;
  margin-bottom: 15px;
  line-height: 1.5;
}

.suggestion-metrics {
  display: flex;
  gap: 20px;
  background: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 4px;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.metric-item .label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 2px;
}

.metric-item .value {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
}

.suggestion-footer {
  margin-top: 15px;
  text-align: right;
}

.empty-suggestion {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 20px;
}
:deep(.el-select__wrapper) { background-color: #262729 !important; box-shadow: 0 0 0 1px #4c4d4f inset !important; }
:deep(.el-select__placeholder) { color: #cfd3dc; }
</style>