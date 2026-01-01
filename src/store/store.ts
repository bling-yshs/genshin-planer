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
