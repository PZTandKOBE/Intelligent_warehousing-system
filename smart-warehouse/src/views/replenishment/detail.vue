<template>
  <div class="page-container">
    <el-page-header @back="$router.back()" title="返回列表" class="custom-header mb-20">
      <template #content>
        <span class="title">补货建议详情</span>
        <el-tag type="warning" effect="dark" class="ml-10">紧急程度: 高</el-tag>
      </template>
      <template #extra>
         <el-button type="primary" :icon="Download" @click="handleExport">导出报告</el-button>
      </template>
    </el-page-header>

    <el-row :gutter="20">
       <el-col :span="24">
          <el-card shadow="never" class="detail-card" id="rep-report">
             <template #header>
               <div class="card-header">
                  <span>📊 补货分析报告</span>
                  <span class="text-info" style="font-size: 12px; font-weight: normal;">(邮件状态: 已自动发送)</span>
               </div>
             </template>
             <div class="html-content" v-html="reportHtml"></div>
          </el-card>
       </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { downloadPDF } from '@/utils/exportReport';

const reportHtml = `
  <h3 style="color:#fff">1. 缺口分析</h3>
  <p>物料 <strong>STM32 芯片</strong> 当前库存仅剩 50pcs，低于安全库存线 (200pcs)。根据过去7天的消耗速率 (平均 30pcs/天)，预计将在 <strong>1.6天</strong> 后耗尽。</p>
  <h3 style="color:#fff">2. 补货建议</h3>
  <p>建议采购数量：<strong>500pcs</strong>。</p>
  <p>建议供应商：ST Microelectronics (上一单交期 3天)。</p>
  <h3 style="color:#fff">3. 风险提示</h3>
  <p style="color: #E6A23C">该物料近期市场价格波动较大，建议尽快下单锁定价格。</p>
`;

const handleExport = () => {
  downloadPDF('补货建议报告', '#rep-report');
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }
.custom-header { background: #1d1e1f; padding: 15px; border: 1px solid #333; }
:deep(.el-page-header__content) { color: #fff; }
.detail-card { background: #1d1e1f; border: 1px solid #333; color: #cfd3dc; }
.card-header { display: flex; justify-content: space-between; align-items: center; color: #fff; font-weight: bold; }
.html-content { line-height: 1.6; color: #cfd3dc; padding: 10px; }
</style>