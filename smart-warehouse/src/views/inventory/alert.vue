<template>
  <div class="page-container">
    <el-row :gutter="20" class="mb-20">
      <el-col :span="8">
        <el-card shadow="never" class="stat-card warning-bg">
          <div class="stat-content">
            <div class="stat-title">库存预警总数</div>
            <div class="stat-num text-danger">12</div>
          </div>
          <el-icon class="stat-icon text-danger"><Warning /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card info-bg">
          <div class="stat-content">
            <div class="stat-title">呆滞积压品</div>
            <div class="stat-num text-warning">5</div>
          </div>
          <el-icon class="stat-icon text-warning"><Box /></el-icon>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="stat-card success-bg">
          <div class="stat-content">
            <div class="stat-title">本月已处理</div>
            <div class="stat-num text-success">28</div>
          </div>
          <el-icon class="stat-icon text-success"><CircleCheck /></el-icon>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="main-card">
      <div class="filter-bar mb-20">
        <div class="left-filters">
          <el-select v-model="filters.warehouse" placeholder="选择仓库" style="width: 160px; margin-right: 15px">
            <el-option label="全部仓库" value="" />
            <el-option label="Zone A" value="A" />
            <el-option label="Zone B" value="B" />
          </el-select>
          
          <el-radio-group v-model="filters.type" class="custom-radio-group">
            <el-radio-button label="all">全部</el-radio-button>
            <el-radio-button label="LOW_STOCK">📉 库存不足</el-radio-button>
            <el-radio-button label="STAGNANT">📦 呆滞积压</el-radio-button>
          </el-radio-group>
        </div>

        <div class="right-actions">
          <el-button type="primary" :icon="Refresh" @click="handleRefresh">刷新数据</el-button>
        </div>
      </div>

      <el-table :data="alertList" style="width: 100%" class="custom-table" border>
        <el-table-column prop="id" label="预警ID" width="100" show-overflow-tooltip />
        <el-table-column prop="level" label="级别" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getLevelTag(row.level)" effect="dark" size="small">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="预警类型" width="120" align="center">
           <template #default="{ row }">
            <el-tag :type="row.type === 'LOW_STOCK' ? 'danger' : 'warning'" effect="plain">
              {{ row.typeLabel }}
            </el-tag>
          </template>
        </el-table-column>
        
        <el-table-column label="物料信息" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <div><span class="text-primary font-bold">{{ row.materialCode }}</span></div>
            <div class="sub-text">{{ row.materialName }}</div>
          </template>
        </el-table-column>

        <el-table-column label="库存概况 (现存 vs 安全)" width="220">
          <template #default="{ row }">
            <div class="stock-compare">
              <span>{{ row.currentStock }}</span>
              <span class="divider">/</span>
              <span class="text-gray">安全线: {{ row.safeStock }}</span>
            </div>
            <el-progress 
              :percentage="getStockPercentage(row)" 
              :status="row.type === 'LOW_STOCK' ? 'exception' : 'warning'" 
              :stroke-width="6" 
              :show-text="false"
            />
          </template>
        </el-table-column>

        <el-table-column prop="warehouse" label="仓库" width="100" align="center" />
        <el-table-column prop="createTime" label="触发时间" width="160" />
        
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDrawer(row)">分析详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      title="预警详细分析报告"
      size="600px"
      :destroy-on-close="true"
      class="alert-drawer"
    >
      <div v-if="currentAlert" class="drawer-content">
        <div class="alert-header mb-20">
          <div class="header-row">
            <h2 class="alert-title">{{ currentAlert.materialName }}</h2>
            <el-tag :type="getLevelTag(currentAlert.level)" effect="dark">{{ currentAlert.level }} 级预警</el-tag>
          </div>
          <div class="sub-row">
            <span>预警ID: {{ currentAlert.id }}</span>
            <el-divider direction="vertical" />
            <span>触发时间: {{ currentAlert.createTime }}</span>
          </div>
        </div>

        <el-card shadow="never" class="detail-card mb-20">
          <template #header>📸 库存快照 (Snapshot)</template>
          <el-descriptions :column="2" border class="custom-desc">
            <el-descriptions-item label="当前库存">
              <span class="text-highlight">{{ currentAlert.currentStock }}</span> {{ currentAlert.unit }}
            </el-descriptions-item>
            <el-descriptions-item label="安全库存">
              {{ currentAlert.safeStock }} {{ currentAlert.unit }}
            </el-descriptions-item>
            <el-descriptions-item label="库存缺口" v-if="currentAlert.type === 'LOW_STOCK'">
              <span class="text-danger">-{{ currentAlert.gap }}</span>
            </el-descriptions-item>
            <el-descriptions-item label="呆滞天数" v-else>
              <span class="text-warning">{{ currentAlert.stagnantDays }} 天</span>
            </el-descriptions-item>
            <el-descriptions-item label="日均消耗">
              {{ currentAlert.dailyUsage }} /天
            </el-descriptions-item>
            <el-descriptions-item label="预计耗尽">
              <span class="text-danger font-bold">{{ currentAlert.depletionDate }}</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <div class="analysis-section mb-20">
          <h4 class="section-title"><el-icon><DataAnalysis /></el-icon> 触发原因分析</h4>
          <div class="analysis-text">
            {{ currentAlert.reason }}
          </div>
        </div>

        <div class="suggestion-section">
          <h4 class="section-title"><el-icon><MagicStick /></el-icon> AI 处理建议</h4>
          <el-alert
            :title="currentAlert.suggestionTitle"
            :type="currentAlert.type === 'LOW_STOCK' ? 'error' : 'warning'"
            :description="currentAlert.suggestionDesc"
            show-icon
            :closable="false"
            effect="dark"
          />
          <div class="action-buttons mt-20">
            <el-button type="primary" v-if="currentAlert.type === 'LOW_STOCK'">生成补货申请 ({{ currentAlert.gap }}pcs)</el-button>
            <el-button type="warning" v-else>发起呆滞促销</el-button>
            <el-button @click="drawerVisible = false">暂不处理</el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Warning, Box, CircleCheck, Refresh, DataAnalysis, MagicStick } from '@element-plus/icons-vue';

