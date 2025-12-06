<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <div class="header-content">
          <span class="title">优化方案详情: {{ planId }}</span>
          <el-tag :type="planData.emailSent ? 'success' : 'info'" effect="dark" class="ml-10">
             {{ planData.emailSent ? '邮件已发送' : '邮件待发送' }}
          </el-tag>
        </div>
      </template>
      <template #extra>
        <el-button type="primary" :icon="Download" @click="handleExport">导出 PDF 报告</el-button>
      </template>
    </el-page-header>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="never" class="detail-card mb-20" id="report-area">
          <template #header>
            <div class="card-header">
              <span><el-icon class="mr-5"><Document /></el-icon> 智能分析报告 (AI Report)</span>
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
      <el-table :data="taskList" style="width: 100%" class="custom-table">
        <el-table-column prop="step" label="步骤" width="80" />
        <el-table-column prop="taskType" label="类型" width="100" />
        <el-table-column prop="material" label="物料" />
        <el-table-column prop="from" label="源库位" />
        <el-table-column prop="to" label="目标库位" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document, List } from '@element-plus/icons-vue';
import { downloadPDF } from '@/utils/exportReport';

const route = useRoute();
const planId = ref(route.params.id || 'OPT-UNKNOWN');

const planData = ref({
  status: '待执行',
  emailSent: false,
  // 模拟 Dify 返回的 Markdown 转 HTML 后的内容
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
  { step: 1, taskType: '移库', material: 'STM32 芯片', from: 'A-09-01', to: 'A-01-01' },
  { step: 2, taskType: '移库', material: '电容 10uF', from: 'A-09-02', to: 'A-01-02' },
]);

const handleExport = () => {
  downloadPDF(`优化报告_${planId.value}`, '#report-area');
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }

/* HTML 内容样式适配 */
.report-html-content { line-height: 1.8; color: #cfd3dc; padding: 10px; }
:deep(strong) { color: #409EFF; }
:deep(ul) { padding-left: 20px; }
:deep(li) { margin-bottom: 8px; }

/* 表格复用 */
:deep(.el-table), :deep(.el-table th.el-table__cell), :deep(.el-table tr), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; color: #cfd3dc; border-bottom: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; }
</style>