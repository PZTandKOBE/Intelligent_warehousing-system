<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select v-model="filters.warehouse" placeholder="全部仓库" style="width: 160px" clearable>
            <el-option label="Zone A (电子区)" value="A" />
            <el-option label="Zone B (五金区)" value="B" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            style="width: 260px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="calendar-card">
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click.stop="openDayDetail(data.day)">
            <div class="day-num">{{ data.day.split('-').slice(2).join('') }}</div>
            
            <div class="plan-events">
              <div 
                v-for="plan in getPlansByDate(data.day)" 
                :key="plan.id"
                class="plan-tag"
                :class="plan.type === 'URGENT' ? 'urgent' : 'normal'"
              >
                <span class="dot"></span>
                <span class="text">
                  {{ plan.materialName }} x {{ plan.qty }}
                </span>
              </div>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>

    <el-drawer
      v-model="drawerVisible"
      :title="`📅 补货计划详情 (${currentDate})`"
      size="600px"
      destroy-on-close
      class="plan-drawer"
    >
      <div class="drawer-content">
        <el-table :data="currentDatePlans" style="width: 100%" class="custom-table" border>
          <el-table-column prop="materialName" label="物料名称" min-width="150" />
          <el-table-column prop="qty" label="计划数量" width="100" align="center">
            <template #default="{ row }">
              <span class="text-success font-bold">+{{ row.qty }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === 'URGENT' ? 'danger' : 'primary'" size="small" effect="dark">
                {{ row.type === 'URGENT' ? '紧急插单' : '常规补货' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'DONE' ? 'success' : 'warning'" size="small" effect="plain">
                {{ row.status === 'DONE' ? '已入库' : '待执行' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const calendarDate = ref(new Date('2023-12-01')); // 模拟数据时间
const drawerVisible = ref(false);
const currentDate = ref('');
const currentDatePlans = ref([]);

const filters = reactive({
  warehouse: '',
  dateRange: []
});

// 模拟数据
const planList = [
  { id: 'P-001', date: '2023-12-04', materialName: 'STM32 芯片', qty: 500, type: 'URGENT', status: 'PENDING' },
  { id: 'P-002', date: '2023-12-04', materialName: 'M3 螺母', qty: 2000, type: 'NORMAL', status: 'PENDING' },
  { id: 'P-003', date: '2023-12-01', materialName: '工业电源', qty: 50, type: 'NORMAL', status: 'DONE' },
  { id: 'P-004', date: '2023-12-10', materialName: '散热风扇', qty: 100, type: 'NORMAL', status: 'PENDING' },
];

const getPlansByDate = (dateStr) => {
  return planList.filter(item => item.date === dateStr);
};

const openDayDetail = (dateStr) => {
  const plans = getPlansByDate(dateStr);
  if (plans.length === 0) return;
  
  currentDate.value = dateStr;
  currentDatePlans.value = plans;
  drawerVisible.value = true;
};

const handleSearch = () => {
  ElMessage.success('日历数据已刷新');
};

const resetSearch = () => {
  filters.warehouse = '';
  filters.dateRange = [];
};
</script>

<style scoped>
.page-container { 
  height: 100%; 
  box-sizing: border-box;
  padding: 20px; 
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}

.mb-20 { margin-bottom: 20px; }

/* --- 核心修复：导航栏高度与居中 --- */
.search-card { 
  background: #1d1e1f; 
  border: 1px solid #333; 
  flex-shrink: 0; 
}

.search-card :deep(.el-card__body) {
  height: 80px;  /* 固定高度，显得大气 */
  display: flex;
  align-items: center; /* 垂直居中 */
  padding: 0 20px;
}

/* 强制移除 form-item 默认的底部间距，防止 Flex 居中后还是偏上 */
.search-form :deep(.el-form-item) {
  margin-bottom: 0 !important;
  margin-right: 20px;
}
/* ---------------------------------- */

/* 日历卡片自适应高度 */
.calendar-card { 
  flex: 1; 
  background: #1d1e1f; 
  border: 1px solid #333; 
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-card__body) {
  flex: 1; 
  padding: 0; 
  overflow-y: auto;
}

/* 日历样式覆盖 */
:deep(.el-calendar) { background-color: transparent; --el-calendar-border: 1px solid #333; --el-calendar-selected-bg-color: #2c3e50; }
:deep(.el-calendar__header) { border-bottom: 1px solid #333; padding: 12px 20px; }
:deep(.el-calendar__title) { color: #fff; font-weight: bold; }
:deep(.el-calendar__button-group .el-button) { background-color: #262729; border-color: #4c4d4f; color: #cfd3dc; }
:deep(.el-calendar__button-group .el-button:hover) { color: #409EFF; border-color: #409EFF; }
:deep(.el-calendar__body) { padding: 0; }
:deep(.el-calendar-table thead th) { color: #909399; }
:deep(.el-calendar-table td.el-calendar-day) { height: 120px; padding: 5px; box-sizing: border-box; border-bottom: 1px solid #333; border-right: 1px solid #333; transition: background 0.3s; }
:deep(.el-calendar-table td:hover) { background-color: #262729; cursor: pointer; }
:deep(.el-calendar-table td.is-selected) { background-color: #2c3e50; }

/* 日历单元格内容 */
.calendar-cell { height: 100%; display: flex; flex-direction: column; }
.day-num { font-size: 14px; color: #909399; margin-bottom: 4px; text-align: right; margin-right: 5px; }
.plan-events { flex: 1; overflow-y: auto; }

.plan-tag {
  font-size: 12px; margin-bottom: 3px; padding: 2px 4px; border-radius: 4px;
  display: flex; align-items: center; background-color: #333; color: #ccc;
  border-left: 3px solid #909399;
}
.plan-tag.urgent { background-color: rgba(245, 108, 108, 0.2); color: #f89898; border-left-color: #F56C6C; }
.plan-tag.normal { background-color: rgba(64, 158, 255, 0.2); color: #a0cfff; border-left-color: #409EFF; }

.text-success { color: #67C23A; }
.font-bold { font-weight: bold; }

/* 表单组件暗黑适配 */
:deep(.el-form-item__label) { color: #cfd3dc; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) { 
  background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; color: #fff; 
}
:deep(.el-input__inner) { color: #fff; }
:deep(.el-range-input) { color: #fff; background: transparent; }
:deep(.el-range-separator) { color: #909399; }

/* 抽屉样式 */
:deep(.plan-drawer) { background-color: #1d1e1f !important; border-left: 1px solid #333; }
:deep(.plan-drawer .el-drawer__header) { margin-bottom: 0; border-bottom: 1px solid #333; color: #fff; }
:deep(.plan-drawer .el-drawer__title) { color: #fff; font-weight: bold; }
.drawer-content { padding: 20px; }

/* 表格样式 */
:deep(.el-table) {
  background-color: transparent !important; color: #cfd3dc; --el-table-border-color: #333;
  --el-table-header-bg-color: #262729; --el-table-row-hover-bg-color: #2c3e50;
}
:deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important;
  border-bottom: 1px solid #333 !important;
  border-right: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; font-weight: bold; }
</style>