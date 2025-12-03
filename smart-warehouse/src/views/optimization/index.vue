<template>
  <div class="page-container">
    <div class="action-bar mb-20">
      <el-button type="primary" :icon="Plus" @click="handleCreate">新建入库方案</el-button>
      <div class="right-search">
        <el-input 
          v-model="keyword" 
          placeholder="搜索方案编号..." 
          :prefix-icon="Search"
          style="width: 250px" 
          clearable
        />
        <el-button :icon="Refresh" circle class="ml-10" />
      </div>
    </div>

    <el-card shadow="never" class="list-card">
      <el-table :data="planList" style="width: 100%" class="custom-table">
        <el-table-column prop="planId" label="方案编号" width="150" />
        <el-table-column prop="type" label="入库类型" width="120">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getPlanTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商/来源" min-width="180" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span class="status-dot" :class="row.statusClass"></span> {{ row.status }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View">详情</el-button>
            <el-button link type="danger" :icon="Delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新建入库方案" width="500px">
      <span style="color: #cfd3dc">这里是表单内容...</span>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="dialogVisible = false">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
// 删除了不需要的 Check 和 VideoPlay 图标引用
import { Plus, Search, Refresh, View, Delete } from '@element-plus/icons-vue';

const keyword = ref('');
const dialogVisible = ref(false);

const planList = reactive([
  { planId: 'P-20241201-01', type: '采购入库', supplier: 'ST Microelectronics', createTime: '2024-12-01 09:30', status: '待审核', statusClass: 'warning' },
  { planId: 'P-20241201-02', type: '生产退料', supplier: '产线 A04', createTime: '2024-12-01 10:15', status: '执行中', statusClass: 'processing' },
  { planId: 'P-20241130-05', type: '调拨入库', supplier: '二号仓库', createTime: '2024-11-30 14:20', status: '已完成', statusClass: 'success' },
]);

const getPlanTypeTag = (type) => {
  if (type === '采购入库') return 'primary';
  if (type === '生产退料') return 'warning';
  return 'info';
};

const handleCreate = () => {
  dialogVisible.value = true;
};
</script>

<style scoped>
.page-container { padding: 20px; }
.mb-20 { margin-bottom: 20px; }
.ml-10 { margin-left: 10px; }

.action-bar { display: flex; justify-content: space-between; align-items: center; }
.right-search { display: flex; align-items: center; }

/* 列表卡片暗黑化 */
.list-card { background: #1d1e1f; border: 1px solid #333; }

/* 搜索框暗黑化 */
:deep(.el-input__wrapper) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
}
:deep(.el-input__inner) { color: #fff; }

/* 表格暗黑化 */
:deep(.el-table), :deep(.el-table tr), :deep(.el-table th.el-table__cell), :deep(.el-table td.el-table__cell) {
  background-color: transparent !important; color: #cfd3dc; border-bottom: 1px solid #333 !important;
}
:deep(.el-table th.el-table__cell) { background-color: #262729 !important; color: #fff; }
:deep(.el-table__inner-wrapper::before) { display: none !important; }
:deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) { background-color: #262729 !important; }

/* 状态点样式 */
.status-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 5px; }
.status-dot.warning { background: #E6A23C; }
.status-dot.processing { background: #409EFF; box-shadow: 0 0 4px #409EFF; }
.status-dot.success { background: #67C23A; }

:deep(.el-dialog) { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-dialog__title) { color: #fff; }
</style>