/**
 * Hakush 数据适配器
 * 将 hakush 数据源的数据结构转换为现有的 WikiAvatarInfo/WikiAvatarMaterials 格式
 */

import type {
  HakushCharacterData,
  HakushCharacterInfo,
  HakushCharacterMaterials,
  HakushElement,
  HakushItem,
  HakushRank,
  HakushWeaponType,
} from '@/entity/wiki/HakushTypes'
import type { WikiAvatarInfo, WikiAvatarMaterials } from '@/entity/wiki/WikiAvatar'
import type { WikiItem } from '@/entity/wiki/WikiItem'

// ============ 映射表 ============

/**
 * 稀有度映射: Hakush → Wiki
 */
const RANK_MAP: Record<HakushRank, number> = {
  QUALITY_ORANGE: 5,
  QUALITY_PURPLE: 4,
  QUALITY_ORANGE_SP: 5,
}

/**
 * 武器类型映射: Hakush → Wiki
 */
const WEAPON_TYPE_MAP: Record<HakushWeaponType, string> = {
  WEAPON_SWORD_ONE_HAND: 'Sword',
  WEAPON_CLAYMORE: 'Claymore',
  WEAPON_BOW: 'Bow',
  WEAPON_POLE: 'Pole',
  WEAPON_CATALYST: 'Catalyst',
}

/**
 * 元素类型映射: Hakush → Wiki
 * Hakush 使用英文名称，Wiki 也使用英文名称，但需要统一格式
 */
const ELEMENT_MAP: Record<HakushElement, string> = {
  Pyro: 'Fire',
  Hydro: 'Water',
  Anemo: 'Wind',
  Electro: 'Electric',
  Cryo: 'Ice',
  Geo: 'Rock',
  Dendro: 'Grass',
}

// ============ 适配器函数 ============

/**
 * 转换角色基础信息: HakushCharacterInfo → WikiAvatarInfo
 */
export function adaptHakushCharacterInfo(
  id: string,
  hakush: HakushCharacterInfo,
): WikiAvatarInfo {
  return {
    _id: Number.parseInt(id, 10),
    _name: hakush.EN, // 使用英文名作为 _name
    Name: hakush.CHS, // 中文名
    Icon: hakush.icon, // 图标名称
    Grade: RANK_MAP[hakush.rank] || 5,
    Weapon: WEAPON_TYPE_MAP[hakush.weapon] || 'Sword',
    Element: ELEMENT_MAP[hakush.element] || hakush.element,
  }
}

/**
 * 转换材料列表: HakushMaterial[] → Record<string, number>
 */
function convertMaterialsToRecord(
  mats: Array<{ Id: number, Count: number }>,
  cost: number,
): Record<string, number> {
  const result: Record<string, number> = {}

  // 添加材料
  for (const mat of mats) {
    result[mat.Id.toString()] = mat.Count
  }

  // 添加摩拉 (ID 202)
  if (cost > 0) {
    result['202'] = cost
  }

  return result
}

/**
 * 转换角色材料数据: HakushCharacterMaterials → WikiAvatarMaterials
 */
export function adaptHakushMaterials(
  materials: HakushCharacterMaterials,
): WikiAvatarMaterials {
  // 1. 转换突破材料 (Ascensions → Promotion)
  // Hakush 有 6 个阶段 (1-6)，Wiki 需要 7 个 (0-6)
  // 阶段 0 为空对象 (1-20级无需突破材料)
  const promotion: Record<string, number>[] = [{}]

  for (const ascension of materials.Ascensions) {
    promotion.push(convertMaterialsToRecord(ascension.Mats, ascension.Cost))
  }

  // 2. 转换天赋材料 (Talents → A/E/Q)
  // Hakush: Talents[0/1/2] 分别对应普攻/元素战技/元素爆发
  // 每个天赋有 9 级 (1→2, 2→3, ..., 9→10)
  const A: Record<string, number>[] = []
  const E: Record<string, number>[] = []
  const Q: Record<string, number>[] = []

  if (materials.Talents.length >= 3) {
    // 普攻 (A)
    for (const level of materials.Talents[0]) {
      A.push(convertMaterialsToRecord(level.Mats, level.Cost))
    }

    // 元素战技 (E)
    for (const level of materials.Talents[1]) {
      E.push(convertMaterialsToRecord(level.Mats, level.Cost))
    }

    // 元素爆发 (Q)
    for (const level of materials.Talents[2]) {
      Q.push(convertMaterialsToRecord(level.Mats, level.Cost))
    }
  }

  return {
    Promotion: promotion,
    A,
    E,
    Q,
  }
}

