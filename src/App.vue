<template>
  <div class="min-h-screen p-6">
    <div class="mx-auto max-w-[1920px]">
      <DebugPanel
        :show-debug-info="showDebugInfo"
        :game-tokens="authStore.gameTokens"
        :inventory-progress="inventoryProgress"
        :inventory-steps="inventorySteps"
        :is-checking-update="isCheckingUpdate"
        @toggle-debug="showDebugInfo = !showDebugInfo"
        @login="openLoginQRCode"
        @fetch-inventory="fetchAllAvatarsInventory"
        @test="testFn"
        @show-device-info="showDeviceInfo"
        @clear-test-data="clearTestData"
        @check-update="handleCheckUpdate(false)"
      />

      <ResizablePanelGroup direction="horizontal" class="rounded-xl border-2 border-border/50 max-h-[90vh] min-h-[90vh] overflow-hidden shadow-2xl">
        <ResizablePanel :default-size="50" :min-size="30">
          <ItemLibraryPanel
            v-model:search-query="searchQuery"
            :filtered-items="filteredItems"
            :get-quality-background="getQualityBackground"
            @add="addToPlan"
          />
        </ResizablePanel>

        <ResizableHandle with-handle class="bg-border/50 hover:bg-primary/30 transition-colors" />
        <ResizablePanel :default-size="50" :min-size="42">
          <PlanPanel
            :current-plan-name="currentPlanName"
            :has-unsaved-changes="hasUnsavedChanges"
            :saved-plans="savedPlans"
            :current-plan-id="currentPlanId"
            :plan-filter="planFilter"
            :is-plan-empty="isPlanEmpty"
            :filtered-avatar-plans="filteredAvatarPlans"
            :avatar-plan-loading="avatarPlanLoading"
            :filtered-plan="filteredPlan"
            :get-quality-background="getQualityBackground"
            :get-wiki-avatar-icon-url="getWikiAvatarIconUrl"
            @create-plan="createNewPlan"
            @select-plan="tryLoadPlan"
            @quick-save="quickSave"
            @open-save-as="openSaveAsDialog"
            @open-rename="openRenameDialog"
            @open-delete="openDeleteDialog"
            @open-calculator="showCalculatorDialog = true"
            @set-filter="setPlanFilter"
            @avatar-plan-input="handleAvatarPlanInput"
            @remove-avatar-plan="removeAvatarPlan"
            @remove-plan-item="removeFromPlan"
            @update-shortage="calculateShortage"
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>

    <Toaster />

    <QrLoginDialog
      v-model:open="showQRDialog"
      :qr-login-base64="qrLoginBase64"
      :qr-countdown="qrCountdown"
      :is-polling="isPolling"
    />

    <AvatarSelectDialog
      v-model:open="showAvatarDialog"
      :all-avatars="allAvatars"
      :is-loading-avatars="isLoadingAvatars"
      @select-avatar="calculateAvatarMaterials"
    />

    <PlanDialogs
      v-model:save-open="showSaveDialog"
      v-model:rename-open="showRenameDialog"
      v-model:delete-open="showDeleteConfirmDialog"
      v-model:unsaved-open="showUnsavedDialog"
      v-model:plan-name="newPlanName"
      :current-plan-name="currentPlanName"
      @save="saveCurrentPlan"
      @rename="renamePlan"
      @delete="deleteCurrentPlan"
      @unsaved-choice="handleUnsavedChoice"
    />

    <AvatarCalculatorDialog
      v-model:open="showCalculatorDialog"
      @add-avatar-plans="handleAddAvatarPlans"
    />

    <UpdateDialog
      v-model:open="showUpdateDialog"
      :update-available="updateAvailable"
      :update-body-html="updateBodyHtml"
      :is-downloading-update="isDownloadingUpdate"
      :update-progress="updateProgress"
      @download="handleDownloadAndInstall"
    />
  </div>
</template>

<script setup lang="ts">
import type { Avatar } from '@/entity/calculator/Avatar'
import type { AvatarPlan, PlanItem, SavedPlan } from '@/entity/InventoryItem.ts'
import type { OverallConsume } from '@/entity/OverallConsume'
import type { QrLogin } from '@/entity/remote/QrLogin.ts'
import type { AvatarCalculatorConfig } from '@/entity/wiki/WikiAvatar'
import type { CalculatedMaterial } from '@/entity/wiki/WikiItem'
import { marked } from 'marked'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import qualityBlue from '@/assets/level_background/UI_QUALITY_BLUE.png'
import qualityGreen from '@/assets/level_background/UI_QUALITY_GREEN.png'
// 导入品质背景图片
import qualityNone from '@/assets/level_background/UI_QUALITY_NONE.png'
import qualityOrange from '@/assets/level_background/UI_QUALITY_ORANGE.png'
import qualityPurple from '@/assets/level_background/UI_QUALITY_PURPLE.png'
import qualityRed from '@/assets/level_background/UI_QUALITY_RED.png'
import qualityWhite from '@/assets/level_background/UI_QUALITY_WHITE.png'
import AvatarCalculatorDialog from '@/components/calculator/AvatarCalculatorDialog.vue'
import AvatarSelectDialog from '@/components/home/AvatarSelectDialog.vue'
import DebugPanel from '@/components/home/DebugPanel.vue'
import ItemLibraryPanel from '@/components/home/ItemLibraryPanel.vue'
import PlanDialogs from '@/components/home/PlanDialogs.vue'
import PlanPanel from '@/components/home/PlanPanel.vue'
import QrLoginDialog from '@/components/home/QrLoginDialog.vue'
import UpdateDialog from '@/components/home/UpdateDialog.vue'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Toaster } from '@/components/ui/sonner'
import { httpHeaderManager } from '@/entity/HttpHeaderManager'
import {
  convertAvatarToBatchComputeItem,
  convertWeaponToBatchComputeItem,

  fetchAllAvatarList,

  fetchBatchCompute,
  fetchBatchComputeWeapons,
  fetchMHYLoginQRCode,
  fetchMHYLoginResult,
  fetchUserGameRoles,
  fetchWeaponList,
  generateQRCode,
} from '@/service/MHYService.ts'
import { checkForUpdate, downloadAndInstallUpdate, relaunchApp } from '@/service/UpdateService'
import { getWikiAvatarIconUrl } from '@/service/WikiService'
import { useAuthStore } from '@/store/store'
import { convertToCalculatedMaterials, calculateAvatarMaterials as fetchAvatarMaterialsMap } from '@/utils/materialCalculator'
import 'vue-sonner/style.css'

