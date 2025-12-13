import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import { getWarehouses } from '@/api/warehouse';

export const useWarehouseStore = defineStore('warehouse', () => {
  // --- State (数据) ---
  const logs = ref([]); // 全局日志列表
  const warehouseList = ref([]); //仓库列表

  // 初始化日志
  const initLogs = () => {
    logs.value = [
      { time: '09:00', title: '系统就绪', content: '仓库管理系统已连接', type: 'success' }
    ];
  };
  initLogs();

  // --- Actions (行为) ---

  //获取仓库列表 Action
  const fetchWarehouses = async () => {
    // 简单缓存机制：如果有数据就不查了，可根据需求改为强制刷新
    if (warehouseList.value.length > 0) return;

    try {
      const res = await getWarehouses();
      if (res.code === 200) {
        // 文档结构: data.items
        warehouseList.value = res.data.items || [];
      }
    } catch (error) {
      console.error("获取仓库列表失败:", error);
    }
  };
  
  // 添加日志 (通用功能)
  const addLog = (title, content, type = 'success') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
    logs.value.unshift({ time, title, content, type });
    
    // 限制日志长度
    if (logs.value.length > 50) {
      logs.value.pop();
    }

    ElNotification({
      title: title,
      message: content,
      type: type,
      position: 'bottom-right', 
      duration: 3000
    });
  };

  return {
    logs,
    warehouseList,
    fetchWarehouses,
    addLog
  };
});