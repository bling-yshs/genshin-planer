import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createApp } from 'vue'
import App from './App.vue'
import { initApp } from './init'
import 'vue-virtual-scroller/dist/vue-virtual-scroller.css'
import './assets/global.css'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// 安装 Pinia
app.use(pinia)

// 全局初始化
initApp().catch(console.error)

// 挂载应用
app.mount('#app')