// 根据稀有度获取背景图片
function getQualityBackground(rarity: number | undefined): string {
  switch (rarity) {
    case 0:
      return qualityNone
    case 1:
      return qualityWhite
    case 2:
      return qualityGreen
    case 3:
      return qualityBlue
    case 4:
      return qualityPurple
    case 5:
      return qualityOrange
    case 105:
      return qualityRed
    default:
      return qualityWhite
  }
}

interface AvatarPlanMaterialView extends CalculatedMaterial {
  actualNum: number
  shortage: number
}

interface AvatarPlanView {
  plan: AvatarPlan
  displayMaterials: AvatarPlanMaterialView[]
  shortageCount: number
  totalMaterials: number
}

interface AvatarPlanPayload {
  config: AvatarCalculatorConfig
  materials: CalculatedMaterial[]
}

// 响应式数据
const showDebugInfo = ref(false)
const searchQuery = ref('')
const items = ref<OverallConsume[]>([])
const cultivationPlan = ref<PlanItem[]>([])
const avatarPlans = ref<AvatarPlan[]>([])
const planFilter = ref<'all' | 'shortage'>('all')
const loginPayload = ref<string | null>(null)
const avatarPlanLoading = ref<Record<string, boolean>>({})

// 使用 store 管理认证数据
const authStore = useAuthStore()

// Dialog 状态
const showQRDialog = ref(false)
const showAvatarDialog = ref(false)

// 多套计划管理相关状态
const savedPlans = ref<SavedPlan[]>([])
const currentPlanId = ref<string | null>(null)
const showSaveDialog = ref(false)
const showRenameDialog = ref(false)
const showDeleteConfirmDialog = ref(false)
const showUnsavedDialog = ref(false)
const pendingPlanId = ref<string | null>(null) // 待切换的计划 ID
const newPlanName = ref('')
const hasUnsavedChanges = ref(false)
const SAVED_PLANS_KEY = 'mhy_saved_plans'
const CURRENT_PLAN_ID_KEY = 'mhy_current_plan_id'
const AVATAR_PLANS_KEY = 'mhy_avatar_plans'

// 角色选择器状态
const allAvatars = ref<Avatar[]>([])
const isLoadingAvatars = ref(false)

// 角色材料计算器状态
const showCalculatorDialog = ref(false)

// 获取背包物品进度条状态
const inventoryProgress = ref({
  isLoading: false,
  currentStep: 0, // 0=未开始, 1-5=各阶段
})

// 步骤定义
const inventorySteps = [
  { step: 1, title: '获取角色列表' },
  { step: 2, title: '获取武器列表' },
  { step: 3, title: '计算武器材料' },
  { step: 4, title: '计算角色材料' },
  { step: 5, title: '完成' },
]

// 更新检查状态
const showUpdateDialog = ref(false)
const updateAvailable = shallowRef<Awaited<ReturnType<typeof checkForUpdate>>>(null)
const isCheckingUpdate = ref(false)
const isDownloadingUpdate = ref(false)
const updateProgress = ref({ downloaded: 0, total: 0 })

// 更新内容 markdown 渲染
const updateBodyHtml = computed(() => {
  if (!updateAvailable.value?.body)
    return ''
  return marked(updateAvailable.value.body)
})

// 计算属性
const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return items.value
  }

  const query = searchQuery.value.trim()

  // 优先精确匹配 ID
  const idMatch = items.value.filter(item => item.id.toString() === query)
  if (idMatch.length > 0) {
    return idMatch
  }

  // 否则模糊搜索名字
  return items.value.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
})

// 动态计算养成计划（自动同步背包数据）
const computedPlan = computed(() => {
  // 用于跟踪每种材料的累计消耗（需要考虑角色计划的消耗）
  const materialConsumption = new Map<number, number>()

  // 先计算所有角色计划的材料消耗
  avatarPlans.value.forEach((plan) => {
    const sourceMaterials = Array.isArray(plan.materials) ? plan.materials : []
    sourceMaterials.forEach((material) => {
      const previousConsumption = materialConsumption.get(material.id) ?? 0
      materialConsumption.set(material.id, previousConsumption + material.num)
    })
  })

  // 然后计算自定义材料计划
  return cultivationPlan.value.map((planItem) => {
    // 从最新的背包数据中获取实际数量
    const inventoryItem = items.value.find(item => item.id === planItem.id)
    const inventoryNum = inventoryItem?.actualNum ?? planItem.actualNum ?? 0

    // 获取该材料之前已经被消耗的数量（包括角色计划的消耗）
    const previousConsumption = materialConsumption.get(planItem.id) ?? 0

    // 计算实际可用的材料数量
    const actualNum = Math.max(0, inventoryNum - previousConsumption)

    // 计算缺少数量
    const shortage = Math.max(0, planItem.requiredNum - actualNum)

    // 更新该材料的累计消耗量
    materialConsumption.set(planItem.id, previousConsumption + planItem.requiredNum)

    return {
      ...planItem,
      actualNum,
      shortage,
    }
  })
})

