<template>
  <div class="monitor-container">
    <div class="monitor-header">
      <div class="left">
        <div class="title-group">
          <h2>🧊 3D 仓库数字孪生</h2>
          <div class="real-time-clock">{{ currentTime }}</div>
        </div>
        
        <el-select 
          v-model="currentZoneId" 
          placeholder="请选择仓库" 
          size="default" 
          class="zone-select ml-20"
          @change="handleZoneChange"
        >
          <template #prefix>
            <el-icon><Location /></el-icon>
          </template>
          <el-option 
            v-for="item in warehouseStore.warehouseList"
            :key="item.warehouse_id"
            :label="item.warehouse_name"
            :value="item.warehouse_id"
          />
        </el-select>
      </div>

      <div class="right">
        <div class="tips">
          <span>🖱️ 左键旋转</span>
          <span>🖱️ 右键平移</span>
          <span>🖱️ 滚轮缩放</span>
        </div>
      </div>
    </div>

    <div ref="threeContainer" class="three-canvas"></div>

    <div v-if="loading" class="loading-mask">
      <div class="loading-spinner"></div>
      <p>正在同步物理世界数据...</p>
    </div>

    <el-drawer
      v-model="drawerVisible"
      title="📦 库位详情"
      size="320px"
      :modal="false"
      class="monitor-drawer"
    >
      <div v-if="selectedBin" class="drawer-detail">
        <div class="detail-header">
          <h1 class="bin-code">{{ selectedBin.storage_code }}</h1>
          <el-tag :type="getStatusType(selectedBin.value)" effect="dark" round>
            {{ getStatusText(selectedBin.value) }}
          </el-tag>
        </div>
        
        <div class="info-grid">
          <div class="info-item">
            <span class="label">坐标位置</span>
            <span class="value">[ {{ selectedBin.coordinate ? selectedBin.coordinate.join(', ') : '-' }} ]</span>
          </div>
          <div class="info-item">
            <span class="label">占用率 / 价值</span>
            <span class="value highlight">{{ selectedBin.value }}</span>
          </div>
          <div class="info-item">
            <span class="label">当前状态</span>
            <span class="value" :style="{ color: getStatusColor(selectedBin.value) }">
              {{ getStatusText(selectedBin.value) }}
            </span>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { Location } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getDashboardHeatmap } from '@/api/warehouse';
import { useWarehouseStore } from '@/stores/warehouse';

const threeContainer = ref(null);
const drawerVisible = ref(false);
const selectedBin = ref(null);
const loading = ref(false);
const currentTime = ref(''); // ✅ 新增：时间状态

const warehouseStore = useWarehouseStore();
const currentZoneId = ref(null);

let scene, camera, renderer, controls;
let raycaster, mouse;
let cubes = []; 
let animationId;
let timeInterval; // ✅ 新增：时间定时器
let intersectedObject = null;

// 定义颜色映射
const COLORS = {
  bg: 0x0b1120,
  grid: 0x1f2937,
  floor: 0x111827,
  
  // 颜色分层逻辑
  boxIdle: 0x67C23A,   // 0-0.2: 绿色 (空闲)
  boxLow: 0x409EFF,    // 0.2-0.5: 蓝色 (低占用)
  boxMedium: 0xE6A23C, // 0.5-0.7: 橙色 (中度)
  boxHigh: 0xF56C6C,   // 0.7-1.0: 红色 (高占用)

  hover: 0x00ffff,       
  hoverEmissive: 0x444444 
};

//更新时间函数
const updateTime = () => {
  const now = new Date();
  currentTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

// --- Three.js 初始化逻辑 ---
const initThree = () => {
  if (!threeContainer.value) return;
  const width = threeContainer.value.clientWidth;
  const height = threeContainer.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.Fog(COLORS.bg, 80, 300);

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
  camera.position.set(50, 60, 80);

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; 
  threeContainer.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 2;
  controls.maxDistance = 200;
  controls.maxPolarAngle = Math.PI / 2 - 0.02; 

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); 
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
  dirLight.position.set(30, 60, 40);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 4096; 
  dirLight.shadow.mapSize.height = 4096;
  const d = 150;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  scene.add(dirLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  createFloor();
  
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onMouseClick);
  animate();
};

