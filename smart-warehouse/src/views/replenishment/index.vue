<template>
  <div class="page-container">
    <div class="action-bar mb-15">
      <div class="left-panel">
        <el-radio-group v-model="viewMode" class="custom-radio-group">
          <el-radio-button label="list">
            <el-icon class="mr-5"><List /></el-icon>列表视图
          </el-radio-button>
          <el-radio-button label="calendar">
            <el-icon class="mr-5"><Calendar /></el-icon>日历视图
          </el-radio-button>
        </el-radio-group>
        
        <span class="meta-info ml-20" v-if="viewMode === 'calendar'">
          <span class="dot urgent"></span> 紧急
          <span class="dot normal ml-10"></span> 常规
        </span>
      </div>
      
      <div class="right-search">
        <el-button type="primary" :icon="Refresh" @click="handleRefresh" plain>刷新</el-button>
        <el-button type="success" :icon="Download" class="ml-10" plain>导出</el-button>
      </div>
    </div>

    <div v-if="viewMode === 'list'" class="full-width-container">
      <el-row :gutter="15" class="mb-15">
        <el-col :span="6" v-for="(card, index) in kpiCards" :key="index">
          <el-card shadow="never" class="kpi-card">
            <div class="kpi-content">
              <div class="kpi-value" :style="{ color: card.color }">{{ card.value }}</div>
              <div class="kpi-label">{{ card.label }}</div>
            </div>
            <el-icon :size="20" :color="card.color" class="kpi-icon"><component :is="card.icon" /></el-icon>
          </el-card>
        </el-col>
      </el-row>

      <el-card shadow="never" class="content-card no-padding-card">
        <el-tabs v-model="activeTab" class="custom-tabs">
          <el-tab-pane label="🔴 紧急补货" name="urgent">
            <ReplenishTable :data="urgentList" type="urgent" />
          </el-tab-pane>
          <el-tab-pane label="🔵 常规补货" name="normal">
            <ReplenishTable :data="normalList" type="normal" />
          </el-tab-pane>
        </el-tabs>
      </el-card>
    </div>

    <div v-else class="calendar-container">
      <el-card shadow="never" class="calendar-card">
        <el-calendar v-model="currentDate">
          <template #date-cell="{ data }">
            <div class="custom-cell" :class="{ 'is-selected': data.isSelected }" @click="handleDateClick(data)">
              <div class="date-num">{{ data.day.split('-').slice(2).join('') }}</div>
              
              <div class="task-dots">
                <div v-for="(task, idx) in getTasksByDate(data.day)" :key="idx" 
                     class="task-item" :class="task.type">
                  {{ task.name }} x{{ task.amount }}
                </div>
              </div>
            </div>
          </template>
        </el-calendar>
      </el-card>

      <el-dialog v-model="dialogVisible" :title="`📅 ${selectedDate} 补货详情`" width="450px" class="custom-dialog">
        <el-timeline>
          <el-timeline-item
            v-for="(activity, index) in selectedDayTasks"
            :key="index"
            :type="activity.type === 'urgent' ? 'danger' : 'primary'"
            :timestamp="activity.time"
            hollow
          >
            <span class="font-bold">{{ activity.name }}</span>
            <div class="text-xs text-gray">需补: {{ activity.amount }} | {{ activity.type === 'urgent' ? '加急' : '常规' }}</div>
          </el-timeline-item>
          <div v-if="selectedDayTasks.length === 0" class="empty-tips">今日无计划</div>
        </el-timeline>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, h } from 'vue';
import { 
  Refresh, Download, Warning, Goods, Van, List, Calendar 
} from '@element-plus/icons-vue';
import { ElMessage, ElTable, ElTableColumn, ElButton, ElProgress } from 'element-plus';

// ---------------- 逻辑部分 ----------------
const viewMode = ref('list');
const currentDate = ref(new Date());
const dialogVisible = ref(false);
const selectedDate = ref('');
const selectedDayTasks = ref([]);

const kpiCards = [
  { label: '待补货SKU', value: '12', icon: Goods, color: '#F56C6C' },
  { label: '今日到货', value: '5', icon: Van, color: '#409EFF' },
  { label: '缺货风险', value: 'High', icon: Warning, color: '#E6A23C' },
  { label: '本周总量', value: '1,240', icon: Calendar, color: '#67C23A' },
];

const activeTab = ref('urgent');
const urgentList = reactive([
  { id: 'R-001', name: '304不锈钢螺丝 M4 (加长版防锈型)', stock: 50, safety: 200, suggest: 500, leadTime: '3天' },
  { id: 'R-002', name: 'Intel CPU i5-12400F 12代酷睿盒装处理器', stock: 10, safety: 50, suggest: 100, leadTime: '7天' },
  { id: 'R-004', name: '工业导热硅脂 (500g大桶装/高导热率)', stock: 2, safety: 10, suggest: 20, leadTime: '1天' },
]);
const normalList = reactive([
  { id: 'R-003', name: '加厚五层瓦楞纸箱 40x40x40 (打包专用)', stock: 800, safety: 500, suggest: 2000, leadTime: '2天' },
]);

// 模拟日历数据
const calendarMap = reactive({
  '2024-05-01': [{ name: '螺丝M4', amount: 500, type: 'urgent', time: '09:00' }],
  '2024-05-03': [{ name: 'CPU', amount: 100, type: 'urgent', time: '14:00' }, { name: '纸箱', amount: 2000, type: 'normal', time: '16:00' }],
  [new Date().toISOString().slice(0,10)]: [{ name: '今日加急件', amount: 20, type: 'urgent', time: '现在' }],
});

const getTasksByDate = (day) => calendarMap[day] || [];

const handleDateClick = (data) => {
  selectedDate.value = data.day;
  selectedDayTasks.value = getTasksByDate(data.day);
  dialogVisible.value = true;
};