const filteredPlan = computed(() => {
  if (planFilter.value === 'shortage') {
    return computedPlan.value.filter(item => item.shortage > 0)
  }
  return computedPlan.value
})

const filteredAvatarPlans = computed<AvatarPlanView[]>(() => {
  // 用于跟踪每种材料的累计消耗
  const materialConsumption = new Map<number, number>()

  return avatarPlans.value.map((plan) => {
    const sourceMaterials = Array.isArray(plan.materials) ? plan.materials : []
    const materialsView = sourceMaterials.map((material) => {
      const inventoryItem = items.value.find(item => item.id === material.id)
      const inventoryNum = inventoryItem?.actualNum ?? 0

      // 获取该材料之前已经被消耗的数量
      const previousConsumption = materialConsumption.get(material.id) ?? 0

      // 计算当前角色实际可用的材料数量（背包数量 - 之前角色的消耗）
      const actualNum = Math.max(0, inventoryNum - previousConsumption)

      // 计算当前角色的缺少数量
      const shortage = Math.max(0, material.num - actualNum)

      // 更新该材料的累计消耗量
      materialConsumption.set(material.id, previousConsumption + material.num)

      return {
        ...material,
        actualNum,
        shortage,
      }
    })

    const displayMaterials = planFilter.value === 'shortage'
      ? materialsView.filter(material => material.shortage > 0)
      : materialsView

    const shortageCount = materialsView.filter(material => material.shortage > 0).length

    return {
      plan,
      displayMaterials,
      shortageCount,
      totalMaterials: materialsView.length,
    }
  }).filter((entry) => {
    if (planFilter.value !== 'shortage') {
      return true
    }
    return entry.displayMaterials.length > 0
  })
})

const isPlanEmpty = computed(() => cultivationPlan.value.length === 0 && avatarPlans.value.length === 0)

// LocalStorage 缓存 Key
const INVENTORY_CACHE_KEY = 'mhy_inventory_items'
const avatarPlanTimers = new Map<string, ReturnType<typeof setTimeout>>()

// 方法
function loadItemsData() {
  try {
    const cachedData = localStorage.getItem(INVENTORY_CACHE_KEY)
    if (cachedData) {
      items.value = JSON.parse(cachedData)
      console.log('从缓存加载物品数据成功:', items.value.length, '个物品')
    }
    else {
      console.log('没有缓存的物品数据')
    }
  }
  catch (error) {
    console.error('加载缓存数据失败:', error)
  }
}

// 保存物品数据到缓存
function saveItemsToCache() {
  try {
    localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify(items.value))
    console.log('物品数据已缓存')
  }
  catch (error) {
    console.error('缓存物品数据失败:', error)
  }
}

// 排除的角色名称列表
const EXCLUDED_AVATAR_NAMES = ['奇偶·女性', '奇偶·男性', '旅行者']

