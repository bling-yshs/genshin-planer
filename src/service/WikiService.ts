import type { WikiAvatarInfo, WikiAvatarMaterials } from '@/entity/wiki/WikiAvatar'
import type { WikiItem } from '@/entity/wiki/WikiItem'
import { invoke } from '@tauri-apps/api/core'
import { fetch } from '@tauri-apps/plugin-http'

const WIKI_BASE_URL = 'https://homdgcat.wiki/gi/CH'
const WIKI_RES_BASE_URL = 'https://homdgcat.wiki/homdgcat-res'

// 缓存
let avatarListCache: WikiAvatarInfo[] | null = null
let itemCache: Map<number, WikiItem> | null = null
const avatarMaterialsCache = new Map<string, WikiAvatarMaterials>()

interface RustResult<T> {
  success: boolean
  data: T | null
  message: string
}

/**
 * 执行 JS 代码并返回指定变量的值
 */
async function executeJsAndGetVariable<T>(jsCode: string, variableName: string): Promise<T> {
  const result = await invoke<RustResult<T>>('execute_js_get_variable', {
    jsCode,
    variableName,
  })
  if (!result.success || result.data === null) {
    throw new Error(result.message || `无法获取变量 ${variableName}`)
  }
  return result.data
}

/**
 * 获取全角色列表
 */
export async function fetchWikiAvatarList(): Promise<WikiAvatarInfo[]> {
  if (avatarListCache) {
    return avatarListCache
  }

  const response = await fetch(`${WIKI_BASE_URL}/avatar.js`)
  if (!response.ok) {
    throw new Error(`获取角色列表失败: ${response.status}`)
  }

  const jsText = await response.text()
  const avatarList = await executeJsAndGetVariable<WikiAvatarInfo[]>(jsText, '__AvatarInfoConfig')

  // 过滤掉旅行者等特殊角色
  const filteredList = avatarList.filter(
    avatar => !['PlayerGirl', 'PlayerBoy'].includes(avatar._name)
      && !avatar._name.includes('_Odd')
      && !avatar.Name.includes('旅行者'),
  )

  avatarListCache = filteredList
  return filteredList
}

/**
 * 获取角色材料数据
 */
export async function fetchWikiAvatarMaterials(avatarEnglishName: string): Promise<WikiAvatarMaterials> {
  const cached = avatarMaterialsCache.get(avatarEnglishName)
  if (cached) {
    return cached
  }

  const response = await fetch(`${WIKI_BASE_URL}/Avatar/${avatarEnglishName}_1.js`)
  if (!response.ok) {
    throw new Error(`获取角色材料数据失败: ${response.status}`)
  }

  const jsText = await response.text()
  const materialsObj = await executeJsAndGetVariable<Record<string, WikiAvatarMaterials>>(jsText, '_AvatarMats_')

  const materials = Object.values(materialsObj)[0] as WikiAvatarMaterials

  avatarMaterialsCache.set(avatarEnglishName, materials)
  return materials
}

/**
 * 获取物品信息缓存
 * 注意：item.js 返回的数组中，只有索引 1-9 是材料数据，其他索引包含非材料数据（如成就图标等）
 */
export async function fetchWikiItemList(): Promise<Map<number, WikiItem>> {
  if (itemCache) {
    return itemCache
  }

  const response = await fetch(`${WIKI_BASE_URL}/item.js`)
  if (!response.ok) {
    throw new Error(`获取物品列表失败: ${response.status}`)
  }

  const jsText = await response.text()
  const itemsArray = await executeJsAndGetVariable<WikiItem[][]>(jsText, '_items')

  // 构建 ID -> Item 映射
  // 只取索引 1-5 的数据，这些才是材料数据
  const itemMap = new Map<number, WikiItem>()
  for (let i = 1; i <= 9 && i < itemsArray.length; i++) {
    const category = itemsArray[i]
    if (Array.isArray(category)) {
      for (const item of category) {
        if (item && item._id) {
          itemMap.set(item._id, item)
        }
      }
    }
  }

  // 添加摩拉（特殊处理）
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
  return `${WIKI_RES_BASE_URL}/Mat/${iconName}.png`
}

/**
 * 获取角色图标 URL
 */
export function getWikiAvatarIconUrl(avatar: WikiAvatarInfo): string {
  return `${WIKI_RES_BASE_URL}/Avatar/UI_AvatarIcon_${avatar._name}.png`
}

/**
 * 清除缓存
 */
export function clearWikiCache(): void {
  avatarListCache = null
  itemCache = null
  avatarMaterialsCache.clear()
}
