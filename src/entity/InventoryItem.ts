import type { AvatarCalculatorConfig } from '@/entity/wiki/WikiAvatar'
import type { CalculatedMaterial } from '@/entity/wiki/WikiItem'

// 背包物品接口定义
export interface InventoryItem {
  id: number
  name: string
  icon: string
  icon_url: string
  num: number
  level: number
  rarity: number
  wiki_url?: string
  lack_num?: number
  actualNum?: number
}

// 培养计划物品接口
export interface PlanItem extends InventoryItem {
  requiredNum: number
  shortage: number
}

// 角色养成计划
export interface AvatarPlan {
  id: string
  config: AvatarCalculatorConfig
  materials: CalculatedMaterial[]
  createdAt: number
  updatedAt: number
}

// 已保存的养成计划
export interface SavedPlan {
  id: string // UUID
  name: string // 计划名称
  items: PlanItem[] // 计划物品列表
  avatarPlans?: AvatarPlan[] // 角色计划列表
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}