// 获取全角色+全武器数据作为背包物品数据集
async function fetchAllAvatarsInventory() {
  const tokens = authStore.gameTokens
  if (!tokens?.uid || !tokens?.cookie_token || !tokens?.ltoken || !tokens?.ltuid) {
    toast('请先登录获取游戏令牌', { duration: 3000 })
    return
  }

  // 初始化进度条
  inventoryProgress.value = { isLoading: true, currentStep: 1 }

  try {
    // 获取全角色列表
    const avatarList = await fetchAllAvatarList()

    // 过滤掉旅行者和奇偶角色
    const validAvatars = avatarList.list.filter(
      avatar => !EXCLUDED_AVATAR_NAMES.includes(avatar.name),
    )

    console.log(`全角色列表: ${avatarList.total} 个，过滤后: ${validAvatars.length} 个`)
    inventoryProgress.value = { isLoading: true, currentStep: 2 }

    // 获取所有类型的武器
    const allWeapons = await fetchWeaponList()
    console.log(`全武器列表: ${allWeapons.length} 把`)

    inventoryProgress.value = { isLoading: true, currentStep: 3 }

    // 将所有角色转换为计算请求格式
    const avatarComputeItems = validAvatars.map(avatar => convertAvatarToBatchComputeItem(avatar))

    // 将所有武器转换为计算请求格式
    const weaponComputeItems = allWeapons.map(weapon => convertWeaponToBatchComputeItem(weapon))

    console.log('角色计算请求:', avatarComputeItems.length)
    console.log('武器计算请求:', weaponComputeItems.length)

    // 调用批量计算 API（串行请求，避免限流）
    // 1. 先获取武器消耗
    const weaponResult = await fetchBatchComputeWeapons(
      tokens.uid,
      weaponComputeItems,
      {
        cookie_token: tokens.cookie_token,
        ltoken: tokens.ltoken,
        ltuid: tokens.ltuid,
      },
    )
    console.log('武器计算结果:', weaponResult)

    // 2. 等待 1 秒
    const apiDelay = 1000
    await new Promise(resolve => setTimeout(resolve, apiDelay))

    // 3. 再获取角色消耗
    inventoryProgress.value = { isLoading: true, currentStep: 4 }
    const avatarResult = await fetchBatchCompute(
      tokens.uid,
      avatarComputeItems,
      {
        cookie_token: tokens.cookie_token,
        ltoken: tokens.ltoken,
        ltuid: tokens.ltuid,
      },
    )
    console.log('角色计算结果:', avatarResult)

    // 合并计算结果
    const combinedConsume = [...avatarResult.overall_consume]

    // 遍历武器计算结果，合并到总结果中
    weaponResult.overall_consume.forEach((weaponItem) => {
      const existingItem = combinedConsume.find(item => item.id === weaponItem.id)
      if (existingItem) {
        // 计算两个结果分别推导出的“持有量”
        const stock1 = existingItem.num - existingItem.lack_num
        const stock2 = weaponItem.num - weaponItem.lack_num

        // 实际持有量取最大值（因为是同一个背包）
        const realStock = Math.max(stock1, stock2)

        // 更新总需求
        existingItem.num += weaponItem.num

        // 反推新的 lack_num，以保证 num - lack_num === realStock
        // 这样可以确保最终显示的“背包数量”是正确的去重后的数量
        existingItem.lack_num = Math.max(0, existingItem.num - realStock)
      }
      else {
        combinedConsume.push(weaponItem)
      }
    })

    // 将计算结果转换为物品库格式
    items.value = combinedConsume.map(item => ({
      ...item,
      actualNum: item.lack_num === 0 ? item.num : item.num - item.lack_num,
    }))

    inventoryProgress.value = { isLoading: true, currentStep: 5 }

    toast('背包物品列表获取成功！', {
      description: `${validAvatars.length} 个角色 + ${allWeapons.length} 把武器，共 ${items.value.length} 种物品`,
      duration: 3000,
    })

    // 保存到缓存
    saveItemsToCache()
  }
  catch (error) {
    console.error('获取背包物品列表失败:', error)
    toast('获取背包物品列表失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
  finally {
    // 延迟隐藏进度条，让用户看到完成状态
    setTimeout(() => {
      inventoryProgress.value = { isLoading: false, currentStep: 0 }
    }, 800)
  }
}

async function testFn() {
  console.log('hello')
}

function addToPlan(item: OverallConsume) {
  // 检查是否已经在计划中
  const existingIndex = cultivationPlan.value.findIndex(planItem => planItem.id === item.id)

  if (existingIndex !== -1) {
    toast('添加失败', {
      description: `${item.name} 已经存在于你的养成计划中`,
      duration: 3000,
    })
    return
  }

  const planItem: PlanItem = {
    ...item,
    rarity: item.rarity || 1, // 默认稀有度为1
    requiredNum: 1,
    shortage: 0,
  }

  calculateShortage(planItem)
  cultivationPlan.value.push(planItem)

  // 如果没有当前计划，自动创建"未命名的养成计划"
  if (!currentPlanId.value) {
    const now = Date.now()
    const newPlan: SavedPlan = {
      id: `plan_${now}`,
      name: '未命名的养成计划',
      items: JSON.parse(JSON.stringify(cultivationPlan.value)),
      avatarPlans: JSON.parse(JSON.stringify(avatarPlans.value)),
      createdAt: now,
      updatedAt: now,
    }
    savedPlans.value.push(newPlan)
    currentPlanId.value = newPlan.id
    hasUnsavedChanges.value = false
    localStorage.setItem(CURRENT_PLAN_ID_KEY, newPlan.id)
    persistAllPlans()
  }
  else {
    // 保存到本地存储
    savePlanToStorage()
  }

  // 显示成功提示
  toast('物品已添加到养成计划', {
    description: `${item.name} 已成功添加到养成计划`,
    duration: 2000,
  })
}

function removeFromPlan(itemId: number) {
  const index = cultivationPlan.value.findIndex(item => item.id === itemId)
  if (index !== -1) {
    cultivationPlan.value.splice(index, 1)
    savePlanToStorage()
  }
}

function getAvatarPlanId(avatarId: number): string {
  return `avatar_${avatarId}`
}

// 处理计算器添加的角色计划
function handleAddAvatarPlans(plans: AvatarPlanPayload[]) {
  let addedCount = 0
  let updatedCount = 0
  const now = Date.now()

  for (const plan of plans) {
    if (!plan?.config?.avatar) {
      continue
    }

    const planId = getAvatarPlanId(plan.config.avatar._id)
    const existingIndex = avatarPlans.value.findIndex(item => item.id === planId)

    if (existingIndex !== -1) {
      const existing = avatarPlans.value[existingIndex]!
      avatarPlans.value[existingIndex] = {
        ...existing,
        config: plan.config,
        materials: plan.materials,
        updatedAt: now,
      }
      updatedCount++
    }
    else {
      avatarPlans.value.push({
        id: planId,
        config: plan.config,
        materials: plan.materials,
        createdAt: now,
        updatedAt: now,
      })
      addedCount++
    }
  }

  // 如果没有当前计划，自动创建一个
  if (!currentPlanId.value && (addedCount > 0 || updatedCount > 0)) {
    // 生成计划名称：角色名用下划线连接，最多3个，超出用"等"
    const avatarNames = plans
      .filter(p => p?.config?.avatar)
      .map(p => p.config.avatar.Name)
      .slice(0, 3)

    let planName = avatarNames.join('_')
    if (plans.length > 3) {
      planName += '等'
    }

    // 创建新计划
    const newPlan: SavedPlan = {
      id: `plan_${Date.now()}`,
      name: planName,
      items: JSON.parse(JSON.stringify(cultivationPlan.value)),
      avatarPlans: JSON.parse(JSON.stringify(avatarPlans.value)),
      createdAt: now,
      updatedAt: now,
    }
    savedPlans.value.push(newPlan)
    currentPlanId.value = newPlan.id
    hasUnsavedChanges.value = false
    localStorage.setItem(CURRENT_PLAN_ID_KEY, newPlan.id)
    persistAllPlans()
  }
  else if (addedCount > 0 || updatedCount > 0) {
    savePlanToStorage()
  }

  const messages: string[] = []
  if (addedCount > 0) {
    messages.push(`新增 ${addedCount} 个角色`)
  }
  if (updatedCount > 0) {
    messages.push(`更新 ${updatedCount} 个角色`)
  }

  if (messages.length > 0) {
    toast('角色材料已添加到养成计划', {
      description: messages.join('，'),
      duration: 3000,
    })
  }
}

function handleAvatarPlanInput(planId: string) {
  const plan = avatarPlans.value.find(item => item.id === planId)
  if (!plan) {
    return
  }

  plan.updatedAt = Date.now()
  savePlanToStorage()
  scheduleAvatarPlanRecalculation(planId)
}

function scheduleAvatarPlanRecalculation(planId: string) {
  const timer = avatarPlanTimers.get(planId)
  if (timer) {
    clearTimeout(timer)
  }

  avatarPlanTimers.set(planId, setTimeout(() => {
    void fetchAvatarPlanMaterials(planId)
  }, 300))
}

async function fetchAvatarPlanMaterials(planId: string) {
  const plan = avatarPlans.value.find(item => item.id === planId)
  if (!plan) {
    return
  }

  avatarPlanLoading.value = { ...avatarPlanLoading.value, [planId]: true }
  try {
    const materialMap = await fetchAvatarMaterialsMap(plan.config)
    const materials = await convertToCalculatedMaterials(materialMap)
    plan.materials = materials
    plan.updatedAt = Date.now()
    savePlanToStorage()
  }
  catch (error) {
    console.error('计算角色材料失败:', error)
    toast('角色材料计算失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 4000,
    })
  }
  finally {
    avatarPlanLoading.value = { ...avatarPlanLoading.value, [planId]: false }
  }
}

function removeAvatarPlan(planId: string) {
  const timer = avatarPlanTimers.get(planId)
  if (timer) {
    clearTimeout(timer)
    avatarPlanTimers.delete(planId)
  }

  const index = avatarPlans.value.findIndex(item => item.id === planId)
  if (index !== -1) {
    avatarPlans.value.splice(index, 1)
    savePlanToStorage()
  }
}

function calculateShortage(planItem: PlanItem) {
  const shortage = planItem.requiredNum - (planItem.actualNum || 0)
  planItem.shortage = Math.max(0, shortage)
  // 每次计算后保存到本地存储
  savePlanToStorage()
}

function setPlanFilter(filter: 'all' | 'shortage') {
  planFilter.value = filter
  localStorage.setItem('planFilter', filter)
}

function savePlanToStorage() {
  localStorage.setItem('cultivationPlan', JSON.stringify(cultivationPlan.value))
  localStorage.setItem(AVATAR_PLANS_KEY, JSON.stringify(avatarPlans.value))
  localStorage.setItem('planFilter', planFilter.value)
  // 标记有未保存的修改
  if (currentPlanId.value) {
    hasUnsavedChanges.value = true
  }
}

function loadPlanFromStorage() {
  // 恢复过滤状态
  const savedFilter = localStorage.getItem('planFilter')
  if (savedFilter && (savedFilter === 'all' || savedFilter === 'shortage')) {
    planFilter.value = savedFilter as 'all' | 'shortage'
  }

  // 加载所有已保存的计划
  loadAllSavedPlans()

  // 尝试恢复上次选中的计划
  const lastPlanId = localStorage.getItem(CURRENT_PLAN_ID_KEY)
  if (lastPlanId && savedPlans.value.find(p => p.id === lastPlanId)) {
    loadPlanById(lastPlanId, false)
  }
  else {
    // 恢复临时养成计划
    avatarPlans.value = []
    const saved = localStorage.getItem('cultivationPlan')
    if (saved) {
      try {
        const savedPlan = JSON.parse(saved)
        if (Array.isArray(savedPlan)) {
          // 恢复保存的计划，只计算 shortage 但不触发保存
          cultivationPlan.value = savedPlan.map((item: PlanItem) => {
            const planItem = { ...item }
            // 只计算 shortage，不调用 calculateShortage 避免触发保存
            const shortage = planItem.requiredNum - (planItem.actualNum || 0)
            planItem.shortage = Math.max(0, shortage)
            return planItem
          })
        }
        else if (savedPlan && typeof savedPlan === 'object' && Array.isArray(savedPlan.items)) {
          cultivationPlan.value = savedPlan.items.map((item: PlanItem) => {
            const planItem = { ...item }
            const shortage = planItem.requiredNum - (planItem.actualNum || 0)
            planItem.shortage = Math.max(0, shortage)
            return planItem
          })
          if (Array.isArray(savedPlan.avatarPlans)) {
            avatarPlans.value = savedPlan.avatarPlans
          }
        }
      }
      catch (error) {
        console.error('加载保存的计划失败:', error)
      }
    }

    const savedAvatarPlans = localStorage.getItem(AVATAR_PLANS_KEY)
    if (savedAvatarPlans) {
      try {
        avatarPlans.value = JSON.parse(savedAvatarPlans)
      }
      catch (error) {
        console.error('加载角色计划失败:', error)
        avatarPlans.value = []
      }
    }
  }
}

// ============ 多套计划管理方法 ============

// 生成 UUID
function generatePlanId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

// 加载所有已保存的计划
function loadAllSavedPlans() {
  try {
    const saved = localStorage.getItem(SAVED_PLANS_KEY)
    if (saved) {
      savedPlans.value = JSON.parse(saved)
    }
  }
  catch (error) {
    console.error('加载已保存计划列表失败:', error)
    savedPlans.value = []
  }
}

// 保存所有计划到 localStorage
function persistAllPlans() {
  localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(savedPlans.value))
}

