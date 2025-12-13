<template>
  <div ref="vantaRef" class="login-container">
    
    <div class="login-box">
      <div class="header">
        <div class="logo">🤖</div>
        <div class="title">WMS 智能仓储系统</div>
        <div class="subtitle">Future Warehouse Management System</div>
      </div>

      <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" class="login-form">
        <el-form-item prop="username">
          <el-input 
            v-model="loginForm.username" 
            placeholder="管理员账号" 
            :prefix-icon="User"
            class="custom-input"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="loginForm.password" 
            type="password" 
            placeholder="密码" 
            :prefix-icon="Lock"
            show-password
            class="custom-input"
            @keyup.enter="handleLogin"
          />
        </el-form-item>

        <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
          {{ loading ? '系统接入中...' : '立即登录' }}
        </el-button>
        
        <div class="footer-tips">
          <span>演示账号: admin</span>
          <span>密码: 任意</span>
        </div>
      </el-form>
    </div>
    
    <div class="copyright">© 2025 Smart Warehouse Technology Competition</div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

// --- 引入 Vanta 依赖 ---
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';

const router = useRouter();
const loginFormRef = ref(null);
const loading = ref(false);

// Vanta 相关的变量
const vantaRef = ref(null);
let vantaEffect = null;

const loginForm = reactive({
  username: 'admin',
  password: ''
});

const loginRules = {
  username: [{ required: true, message: '请输入账号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
};

// --- 生命周期：初始化和销毁特效 ---
onMounted(() => {
  vantaEffect = NET({
    el: vantaRef.value,
    THREE: THREE, // 必须显式传入 THREE
    mouseControls: true,
    touchControls: true,
    gyroControls: false,
    minHeight: 200.00,
    minWidth: 200.00,
    scale: 1.00,
    scaleMobile: 1.00,
    
    // --- 颜色配置 (关键) ---
    color: 0x409eff,       // 连线的颜色 (Element Plus 主题蓝)
    backgroundColor: 0x0b1120, // 背景色 (深空蓝黑)
    pointsColor: 0xffffff, // 节点的颜色 (白色)
    maxDistance: 22.00,    // 连线距离，调小一点会密集一些
    spacing: 18.00         // 节点间距
  });
});

onBeforeUnmount(() => {
  if (vantaEffect) {
    vantaEffect.destroy(); // 离开页面时销毁，防止内存泄漏
  }
});

const handleLogin = () => {
  if (!loginFormRef.value) return;
  loginFormRef.value.validate((valid) => {
    if (valid) {
      loading.value = true;
      setTimeout(() => {
        loading.value = false;
        ElMessage.success('🚀 欢迎回来，指挥官');
        router.push('/');
      }, 1000);
    }
  });
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: rgba(13, 17, 28, 0.6); 
  backdrop-filter: blur(10px); 
  border: 1px solid rgba(64, 158, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}
.logo {
  font-size: 48px;
  margin-bottom: 10px;
  animation: pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
@keyframes pop {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
}
.subtitle {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
  text-transform: uppercase;
  letter-spacing: 2px;
}


:deep(.custom-input .el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.3) !important; /* 更深一点的透明 */
  box-shadow: none !important;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}
:deep(.custom-input .el-input__inner) {
  color: #fff !important;
  height: 45px;
}
:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #409EFF;
  box-shadow: 0 0 0 1px #409EFF !important;
}

.login-btn {
  width: 100%;
  height: 45px;
  font-size: 16px;
  background: linear-gradient(90deg, #409EFF, #337ecc);
  border: none;
  margin-top: 10px;
  transition: all 0.3s;
}
.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.4);
}

.footer-tips {
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #909399;
}

.copyright {
  position: absolute;
  bottom: 20px;
  color: #606266;
  font-size: 12px;
  z-index: 10;
}
</style>