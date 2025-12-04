import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      // 1. Dashboard 首页
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '首页仪表盘', icon: 'Monitor' }
      },

      // 2. Inventory 库存管理
      {
        path: 'inventory',
        name: 'Inventory',
        meta: { title: '库存管理', icon: 'Box' },
        redirect: '/inventory/list', // 默认跳到列表
        children: [
          {
            path: 'list',
            name: 'InventoryList',
            component: () => import('@/views/inventory/index.vue'),
            meta: { title: '库存查询' }
          },
          {
            path: 'alert',
            name: 'InventoryAlert',
            component: () => import('@/views/inventory/alert.vue'),
            meta: { title: '风险预警' }
          },
          {
            path: 'detail/:id?', // :id? 表示参数可选
            name: 'InventoryDetail',
            component: () => import('@/views/inventory/detail.vue'),
            meta: { title: '库存详情', hidden: true } // hidden: true 表示不在侧边栏显示
          }
        ]
      },

      // 3. Optimization 优化方案
      {
        path: 'optimization',
        name: 'Optimization',
        meta: { title: '优化方案', icon: 'MagicStick' },
        redirect: '/optimization/list',
        children: [
          {
            path: 'list',
            name: 'OptimizationList',
            component: () => import('@/views/optimization/index.vue'),
            meta: { title: '方案列表' }
          },
          {
            path: 'detail/:id?',
            name: 'OptimizationDetail',
            component: () => import('@/views/optimization/detail.vue'),
            meta: { title: '方案详情', hidden: true }
          }
        ]
      },

      // 4. Replenishment 补货建议
      {
        path: 'replenishment',
        name: 'Replenishment',
        meta: { title: '补货建议', icon: 'Van' },
        redirect: '/replenishment/list',
        children: [
          {
            path: 'list',
            name: 'ReplenishmentList',
            component: () => import('@/views/replenishment/index.vue'),
            meta: { title: '补货列表' }
          },
          {
            path: 'plan',
            name: 'ReplenishmentPlan',
            component: () => import('@/views/replenishment/plan.vue'),
            meta: { title: '补货计划' }
          },
          // === 新增：补货详情路由 ===
          {
            path: 'detail',
            name: 'ReplenishmentDetail',
            // 确保文件路径正确指向你的 detail.vue
            component: () => import('@/views/replenishment/detail.vue'),
            meta: { title: '补货详情', hidden: true }
          }
        ]
      },

      // 5. Reports 报告管理
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/index.vue'),
        meta: { title: '报告管理', icon: 'Document' }
      },

      // 6. Task 系统日志
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