// 当前计划名称
const currentPlanName = computed(() => {
  if (!currentPlanId.value) {
    return '未保存的计划'
  }
  const plan = savedPlans.value.find(p => p.id === currentPlanId.value)
  return plan ? plan.name : '未保存的计划'
})

// 打开保存对话框
function openSaveDialog() {
  newPlanName.value = currentPlanId.value ? currentPlanName.value : ''
  showSaveDialog.value = true
}

// 打开另存为对话框
function openSaveAsDialog() {
  newPlanName.value = ''
  showSaveDialog.value = true
}

// 保存当前计划
function saveCurrentPlan() {
  const name = newPlanName.value.trim()
  if (!name) {
    toast('请输入计划名称', { duration: 2000 })
    return
  }

  const now = Date.now()

  if (currentPlanId.value && newPlanName.value === currentPlanName.value) {
    // 覆盖保存现有计划
    const planIndex = savedPlans.value.findIndex(p => p.id === currentPlanId.value)
    if (planIndex !== -1) {
      savedPlans.value[planIndex] = {
        ...savedPlans.value[planIndex]!,
        items: JSON.parse(JSON.stringify(cultivationPlan.value)),
        avatarPlans: JSON.parse(JSON.stringify(avatarPlans.value)),
        updatedAt: now,
      }
    }
    toast('计划已保存', { description: name, duration: 2000 })
  }
  else {
    // 创建新计划
    const newPlan: SavedPlan = {
      id: generatePlanId(),
      name,
      items: JSON.parse(JSON.stringify(cultivationPlan.value)),
      avatarPlans: JSON.parse(JSON.stringify(avatarPlans.value)),
      createdAt: now,
      updatedAt: now,
    }
    savedPlans.value.push(newPlan)
    currentPlanId.value = newPlan.id
    localStorage.setItem(CURRENT_PLAN_ID_KEY, newPlan.id)
    toast('计划已保存', { description: name, duration: 2000 })
  }

  hasUnsavedChanges.value = false
  persistAllPlans()
  showSaveDialog.value = false
}

