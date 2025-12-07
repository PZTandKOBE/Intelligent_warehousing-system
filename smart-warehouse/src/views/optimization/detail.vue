<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">方案详情</span>
      </template>
      <template #extra>
        <el-button type="primary" :icon="Download" @click="handleExport">导出方案报告</el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📋 方案概要 (Summary)</div>
      </template>
      <el-descriptions :column="3" border class="custom-desc">
        <el-descriptions-item label="方案标题">{{ planData.title }}</el-descriptions-item>
        <el-descriptions-item label="方案编号">{{ planId }}</el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ planData.warehouse }}</el-descriptions-item>
        
        <el-descriptions-item label="创建人">{{ planData.creator }}</el-descriptions-item>
        <el-descriptions-item label="分析周期">{{ planData.period }}</el-descriptions-item>
        <el-descriptions-item label="当前状态">
          <el-tag :type="planData.status === '待执行' ? 'warning' : 'success'" effect="dark" size="small">
            {{ planData.status }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="邮件通知">
          <span :class="planData.emailSent ? 'text-success' : 'text-gray'">
            <el-icon><Message /></el-icon> {{ planData.emailSent ? '已自动发送' : '待系统发送' }}
          </span>
          <span v-if="planData.emailSent" class="text-gray" style="margin-left: 10px; font-size: 12px;">(2024-05-01 10:00)</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never" class="detail-card mb-20" id="report-area">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><Document /></el-icon> 智能分析报告</span>
            </div>
          </template>
          <div class="report-html-content" v-html="planData.contentHtml"></div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-card shadow="never" class="detail-card">
      <template #header>
        <div class="card-header">
          <span><el-icon class="mr-5"><List /></el-icon> 执行任务序列</span>
        </div>
      </template>
      <el-table :data="taskList" style="width: 100%" class="custom-table" border>
        <el-table-column prop="taskCode" label="任务编号" width="120" />
        <el-table-column prop="material" label="物料信息" min-width="150" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="100" align="center" />
        
        <el-table-column label="移库路径" width="200">
          <template #default="{ row }">
            <span>{{ row.from }}</span>
            <el-icon class="mx-2"><Right /></el-icon>
            <span class="text-primary">{{ row.to }}</span>
          </template>
        </el-table-column>

        <el-table-column prop="priority" label="优先级" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" effect="plain" size="small">
              {{ getPriorityLabel(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">
              {{ getStatusLabel(row.status) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document, List, Message, Right } from '@element-plus/icons-vue';
import { downloadPDF } from '@/utils/exportReport';

const route = useRoute();
const planId = ref(route.params.id || 'OPT-UNKNOWN');

const planData = reactive({
  title: 'Zone A 紧急入库推荐',
  warehouse: 'Zone A (电子区)',
  creator: 'System AI',
  status: '待执行',
  period: '2024-04-24 ~ 2024-05-01',
  emailSent: true,
  contentHtml: `
    <h3 style="color:#fff">1. 核心问题分析</h3>
    <p>经过对 <strong>Zone A</strong> 过去30天的入库数据分析，发现电子元器件的周转率分布极不均匀。高频物料（如 STM32）被放置在了货架顶层（Row-9），导致 AGV 平均取货时间增加了 45秒/次。</p>
    <h3 style="color:#fff">2. 优化建议</h3>
    <p>建议执行 <strong>ABC 分类存储策略</strong>：</p>
    <ul>
      <li>将 15 种高频物料移至底层（Row-1 ~ Row-3）。</li>
      <li>将 呆滞品 移至 Zone C 深堆区。</li>
    </ul>
    <h3 style="color:#fff">3. 预期收益</h3>
    <p>预计出库效率提升 <strong>18%</strong>，每日节省 AGV 电量 1.2kWh。</p>
  `
});

const taskList = ref([
  { taskCode: 'T-001', material: 'STM32 芯片', qty: 500, from: 'A-09-01', to: 'A-01-01', priority: 'High', status: 'Pending' },
  { taskCode: 'T-002', material: '电容 10uF', qty: 2000, from: 'A-09-02', to: 'A-01-02', priority: 'Medium', status: 'Pending' },
  { taskCode: 'T-003', material: '旧款连接器', qty: 50, from: 'A-02-05', to: 'C-01-01', priority: 'Low', status: 'Done' },
]);

const handleExport = () => {
  downloadPDF(`优化报告_${planId.value}`, '#report-area');
};

// --- 新增：汉化映射逻辑 ---
const getPriorityLabel = (val) => {
  const map = { High: '高', Medium: '中', Low: '低' };
  return map[val] || val;
};

const getPriorityType = (val) => {
  if (val === 'High') return 'danger';
  if (val === 'Medium') return 'warning';
  return 'info';
};

const getStatusLabel = (val) => {
  const map = { Pending: '待处理', Done: '已完成' };
  return map[val] || val;
};

const getStatusClass = (val) => {
  return val === 'Pending' ? 'text-warning' : 'text-success';
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.mx-2 { margin: 0 8px; }
.text-success { color: #67C23A; }
.text-warning { color: #E6A23C; }
.text-primary { color: #409EFF; }
.text-gray { color: #909399; }

.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }

.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }

/* 描述列表样式适配 */
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }

/* HTML 内容样式适配 */
.report-html-content { line-height: 1.8; color: #cfd3dc; padding: 10px; }
:deep(strong) { color: #409EFF; }
:deep(ul) { padding-left: 20px; }
:deep(li) { margin-bottom: 8px; }

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
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; }
</style>