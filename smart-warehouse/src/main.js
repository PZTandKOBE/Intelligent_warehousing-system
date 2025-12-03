import { createApp } from 'vue'
import App from './App.vue'

// 1. 引入样式
import './style.css' // 如果你删了style.css，这行也要删掉
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css' // 暗黑模式变量

// 2. 引入库
import ElementPlus from 'element-plus'
import { createPinia } from 'pinia'
import router from './router' // 稍后我们在 router 文件夹里创建这个

const app = createApp(App)

// 3. 挂载
app.use(createPinia())
app.use(router)
app.use(ElementPlus)

app.mount('#app')