<template>
  <div class="monitor-container">
    <div class="monitor-header">
      <div class="left">
        <h2>🧊 3D 仓库数字孪生 (Digital Twin)</h2>
        
        <el-select 
          v-model="currentZone" 
          placeholder="切换库区" 
          size="default" 
          class="zone-select ml-10"
          @change="handleZoneChange"
        >
          <template #prefix>
            <el-icon><Location /></el-icon>
          </template>
          <el-option label="Zone A - 电子元器件区" value="A" />
          <el-option label="Zone B - 五金配件区" value="B" />
          <el-option label="Zone C - 暂存区 (建设中)" value="C" disabled />
        </el-select>
      </div>

      <div class="right">
        <div class="tips">
          <span>🖱️ 左键旋转</span>
          <span>🖱️ 右键平移</span>
          <span>🖱️ 悬停高亮 / 点击查看</span>
        </div>
        </div>
    </div>

    <div ref="threeContainer" class="three-canvas"></div>

    <div v-if="loading" class="loading-mask">
      <div class="loading-spinner"></div>
      <p>正在切换至 {{ currentZone === 'A' ? '电子区' : '五金区' }} 数据...</p>
    </div>

    <div class="map-legend">
      <div class="legend-item"><span class="block normal"></span> 正常 (Normal)</div>
      <div class="legend-item"><span class="block warning"></span> 积压 (Warning)</div>
      <div class="legend-item"><span class="block critical"></span> 爆仓 (Critical)</div>
      </div>

    <el-drawer
      v-model="drawerVisible"
      title="库位详情"
      size="380px"
      :modal="false"
      destroy-on-close
      class="monitor-drawer"
    >
      <div v-if="selectedBin" class="drawer-detail">
        <div class="detail-header">
          <h1 class="bin-code">{{ selectedBin.storage_code }}</h1>
          <el-tag :type="getStatusType(selectedBin.usage_rate)" effect="dark" size="large">
            {{ getStatusText(selectedBin.usage_rate) }}
          </el-tag>
        </div>
        
        <el-divider border-style="dashed" />
        
        <el-descriptions :column="1" border class="dark-descriptions">
          <el-descriptions-item label="当前物料">
            <span style="color: #409EFF; font-weight: bold;">{{ selectedBin.material_name || '未知' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="当前数量">
            <span class="desc-text" style="font-size: 16px;">{{ selectedBin.quantity || 0 }}</span> 
            <span class="desc-text">{{ selectedBin.unit || 'pcs' }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="利用率">
            <div class="progress-box">
              <el-progress 
                :percentage="selectedBin.usage_rate || 0" 
                :status="getStatusType(selectedBin.usage_rate)" 
                :stroke-width="10"
              />
            </div>
          </el-descriptions-item>
           <el-descriptions-item label="最近更新">
            <span class="desc-text">{{ selectedBin.last_updated || '刚刚' }}</span>
          </el-descriptions-item>
        </el-descriptions>

        <div class="drawer-actions mt-20">
          <el-button type="primary" size="large" style="width: 100%" @click="jumpToInventory(selectedBin.material_code)">
            查看完整档案 >
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Location } from '@element-plus/icons-vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { getDashboardHeatmap, getStorageDetail } from '@/api/warehouse';

const router = useRouter();
const threeContainer = ref(null);
const drawerVisible = ref(false);
const selectedBin = ref(null);
const loading = ref(true);
const currentZone = ref('A');

let scene, camera, renderer, controls;
let raycaster, mouse;
let cubes = []; 
let animationId;
let intersectedObject = null; 

const COLORS = {
  bg: 0x0b1120,
  floor: 0x151b2b, 
  grid: 0x334155,
  normal: 0x3b82f6,
  warning: 0xeab308,
  critical: 0xef4444,
  highlight: 0x666666 
};

const initThree = () => {
  const width = threeContainer.value.clientWidth;
  const height = threeContainer.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.bg);
  scene.fog = new THREE.FogExp2(COLORS.bg, 0.025); 

  camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
  camera.position.set(0, 12, 16); 

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  threeContainer.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.1;
  controls.minDistance = 5;
  controls.maxDistance = 40;

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
  scene.add(ambientLight);
  
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(10, 20, 10);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  scene.add(dirLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  createFloor();
  // AGV 创建逻辑已移除

  window.addEventListener('resize', onWindowResize);
  window.addEventListener('click', onMouseClick);
  window.addEventListener('mousemove', onMouseMove);
  
  animate();
};

const createFloor = () => {
  const size = 50;
  const divisions = 50;
  const gridHelper = new THREE.GridHelper(size, divisions, COLORS.grid, COLORS.grid);
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
  loading.value = true;
  try {
    const res = await getDashboardHeatmap(currentZone.value);
    const dataList = res.data || [];
    
    cubes.forEach(cube => scene.remove(cube));
    cubes = [];

    const geometry = new THREE.BoxGeometry(0.8, 1, 0.8);

    dataList.forEach(item => {
      let color = COLORS.normal;
      if (item.value > 60) color = COLORS.warning;
      if (item.value > 90) color = COLORS.critical;

      const material = new THREE.MeshStandardMaterial({ 
        color: color,
        roughness: 0.3,
        metalness: 0.1,
        transparent: true,
        opacity: 0.95
      });

      const cube = new THREE.Mesh(geometry, material);
      const offsetX = currentZone.value === 'A' ? 12 : 10;
      const offsetZ = currentZone.value === 'A' ? 6 : 8;

      const posX = item.x - offsetX; 
      const posZ = item.y - offsetZ;
      const heightScale = 0.2 + (item.value / 100) * 2.5;
      
      cube.scale.y = heightScale;
      cube.position.set(posX, heightScale / 2, posZ);
      cube.castShadow = true;
      cube.receiveShadow = true;
      cube.userData = { ...item }; 
      
      scene.add(cube);
      cubes.push(cube);
    });
    
  } catch (error) {
    console.error(error);
    ElMessage.error('3D 数据加载失败');
  } finally {
    loading.value = false;
  }
};

const handleZoneChange = () => {
  drawerVisible.value = false;
  loadDataAndBuild(); 
};

const onMouseMove = (event) => {
  const rect = threeContainer.value.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
};

const onMouseClick = (event) => {
  if (intersectedObject) {
    handleCubeClick(intersectedObject.userData.storage_code);
  }
};

const handleCubeClick = async (code) => {
  if (!code) return;
  drawerVisible.value = true;
  selectedBin.value = null;
  try {
    const res = await getStorageDetail(code);
    selectedBin.value = res.data;
  } catch (error) {
    ElMessage.error('获取详情失败');
  }
};

const animate = () => {
  animationId = requestAnimationFrame(animate);
  controls.update();

  // AGV 移动逻辑已移除

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cubes);

  if (intersects.length > 0) {
    if (intersectedObject !== intersects[0].object) {
      if (intersectedObject) intersectedObject.material.emissive.setHex(intersectedObject.currentHex);
      intersectedObject = intersects[0].object;
      intersectedObject.currentHex = intersectedObject.material.emissive.getHex();
      intersectedObject.material.emissive.setHex(COLORS.highlight);
    }
  } else {
    if (intersectedObject) {
      intersectedObject.material.emissive.setHex(intersectedObject.currentHex);
    }
    intersectedObject = null;
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

onMounted(() => {
  initThree();
  loadDataAndBuild();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  window.removeEventListener('click', onMouseClick);
  window.removeEventListener('mousemove', onMouseMove);
  if (renderer) renderer.dispose();
});

const getStatusType = (rate) => { if (rate >= 90) return 'danger'; if (rate >= 60) return 'warning'; return 'success'; };
const getStatusText = (rate) => { if (rate >= 90) return '爆仓预警'; if (rate >= 60) return '库存积压'; return '正常流转'; };
const jumpToInventory = (code) => { router.push(code ? { path: '/inventory/list', query: { keyword: code } } : '/inventory/list'); };
</script>

<style scoped>
.monitor-container {
    height: 100%;
    position: relative;
    overflow: hidden;
    background-color: #0b1120;
}

.monitor-header {
    position: absolute;
    top: 20px;
    left: 20px;
    right: 20px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    pointer-events: none;
}

.monitor-header .right,
.monitor-header h2,
.monitor-header .el-tag,
.monitor-header .el-select,
.monitor-header .el-button {
    pointer-events: auto;
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
    pointer-events: none;
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
    color: #aaa;
    font-size: 12px;
    background: rgba(0, 0, 0, 0.5);
    padding: 5px 15px;
    border-radius: 20px;
}

.map-legend {
    position: absolute;
    bottom: 30px;
    left: 30px;
    background: rgba(0, 0, 0, 0.7);
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #444;
    pointer-events: none;
}

.legend-item {
    display: flex;
    align-items: center;
    color: #fff;
    margin-bottom: 5px;
    font-size: 13px;
}

.block {
    width: 12px;
    height: 12px;
    margin-right: 8px;
    display: inline-block;
    border: 1px solid #fff;
}

.block.normal {
    background: #3b82f6;
}

.block.warning {
    background: #eab308;
}

.block.critical {
    background: #ef4444;
}

/* agv 样式可以删除，也可以保留不影响 */
.block.agv {
    background: #10b981;
}

:deep(.el-drawer) {
    background-color: rgba(20, 24, 30, 0.95) !important;
    backdrop-filter: blur(10px);
    border-left: 1px solid #333;
}

:deep(.el-drawer__title) {
    color: #fff;
}

:deep(.el-drawer__body) {
    padding: 20px;
}

:deep(.dark-descriptions) {
    --el-descriptions-table-border: 1px solid #444;
    --el-descriptions-item-bordered-label-background: #1d2129;
}

:deep(.el-descriptions__body) {
    background: transparent !important;
    color: #fff !important;
}

:deep(.el-descriptions__label.el-descriptions__cell) {
    background: #1d2129 !important;
    color: #909399 !important;
    font-weight: bold;
}

:deep(.el-descriptions__content.el-descriptions__cell) {
    background: rgba(255, 255, 255, 0.02) !important;
    color: #fff !important;
}

:deep(.el-progress__text) {
    color: #fff !important;
}

/* 专门定制下拉框样式，让它透明融入背景 */
:deep(.zone-select) {
    width: 200px;
}

:deep(.zone-select .el-input__wrapper) {
    background-color: rgba(0, 0, 0, 0.5) !important;
    box-shadow: 0 0 0 1px #444 inset !important;
    color: #fff;
}

:deep(.zone-select .el-input__inner) {
    color: #fff !important;
}

.bin-code {
    color: #409EFF;
    margin: 0 0 10px 0;
    font-size: 24px;
}

.desc-text {
    color: #e5e7eb;
}

.progress-box {
    padding-right: 10px;
}

.ml-10 {
    margin-left: 10px;
}

.mt-20 {
    margin-top: 20px;
}
</style>