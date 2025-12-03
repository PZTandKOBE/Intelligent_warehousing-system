<template>
  <div class="page-container">
    <el-alert
      title="⚠️ 风险提示：检测到 5 种物料库存低于安全水位，3 种物料滞销超过 180 天。"
      type="error"
      effect="dark"
      show-icon
      class="mb-20"
    />

    <el-card shadow="never" class="box-card">
      <template #header>
        <div class="card-header">
          <span>🛡️ 风险预警监控中心</span>
          <el-radio-group v-model="activeType" size="small">
            <el-radio-button label="all">全部风险</el-radio-button>
            <el-radio-button label="low">低库存</el-radio-button>
            <el-radio-button label="dead">呆滞品</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="alertData" style="width: 100%" class="custom-table">
        <el-table-column prop="code" label="物料编码" width="120" />
        <el-table-column prop="name" label="物料名称" min-width="150" />
        <el-table-column label="风险类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === '呆滞' ? 'info' : 'danger'" effect="dark">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前状态" min-width="200">
          <template #default="{ row }">
            <span v-if="row.type === '低库存'" style="color: #F56C6C">
              当前: {{ row.current }} / 安全线: {{ row.safe }} (缺 {{ row.safe - row.current }})
            </span>
            <span v-else style="color: #909399">
              最后出库: {{ row.lastDate }} (已滞销 {{ row.days }} 天)
            </span>
          </template>
        </el-table-column>
        <el-table-column label="AI 建议处理" min-width="180">
          <template #default="{ row }">
             <el-button type="primary" link size="small" icon="MagicStick">{{ row.suggestion }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const activeType = ref('all');

const alertData = reactive([
  { code: 'M-1001', name: '激光雷达 S1', type: '低库存', current: 5, safe: 20, suggestion: '生成紧急补货单' },
  { code: 'M-3004', name: '旧版伺服电机', type: '呆滞', lastDate: '2023-10-01', days: 195, suggestion: '建议移库至深区或折价处理' },
  { code: 'M-1022', name: '控制板 PCB-A', type: '低库存', current: 12, safe: 50, suggestion: '加入补货计划' },
  { code: 'M-5001', name: '特种润滑油', type: '呆滞', lastDate: '2023-11-15', days: 150, suggestion: '检查有效期' },
]);
</script>

<style scoped>
/* 复用之前的暗黑表格样式 */
.page-container { height: 100%; padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.box-card { background: #1d1e1f; border: 1px solid #333; color: #fff; }
.card-header { display: flex; justify-content: space-between; align-items: center; }

/* 强制覆盖 Element Plus 表格样式 */
:deep(.el-table), :deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; color: #cfd3dc; border-bottom: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: #2c3e50 !important; }
:deep(.el-table__inner-wrapper::before) { display: none !important; }
</style>