// 快速保存（覆盖当前计划）
function quickSave() {
  if (!currentPlanId.value) {
    openSaveDialog()
    return
  }

  const planIndex = savedPlans.value.findIndex(p => p.id === currentPlanId.value)
  if (planIndex !== -1) {
    savedPlans.value[planIndex] = {
      ...savedPlans.value[planIndex]!,
      items: JSON.parse(JSON.stringify(cultivationPlan.value)),
      avatarPlans: JSON.parse(JSON.stringify(avatarPlans.value)),
      updatedAt: Date.now(),
    }
    hasUnsavedChanges.value = false
    persistAllPlans()
    toast('计划已保存', { description: currentPlanName.value, duration: 2000 })
  }
}

// 尝试切换计划（检查未保存的更改）
function tryLoadPlan(planId: string) {
  if (planId === currentPlanId.value) {
    return
  }

  if (hasUnsavedChanges.value) {
    pendingPlanId.value = planId
    showUnsavedDialog.value = true
  }
  else {
    loadPlanById(planId, true)
  }
}

// 加载指定计划
function loadPlanById(planId: string, showToast = true) {
  const plan = savedPlans.value.find(p => p.id === planId)
  if (!plan) {
    toast('计划不存在', { duration: 2000 })
    return
  }

  cultivationPlan.value = JSON.parse(JSON.stringify(plan.items))
  avatarPlans.value = JSON.parse(JSON.stringify(plan.avatarPlans ?? []))
  avatarPlanLoading.value = {}
  currentPlanId.value = planId
  hasUnsavedChanges.value = false
  localStorage.setItem(CURRENT_PLAN_ID_KEY, planId)
  localStorage.setItem('cultivationPlan', JSON.stringify(cultivationPlan.value))
  localStorage.setItem(AVATAR_PLANS_KEY, JSON.stringify(avatarPlans.value))

  if (showToast) {
    toast('已切换到计划', { description: plan.name, duration: 2000 })
  }
}

// 处理未保存对话框的选择
function handleUnsavedChoice(choice: 'save' | 'discard' | 'cancel') {
  showUnsavedDialog.value = false

  if (choice === 'cancel') {
    pendingPlanId.value = null
    return
  }

  if (choice === 'save') {
    if (currentPlanId.value) {
      quickSave()
    }
    else {
      // 如果当前是未保存的计划，打开保存对话框
      openSaveDialog()
      return
    }
  }

  // 切换到待定计划
  if (pendingPlanId.value) {
    if (pendingPlanId.value === 'NEW') {
      doCreateNewPlan()
    }
    else {
      loadPlanById(pendingPlanId.value, true)
    }
    pendingPlanId.value = null
  }
}