// 筛选状态
const filters = reactive({
  warehouse: '',
  type: 'all'
});

const drawerVisible = ref(false);
const currentAlert = ref(null);

// 模拟数据列表
const alertList = reactive([
  { 
    id: 'ALT-2024001', level: 'HIGH', type: 'LOW_STOCK', typeLabel: '库存不足',
    materialCode: 'M-2024003', materialName: '工业电源 24V', unit: '台',
    currentStock: 5, safeStock: 20, gap: 15,
    warehouse: 'Zone A', createTime: '2024-05-20 10:00'
  },
  { 
    id: 'ALT-2024002', level: 'MEDIUM', type: 'STAGNANT', typeLabel: '呆滞积压',
    materialCode: 'M-2024008', materialName: '旧款连接器', unit: '个',
    currentStock: 2000, safeStock: 500, stagnantDays: 120,
    warehouse: 'Zone B', createTime: '2024-05-18 09:00'
  },
  { 
    id: 'ALT-2024003', level: 'HIGH', type: 'LOW_STOCK', typeLabel: '库存不足',
    materialCode: 'M-2024012', materialName: 'M3 螺母', unit: '包',
    currentStock: 100, safeStock: 500, gap: 400,
    warehouse: 'Zone B', createTime: '2024-05-20 14:00'
  },
]);

// 模拟详情数据获取
const openDrawer = (row) => {
  // 这里模拟根据 ID 获取详情
  currentAlert.value = {
    ...row,
    dailyUsage: row.type === 'LOW_STOCK' ? 3 : 0, // 日均消耗
    depletionDate: row.type === 'LOW_STOCK' ? '1.6 天后' : '-', // 预计耗尽
    reason: row.type === 'LOW_STOCK' 
      ? `当前库存 (${row.currentStock}) 低于安全库存线 (${row.safeStock}) 75%，且近期日均消耗呈上升趋势。`
      : `该物料已连续 ${row.stagnantDays} 天无出库记录，占用库容 0.8m³。`,
    suggestionTitle: row.type === 'LOW_STOCK' ? '建议立即补货' : '建议清理库存',
    suggestionDesc: row.type === 'LOW_STOCK' 
      ? `建议采购数量 ${row.gap + 50} 台（含 50 安全缓冲），预计交期 3 天。`
      : '建议申请报废或降价转卖，释放 Zone B 货架空间。'
  };
  drawerVisible.value = true;
};

const handleRefresh = () => {
  // 刷新逻辑
};

// 辅助函数
const getLevelTag = (level) => {
  if (level === 'HIGH') return 'danger';
  if (level === 'MEDIUM') return 'warning';
  return 'info';
};