const createFloor = () => {
  const size = 150;
  const divisions = 75;
  const gridHelper = new THREE.GridHelper(size, divisions, 0x374151, 0x1f2937);
  scene.add(gridHelper);

  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({ 
    color: COLORS.floor, 
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.2
  });
  const plane = new THREE.Mesh(geometry, material);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -0.01;
  plane.receiveShadow = true;
  scene.add(plane);
};

const loadDataAndBuild = async () => {
  if (!currentZoneId.value) return;

  loading.value = true;
  try {
    const res = await getDashboardHeatmap(currentZoneId.value);

    cubes.forEach(cube => scene.remove(cube));
    cubes = [];

    if (res.code === 200 && res.data && res.data.points && res.data.points.length > 0) {
      const points = res.data.points;
      
      const boxSize = 1.0; 
      const binSpacing = 1.0; 
      const rackSpacing = 1.1; 
      const levelSpacing = 0.2; 

      const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);

      let minX = Infinity, maxX = -Infinity;
      let minZ = Infinity, maxZ = -Infinity;
      let minLayer = Infinity;

      points.forEach(p => {
        const [row, col, layer] = p.coordinate || [0,0,0];
        if (row < minX) minX = row;
        if (row > maxX) maxX = row;
        if (col < minZ) minZ = col;
        if (col > maxZ) maxZ = col;
        if (layer < minLayer) minLayer = layer;
      });

      const totalWidthX = (maxX - minX) * rackSpacing;
      const totalDepthZ = (maxZ - minZ) * binSpacing;
      
      const centerOffsetX = minX * rackSpacing + totalWidthX / 2;
      const centerOffsetZ = minZ * binSpacing + totalDepthZ / 2;

      points.forEach(point => {
        const [row, col, layer] = point.coordinate || [0,0,0];

        // 颜色逻辑
        let color = COLORS.boxIdle;
        const val = Number(point.value) || 0;

        if (val >= 0.2 && val < 0.5) {
          color = COLORS.boxLow;
        } else if (val >= 0.5 && val < 0.7) {
          color = COLORS.boxMedium;
        } else if (val >= 0.7) {
          color = COLORS.boxHigh;
        }

        const material = new THREE.MeshStandardMaterial({ 
          color: color, 
          roughness: 0.4,
          metalness: 0.1
        });
        
        const cube = new THREE.Mesh(geometry, material);
        const posX = row * rackSpacing - centerOffsetX;
        const posZ = col * binSpacing - centerOffsetZ;
        const normalizedLayer = layer - minLayer; 
        const posY = normalizedLayer * levelSpacing + (boxSize / 2);

        cube.position.set(posX, posY, posZ);
        cube.castShadow = true;
        cube.receiveShadow = true;
        cube.userData = { ...point, originalHex: color }; 
        
        scene.add(cube);
        cubes.push(cube);
      });

      fitCameraToSelection(camera, controls, cubes, 0.8); 
      ElMessage.success(`数据同步完成: ${points.length} 单元`);
    } else {
      ElMessage.warning('当前仓库暂无库存数据');
    }
  } catch (error) {
    console.error(error);
    ElMessage.error('数据同步失败');
  } finally {
    loading.value = false;
  }
};

const fitCameraToSelection = (camera, controls, selection, fitOffset = 1.0) => {
  if (!selection || selection.length === 0) return;
  const box = new THREE.Box3();
  for(const object of selection) box.expandByObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const maxSize = Math.max(size.x, size.y, size.z);
  if (maxSize === 0) return;
  
  const fitHeightDistance = maxSize / (2 * Math.atan(Math.PI * camera.fov / 360));
  const distance = fitOffset * fitHeightDistance;
  
  if (!isFinite(distance) || distance <= 0) return;

  const direction = controls.target.clone().sub(camera.position).normalize().multiplyScalar(distance);
  controls.maxDistance = distance * 10;
  controls.target.copy(center);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  camera.position.copy(controls.target).sub(direction);
  controls.update();
};

const handleZoneChange = () => {
  loadDataAndBuild();
};

const onMouseMove = (event) => {
  if (!threeContainer.value) return;
  const rect = threeContainer.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
};

