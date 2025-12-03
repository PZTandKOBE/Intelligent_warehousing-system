<!-- 布局入口 -->
<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
      <div class="logo">
        <span>🤖 WMS 智能仓储</span>
      </div>
      <el-menu active-text-color="#409EFF" background-color="#0b1120" text-color="#bfcbd9" :default-active="activeMenu"
        class="el-menu-vertical" router>
        <el-menu-item index="/dashboard">
          <el-icon>
            <Monitor />
          </el-icon>
          <span>首页仪表盘</span>
        </el-menu-item>

        <el-sub-menu index="/inventory">
          <template #title>
            <el-icon>
              <Box />
            </el-icon>
            <span>库存管理</span>
          </template>
          <el-menu-item index="/inventory/list">库存查询</el-menu-item>
          <el-menu-item index="/inventory/alert">风险预警</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/optimization">
          <template #title>
            <el-icon>
              <MagicStick />
            </el-icon>
            <span>优化方案</span>
          </template>
          <el-menu-item index="/optimization/list">方案列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/replenishment">
          <template #title>
            <el-icon>
              <Van />
            </el-icon>
            <span>补货建议</span>
          </template>
          <el-menu-item index="/replenishment/list">补货列表</el-menu-item>
          <el-menu-item index="/replenishment/plan">补货计划</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/reports">
          <el-icon>
            <Document />
          </el-icon>
          <span>报告管理</span>
        </el-menu-item>

        <el-menu-item index="/task">
          <el-icon>
            <Timer />
          </el-icon>
          <span>系统日志</span>
        </el-menu-item>
      </el-menu>
    </div>

    <div class="main-container">
      <div class="navbar">
        <div class="breadcrumb">首页 / {{ currentRouteName }}</div>
        <div class="user-info">
          <el-avatar :size="30" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
          <span style="margin-left: 10px; font-size: 14px;">Admin</span>
        </div>
      </div>

      <div class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
// 引入图标
import { Monitor, Box, MagicStick, Van, Document, Timer } from '@element-plus/icons-vue';

const route = useRoute();

// 高亮当前菜单项
const activeMenu = computed(() => route.path);
// 显示当前路由名称
// 定义路由名称到中文标题的映射
const routeTitleMap = {
  'Dashboard': '首页仪表盘',
  'InventoryList': '库存查询',
  'InventoryAlert': '风险预警',
  'InventoryDetail': '库存详情',
  'OptimizationList': '方案列表',
  'OptimizationDetail': '方案详情',
  'ReplenishmentList': '补货列表',
  'ReplenishmentPlan': '补货计划',
  'Reports': '报告管理',
  'Task': '系统日志',
  'Login': '登录'
};

// 动态计算当前页面标题
const currentRouteName = computed(() => {
  // 如果能匹配到，就显示中文；匹配不到显示路由原本的名字
  return routeTitleMap[route.name] || route.name;
});
</script>

<style scoped>
.app-wrapper {
  display: flex;
  width: 100%;
  height: 100vh;
  background-color: #0b1120;
}

/* 左侧样式 */
.sidebar-container {
  width: 210px;
  background-color: #0b1120;
  border-right: 1px solid #1d1e1f;
  display: flex;
  flex-direction: column;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  color: #fff;
  border-bottom: 1px solid #1d1e1f;
}
.el-menu-vertical {
  border-right: none;
}

/* 右侧样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.navbar {
  height: 60px;
  background-color: #0b1120; /* 保持深色 */
  border-bottom: 1px solid #1d1e1f;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  color: #fff;
}
.app-main {
  flex: 1;
  padding: 20px;
  overflow-y: auto; /* 内容多了可以滚动 */
  background-color: #060a13; /* 内容区稍微深一点，突出层次感 */
}

/* 简单的淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>