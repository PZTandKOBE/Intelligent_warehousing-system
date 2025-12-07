<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <div class="header-content">
          <span class="title">建议详情: {{ recId }}</span>
        </div>
      </template>
      <template #extra>
         <el-button type="primary" :icon="Download" @click="handleExport">导出报告</el-button>
      </template>
    </el-page-header>

    <el-card shadow="never" class="detail-card mb-20">
      <template #header>
        <div class="card-header">📋 补货建议概要 (Summary)</div>
      </template>
      <el-descriptions :column="4" border class="custom-desc">
        <el-descriptions-item label="商品信息">
          <span class="text-primary font-bold">{{ recData.materialCode }}</span>
          <br/>
          <span class="sub-text">{{ recData.materialName }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="所属仓库">{{ recData.warehouse }}</el-descriptions-item>
        
        <el-descriptions-item label="紧急程度">
          <el-tag :type="getPriorityTag(recData.priority)" effect="dark">
            {{ getPriorityLabel(recData.priority) }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="处理状态">
          <el-tag :type="recData.status === 'PENDING' ? 'warning' : 'info'" effect="plain">
            {{ getStatusLabel(recData.status) }}
          </el-tag>
        </el-descriptions-item>

        <el-descriptions-item label="当前库存">
          <span :class="recData.currentStock < recData.safeStock ? 'text-danger font-bold' : ''">
            {{ recData.currentStock }}
          </span>
        </el-descriptions-item>
        <el-descriptions-item label="安全库存">{{ recData.safeStock }}</el-descriptions-item>
        <el-descriptions-item label="库存缺口">
          <span class="text-danger">-{{ recData.gap }}</span>
        </el-descriptions-item>

        <el-descriptions-item label="邮件通知">
          <span :class="recData.emailSent ? 'text-success' : 'text-gray'">
            <el-icon><Message /></el-icon> {{ recData.emailSent ? '已自动发送' : '待系统发送' }}
          </span>
          <span v-if="recData.emailSent" class="text-gray" style="margin-left: 10px; font-size: 12px;">
            ({{ recData.emailTime }})
          </span>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-row :gutter="20">
       <el-col :span="24">
          <el-card shadow="never" class="detail-card" id="rep-report">
             <template #header>
               <div class="card-header">
                  <span><el-icon class="mr-5"><Document /></el-icon> 智能补货分析报告</span>
               </div>
             </template>
             <div class="html-content" v-html="recData.contentHtml"></div>
          </el-card>
       </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { Download, Document, Message } from '@element-plus/icons-vue';
import { downloadPDF } from '@/utils/exportReport';

const route = useRoute();
const recId = ref(route.params.id || 'REC-UNKNOWN');

// 模拟详情数据
const recData = reactive({
  materialCode: 'M-2024003',
  materialName: '工业电源 24V',
  warehouse: 'Zone A',
  currentStock: 5,
  safeStock: 20,
  gap: 15,
  priority: 'HIGH',
  status: 'PENDING', // 新增状态字段
  emailSent: true,
  emailTime: '2024-05-20 10:05',
  contentHtml: `
    <h3 style="color:#fff">1. 缺口分析</h3>
    <p>物料 <strong>工业电源 24V</strong> 当前库存仅剩 5pcs，严重低于安全库存线 (20pcs)。根据过去7天的消耗速率 (平均 3pcs/天)，预计将在 <strong>1.6天</strong> 后耗尽。</p>
    <h3 style="color:#fff">2. 补货建议</h3>
    <p>建议采购数量：<strong>50pcs</strong> (补齐安全库存 + 30pcs 缓冲)。</p>
    <p>建议供应商：ST Microelectronics (上一单交期 3天)。</p>
    <h3 style="color:#fff">3. 风险提示</h3>
    <p style="color: #E6A23C">该物料近期市场价格波动较大，建议尽快下单锁定价格。</p>
  `
});

// 汉化映射逻辑 (与列表页保持一致)
const getPriorityLabel = (val) => {
  const map = { 'HIGH': '高', 'MEDIUM': '中', 'LOW': '低' };
  return map[val] || val;
};

const getPriorityTag = (val) => {
  const map = { 'HIGH': 'danger', 'MEDIUM': 'warning', 'LOW': 'info' };
  return map[val] || 'info';
};

const getStatusLabel = (val) => {
  const map = { 'PENDING': '待处理', 'COMPLETED': '已完成' };
  return map[val] || val;
};

const handleExport = () => {
  downloadPDF(`补货建议_${recId.value}`, '#rep-report');
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.text-danger { color: #F56C6C; }
.text-success { color: #67C23A; }
.text-primary { color: #409EFF; }
.text-gray { color: #909399; }
.font-bold { font-weight: bold; }
.sub-text { font-size: 12px; color: #909399; }

.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }

.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { display: flex; align-items: center; color: #fff; font-weight: bold; }

/* 描述列表样式适配 */
:deep(.custom-desc .el-descriptions__label) { background: #262729 !important; color: #909399; width: 100px; }
:deep(.custom-desc .el-descriptions__content) { background: #1d1e1f !important; color: #fff; }

.html-content { line-height: 1.6; color: #cfd3dc; padding: 10px; }
:deep(strong) { color: #409EFF; }
</style>