import type {
  HakushCharacterData,
  HakushCharacterListResponse,
  HakushItemListResponse,
} from '@/entity/wiki/HakushTypes'
import type { WikiAvatarInfo, WikiAvatarMaterials } from '@/entity/wiki/WikiAvatar'
import type { WikiItem } from '@/entity/wiki/WikiItem'
import { fetch } from '@tauri-apps/plugin-http'
import {
  adaptHakushCharacterInfo,
  adaptHakushItem,
  adaptHakushMaterials,
  isTraveler,
  validateCharacterMaterials,
} from '@/utils/hakushAdapter'

// Hakush 数据源 URL
const HAKUSH_BASE_URL = 'https://cnb.cool/bling-team/yuhengbei/-/git/raw/main/output/hakush/gi'
const HAKUSH_JSON_URL = `${HAKUSH_BASE_URL}/json`
const HAKUSH_IMAGE_URL = `${HAKUSH_BASE_URL}/image`

// 缓存
let avatarListCache: WikiAvatarInfo[] | null = null
let itemCache: Map<number, WikiItem> | null = null
const avatarMaterialsCache = new Map<string, WikiAvatarMaterials>()
const characterDataCache = new Map<string, HakushCharacterData>()

/**
 * 获取全角色列表
 */
export async function fetchWikiAvatarList(): Promise<WikiAvatarInfo[]> {
  if (avatarListCache) {
    return avatarListCache
  }

  const response = await fetch(`${HAKUSH_JSON_URL}/character.json`)
  if (!response.ok) {
    throw new Error(`获取角色列表失败: ${response.status}`)
  }

  const data = await response.json() as HakushCharacterListResponse

  // 转换并过滤角色
  const avatarList: WikiAvatarInfo[] = []
  const avatarWithRelease: Array<{ avatar: WikiAvatarInfo, release: string }> = []

  for (const [id, info] of Object.entries(data)) {
    // 过滤旅行者
    if (isTraveler(id, info)) {
      continue
    }

    // 不再过滤未发布角色，而是将其排在最前面
    const avatar = adaptHakushCharacterInfo(id, info)
    avatarWithRelease.push({ avatar, release: info.release })
  }

  // 排序: 未发布角色 (1970-01-01) 排在最前，其他按发布时间从晚到早
  avatarWithRelease.sort((a, b) => {
    const dateA = new Date(a.release)
    const dateB = new Date(b.release)

    // 检查是否为未发布角色 (1970-01-01)
    const isUnreleasedA = dateA.getFullYear() === 1970
    const isUnreleasedB = dateB.getFullYear() === 1970

    // 未发布角色排在最前
    if (isUnreleasedA && !isUnreleasedB) {
      return -1
    }
    if (!isUnreleasedA && isUnreleasedB) {
      return 1
    }

    // 都是未发布或都是已发布，按时间从晚到早排序
    return dateB.getTime() - dateA.getTime()
  })

  // 提取排序后的角色列表
  for (const item of avatarWithRelease) {
    avatarList.push(item.avatar)
  }

  avatarListCache = avatarList
  return avatarList
}

/**
 * 获取角色材料数据
 * @param avatarId 角色数字 ID (如 "10000037")
 */
export async function fetchWikiAvatarMaterials(avatarId: string): Promise<WikiAvatarMaterials> {
  const cached = avatarMaterialsCache.get(avatarId)
  if (cached) {
    return cached
  }

  const response = await fetch(`${HAKUSH_JSON_URL}/character/${avatarId}.json`)
  if (!response.ok) {
    throw new Error(`获取角色材料数据失败: ${response.status}`)
  }

  const characterData = await response.json() as HakushCharacterData

  // 验证材料数据完整性
  if (!validateCharacterMaterials(characterData)) {
    throw new Error(`角色 ${avatarId} 的材料数据不完整`)
  }

  // 转换材料数据
  const materials = adaptHakushMaterials(characterData.Materials)

  // 缓存
  avatarMaterialsCache.set(avatarId, materials)
  characterDataCache.set(avatarId, characterData)

  return materials
}

/**
 * 获取角色完整数据 (包含 LevelEXP)
 * @param avatarId 角色数字 ID
 */
export async function fetchHakushCharacterData(avatarId: string): Promise<HakushCharacterData> {
  const cached = characterDataCache.get(avatarId)
  if (cached) {
    return cached
  }

  const response = await fetch(`${HAKUSH_JSON_URL}/character/${avatarId}.json`)
  if (!response.ok) {
    throw new Error(`获取角色数据失败: ${response.status}`)
  }

  const characterData = await response.json() as HakushCharacterData
  characterDataCache.set(avatarId, characterData)

  return characterData
}

/**
 * 获取物品信息缓存
 */
export async function fetchWikiItemList(): Promise<Map<number, WikiItem>> {
  if (itemCache) {
    return itemCache
  }

  const response = await fetch(`${HAKUSH_JSON_URL}/item_all.json`)
  if (!response.ok) {
    throw new Error(`获取物品列表失败: ${response.status}`)
  }

  const data = await response.json() as HakushItemListResponse

  // 构建 ID -> Item 映射
  const itemMap = new Map<number, WikiItem>()
  for (const [id, item] of Object.entries(data)) {
    itemMap.set(Number.parseInt(id, 10), adaptHakushItem(id, item))
  }

  // 确保摩拉存在 (ID 202)
  if (!itemMap.has(202)) {
    itemMap.set(202, {
      _id: 202,
      R: 3,
      Name: '摩拉',
      Desc: '通用货币',
      Icon: 'UI_ItemIcon_202',
      Type: '货币',
    })
  }

  // 确保经验书存在
  const expBooks = [
    { id: 104001, name: '流浪者的经验', icon: 'UI_ItemIcon_104001', rank: 2 },
    { id: 104002, name: '冒险家的经验', icon: 'UI_ItemIcon_104002', rank: 3 },
    { id: 104003, name: '大英雄的经验', icon: 'UI_ItemIcon_104003', rank: 4 },
  ]

  for (const book of expBooks) {
    if (!itemMap.has(book.id)) {
      itemMap.set(book.id, {
        _id: book.id,
        R: book.rank,
        Name: book.name,
        Desc: '角色经验素材',
        Icon: book.icon,
        Type: '角色经验素材',
      })
    }
  }

  itemCache = itemMap
  return itemMap
}

/**
 * 获取物品图标 URL
 */
export function getWikiItemIconUrl(iconName: string): string {
  if (!iconName) {
    return ''
  }
  return `${HAKUSH_IMAGE_URL}/${iconName}.webp`
}

/**
 * 获取角色图标 URL
 */
export function getWikiAvatarIconUrl(avatar: WikiAvatarInfo): string {
  if (!avatar.Icon) {
    return ''
  }
  return `${HAKUSH_IMAGE_URL}/${avatar.Icon}.webp`
}

/**
 * 清除缓存
 */
export function clearWikiCache(): void {
  avatarListCache = null
  itemCache = null
  avatarMaterialsCache.clear()
  characterDataCache.clear()
}