const getStockPercentage = (row) => {
  if (row.type === 'LOW_STOCK') {
    // 越少越危险，进度条反向显示或者显示剩余比例
    return Math.min((row.currentStock / row.safeStock) * 100, 100);
  }
  return 100; // 呆滞品通常是满的
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mt-20 { margin-top: 20px; }
.font-bold { font-weight: bold; }
.text-primary { color: #409EFF; }
.text-danger { color: #F56C6C; }
.text-warning { color: #E6A23C; }
.text-success { color: #67C23A; }
.text-gray { color: #909399; }
.text-highlight { color: #fff; font-size: 16px; font-weight: bold; }

/* 统计卡片 */
.stat-card { background-color: #1d1e1f; border: 1px solid #333; color: #fff; }
.stat-card :deep(.el-card__body) {
  display: flex; justify-content: space-between; align-items: center; padding: 20px;
}
.stat-icon { font-size: 40px; opacity: 0.8; }
.stat-title { font-size: 14px; color: #909399; }
.stat-num { font-size: 24px; font-weight: bold; margin-top: 5px; }

/* 主卡片与筛选 */
.main-card { background-color: #1d1e1f; border: 1px solid #333; min-height: 500px; }
.filter-bar { display: flex; justify-content: space-between; align-items: center; }
.left-filters { display: flex; align-items: center; }

/* =========================================
   👉 核心修复：Radio Button 暗黑样式覆盖
   ========================================= */
.custom-radio-group {
  margin-left: 10px;
}

/* 1. 默认状态：深灰背景、浅灰文字、深灰边框 */
.custom-radio-group :deep(.el-radio-button__inner) {
  background-color: #262729 !important;
  border-color: #4c4d4f !important;
  color: #cfd3dc !important;
  box-shadow: none !important; /* 去除默认的阴影 */
}

/* 2. 选中状态：蓝色背景、白色文字 */
.custom-radio-group :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409EFF !important;
  border-color: #409EFF !important;
  color: #fff !important;
  box-shadow: -1px 0 0 0 #409EFF !important; /* 修正选中时的左侧阴影条 */
}

/* 3. 悬停状态：文字变蓝 */
.custom-radio-group :deep(.el-radio-button__inner:hover) {
  color: #409EFF !important;
}

/* ========================================= */

/* 表格样式 */
:deep(.el-table) {
  background-color: transparent !important; color: #cfd3dc; --el-table-border-color: #333;
  --el-table-header-bg-color: #262729; --el-table-row-hover-bg-color: #2c3e50;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
}
:deep(.el-table th.el-table__cell) { color: #fff; font-weight: bold; }

/* 详情抽屉内部样式 */
.drawer-content { padding: 0 10px; }
.alert-header { border-bottom: 1px solid #333; padding-bottom: 15px; }
.header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
.alert-title { margin: 0; font-size: 20px; color: #fff; }
.sub-row { font-size: 12px; color: #909399; display: flex; align-items: center; }

.detail-card { background: #262729; border: 1px solid #333; color: #fff; }
:deep(.detail-card .el-card__header) { border-bottom: 1px solid #333; padding: 10px 15px; font-size: 14px; font-weight: bold; }

/* 描述列表样式适配 */
:deep(.custom-desc .el-descriptions__label) { background: #1d1e1f !important; color: #909399; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }

.section-title { margin: 0 0 10px 0; color: #fff; font-size: 15px; display: flex; align-items: center; gap: 5px; }
.analysis-text { background: rgba(64, 158, 255, 0.1); padding: 15px; border-radius: 4px; color: #cfd3dc; line-height: 1.6; border: 1px solid rgba(64, 158, 255, 0.2); }

.action-buttons { display: flex; gap: 10px; }

/* 覆盖 Element Plus Drawer 默认背景 */
:deep(.alert-drawer) { background-color: #1d1e1f !important; border-left: 1px solid #333; }
:deep(.alert-drawer .el-drawer__header) { margin-bottom: 0; border-bottom: 1px solid #333; color: #fff; }
:deep(.alert-drawer .el-drawer__title) { color: #fff; font-weight: bold; }

/* 下拉框暗黑适配 */
:deep(.el-select__wrapper) { background-color: #262729 !important; box-shadow: 0 0 0 1px #4c4d4f inset !important; }
:deep(.el-select__placeholder) { color: #cfd3dc; }
</style>