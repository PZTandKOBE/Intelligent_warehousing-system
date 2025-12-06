<template>
  <div class="page-container">
    <div class="header-bar mb-20">
      <el-page-header @back="goBack" :icon="ArrowLeft" title="返回列表" class="custom-header">
        <template #content>
          <span style="color: #fff; font-weight: bold;">库存详情 / {{ itemInfo.code }}</span>
        </template>
        <template #extra>
          <el-button type="primary" :icon="Edit">编辑资料</el-button>
          <el-button type="success" :icon="Refresh">刷新库存</el-button>
        </template>
      </el-page-header>
    </div>

    <el-card shadow="never" class="info-card mb-20">
      <el-row :gutter="40" style="align-items: center;">
        <el-col :span="4">
          <div class="img-box">
             <el-icon size="60" color="#909399"><Box /></el-icon>
          </div>
        </el-col>
        <el-col :span="20">
          <div class="item-header">
            <h2>{{ itemInfo.name }}</h2>
            <el-tag effect="dark" :type="getStatusTag(itemInfo.status)" class="ml-10">{{ itemInfo.status }}</el-tag>
            <el-tag effect="dark" type="info" class="ml-10">{{ itemInfo.category }}</el-tag>
          </div>
          
          <el-descriptions :column="4" class="custom-desc" border>
            <el-descriptions-item label="规格型号">{{ itemInfo.spec }}</el-descriptions-item>
            <el-descriptions-item label="计量单位">{{ itemInfo.unit }}</el-descriptions-item>
            <el-descriptions-item label="单价">¥ {{ itemInfo.price }}</el-descriptions-item>
            <el-descriptions-item label="供应商">{{ itemInfo.supplier }}</el-descriptions-item>
            <el-descriptions-item label="安全库存">{{ itemInfo.safeStock }}</el-descriptions-item>
            <el-descriptions-item label="最大库容">{{ itemInfo.maxStock }}</el-descriptions-item>
            <el-descriptions-item label="最近入库">2024-04-15</el-descriptions-item>
            <el-descriptions-item label="最近出库">2024-04-20</el-descriptions-item>
          </el-descriptions>
        </el-col>
      </el-row>
    </el-card>

    <el-row :gutter="20" class="mb-20">
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">当前物理库存</div>
          <div class="value primary">{{ itemInfo.currentQty }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">可用库存</div>
          <div class="value success">{{ itemInfo.availableQty }}</div>
          <div class="sub">锁定: {{ itemInfo.currentQty - itemInfo.availableQty }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">在途库存 (采购中)</div>
          <div class="value warning">{{ itemInfo.onWayQty }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="kpi-card">
          <div class="label">本月周转率</div>
          <div class="value info">{{ itemInfo.turnoverRate }}</div>
        </el-card>
      </el-col>
    </el-row>

    <el-card shadow="never" class="box-card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="📍 库位分布" name="location">
          <el-table :data="locationData" style="width: 100%" class="custom-table">
            <el-table-column prop="zone" label="所属库区" />
            <el-table-column prop="binCode" label="库位编码" />
            <el-table-column prop="qty" label="当前数量">
              <template #default="{ row }">
                <span style="font-weight: bold; color: #409EFF">{{ row.qty }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="batch" label="批次号" />
            <el-table-column prop="inDate" label="入库日期" />
            <el-table-column label="操作">
              <template #default>
                <el-button link type="primary">移库</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="🕒 出入库历史" name="history">
          <el-timeline style="padding: 20px;">
            <el-timeline-item
              v-for="(activity, index) in historyData"
              :key="index"
              :type="activity.type === 'in' ? 'success' : 'warning'"
              :timestamp="activity.date"
              placement="top"
            >
              <el-card class="history-card">
                <h4>{{ activity.title }}</h4>
                <p>操作人: {{ activity.user }} | 变动数量: <span :class="activity.type === 'in' ? 'text-success' : 'text-danger'">{{ activity.qty }}</span></p>
                <p style="font-size:12px; color:#909399">单据号: {{ activity.orderId }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ArrowLeft, Edit, Refresh, Box } from '@element-plus/icons-vue';

const router = useRouter();
const route = useRoute(); // 1. 获取路由对象
const activeTab = ref('location');

// 2. 默认空数据
const itemInfo = reactive({
  code: '',
  name: '',
  spec: '',
  unit: '',
  price: '',
  supplier: '',
  safeStock: 0,
  maxStock: 0,
  status: '正常',
  category: '',
  currentQty: 0,
  availableQty: 0,
  onWayQty: 0,
  turnoverRate: '0%'
});

// 3. 模拟一个“后端数据库”，存放我们在 List 页看到的那 5 个物料
const mockDatabase = {
  'M-1001': {
    code: 'M-1001', name: '32位微控制器', spec: 'STM32F103', unit: 'pcs', category: '电子元器件',
    price: '12.50', supplier: 'ST Microelectronics', safeStock: 200, maxStock: 2000, status: '正常',
    currentQty: 1500, availableQty: 1450, onWayQty: 500, turnoverRate: '25%'
  },
  'M-1002': {
    code: 'M-1002', name: '工业级继电器', spec: '24V DC', unit: '个', category: '电气件',
    price: '45.00', supplier: '欧姆龙', safeStock: 100, maxStock: 500, status: '正常',
    currentQty: 230, availableQty: 230, onWayQty: 0, turnoverRate: '15%'
  },
  'M-1003': {
    code: 'M-1003', name: '伺服电机', spec: '400W 3000rpm', unit: '台', category: '动力件',
    price: '850.00', supplier: '汇川技术', safeStock: 20, maxStock: 50, status: '低库存',
    currentQty: 12, availableQty: 5, onWayQty: 10, turnoverRate: '40%'
  },
  'M-1004': {
    code: 'M-1004', name: 'M4不锈钢螺丝', spec: 'M4*12', unit: '颗', category: '标准件',
    price: '0.05', supplier: '紧固件之家', safeStock: 5000, maxStock: 40000, status: '积压',
    currentQty: 50000, availableQty: 50000, onWayQty: 0, turnoverRate: '2%'
  },
  'M-1005': {
    code: 'M-1005', name: 'PLC控制模块', spec: 'FX3U-32MT', unit: '套', category: '控制器',
    price: '1200.00', supplier: '三菱电机', safeStock: 30, maxStock: 100, status: '正常',
    currentQty: 45, availableQty: 40, onWayQty: 20, turnoverRate: '18%'
  }
};

const locationData = ref([]);
const historyData = ref([]);

// 4. 加载数据函数
const loadData = () => {
  // 获取路由传过来的 id (例如 M-1003)
  const id = route.params.id;
  
  // 从模拟数据库里找
  const data = mockDatabase[id];
  
  if (data) {
    // 找到了，覆盖 itemInfo
    Object.assign(itemInfo, data);
    
    // 模拟一下该物料的库位分布
    locationData.value = [
      { zone: 'A区 (电子区)', binCode: 'A-01-04', qty: Math.floor(data.currentQty * 0.6), batch: 'B20240401', inDate: '2024-04-01' },
      { zone: 'B区 (暂存区)', binCode: 'B-02-01', qty: Math.floor(data.currentQty * 0.4), batch: 'B20240315', inDate: '2024-03-15' }
    ];
    
    // 模拟一下历史记录
    historyData.value = [
      { date: '2024-04-20 14:30', title: '生产领料出库', type: 'out', qty: '-10', user: '张三', orderId: 'OUT-20240420-001' },
      { date: '2024-04-15 09:00', title: '采购入库', type: 'in', qty: '+50', user: '李四', orderId: 'IN-20240415-088' }
    ];
  } else {
    // 没找到（可能是直接访问的页面），给个默认值防止空白
    Object.assign(itemInfo, mockDatabase['M-1001']);
  }
};

onMounted(() => {
  loadData();
});

const goBack = () => {
  router.push('/inventory/list');
};

const getStatusTag = (status) => {
  if (status === '正常') return 'success';
  if (status === '低库存') return 'danger';
  return 'warning';
};
</script>

<style scoped>
.page-container {
  padding: 20px;
}

.mb-20 {
  margin-bottom: 20px;
}

.ml-10 {
  margin-left: 10px;
}

/* 头部样式 */
.header-bar {
  color: #fff;
}

/* --- 交互样式 --- */
:deep(.el-page-header__left) {
  color: #fff !important;
  transition: all 0.3s;
}

:deep(.el-page-header__left:hover) {
  color: #409EFF !important;
  cursor: pointer;
}

:deep(.el-page-header__content) {
  color: #fff !important;
}

/* 物品详情样式 */
.info-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
}

.img-box {
  background: #262729;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.item-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.item-header h2 {
  margin: 0;
}

:deep(.el-descriptions__body) {
  background: transparent !important;
}

:deep(.el-descriptions__label) {
  background: #262729 !important;
  color: #909399 !important;
  font-weight: bold;
}

:deep(.el-descriptions__content) {
  background: transparent !important;
  color: #fff !important;
}

/* KPI 卡片 */
.kpi-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
  text-align: center;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.kpi-card .label {
  color: #909399;
  font-size: 13px;
}

.kpi-card .value {
  font-size: 28px;
  font-weight: bold;
  margin: 5px 0;
}

.kpi-card .sub {
  font-size: 12px;
  color: #909399;
  margin-top: -5px;
}

.value.primary {
  color: #409EFF;
}

.value.success {
  color: #67C23A;
}

.value.warning {
  color: #E6A23C;
}

.value.info {
  color: #909399;
}

/* 底部 Tabs 卡片 */
.box-card {
  background: #1d1e1f;
  border: 1px solid #333;
  color: #fff;
}

.history-card {
  background: #262729;
  border: 1px solid #333;
  color: #cfd3dc;
  padding: 10px;
}

.text-success {
  color: #67C23A;
  font-weight: bold;
}

.text-danger {
  color: #F56C6C;
  font-weight: bold;
}

:deep(.el-tabs__item) {
  color: #cfd3dc;
}

:deep(.el-tabs__item.is-active) {
  color: #409EFF;
}

/* 表格复用暗黑样式 */
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
}

:deep(.el-table__inner-wrapper::before) {
  display: none !important;
}
</style>