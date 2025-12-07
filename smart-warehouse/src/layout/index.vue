<template>
  <div class="app-wrapper">
    <div class="sidebar-container">
      <div class="logo">
        <span>🤖 WMS 智能仓储</span>
      </div>
      <el-menu 
        active-text-color="#409EFF" 
        background-color="#0b1120" 
        text-color="#bfcbd9" 
        :default-active="activeMenu"
        class="el-menu-vertical" 
        router
      >
        <el-sub-menu index="/dashboard">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>仪表盘</span>
          </template>
          <el-menu-item index="/dashboard/analysis">数据概览</el-menu-item>
          <el-menu-item index="/dashboard/monitor">仓库监控</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/inventory">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>库存管理</span>
          </template>
          <el-menu-item index="/inventory/list">库存查询</el-menu-item>
          <el-menu-item index="/inventory/alerts">库存预警</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/optimization">
          <template #title>
            <el-icon><MagicStick /></el-icon>
            <span>库存优化</span>
          </template>
          <el-menu-item index="/optimization/plans">方案列表</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/replenishment">
          <template #title>
            <el-icon><Van /></el-icon>
            <span>补货预测</span>
          </template>
          <el-menu-item index="/replenishment/recommendations">补货建议</el-menu-item>
          <el-menu-item index="/replenishment/calendar">补货日历</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/reports/list">
          <el-icon><Document /></el-icon>
          <span>报告管理</span>
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
import { Monitor, Box, MagicStick, Van, Document } from '@element-plus/icons-vue';

const route = useRoute();
const activeMenu = computed(() => route.path);

const routeTitleMap = {
  'Dashboard': '仪表盘',
  'DashboardAnalysis': '数据概览',
  'DashboardMonitor': '仓库监控',
  'InventoryList': '库存查询',
  'InventoryAlerts': '库存预警',
  'InventoryDetail': '库存详情',
  'OptimizationPlans': '方案列表',
  'OptimizationDetail': '方案详情',
  'ReplenishmentRecommendations': '补货建议',
  'ReplenishmentDetail': '建议详情',
  'ReplenishmentCalendar': '补货日历',
  'ReportList': '报告管理',
  'ReportDetail': '报告详情'
};

const currentRouteName = computed(() => routeTitleMap[route.name] || route.name);
</script>

<style scoped>
.app-wrapper { display: flex; width: 100%; height: 100vh; background-color: #0b1120; }
.sidebar-container { width: 210px; background-color: #0b1120; border-right: 1px solid #1d1e1f; display: flex; flex-direction: column; }
.logo { height: 60px; line-height: 60px; text-align: center; font-size: 18px; font-weight: bold; color: #fff; border-bottom: 1px solid #1d1e1f; }
.el-menu-vertical { border-right: none; }
.main-container { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.navbar { height: 60px; background-color: #0b1120; border-bottom: 1px solid #1d1e1f; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; color: #fff; }
.app-main { flex: 1; padding: 20px; overflow-y: auto; background-color: #060a13; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>