const handleRefresh = () => ElMessage.success('数据已更新');

// ---------------- 核心修改：真正的自适应列宽 ----------------
const ReplenishTable = (props) => {
  return h(ElTable, { data: props.data, style: { width: '100%' }, class: 'custom-table' }, () => [
    
    // 1. 【自适应列】物料名称：不设固定width，只设一个很小的minWidth兜底
    // Element Plus 会自动让它占据剩余空间的大部分
    h(ElTableColumn, { 
      prop: 'name', 
      label: '物料名称', 
      minWidth: '150', // 仅做兜底，防止极小屏幕崩溃，不做限制
      showOverflowTooltip: true 
    }), 
    
    // 2. 【自适应列】库存状态：同上，自动瓜分剩余空间
    h(ElTableColumn, { label: '库存状态', minWidth: '150', default: (scope) => {
      const percentage = Math.min(Math.round((scope.row.stock / scope.row.safety) * 100), 100);
      return h('div', [
        h('div', { style: 'font-size:12px; margin-bottom:4px; color: #909399;' }, `${scope.row.stock} / ${scope.row.safety}`),
        h(ElProgress, { percentage, status: percentage < 30 ? 'exception' : 'warning', strokeWidth: 6 })
      ]);
    }}),

    // 3. 【固定列】右边的小列设置固定 width，确保它们不抢占主列空间
    h(ElTableColumn, { prop: 'suggest', label: '建议补货', width: '100', align: 'center' }),
    h(ElTableColumn, { prop: 'leadTime', label: '交期', width: '80', align: 'center' }),
    h(ElTableColumn, { label: '操作', width: '100', fixed: 'right', align: 'center', default: () => 
      h(ElButton, { type: 'primary', link: true }, () => '采购') 
    })
  ]);
};
</script>

<style scoped>
/* 全局容器 */
.page-container { padding: 15px; background-color: #121212; min-height: 100vh; }
.mb-15 { margin-bottom: 15px; }
.ml-10 { margin-left: 10px; }
.ml-20 { margin-left: 20px; }
.mr-5 { margin-right: 5px; }

/* 1. 顶部操作栏 & 按钮深度定制 (适应暗黑背景) */
.action-bar { display: flex; justify-content: space-between; align-items: center; }
.left-panel { display: flex; align-items: center; }

:deep(.el-radio-button__inner) {
  background-color: #2b2b2b;
  border-color: #444;
  color: #a0a0a0;
  box-shadow: none !important;
}
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
  color: #fff;
  box-shadow: none !important;
}
:deep(.el-radio-button:first-child .el-radio-button__inner) { border-left: 1px solid #444; }

/* 2. 列表视图 */
.kpi-card { background: #1d1e1f; border: 1px solid #333; color: #fff; }
:deep(.el-card__body) { padding: 12px 15px; display: flex; align-items: center; justify-content: space-between; }
.kpi-value { font-size: 22px; font-weight: bold; line-height: 1.2; }
.kpi-label { font-size: 12px; color: #888; margin-top: 2px; }

.content-card { background: #1d1e1f; border: 1px solid #333; }
.no-padding-card :deep(.el-card__body) { padding: 0; } 
.custom-tabs { padding: 10px 15px 0 15px; }

/* 表格样式：透明背景 */
:deep(.el-table) { 
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #262729;
  --el-table-border-color: #333;
  --el-table-text-color: #cfd3dc;
  --el-table-header-text-color: #fff;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; border-bottom: 1px solid #333; }
:deep(.el-table td.el-table__cell) { border-bottom: 1px solid #333; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: #2c2d2f !important; }

/* 3. 日历视图深度定制 */
.calendar-card { background: #1d1e1f; border: 1px solid #333; border-radius: 4px; padding: 5px; }

:deep(.el-calendar) { background: transparent; --el-calendar-border: none; }
:deep(.el-calendar__header) { border-bottom: 1px solid #333; padding: 10px 15px; }
:deep(.el-calendar__title) { color: #fff; font-weight: bold; }

/* 日历头部按钮颜色修复 */
:deep(.el-calendar__button-group .el-button) {
  background-color: #2b2b2b;
  border-color: #444;
  color: #cfd3dc;
}
:deep(.el-calendar__button-group .el-button:hover) {
  color: #409EFF;
  border-color: #409EFF;
  background-color: rgba(64, 158, 255, 0.1);
}
:deep(.el-calendar__button-group .el-button:active) {
  background-color: #409EFF;
  color: #fff;
}

:deep(.el-calendar-table thead th) { color: #888; }
:deep(.el-calendar-table td) { border: 1px solid #333; }
:deep(.el-calendar-table .el-calendar-day) { height: 110px; padding: 5px; }
:deep(.el-calendar-table td.is-selected) { background-color: #262729; }
:deep(.el-calendar-table .el-calendar-day:hover) { background-color: #262729; }

.custom-cell { height: 100%; display: flex; flex-direction: column; }
.date-num { font-size: 14px; color: #cfd3dc; font-weight: bold; margin-bottom: 5px; }
.task-dots { flex: 1; overflow-y: auto; }
.task-item { 
  font-size: 10px; margin-bottom: 2px; padding: 1px 4px; border-radius: 2px; 
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.task-item.urgent { background: rgba(245, 108, 108, 0.2); color: #F56C6C; border-left: 2px solid #F56C6C; }
.task-item.normal { background: rgba(64, 158, 255, 0.2); color: #409EFF; border-left: 2px solid #409EFF; }

.meta-info { font-size: 12px; color: #888; display: flex; align-items: center; }
.dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; margin-right: 4px; }
.dot.urgent { background: #F56C6C; }
.dot.normal { background: #409EFF; }
</style>