/**
 * 转换物品信息: HakushItem → WikiItem
 */
export function adaptHakushItem(
  id: string,
  hakush: HakushItem,
): WikiItem {
  return {
    _id: Number.parseInt(id, 10),
    R: hakush.Rank,
    Name: hakush.Name,
    Desc: hakush.Desc,
    Icon: hakush.Icon,
    Type: hakush.Type,
  }
}

// ============ 经验书计算 ============

/**
 * 经验书配置
 */
const EXP_BOOKS = [
  { id: 104003, exp: 20000, name: '大英雄的经验' }, // 紫色
  { id: 104002, exp: 5000, name: '冒险家的经验' }, // 蓝色
  { id: 104001, exp: 1000, name: '流浪者的经验' }, // 绿色
]

/**
 * 根据等级经验数组计算所需经验书
 * 使用贪心算法: 优先使用大经验书
 *
 * @param fromLevel 起始等级 (1-90)
 * @param toLevel 目标等级 (1-90)
 * @param levelEXP 每级所需经验数组 (索引0对应1级，索引89对应90级)
 * @returns 经验书 ID → 数量的映射
 */
export function calculateExpBooks(
  fromLevel: number,
  toLevel: number,
  levelEXP: number[],
): Record<string, number> {
  // 计算总经验需求
  let totalExp = 0
  for (let i = fromLevel - 1; i < toLevel - 1; i++) {
    totalExp += levelEXP[i] || 0
  }

  if (totalExp === 0) {
    return {}
  }

  const result: Record<string, number> = {}

  // 贪心分配: 从大到小使用经验书
  for (const book of EXP_BOOKS) {
    const count = Math.floor(totalExp / book.exp)
    if (count > 0) {
      result[book.id.toString()] = count
      totalExp -= count * book.exp
    }
  }

  // 处理剩余经验 (使用最小的经验书向上取整)
  if (totalExp > 0) {
    const smallestBook = EXP_BOOKS[EXP_BOOKS.length - 1]
    const remainingCount = Math.ceil(totalExp / smallestBook.exp)
    const currentCount = result[smallestBook.id.toString()] || 0
    result[smallestBook.id.toString()] = currentCount + remainingCount
  }

  return result
}

// ============ 工具函数 ============

/**
 * 检查角色是否为旅行者
 */
export function isTraveler(id: string, info: HakushCharacterInfo): boolean {
  // 旅行者 ID 包含 "-" (如 "10000007-2")
  if (id.includes('-')) {
    return true
  }

  // 英文名包含 "Player"
  if (info.EN.includes('Player')) {
    return true
  }

  return false
}

/**
 * 检查角色是否已发布
 */
export function isReleased(info: HakushCharacterInfo): boolean {
  const releaseDate = new Date(info.release)
  const now = new Date()

  // 未发布角色的日期通常为 "1970-01-01" 或未来日期
  if (releaseDate.getFullYear() === 1970) {
    return false
  }

  return releaseDate <= now
}

/**
 * 验证角色材料数据是否完整
 */
export function validateCharacterMaterials(data: HakushCharacterData): boolean {
  if (!data.Materials) {
    return false
  }

  const { Ascensions, Talents } = data.Materials

  // 检查突破材料 (应该有6个阶段)
  if (!Ascensions || Ascensions.length !== 6) {
    return false
  }

  // 检查天赋材料 (应该有3个天赋)
  if (!Talents || Talents.length !== 3) {
    return false
  }

  // 检查每个天赋是否有9级
  for (const talent of Talents) {
    if (!talent || talent.length !== 9) {
      return false
    }
  }

  return true
}
