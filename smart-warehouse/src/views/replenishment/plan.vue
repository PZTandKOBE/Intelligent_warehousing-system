<template>
  <div class="page-container">
    <el-card shadow="never" class="search-card mb-20">
      <div class="search-bar">
        <el-form :inline="true" :model="queryParams" class="demo-form-inline">
          <el-form-item label="计划单号">
            <el-input v-model="queryParams.planId" placeholder="输入单号" clearable />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <div class="right-actions">
          <el-radio-group v-model="viewMode" size="default" style="margin-right: 15px">
            <el-radio-button label="list">
              <el-icon><List /></el-icon> 列表
            </el-radio-button>
            <el-radio-button label="calendar">
              <el-icon><Calendar /></el-icon> 日历
            </el-radio-button>
          </el-radio-group>
          <el-button type="success" plain :icon="Plus" @click="dialogVisible = true">新建计划</el-button>
        </div>
      </div>
    </el-card>

    <div class="content-wrapper">
      
      <el-card v-if="viewMode === 'list'" shadow="never" class="box-card flex-col h-full">
        <el-table
          :data="planList"
          class="custom-table flex-table"
          height="100%"
          v-loading="loading"
        >
          <el-table-column prop="id" label="计划单号" width="180" fixed />
          <el-table-column prop="type" label="类型" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="row.type === 'urgent' ? 'danger' : 'info'" size="small" effect="dark">
                {{ row.type === 'urgent' ? '紧急' : '常规' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="skuCount" label="SKU数" width="100" align="center" />
          <el-table-column prop="totalAmount" label="预估总价" min-width="120">
            <template #default="{ row }">¥ {{ row.totalAmount.toLocaleString() }}</template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建日期" width="160" />
          <el-table-column prop="eta" label="预计到货" width="160">
            <template #default="{ row }">
              <span style="color: #409EFF; font-weight: bold">{{ row.eta }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">{{ getStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right" align="center">
            <template #default>
              <el-button link type="primary" size="small">详情</el-button>
              <el-button link type="danger" size="small">取消</el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination background layout="total, prev, pager, next" :total="100" :page-size="20" />
        </div>
      </el-card>

      <el-card v-else shadow="never" class="box-card h-full calendar-card">
        <el-calendar v-model="calendarDate">
          <template #date-cell="{ data }">
            <div class="calendar-cell">
              <div class="day-num">{{ data.day.split('-').slice(2).join('') }}</div>
              
              <div class="plan-events">
                <div 
                  v-for="plan in getPlansByDate(data.day)" 
                  :key="plan.id"
                  class="plan-tag"
                  :class="plan.type"
                  @click.stop="handlePlanClick(plan)"
                >
                  <span class="dot"></span>
                  <span class="text">{{ plan.skuCount }}种物料到货</span>
                </div>
              </div>
            </div>
          </template>
        </el-calendar>
      </el-card>

    </div>

    <el-dialog v-model="dialogVisible" title="创建补货计划" width="500px" class="custom-dialog">
      <el-form label-width="80px">
        <el-form-item label="计划类型">
          <el-radio-group v-model="newPlanForm.type">
            <el-radio label="normal">常规周补货</el-radio>
            <el-radio label="urgent">紧急插单</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注说明">
          <el-input v-model="newPlanForm.remark" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false">确认创建</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { List, Calendar, Plus } from '@element-plus/icons-vue';

const viewMode = ref('list'); // 核心状态：list | calendar
const calendarDate = ref(new Date());
const loading = ref(false);
const dialogVisible = ref(false);

const queryParams = reactive({ planId: '', status: '', dateRange: [] });
const newPlanForm = reactive({ type: 'normal', remark: '' });

// 模拟数据 (ETA 是预计到货时间，用于日历映射)
const planList = ref([
  { id: 'PL20231204001', type: 'urgent', skuCount: 3, totalAmount: 4500, createTime: '2023-12-04', eta: '2023-12-06', status: 'purchasing', progress: 40 },
  { id: 'PL20231201005', type: 'normal', skuCount: 15, totalAmount: 128000, createTime: '2023-12-01', eta: '2023-12-10', status: 'shipping', progress: 70 },
  { id: 'PL20231128002', type: 'normal', skuCount: 8, totalAmount: 32000, createTime: '2023-11-28', eta: '2023-12-04', status: 'done', progress: 100 },
  { id: 'PL20231120009', type: 'normal', skuCount: 22, totalAmount: 210000, createTime: '2023-11-20', eta: '2023-11-25', status: 'done', progress: 100 },
]);

// 日历辅助函数：根据日期获取当天的计划
const getPlansByDate = (dateStr) => {
  return planList.value.filter(item => item.eta === dateStr);
};

// 状态字典
const getStatusLabel = (status) => {
  const map = { pending: '待审批', purchasing: '采购中', shipping: '运输中', done: '已入库' };
  return map[status] || status;
};
const getStatusType = (status) => {
  const map = { pending: 'info', purchasing: 'primary', shipping: 'warning', done: 'success' };
  return map[status] || '';
};

const handleSearch = () => { loading.value = true; setTimeout(() => loading.value = false, 500); };
const resetQuery = () => { queryParams.planId = ''; };
const handlePlanClick = (plan) => { console.log('查看日历计划详情', plan); };
</script>

<style scoped>
/* ================= 页面通用布局 ================= */
.page-container { 
  height: 100%; 
  /* 关键修改：加上 box-sizing: border-box */
  box-sizing: border-box;
  padding: 10px; /* 减小内边距 */
  display: flex;
  flex-direction: column;
  overflow: hidden; /* 强制隐藏最外层滚动条 */
}

.mb-20 { margin-bottom: 10px; }

/* 搜索栏 */
.search-card { background: #1d1e1f; border: 1px solid #333; }
.search-bar { display: flex; justify-content: space-between; align-items: flex-start; }
.right-actions { display: flex; align-items: center; }

/* 内容区域 */
.content-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.h-full { height: 100%; }
.box-card { 
  background: #1d1e1f; 
  border: 1px solid #333; 
  color: #fff; 
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-card__body) {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%; 
  padding: 10px; /* 卡片内部减小 padding */
  box-sizing: border-box; /* 关键修改 */
  overflow: hidden;
}

/* 表格去白底 */
.custom-table {
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-header-bg-color: #262729;
  --el-table-row-hover-bg-color: #2c3e50;
  --el-table-border-color: #333;
  --el-table-text-color: #cfd3dc;
  --el-table-header-text-color: #fff;
  background-color: transparent !important;
}

:deep(.el-table), 
:deep(.el-table tr), 
:deep(.el-table th.el-table__cell), 
:deep(.el-table td.el-table__cell) {
  background-color: transparent !important; 
  color: #cfd3dc; 
  border-bottom: 1px solid #333 !important;
}

:deep(.el-table th.el-table__cell) { 
  background-color: #262729 !important; 
  color: #fff; 
  font-weight: 600;
}
:deep(.el-table__inner-wrapper::before) { display: none !important; }

/* 分页居右 */
.pagination-container { display: flex; justify-content: flex-end; margin-top: 15px; }

/* 日历样式修复 */
.calendar-card { overflow-y: auto; }
:deep(.el-calendar) { 
  background-color: transparent; 
  --el-calendar-border: 1px solid #333;
  --el-calendar-selected-bg-color: #2c3e50;
}
:deep(.el-calendar__header) { border-bottom: 1px solid #333; padding: 12px 0; }
:deep(.el-calendar__title) { color: #fff; }

/* 日历按钮组样式 */
:deep(.el-calendar__button-group .el-button) {
  background-color: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
}
:deep(.el-calendar__button-group .el-button:hover) {
  color: #409EFF;
  border-color: #409EFF;
  background-color: #262729;
}
:deep(.el-calendar__button-group .el-button:active) { background-color: #1d1e1f; }

/* 日历主体 */
:deep(.el-calendar__body) { padding: 0; }
:deep(.el-calendar-table thead th) { color: #909399; }
:deep(.el-calendar-table td.el-calendar-day) { 
  height: 100px; 
  padding: 5px; 
  box-sizing: border-box; 
  border-bottom: 1px solid #333;
  border-right: 1px solid #333;
}
:deep(.el-calendar-table td:hover) { background-color: #262729; }
:deep(.el-calendar-table tr:first-child td) { border-top: 1px solid #333; }
:deep(.el-calendar-table tr td:first-child) { border-left: 1px solid #333; }
:deep(.el-calendar-table td.is-selected) { background-color: #2c3e50; }

/* 日历格子内容 */
.calendar-cell { height: 100%; display: flex; flex-direction: column; }
.day-num { font-size: 14px; color: #909399; margin-bottom: 4px; text-align: right; margin-right: 5px; }
.plan-events { flex: 1; overflow-y: auto; }

.plan-tag {
  font-size: 12px;
  margin-bottom: 2px;
  padding: 2px 4px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  background-color: #333;
  color: #ccc;
  border-left: 3px solid #909399;
}
.plan-tag:hover { opacity: 0.8; }
.plan-tag.urgent { background-color: rgba(245, 108, 108, 0.2); color: #f89898; border-left-color: #F56C6C; }
.plan-tag.normal { background-color: rgba(64, 158, 255, 0.2); color: #a0cfff; border-left-color: #409EFF; }

/* 通用组件覆盖 */
:deep(.el-input__wrapper), :deep(.el-date-editor) {
  background-color: #262729;
  box-shadow: 0 0 0 1px #4c4d4f inset;
}
:deep(.el-input__inner) { color: #fff; }
:deep(.el-button--default) {
  background: transparent;
  border-color: #4c4d4f;
  color: #fff;
}
:deep(.el-button--default:hover) { color: #409EFF; border-color: #409EFF; }

/* 弹窗 */
:deep(.el-dialog) { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-dialog__title) { color: #fff; }
:deep(.el-radio__label) { color: #cfd3dc; }
:deep(.el-textarea__inner) {
  background-color: #262729;
  box-shadow: 0 0 0 1px #4c4d4f inset;
  color: #fff;
}

/* Radio Button */
:deep(.el-radio-button__inner) {
  background: #262729;
  border-color: #4c4d4f;
  color: #cfd3dc;
  box-shadow: none;
}
:deep(.el-radio-button:first-child .el-radio-button__inner) { border-left: 1px solid #4c4d4f; }
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background-color: #409EFF;
  border-color: #409EFF;
  color: #fff;
  box-shadow: -1px 0 0 0 #409EFF;
}
</style>