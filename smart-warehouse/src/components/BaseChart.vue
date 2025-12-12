<template>
  <div ref="chartRef" :style="{ width: width, height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, markRaw, nextTick } from 'vue';
import * as echarts from 'echarts';

const props = defineProps({
  options: {
    type: Object,
    required: true,
    default: () => ({})
  },
  width: {
    type: String,
    default: '100%'
  },
  height: {
    type: String,
    default: '400px'
  }
});

const chartRef = ref(null);
const chartInstance = ref(null);

const initChart = () => {
  const el = chartRef.value;
  if (!el) return;

  // 🟢 核心修复：如果容器没有尺寸，说明可能还在 v-if 动画中或者父元素隐藏
  // 此时不强行初始化，而是等待下一次检查
  if (el.clientWidth === 0 || el.clientHeight === 0) {
    // console.warn('ECharts container size is 0, waiting...');
    return;
  }

  // 销毁旧实例防止内存泄漏
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }

  // 使用 dark 主题
  chartInstance.value = markRaw(echarts.init(el, 'dark', {
    renderer: 'canvas'
  }));
  setOptions();
};

const setOptions = () => {
  if (chartInstance.value && props.options) {
    chartInstance.value.setOption(props.options);
  }
};

const resizeHandler = () => {
  if (chartInstance.value) {
    chartInstance.value.resize();
  } else {
    // 如果之前因为尺寸为0没初始化成功，resize的时候再试一次
    initChart();
  }
};

watch(
  () => props.options,
  () => {
    // 数据变化时，如果实例不存在（之前宽为0），尝试初始化
    if (!chartInstance.value) {
      initChart();
    } else {
      setOptions();
    }
  },
  { deep: true }
);

onMounted(() => {
  window.addEventListener('resize', resizeHandler);
  
  // 🟢 核心修复：不要立即初始化，给 DOM 布局一点时间
  // 特别是在 Tab 切换时，DOM 从 display:none 变可见需要时间
  setTimeout(() => {
    initChart();
  }, 100); 
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler);
  if (chartInstance.value) {
    chartInstance.value.dispose();
  }
});

// 暴露 resize 方法给父组件，万一需要手动触发
defineExpose({
  resize: resizeHandler
});
</script>