import { defineStore } from 'pinia';
import { ref } from 'vue';
import { ElNotification } from 'element-plus';
import dayjs from 'dayjs'; // 如果没有安装 dayjs，可以用 new Date() 代替

export const useWarehouseStore = defineStore('warehouse', () => {
  // --- State (数据) ---
  const isRunning = ref(false); // 是否正在运行夜间模式
  const agvPosition = ref([0, 0]); // AGV 坐标
  const logs = ref([]); // 全局日志列表

  // 初始化一些假日志，免得一开始是空的不好看
  const initLogs = () => {
    logs.value = [
      { time: '20:00', title: '系统启动', content: '进入夜间无人值守模式', type: 'info' },
      { time: '20:05', title: '任务下发', content: '接收 Dify 智能体指令集 (15条)', type: 'warning' }
    ];
  };
  initLogs();

  // --- Actions (行为) ---
  
  // 1. 添加日志
  const addLog = (title, content, type = 'success') => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' });
    
    // 插入到数组最前面
    logs.value.unshift({ time, title, content, type });
    
    // 只有在运行时才弹窗，避免刷屏
    if (isRunning.value) {
      ElNotification({
        title: title,
        message: content,
        type: type,
        position: 'bottom-right', // 弹窗在右下角
        duration: 3000
      });
    }
  };

  // 2. 模拟 AGV 移动逻辑 (把 Dashboard 里的逻辑搬到这里)
  let timer = null;
  const startSimulation = () => {
    if (isRunning.value) return;
    isRunning.value = true;
    addLog('作业开始', 'AGV-01 启动引擎，开始执行整理任务', 'primary');

    let direction = 1;
    
    timer = setInterval(() => {
      let [x, y] = agvPosition.value;
      
      // 简单的巡逻算法
      if (x >= 9) {
        direction = -1;
        y = (y + 1) % 10;
        // 每次换行时，模拟完成了一个小任务
        addLog('节点到达', `AGV 到达检测点 (${x}, ${y})，货物校验正常`, 'success');
      } else if (x <= 0) {
        direction = 1;
        y = (y + 1) % 10;
      }
      x += direction;
      
      agvPosition.value = [x, y];
    }, 1000);
  };

  const stopSimulation = () => {
    clearInterval(timer);
    isRunning.value = false;
    addLog('作业暂停', '人工介入停止或任务完成', 'warning');
  };

  return {
    isRunning,
    agvPosition,
    logs,
    startSimulation,
    stopSimulation,
    addLog
  };
});