// 新建空白计划
function createNewPlan() {
  if (hasUnsavedChanges.value) {
    pendingPlanId.value = 'NEW'
    showUnsavedDialog.value = true
  }
  else {
    doCreateNewPlan()
  }
}

function doCreateNewPlan() {
  cultivationPlan.value = []
  avatarPlans.value = []
  avatarPlanLoading.value = {}
  currentPlanId.value = null
  hasUnsavedChanges.value = false
  localStorage.removeItem(CURRENT_PLAN_ID_KEY)
  localStorage.setItem('cultivationPlan', JSON.stringify([]))
  localStorage.setItem(AVATAR_PLANS_KEY, JSON.stringify([]))
  toast('已创建新计划', { duration: 2000 })
}

// 打开重命名对话框
function openRenameDialog() {
  if (!currentPlanId.value) {
    toast('请先保存当前计划', { duration: 2000 })
    return
  }
  newPlanName.value = currentPlanName.value
  showRenameDialog.value = true
}

// 重命名计划
function renamePlan() {
  const name = newPlanName.value.trim()
  if (!name) {
    toast('请输入计划名称', { duration: 2000 })
    return
  }

  if (!currentPlanId.value) {
    return
  }

  const planIndex = savedPlans.value.findIndex(p => p.id === currentPlanId.value)
  if (planIndex !== -1) {
    savedPlans.value[planIndex]!.name = name
    savedPlans.value[planIndex]!.updatedAt = Date.now()
    persistAllPlans()
    toast('已重命名为', { description: name, duration: 2000 })
  }

  showRenameDialog.value = false
}

// 打开删除确认对话框
function openDeleteDialog() {
  if (!currentPlanId.value) {
    toast('当前计划尚未保存', { duration: 2000 })
    return
  }
  showDeleteConfirmDialog.value = true
}

// 删除当前计划
function deleteCurrentPlan() {
  if (!currentPlanId.value) {
    return
  }

  const planName = currentPlanName.value
  savedPlans.value = savedPlans.value.filter(p => p.id !== currentPlanId.value)
  persistAllPlans()

  // 重置到新计划状态
  currentPlanId.value = null
  cultivationPlan.value = []
  avatarPlans.value = []
  avatarPlanLoading.value = {}
  hasUnsavedChanges.value = false
  localStorage.removeItem(CURRENT_PLAN_ID_KEY)
  localStorage.setItem('cultivationPlan', JSON.stringify([]))
  localStorage.setItem(AVATAR_PLANS_KEY, JSON.stringify([]))

  showDeleteConfirmDialog.value = false
  toast('计划已删除', { description: planName, duration: 2000 })
}

let qrLogin = ref<QrLogin | null>(null)
let qrLoginBase64 = ref<string | null>(null)

// 二维码倒计时相关
const qrExpireTime = ref<number>(0)
const qrCountdown = ref<string>('')
const isPolling = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 解析二维码过期时间
function parseQRExpireTime(url: string): number {
  try {
    const urlObj = new URL(url)
    const expire = urlObj.searchParams.get('expire')
    return expire ? Number.parseInt(expire, 10) : 0
  }
  catch {
    return 0
  }
}

