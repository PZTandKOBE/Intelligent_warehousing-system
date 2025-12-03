<template>
  <div class="page-container">
    <div class="header">
      <h2>📂 运营报告中心 (Report Hub)</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="6" v-for="item in reports" :key="item.id">
        <el-card shadow="hover" class="report-card">
          <div class="icon-wrapper">
            <el-icon :size="40" color="#F56C6C" v-if="item.type === 'pdf'">
              <Document />
            </el-icon>
            <el-icon :size="40" color="#67C23A" v-else>
              <TrendCharts />
            </el-icon>
          </div>
          <div class="info">
            <h4>{{ item.name }}</h4>
            <p>{{ item.date }} | {{ item.size }}</p>
          </div>
          <div class="actions">
            <el-button type="primary" link icon="Download">下载</el-button>
            <el-button type="info" link icon="View">预览</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { reactive } from 'vue';
// 🔴 修复点：引入 TrendCharts 代替 DataSheet
import { Document, TrendCharts } from '@element-plus/icons-vue';

const reports = reactive([
  { id: 1, name: '2025年4月库存分析报告', type: 'pdf', date: '2025-04-01', size: '2.4MB' },
  { id: 2, name: 'Q1 呆滞物料清单', type: 'excel', date: '2025-03-31', size: '450KB' },
  { id: 3, name: '3月 AGV 运行效率汇总', type: 'pdf', date: '2025-03-31', size: '1.8MB' },
  { id: 4, name: '供应链补货建议书', type: 'pdf', date: '2025-04-15', size: '3.2MB' },
]);
</script>

<style scoped>
.page-container { padding: 20px; }
.header { margin-bottom: 20px; color: #fff; }
.report-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  text-align: center;
  margin-bottom: 20px;
}
.icon-wrapper { margin: 15px 0; }
.info h4 { margin: 10px 0; }
.info p { color: #909399; font-size: 12px; }
.actions { margin-top: 15px; border-top: 1px solid #333; padding-top: 10px; }
</style>