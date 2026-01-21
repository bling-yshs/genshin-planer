import type { PlanItem } from '@/entity/InventoryItem.ts'
import type { QrLoginResult } from '@/entity/remote/QrLoginResult.ts'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useStore = defineStore(
  'main',
  () => {
    const someState = ref('hello pinia')
    return { someState }
  },
  {
    persist: true,
  },
)
/**
 * 游戏 Token 信息接口
 */
export interface GameTokens {
  uid: string
  ltuid: string
  ltoken: string
  cookie_token: string
}

/**
 * 用户认证状态管理
 */
export const useAuthStore = defineStore(
  'auth',
  () => {
    // 完整的登录结果
    const qrLoginResult = ref<QrLoginResult | null>(null)
    
    // 游戏令牌信息（用于 API 调用）
    const gameTokens = ref<GameTokens | null>(null)
    
    // 测试 UID
    const testUID = ref<string>('')

    function setQrLoginResult(result: QrLoginResult | null) {
      qrLoginResult.value = result
    }
    
    function setGameTokens(tokens: GameTokens | null) {
      gameTokens.value = tokens
      if (tokens?.uid) {
        testUID.value = tokens.uid
      }
    }
    
    function clearAuthData() {
      qrLoginResult.value = null
      gameTokens.value = null
      testUID.value = ''
    }

    return {
      qrLoginResult,
      setQrLoginResult,
      gameTokens,
      setGameTokens,
      testUID,
      clearAuthData,
    }
  },
  {
    persist: true,
  },
)
//
// /**
//  * 用户信息状态管理
//  */
export const useUserStore = defineStore('user', () => {
  const cultivationPlan = ref<PlanItem[]>([])
  // 养成计划过滤
  const planFilter = ref<'all' | 'shortage'>('all')

  const filteredPlan = computed(() => {
    if (planFilter.value === 'shortage') {
      return cultivationPlan.value.filter(item => item.shortage > 0)
    }
    return cultivationPlan.value
  })

  const setPlanFilter = (filter: 'all' | 'shortage') => {
    planFilter.value = filter
  }

  return {
    filteredPlan,
    setPlanFilter,
  }
})

/**
 * 角色养成预设配置
 */
export interface AvatarPreset {
  id: string // 唯一标识
  name: string // 预设名称，如 "90级 1/9/9"
  levelFrom: number // 起始等级
  levelTo: number // 目标等级
  talentAFrom: number // 普攻起始等级
  talentEFrom: number // 元素战技起始等级
  talentQFrom: number // 元素爆发起始等级
  talentA: number // 普攻目标等级
  talentE: number // 元素战技目标等级
  talentQ: number // 元素爆发目标等级
}

/**
 * 预设管理状态
 */
export const usePresetStore = defineStore(
  'preset',
  () => {
    // 快捷预设区（显示在外面的快捷设置按钮）
    const quickPresets = ref<AvatarPreset[]>([
      {
        id: 'preset-90-10',
        name: '90级 天赋10',
        levelFrom: 1,
        levelTo: 90,
        talentAFrom: 1,
        talentEFrom: 1,
        talentQFrom: 1,
        talentA: 10,
        talentE: 10,
        talentQ: 10,
      },
      {
        id: 'preset-80-8',
        name: '80级 天赋8',
        levelFrom: 1,
        levelTo: 80,
        talentAFrom: 1,
        talentEFrom: 1,
        talentQFrom: 1,
        talentA: 8,
        talentE: 8,
        talentQ: 8,
      },
      {
        id: 'preset-70-6',
        name: '70级 天赋6',
        levelFrom: 1,
        levelTo: 70,
        talentAFrom: 1,
        talentEFrom: 1,
        talentQFrom: 1,
        talentA: 6,
        talentE: 6,
        talentQ: 6,
      },
    ])

    // 暂存区预设（不显示在外面）
    const storagePresets = ref<AvatarPreset[]>([])

    // 添加预设（默认添加到暂存区）
    function addPreset(preset: Omit<AvatarPreset, 'id'>) {
      const newPreset: AvatarPreset = {
        ...preset,
        id: `preset-${Date.now()}`,
      }
      storagePresets.value.push(newPreset)
      return newPreset
    }

    // 更新预设
    function updatePreset(id: string, preset: Partial<AvatarPreset>) {
      // 在快捷预设中查找
      let index = quickPresets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        quickPresets.value[index] = { ...quickPresets.value[index], ...preset }
        return
      }
      // 在暂存区中查找
      index = storagePresets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        storagePresets.value[index] = { ...storagePresets.value[index], ...preset }
      }
    }

    // 删除预设
    function deletePreset(id: string) {
      // 从快捷预设中删除
      let index = quickPresets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        quickPresets.value.splice(index, 1)
        return
      }
      // 从暂存区中删除
      index = storagePresets.value.findIndex(p => p.id === id)
      if (index !== -1) {
        storagePresets.value.splice(index, 1)
      }
    }

    // 根据 ID 获取预设
    function getPresetById(id: string) {
      return quickPresets.value.find(p => p.id === id) || storagePresets.value.find(p => p.id === id)
    }

    // 设置快捷预设列表（用于拖拽后更新）
    function setQuickPresets(presets: AvatarPreset[]) {
      quickPresets.value = presets
    }

    // 设置暂存区列表（用于拖拽后更新）
    function setStoragePresets(presets: AvatarPreset[]) {
      storagePresets.value = presets
    }

    return {
      quickPresets,
      storagePresets,
      addPreset,
      updatePreset,
      deletePreset,
      getPresetById,
      setQuickPresets,
      setStoragePresets,
    }
  },
  {
    persist: true,
  },
)