// 更新倒计时显示
function updateCountdown() {
  if (qrExpireTime.value === 0) {
    qrCountdown.value = ''
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const remaining = qrExpireTime.value - now

  if (remaining <= 0) {
    qrCountdown.value = '已过期'
    stopPolling()
    toast('二维码已过期', { description: '请重新获取', duration: 3000 })
    return
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  qrCountdown.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 停止轮询
function stopPolling() {
  isPolling.value = false
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 处理登录成功
async function handleLoginSuccess(loginResult: Awaited<ReturnType<typeof fetchMHYLoginResult>>) {
  stopPolling()
  showQRDialog.value = false

  authStore.setQrLoginResult(loginResult)

  if (loginResult.cookies) {
    const cookies = loginResult.cookies

    try {
      // 自动获取用户的游戏 UID
      toast('正在获取游戏角色信息...', { duration: 2000 })
      const gameRoles = await fetchUserGameRoles({
        ltoken: cookies.ltoken || '',
        ltuid: cookies.ltuid || cookies.account_id || '',
        cookie_token: cookies.cookie_token || '',
      })

      if (gameRoles.length === 0) {
        toast('未找到原神游戏角色', {
          description: '请确认账号已绑定原神角色',
          duration: 5000,
        })
        return
      }

      // 使用第一个角色的 UID
      const firstRole = gameRoles[0]!
      authStore.setGameTokens({
        uid: firstRole.game_uid,
        ltuid: cookies.ltuid || cookies.account_id || '',
        ltoken: cookies.ltoken || '',
        cookie_token: cookies.cookie_token || '',
      })

      toast('登录成功！', {
        description: `UID: ${firstRole.game_uid} (${firstRole.nickname}) - ${firstRole.region_name}`,
        duration: 5000,
      })
    }
    catch (error) {
      console.error('获取游戏角色失败:', error)
      toast('获取游戏角色失败', {
        description: error instanceof Error ? error.message : '未知错误',
        duration: 5000,
      })
    }
  }
}

// 轮询检查扫码状态
async function pollLoginResult() {
  if (!qrLogin.value || !isPolling.value)
    return

  try {
    const loginResult = await fetchMHYLoginResult(qrLogin.value.ticket)
    console.log('扫码状态:', loginResult.status)

    if (loginResult.status === 'Confirmed') {
      await handleLoginSuccess(loginResult)
    }
  }
  catch (error) {
    console.error('检查扫码状态失败:', error)
  }
}

// 打开登录二维码
async function openLoginQRCode() {
  try {
    // 先停止之前的轮询
    stopPolling()

    toast('正在获取二维码...', { duration: 2000 })
    const result = await fetchMHYLoginQRCode()
    qrLogin.value = result
    qrLoginBase64.value = await generateQRCode(result.url)

    // 解析过期时间
    qrExpireTime.value = parseQRExpireTime(result.url)
    updateCountdown()

    // 打开对话框
    showQRDialog.value = true

    // 开始倒计时
    countdownTimer = setInterval(updateCountdown, 1000)

    // 开始轮询（每5秒）
    isPolling.value = true
    pollingTimer = setInterval(pollLoginResult, 5000)

    toast('请使用米游社扫描二维码', { duration: 3000 })
  }
  catch (error) {
    console.error('获取二维码失败:', error)
    toast('获取二维码失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
}

// 监听 Dialog 关闭时停止轮询
watch(showQRDialog, (newVal) => {
  if (!newVal) {
    stopPolling()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopPolling()
})

// 获取登录结果
function clearTestData() {
  qrLogin.value = null
  loginPayload.value = null
  qrExpireTime.value = 0
  qrCountdown.value = ''
  stopPolling()
  authStore.clearAuthData()
  toast('测试数据已清除', { duration: 2000 })
}

// 显示设备信息
function showDeviceInfo() {
  const deviceId = httpHeaderManager.getDeviceId()
  const deviceFp = httpHeaderManager.getDeviceFp()
  toast('设备信息', {
    description: `设备ID: ${deviceId}\n设备指纹: ${deviceFp}`,
    duration: 10000,
  })
  console.log('设备ID:', deviceId)
  console.log('设备指纹:', deviceFp)
}

// 计算角色材料
async function calculateAvatarMaterials(avatar: Avatar) {
  const tokens = authStore.gameTokens
  if (!tokens?.uid || !tokens?.cookie_token || !tokens?.ltoken || !tokens?.ltuid) {
    toast('请先登录获取游戏令牌', { duration: 3000 })
    return
  }

  try {
    toast(`正在计算 ${avatar.name} 的材料...`, { duration: 2000 })

    // 将角色转换为请求格式
    const computeItem = convertAvatarToBatchComputeItem(avatar)

    console.log('计算项:', computeItem)

    // 调用批量计算 API
    const result = await fetchBatchCompute(
      tokens.uid,
      [computeItem],
      {
        cookie_token: tokens.cookie_token,
        ltoken: tokens.ltoken,
        ltuid: tokens.ltuid,
      },
    )

    toast(`${avatar.name} 材料计算完成！`, {
      description: `共需 ${result.overall_consume.length} 种材料，请查看控制台`,
      duration: 5000,
    })

    // 关闭 dialog
    showAvatarDialog.value = false
  }
  catch (error) {
    console.error('计算材料失败:', error)
    toast('计算材料失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
}

// 生命周期
onMounted(async () => {
  await loadItemsData()
  loadPlanFromStorage()
  // 启动后自动检查更新
  handleCheckUpdate(true)
})

// ============ 更新检查方法 ============

// 检查更新
async function handleCheckUpdate(silent = false) {
  if (isCheckingUpdate.value)
    return

  isCheckingUpdate.value = true
  try {
    const update = await checkForUpdate()
    if (update) {
      updateAvailable.value = update
      showUpdateDialog.value = true
      toast('发现新版本', {
        description: `版本 ${update.version} 可用`,
        duration: 5000,
      })
    }
    else if (!silent) {
      toast('已是最新版本', { duration: 3000 })
    }
  }
  catch (error) {
    console.error('检查更新失败:', error)
    if (!silent) {
      toast('检查更新失败', {
        description: error instanceof Error ? error.message : '未知错误',
        duration: 5000,
      })
    }
  }
  finally {
    isCheckingUpdate.value = false
  }
}

// 下载并安装更新
async function handleDownloadAndInstall() {
  if (!updateAvailable.value || isDownloadingUpdate.value)
    return

  isDownloadingUpdate.value = true
  updateProgress.value = { downloaded: 0, total: 0 }

  try {
    toast('正在下载更新...', { duration: 2000 })

    await downloadAndInstallUpdate(updateAvailable.value, (progress) => {
      if (progress.event === 'Started' && progress.contentLength) {
        updateProgress.value.total = progress.contentLength
      }
      else if (progress.event === 'Progress' && progress.downloaded) {
        updateProgress.value.downloaded += progress.downloaded
      }
      else if (progress.event === 'Finished') {
        toast('下载完成，正在安装...', { duration: 2000 })
      }
    })

    // Windows 上安装时应用会自动退出，这是正常行为
    // 其他平台需要手动重启
    toast('更新安装完成，即将重启应用...', { duration: 3000 })
    setTimeout(async () => {
      await relaunchApp()
    }, 1000)
  }
  catch (error) {
    console.error('下载安装更新失败:', error)
    toast('更新失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
  finally {
    isDownloadingUpdate.value = false
  }
}
</script>

<style>
/* 悬浮滚动条样式 */
.scrollbar-overlay {
  /* 设置滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

/* Webkit 浏览器滚动条样式 */
.scrollbar-overlay::-webkit-scrollbar {
  width: 8px;
}

.scrollbar-overlay::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-overlay::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.scrollbar-overlay::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}

/* 转圈动画 */
.spinner-rotate {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