const onMouseClick = () => {
  if (intersectedObject) {
    selectedBin.value = intersectedObject.userData;
    drawerVisible.value = true;
  }
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls.update();

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);

  if (intersects.length > 0) {
    const currentObject = intersects[0].object;
    if (intersectedObject !== currentObject) {
      if (intersectedObject) {
        intersectedObject.material.color.setHex(intersectedObject.userData.originalHex);
        intersectedObject.material.emissive.setHex(0x000000); 
        intersectedObject.scale.set(1, 1, 1);
      }
      intersectedObject = currentObject;
      intersectedObject.material.color.setHex(COLORS.hover);
      intersectedObject.material.emissive.setHex(0x333333); 
      intersectedObject.scale.set(1.05, 1.05, 1.05); 
    }
  } else {
    if (intersectedObject) {
      intersectedObject.material.color.setHex(intersectedObject.userData.originalHex);
      intersectedObject.material.emissive.setHex(0x000000);
      intersectedObject.scale.set(1, 1, 1);
      intersectedObject = null;
    }
  }
  renderer.render(scene, camera);
};

const onWindowResize = () => {
  if (!threeContainer.value) return;
  const width = threeContainer.value.clientWidth;
  const height = threeContainer.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const getStatusType = (val) => {
  if (val >= 0.7) return 'danger';
  if (val >= 0.5) return 'warning';
  if (val >= 0.2) return 'primary'; 
  return 'success';
};

const getStatusText = (val) => {
  if (val >= 0.7) return '高占用';
  if (val >= 0.5) return '中度占用';
  if (val >= 0.2) return '低占用';
  return '空闲';
};

const getStatusColor = (val) => {
  if (val >= 0.7) return '#F56C6C';
  if (val >= 0.5) return '#E6A23C';
  if (val >= 0.2) return '#409EFF';
  return '#67C23A';
};

onMounted(async () => {
  //启动时间更新
  updateTime();
  timeInterval = setInterval(updateTime, 1000);

  initThree();
  await warehouseStore.fetchWarehouses();

  if (warehouseStore.warehouseList.length > 0) {
    currentZoneId.value = warehouseStore.warehouseList[0].warehouse_id;
    loadDataAndBuild();
  }
});

onBeforeUnmount(() => {
  //清除定时器
  if (timeInterval) clearInterval(timeInterval);
  
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('click', onMouseClick);
  if (renderer) renderer.dispose();
  if (scene) scene.clear();
});
</script>

<style scoped>
.monitor-container {
  height: 100%;
  position: relative;
  background-color: #0b1120;
  overflow: hidden;
}

.monitor-header {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
}

.monitor-header .left,
.monitor-header .right {
  pointer-events: auto;
  display: flex;
  align-items: center;
}

.title-group {
  display: flex;
  flex-direction: column;
}

.monitor-header h2 {
  color: #fff;
  margin: 0;
  font-size: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
}

/*时间样式 */
.real-time-clock {
  color: #909399;
  font-size: 14px;
  font-family: 'DIN', monospace;
  margin-top: 4px;
  letter-spacing: 0.5px;
}

.zone-select {
  width: 220px;
}

.ml-20 {
  margin-left: 20px;
}

.three-canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.loading-mask {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #409EFF;
  text-align: center;
}

.loading-spinner {
  border: 4px solid rgba(64, 158, 255, 0.3);
  border-top: 4px solid #409EFF;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 10px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.tips {
  display: flex;
  gap: 15px;
  margin-right: 20px;
  color: #ccc;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 16px;
  border-radius: 20px;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:deep(.monitor-drawer) {
  background-color: rgba(20, 24, 30, 0.95) !important;
  backdrop-filter: blur(10px);
  border-left: 1px solid #374151;
  box-shadow: -5px 0 15px rgba(0, 0, 0, 0.5);
}

:deep(.el-drawer__title) {
  color: #fff;
  font-weight: bold;
}

:deep(.el-drawer__body) {
  padding: 20px;
}

.bin-code {
  font-size: 24px;
  color: #409EFF;
  margin: 0 0 10px 0;
  font-family: 'DIN', monospace;
  letter-spacing: 1px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 10px;
  border-bottom: 1px dashed #374151;
}

.info-item .label {
  color: #9ca3af;
  font-size: 14px;
}

.info-item .value {
  color: #fff;
  font-weight: bold;
  font-size: 15px;
}

.info-item .value.highlight {
  color: #409EFF;
  font-size: 18px;
}
</style>