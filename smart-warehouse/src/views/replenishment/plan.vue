<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <el-form :inline="true" :model="filters" class="search-form">
        <el-form-item label="仓库">
          <el-select 
            v-model="filters.warehouse_id" 
            placeholder="选择仓库" 
            style="width: 160px" 
            @change="handleSearch"
          >
            <el-option label="Zone A (电子区)" :value="1" />
            <el-option label="Zone B (五金区)" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width: 260px"
            @change="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="calendar-card" v-loading="loading">
      <el-calendar v-model="calendarDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click.stop="openDayDetail(data.day)">
            <div class="day-num">{{ data.day.split('-').slice(2).join('') }}</div>
            
            <div class="plan-events">
              <div 
                v-for="plan in getPlansByDate(data.day)" 
                :key="plan.plan_id"
                class="plan-tag normal"
              >
                <span class="dot"></span>
                <span class="text">
                  {{ plan.goods_name || `Goods-${plan.goods_id}` }} x {{ plan.planned_quantity }}
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
          <el-table-column prop="goods_id" label="商品ID" width="100" />
          <el-table-column prop="goods_name" label="商品名称" min-width="120">
             <template #default="{ row }">{{ row.goods_name || '-' }}</template>
          </el-table-column>
          
          <el-table-column label="仓库" width="100">
             <template #default="{ row }">{{ getWarehouseName(row.warehouse_id) }}</template>
          </el-table-column>
          
          <el-table-column prop="planned_quantity" label="计划数量" width="120" align="center">
            <template #default="{ row }">
              <span class="text-success font-bold">+{{ row.planned_quantity }}</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'" size="small" effect="plain">
                {{ row.status || '待执行' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue';
import { Search, Refresh } from '@element-plus/icons-vue';
import { getReplenishmentPlans } from '@/api/replenishment';
import { ElMessage } from 'element-plus'; // 引入消息提示
import dayjs from 'dayjs';

const calendarDate = ref(new Date());
const drawerVisible = ref(false);
const currentDate = ref('');
const currentDatePlans = ref([]);
const loading = ref(false);
const planList = ref([]);

const filters = reactive({
  // ⚠️ 核心修复：这里必须给默认值 1，对应 Zone A
  warehouse_id: 1, 
  dateRange: []
});

const getWarehouseName = (id) => {
  const map = { 1: 'Zone A', 2: 'Zone B' };
  return map[id] || `WH-${id}`;
};

const getPlansByDate = (dateStr) => {
  return planList.value.filter(item => item.planned_date === dateStr);
};

const loadPlans = async () => {
  // ⚠️ 防御性编程：如果没有 warehouse_id，直接提示并返回，防止发错误的请求
  if (!filters.warehouse_id) {
    ElMessage.warning('请选择仓库');
    return;
  }

  loading.value = true;
  try {
    let start, end;
    if (filters.dateRange && filters.dateRange.length === 2) {
      start = filters.dateRange[0];
      end = filters.dateRange[1];
    } else {
      const current = dayjs(calendarDate.value);
      // 缩小查询范围为当前月的前后，避免一次查太多
      start = current.startOf('month').format('YYYY-MM-DD');
      end = current.endOf('month').format('YYYY-MM-DD');
    }

    const params = {
      start_date: start,
      end_date: end,
      warehouse_id: String(filters.warehouse_id), // 显式转为字符串
      page: 1,
      page_size: 100 // 调小一点 page_size，防止后端处理压力过大报 422
    };

    console.log('Sending API Request:', params); // 调试用：请在控制台看打印出的参数

    const res = await getReplenishmentPlans(params);
    if (res.code === 200) {
      planList.value = res.data.items || [];
    }
  } catch (e) {
    console.error('加载日历失败:', e);
    // 可以在这里打印 e.response.data 看看后端具体报什么错
  } finally {
    loading.value = false;
  }
};

const openDayDetail = (dateStr) => {
  const plans = getPlansByDate(dateStr);
  if (plans.length === 0) return;
  
  currentDate.value = dateStr;
  currentDatePlans.value = plans;
  drawerVisible.value = true;
};

const handleSearch = () => {
  loadPlans();
};

const resetSearch = () => {
  filters.warehouse_id = 1; // 重置时也要保持默认值
  filters.dateRange = [];
  calendarDate.value = new Date();
  loadPlans();
};

watch(calendarDate, () => {
  if (!filters.dateRange || filters.dateRange.length === 0) {
    loadPlans();
  }
});

onMounted(() => {
  loadPlans();
});
</script>

<style scoped>
/* 样式保留 */
.page-container { 
  height: 100%; 
  box-sizing: border-box;
  padding: 20px; 
  display: flex;
  flex-direction: column;
  overflow: hidden; 
}
.mb-20 { margin-bottom: 20px; }
.search-card { 
  background: #1d1e1f; 
  border: 1px solid #333; 
  flex-shrink: 0; 
}
.search-card :deep(.el-card__body) {
  height: 80px; 
  display: flex;
  align-items: center; 
  padding: 0 20px;
}
.search-form :deep(.el-form-item) {
  margin-bottom: 0 !important;
  margin-right: 20px;
}
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
.calendar-cell { height: 100%; display: flex; flex-direction: column; }
.day-num { font-size: 14px; color: #909399; margin-bottom: 4px; text-align: right; margin-right: 5px; }
.plan-events { flex: 1; overflow-y: auto; }
.plan-tag {
  font-size: 12px; margin-bottom: 3px; padding: 2px 4px; border-radius: 4px;
  display: flex; align-items: center; background-color: #333; color: #ccc;
  border-left: 3px solid #909399;
}
.plan-tag.normal { background-color: rgba(64, 158, 255, 0.2); color: #a0cfff; border-left-color: #409EFF; }
.text-success { color: #67C23A; }
.font-bold { font-weight: bold; }
:deep(.el-form-item__label) { color: #cfd3dc; }
:deep(.el-input__wrapper), :deep(.el-select__wrapper), :deep(.el-date-editor) { 
  background-color: #262729; box-shadow: 0 0 0 1px #4c4d4f inset; color: #fff; 
}
:deep(.el-input__inner) { color: #fff; }
:deep(.el-range-input) { color: #fff; background: transparent; }
:deep(.el-range-separator) { color: #909399; }
:deep(.plan-drawer) { background-color: #1d1e1f !important; border-left: 1px solid #333; }
:deep(.plan-drawer .el-drawer__header) { margin-bottom: 0; border-bottom: 1px solid #333; color: #fff; }
:deep(.plan-drawer .el-drawer__title) { color: #fff; font-weight: bold; }
.drawer-content { padding: 20px; }
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