<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold">Pinia Store 使用示例</h1>
    
    <!-- 认证状态 -->
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-3">认证状态</h2>
      <div class="space-y-2">
        <p>登录状态: {{ authStore.isLoggedIn ? '已登录' : '未登录' }}</p>
        <p v-if="authStore.gameTokens">UID: {{ authStore.gameTokens.uid }}</p>
        <p>有效令牌: {{ authStore.hasValidTokens ? '是' : '否' }}</p>
        
        <div class="flex gap-2 mt-3">
          <button 
            @click="simulateLogin" 
            :disabled="authStore.isLoggedIn"
            class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            模拟登录
          </button>
          <button 
            @click="authStore.logout" 
            :disabled="!authStore.isLoggedIn"
            class="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            登出
          </button>
        </div>
      </div>
    </div>

    <!-- 用户信息 -->
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-3">用户信息</h2>
      <div class="space-y-2">
        <p>显示名称: {{ userStore.displayName }}</p>
        <p>UID: {{ userStore.uid || '未设置' }}</p>
        <p>昵称: {{ userStore.nickname || '未设置' }}</p>
        <p>信息完整: {{ userStore.isUserInfoComplete ? '是' : '否' }}</p>
        
        <div class="flex gap-2 mt-3">
          <input 
            v-model="newNickname" 
            placeholder="输入昵称"
            class="px-3 py-1 border rounded"
          >
          <button 
            @click="updateNickname"
            class="px-4 py-2 bg-green-500 text-white rounded"
          >
            更新昵称
          </button>
        </div>
      </div>
    </div>

    <!-- 游戏数据 -->
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-3">游戏数据</h2>
      <div class="space-y-2">
        <p>角色数量: {{ gameStore.totalCharacters }}</p>
        <p>背包物品数量: {{ gameStore.totalInventoryItems }}</p>
        <p>缺少物品数量: {{ gameStore.shortageItemsCount }}</p>
        <p>搜索关键词: {{ gameStore.searchQuery || '无' }}</p>
        
        <div class="flex gap-2 mt-3">
          <input 
            v-model="searchQuery" 
            placeholder="搜索物品"
            class="px-3 py-1 border rounded"
          >
          <button 
            @click="gameStore.setSearchQuery(searchQuery)"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            搜索
          </button>
          <button 
            @click="addSampleData"
            class="px-4 py-2 bg-purple-500 text-white rounded"
          >
            添加示例数据
          </button>
        </div>
      </div>
    </div>

    <!-- 应用设置 -->
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-3">应用设置</h2>
      <div class="space-y-2">
        <p>主题: {{ appStore.theme }}</p>
        <p>暗色模式: {{ appStore.isDarkMode ? '是' : '否' }}</p>
        <p>语言: {{ appStore.language }}</p>
        <p>自动刷新: {{ appStore.autoRefresh ? '开启' : '关闭' }}</p>
        <p>刷新间隔: {{ appStore.refreshInterval }} 分钟</p>
        
        <div class="flex gap-2 mt-3">
          <button 
            @click="toggleTheme"
            class="px-4 py-2 bg-indigo-500 text-white rounded"
          >
            切换主题
          </button>
          <button 
            @click="toggleLanguage"
            class="px-4 py-2 bg-teal-500 text-white rounded"
          >
            切换语言
          </button>
          <button 
            @click="appStore.setAutoRefresh(!appStore.autoRefresh)"
            class="px-4 py-2 bg-orange-500 text-white rounded"
          >
            切换自动刷新
          </button>
        </div>
      </div>
    </div>

    <!-- 数据管理 -->
    <div class="border rounded-lg p-4">
      <h2 class="text-lg font-semibold mb-3">数据管理</h2>
      <div class="flex gap-2">
        <button 
          @click="storeManager.saveAllToStorage"
          class="px-4 py-2 bg-green-600 text-white rounded"
        >
          保存所有数据
        </button>
        <button 
          @click="storeManager.clearAllData"
          class="px-4 py-2 bg-red-600 text-white rounded"
        >
          清理用户数据
        </button>
        <button 
          @click="storeManager.resetApplication"
          class="px-4 py-2 bg-gray-600 text-white rounded"
        >
          重置应用
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { 
  useAuthStore, 
  useUserStore, 
  useGameStore, 
  useAppStore, 
  useStoreManager,
  type InventoryItem 
} from '@/store/store'
import type { UserAndUid } from '@/service/MHYService'

// 使用所有 stores
const authStore = useAuthStore()
const userStore = useUserStore()
const gameStore = useGameStore()
const appStore = useAppStore()
const storeManager = useStoreManager()

// 响应式数据
const newNickname = ref('')
const searchQuery = ref('')

// 模拟登录
async function simulateLogin() {
  // 模拟游戏令牌
  const mockTokens: UserAndUid = {
    uid: '123456789',
    ltuid: 'mock_ltuid',
    ltoken: 'mock_ltoken',
    cookie_token: 'mock_cookie_token'
  }
  
  authStore.setGameTokens(mockTokens)
  userStore.setUid('123456789')
  userStore.setNickname('测试用户')
  
  // 保存到存储
  authStore.saveToStorage()
  userStore.saveToStorage()
}

// 更新昵称
function updateNickname() {
  if (newNickname.value.trim()) {
    userStore.setNickname(newNickname.value.trim())
    userStore.saveToStorage()
    newNickname.value = ''
  }
}

// 切换主题
function toggleTheme() {
  const themes = ['light', 'dark', 'auto'] as const
  const currentIndex = themes.indexOf(appStore.theme)
  const nextTheme = themes[(currentIndex + 1) % themes.length]
  appStore.setTheme(nextTheme)
  appStore.saveToStorage()
}

// 切换语言
function toggleLanguage() {
  const newLang = appStore.language === 'zh-CN' ? 'en-US' : 'zh-CN'
  appStore.setLanguage(newLang)
  appStore.saveToStorage()
}

// 添加示例数据
function addSampleData() {
  const sampleItems: InventoryItem[] = [
    {
      id: 1,
      name: '摩拉',
      icon: 'mora.png',
      icon_url: 'https://example.com/mora.png',
      num: 1000000,
      level: 1,
      rarity: 1,
      actualNum: 1000000
    },
    {
      id: 2,
      name: '英雄的经验',
      icon: 'hero_exp.png',
      icon_url: 'https://example.com/hero_exp.png',
      num: 50,
      level: 1,
      rarity: 4,
      actualNum: 50
    },
    {
      id: 3,
      name: '精锻用魔矿',
      icon: 'weapon_exp.png',
      icon_url: 'https://example.com/weapon_exp.png',
      num: 100,
      level: 1,
      rarity: 3,
      actualNum: 100
    }
  ]
  
  gameStore.setInventoryItems(sampleItems)
  gameStore.saveToStorage()
}
</script>
