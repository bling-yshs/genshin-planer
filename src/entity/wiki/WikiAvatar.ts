/**
 * homdgcat.wiki 角色信息配置
 */
export interface WikiAvatarInfo {
  _name: string // 英文ID，用于获取材料数据
  _id: number // 角色数字ID
  Name: string // 中文名称
  Title?: string // 称号
  Nation?: string // 国家/地区
  Grade: number // 稀有度 (4 或 5)
  Type?: string // 体型 (Girl, Boy, Lady, Male, Loli)
  Weapon: string // 武器类型
  Element: string // 元素类型
  Icon?: string // 图标引用
  Version?: string // 版本
}

/**
 * 角色材料数据
 */
export interface WikiAvatarMaterials {
  Promotion: Record<string, number>[] // 突破材料，7个元素
  A: Record<string, number>[] // 普攻天赋材料，9个元素
  E: Record<string, number>[] // 元素战技材料，9个元素
  Q: Record<string, number>[] // 元素爆发材料，9个元素
}

/**
 * 角色选择配置
 */
export interface AvatarCalculatorConfig {
  avatar: WikiAvatarInfo
  levelFrom: number // 起始等级 (1-90)
  levelTo: number // 目标等级 (1-90)
  talentAFrom: number // 普攻起始等级 (1-10)
  talentEFrom: number // 元素战技起始等级 (1-10)
  talentQFrom: number // 元素爆发起始等级 (1-10)
  talentA: number // 普攻目标等级 (1-10)
  talentE: number // 元素战技目标等级 (1-10)
  talentQ: number // 元素爆发目标等级 (1-10)
}

/**
 * 元素类型中文名称映射
 */
export const ELEMENT_NAMES: Record<string, string> = {
  Fire: '火',
  Water: '水',
  Wind: '风',
  Electric: '雷',
  Elec: '雷',
  Ice: '冰',
  Rock: '岩',
  Grass: '草',
}

/**
 * 武器类型中文名称映射
 */
export const WEAPON_NAMES: Record<string, string> = {
  Sword: '单手剑',
  Claymore: '双手剑',
  Pole: '长柄武器',
  Bow: '弓',
  Catalyst: '法器',
}
