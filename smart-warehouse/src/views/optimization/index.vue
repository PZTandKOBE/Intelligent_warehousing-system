<template>
  <div class="page-container">
    <div class="action-bar mb-20">
      <el-button type="primary" :icon="Plus" @click="handleCreate">新建优化任务</el-button>
      <div class="right-search">
        <el-input 
          v-model="keyword" 
          placeholder="搜索方案编号/任务名..." 
          :prefix-icon="Search"
          style="width: 250px" 
          clearable
        />
        <el-button :icon="Refresh" circle class="ml-10" />
      </div>
    </div>

    <el-card shadow="never" class="list-card">
      <el-table :data="planList" style="width: 100%" class="custom-table">
        <el-table-column prop="planId" label="方案编号" width="160" />
        <el-table-column prop="name" label="任务名称" min-width="150" show-overflow-tooltip />
        <el-table-column prop="type" label="优化类型" width="120">
          <template #default="{ row }">
            <el-tag effect="dark" :type="getPlanTypeTag(row.type)">{{ row.typeLabel }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="aiModel" label="AI 模型" width="120">
          <template #default>
            <el-tag effect="plain" type="info" size="small">Dify Agent</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <span class="status-dot" :class="row.statusClass"></span> {{ row.status }}
          </template>
        </el-table-column>
        
        <el-table-column label="操作" width="230" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button link type="primary" :icon="View" @click="goDetail(row)">详情</el-button>
              
              <el-button 
                v-if="row.status === '待执行'" 
                link 
                type="success" 
                :icon="VideoPlay"
              >执行</el-button>
              
              <el-button 
                v-if="row.status !== '执行中'" 
                link 
                type="danger" 
                :icon="Delete"
              >删除</el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="✨ 新建智能优化任务" width="600px" class="custom-dialog">
      <el-form :model="form" label-width="100px" class="custom-form">
        
        <el-form-item label="任务名称">
          <el-input v-model="form.name" placeholder="例如：4月第一周电子区整理" />
        </el-form-item>

        <el-form-item label="优化类型">
          <el-radio-group v-model="form.type">
            <el-radio-button label="inbound">入库推荐</el-radio-button>
            <el-radio-button label="organize">库内整理</el-radio-button>
            <el-radio-button label="stagnant">呆滞清理</el-radio-button>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="目标区域">
          <el-select v-model="form.zone" placeholder="请选择作业区域" style="width: 100%">
            <el-option label="Zone A - 电子元器件区" value="A" />
            <el-option label="Zone B - 五金配件区" value="B" />
            <el-option label="Zone C - 大件存储区" value="C" />
            <el-option label="全库扫描 (Full Scan)" value="ALL" />
          </el-select>
        </el-form-item>

        <el-form-item label="AI 偏好">
          <div class="slider-box">
            <span class="slider-label">效率优先</span>
            <el-slider v-model="form.priority" :step="10" show-stops style="flex:1; margin: 0 15px;" />
            <span class="slider-label">空间优先</span>
          </div>
          <div class="tips">
            <el-icon><InfoFilled /></el-icon> 效率优先将减少 AGV 行程；空间优先将提高库容利用率。
          </div>
        </el-form-item>
        
        <el-form-item label="备注说明">
          <el-input v-model="form.remark" type="textarea" rows="3" placeholder="输入给 AI 的额外提示词..." />
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">
            <el-icon class="el-icon--left"><MagicStick /></el-icon>
            生成方案
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { 
  Plus, Search, Refresh, View, Delete, VideoPlay, MagicStick, InfoFilled 
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const router = useRouter();
const keyword = ref('');
const dialogVisible = ref(false);

// 表单数据
const form = reactive({
  name: '',
  type: 'inbound',
  zone: '',
  priority: 50,
  remark: ''
});

// 列表数据 (Mock)
const planList = reactive([
  { planId: 'OPT-20240501-A', name: 'Zone A 紧急入库推荐', type: 'inbound', typeLabel: '入库推荐', createTime: '2024-05-01 09:30', status: '待执行', statusClass: 'warning' },
  { planId: 'OPT-20240428-B', name: '月底五金区碎片整理', type: 'organize', typeLabel: '库内整理', createTime: '2024-04-28 14:15', status: '执行中', statusClass: 'processing' },
  { planId: 'OPT-20240415-C', name: 'Q1 呆滞品移库建议', type: 'stagnant', typeLabel: '呆滞清理', createTime: '2024-04-15 10:00', status: '已完成', statusClass: 'success' },
]);

const getPlanTypeTag = (type) => {
  if (type === 'inbound') return 'primary';
  if (type === 'organize') return 'warning';
  return 'danger';
};

const handleCreate = () => {
  form.name = '';
  form.type = 'inbound';
  form.zone = '';
  form.priority = 50;
  dialogVisible.value = true;
};

const handleSubmit = () => {
  dialogVisible.value = false;
  ElMessage.success('任务已提交给 Dify 智能体，正在生成方案...');
  
  // 模拟添加一条数据
  planList.unshift({
    planId: `OPT-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-X`,
    name: form.name || '未命名优化任务',
    type: form.type,
    typeLabel: form.type === 'inbound' ? '入库推荐' : (form.type === 'organize' ? '库内整理' : '呆滞清理'),
    createTime: new Date().toLocaleString(),
    status: '计算中',
    statusClass: 'processing'
  });
};

const goDetail = (row) => {
  router.push(`/optimization/detail/${row.planId}`);
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
:deep(.el-input__wrapper), :deep(.el-textarea__inner), :deep(.el-select__wrapper) { 
  background-color: #262729; 
  box-shadow: 0 0 0 1px #4c4d4f inset;
  color: #fff;
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
.status-dot.processing { background: #409EFF; box-shadow: 0 0 4px #409EFF; animation: pulse 2s infinite; }
.status-dot.success { background: #67C23A; }

@keyframes pulse {
  0% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4); }
  70% { box-shadow: 0 0 0 6px rgba(64, 158, 255, 0); }
  100% { box-shadow: 0 0 0 0 rgba(64, 158, 255, 0); }
}

/* 弹窗样式调整 */
:deep(.el-dialog) { background: #1d1e1f; border: 1px solid #333; }
:deep(.el-dialog__title) { color: #fff; }
:deep(.el-dialog__body) { padding-top: 10px; }
:deep(.el-form-item__label) { color: #cfd3dc; }

/* Radio Button 暗黑适配 */
:deep(.el-radio-button__inner) { background: #262729; color: #cfd3dc; border-color: #4c4d4f; }
:deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) { 
  background-color: #409EFF; border-color: #409EFF; color: #fff; box-shadow: -1px 0 0 0 #409EFF; 
}

/* Slider 容器 */
.slider-box { display: flex; align-items: center; width: 100%; }
.slider-label { font-size: 12px; color: #909399; }
.tips { font-size: 12px; color: #909399; margin-top: 5px; display: flex; align-items: center; }
.tips .el-icon { margin-right: 4px; }

/* 修改部分：按钮布局优化 */
.action-buttons {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px; /* 按钮之间的固定间距 */
}

/* 去除 Element Plus 按钮默认的 margin-left，改用 gap 控制 */
.action-buttons .el-button + .el-button {
  margin-left: 0;
}
</style>