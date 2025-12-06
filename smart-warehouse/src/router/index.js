import { createRouter, createWebHistory, RouterView } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard/analysis',
    children: [
      // 1. 仪表盘 (父级)
      {
        path: 'dashboard',
        name: 'Dashboard',
        meta: { title: '仪表盘', icon: 'Monitor' },
        redirect: '/dashboard/analysis',
        component: RouterView, // 渲染子路由的容器
        children: [
          {
            path: 'analysis',
            name: 'DashboardAnalysis',
            component: () => import('@/views/dashboard/index.vue'),
            meta: { title: '数据概览' }
          },
          {
            path: 'monitor',
            name: 'DashboardMonitor',
            component: () => import('@/views/dashboard/monitor.vue'),
            meta: { title: '仓库监控' }
          }
        ]
      },
      // 2. 库存管理
      {
        path: 'inventory',
        name: 'Inventory',
        meta: { title: '库存管理', icon: 'Box' },
        redirect: '/inventory/list',
        children: [
          {
            path: 'list',
            name: 'InventoryList',
            component: () => import('@/views/inventory/list.vue'),
            meta: { title: '库存查询' }
          },
          {
            path: 'detail/:id',
            name: 'InventoryDetail',
            component: () => import('@/views/inventory/detail.vue'),
            meta: { title: '库存详情', hidden: true }
          },
          {
            path: 'alerts',
            name: 'InventoryAlerts',
            component: () => import('@/views/inventory/alert.vue'),
            meta: { title: '库存预警' }
          }
        ]
      },
      // 3. 库存优化
      {
        path: 'optimization',
        name: 'Optimization',
        meta: { title: '库存优化', icon: 'MagicStick' },
        redirect: '/optimization/plans',
        children: [
          {
            path: 'plans',
            name: 'OptimizationPlans',
            component: () => import('@/views/optimization/index.vue'),
            meta: { title: '方案列表' }
          },
          {
            path: 'plans/:id',
            name: 'OptimizationDetail',
            component: () => import('@/views/optimization/detail.vue'),
            meta: { title: '方案详情', hidden: true }
          }
        ]
      },
      // 4. 补货预测
      {
        path: 'replenishment',
        name: 'Replenishment',
        meta: { title: '补货预测', icon: 'Van' },
        redirect: '/replenishment/recommendations',
        children: [
          {
            path: 'recommendations',
            name: 'ReplenishmentRecommendations',
            component: () => import('@/views/replenishment/index.vue'),
            meta: { title: '补货建议' }
          },
          {
            path: 'recommendations/:id',
            name: 'ReplenishmentDetail',
            component: () => import('@/views/replenishment/detail.vue'),
            meta: { title: '建议详情', hidden: true }
          },
          {
            path: 'calendar',
            name: 'ReplenishmentCalendar',
            component: () => import('@/views/replenishment/plan.vue'),
            meta: { title: '补货日历' }
          }
        ]
      },
      // 5. 报告管理
      {
        path: 'reports',
        name: 'Reports',
        meta: { title: '报告管理', icon: 'Document' },
        redirect: '/reports/list',
        children: [
          {
            path: 'list',
            name: 'ReportList',
            component: () => import('@/views/reports/index.vue'),
            meta: { title: '报告列表' }
          }
        ]
      },
      // 6. 系统日志
      {
        path: 'task',
        name: 'Task',
        component: () => import('@/views/task/index.vue'),
        meta: { title: '系统日志', icon: 'Timer' }
      }
    ]
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router