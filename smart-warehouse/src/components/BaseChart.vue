<template>
  <div ref="chartRef" :style="{ width: width, height: height }"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, markRaw } from 'vue';
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
  if (!chartRef.value) return;
  // 使用 dark 主题
  chartInstance.value = markRaw(echarts.init(chartRef.value, 'dark', {
    renderer: 'canvas'
  }));
  setOptions();
};

const setOptions = () => {
  if (chartInstance.value && props.options) {
    chartInstance.value.setOption(props.options);
  }
};

// ✅ 关键：加回 deep: true，这样直接修改 props.options 里的数据也能触发更新
watch(
  () => props.options,
  () => {
    setOptions();
  },
  { deep: true }
);

const resizeHandler = () => {
  chartInstance.value?.resize();
};

onMounted(() => {
  initChart();
  window.addEventListener('resize', resizeHandler);
});

onUnmounted(() => {
  window.removeEventListener('resize', resizeHandler);
  chartInstance.value?.dispose();
});

defineExpose({
  chartInstance
});
</script>