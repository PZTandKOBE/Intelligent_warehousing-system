<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">报告详情: {{ reportId }}</span>
      </template>
      <template #extra>
        <el-button type="primary" :icon="Download" @click="handleExport">导出报告</el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📄 报告元信息 (Meta Info)</div>
      </template>
      <el-descriptions :column="3" border class="custom-desc">
        <el-descriptions-item label="报告标题">{{ reportData.title }}</el-descriptions-item>
        <el-descriptions-item label="报告编号">{{ reportData.reportCode }}</el-descriptions-item>
        <el-descriptions-item label="报告类型">
          <el-tag :type="getReportTypeTag(reportData.type)" effect="dark" size="small">
            {{ getReportTypeLabel(reportData.type) }}
          </el-tag>
        </el-descriptions-item>
        
        <el-descriptions-item label="所属仓库">{{ reportData.warehouse }}</el-descriptions-item>
        <el-descriptions-item label="分析周期">{{ reportData.period }}</el-descriptions-item>
        <el-descriptions-item label="生成状态">
          <el-tag :type="reportData.status === 'COMPLETED' ? 'success' : 'info'" effect="plain">
            {{ reportData.status === 'COMPLETED' ? '已生成' : '生成中' }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="邮件通知">
          <span :class="reportData.emailSent ? 'text-success' : 'text-gray'">
            <el-icon><Message /></el-icon> {{ reportData.emailSent ? '已自动发送' : '未发送' }}
          </span>
          <span v-if="reportData.emailSent" class="sub-text ml-10">({{ reportData.emailTime }})</span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row>
      <el-col :span="24">
        <el-card shadow="never" class="detail-card" id="report-content-area">
          <template #header>
            <div class="card-header">
              <span>📊 报告正文</span>
            </div>
          </template>
          <div class="report-html" v-html="reportData.contentHtml"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Message } from '@element-plus/icons-vue';
import { downloadPDF } from '@/utils/exportReport';

const route = useRoute();
const reportId = ref(route.params.id || 'RPT-UNKNOWN');

// 模拟数据
const reportData = reactive({
  reportCode: '20240501-D-A',
  title: '5月1日 Zone A 运营日报',
  type: 'DAILY',
  warehouse: 'Zone A (电子区)',
  period: '2024-05-01 00:00 ~ 23:59',
  status: 'COMPLETED',
  emailSent: true,
  emailTime: '2024-05-01 18:05:00',
  contentHtml: `
    <h3 style="color:#fff">1. 运营概览</h3>
    <p>今日 Zone A 共完成入库任务 <strong>120</strong> 单，出库任务 <strong>85</strong> 单。库存周转率较昨日提升 0.5%。</p>
    <h3 style="color:#fff">2. 异常预警</h3>
    <ul>
      <li>发现 <strong>3</strong> 类物料库存低于安全线，已触发自动补货建议。</li>
      <li>AGV-005 号机器人在 14:00 出现短暂离线，已自动修复。</li>
    </ul>
    <h3 style="color:#fff">3. 明日计划</h3>
    <p>预计明日上午将有大批量 <strong>STM32 芯片</strong> 到货，建议提前腾空 A-01 至 A-03 货架。</p>
  `
});

// 类型映射 (与列表页保持一致)
const getReportTypeLabel = (type) => {
  const map = { 
    'DAILY': '运营日报', 
    'WEEKLY': '运营周报', 
    'MONTHLY': '运营月报', 
    'OPTIMIZATION': '优化报告', 
    'REPLENISHMENT': '补货报告' 
  };
  return map[type] || type;
};

const getReportTypeTag = (type) => {
  if (['DAILY', 'WEEKLY', 'MONTHLY'].includes(type)) return 'info';
  if (type === 'OPTIMIZATION') return 'primary';
  if (type === 'REPLENISHMENT') return 'warning';
  return 'info';
};

const handleExport = () => {
  downloadPDF(`运营报告_${reportData.reportCode}`, '#report-content-area');
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }

/* 头部样式 */
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }

/* 卡片样式 */
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { font-weight: bold; color: #fff; }

/* 描述列表样式适配 */
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 120px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }

/* 文本样式 */
.text-success { color: #67C23A; }
.text-gray { color: #909399; }
.sub-text { font-size: 12px; color: #909399; }

/* HTML 内容样式 */
.report-html { line-height: 1.8; color: #cfd3dc; padding: 10px; }
:deep(strong) { color: #409EFF; }
:deep(ul) { padding-left: 20px; }
:deep(li) { margin-bottom: 8px; }
</style>