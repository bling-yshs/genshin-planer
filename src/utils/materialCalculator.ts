import type { AvatarCalculatorConfig } from '@/entity/wiki/WikiAvatar'
import type { BatchCalculationResult, CalculatedMaterial } from '@/entity/wiki/WikiItem'
import { fetchHakushCharacterData, fetchWikiAvatarMaterials, fetchWikiItemList, getWikiItemIconUrl } from '@/service/WikiService'
import { calculateExpBooks } from '@/utils/hakushAdapter'

/**
 * 根据等级获取突破阶段
 * 等级范围: 1-20 -> 0, 21-40 -> 1, 41-50 -> 2, 51-60 -> 3, 61-70 -> 4, 71-80 -> 5, 81-90 -> 6
 */
export function getAscensionPhase(level: number): number {
  if (level <= 20)
    return 0
  if (level <= 40)
    return 1
  if (level <= 50)
    return 2
  if (level <= 60)
    return 3
  if (level <= 70)
    return 4
  if (level <= 80)
    return 5
  return 6
}

/**
 * 合并材料需求
 */
function mergeMaterials(
  target: Map<number, number>,
  source: Record<string, number>,
): void {
  for (const [idStr, num] of Object.entries(source)) {
    const id = Number.parseInt(idStr, 10)
    const current = target.get(id) || 0
    target.set(id, current + num)
  }
}

/**
 * 计算单个角色的材料需求
 */
export async function calculateAvatarMaterials(
  config: AvatarCalculatorConfig,
): Promise<Map<number, number>> {
  const avatarId = config.avatar._id.toString()
  const materials = await fetchWikiAvatarMaterials(avatarId)
  const result = new Map<number, number>()

  // 0. 计算经验书需求 (如果需要升级)
  if (config.levelFrom < config.levelTo) {
    try {
      const characterData = await fetchHakushCharacterData(avatarId)
      if (characterData.LevelEXP && characterData.LevelEXP.length > 0) {
        const expBooks = calculateExpBooks(config.levelFrom, config.levelTo, characterData.LevelEXP)
        mergeMaterials(result, expBooks)
      }
    }
    catch (error) {
      console.warn(`无法获取角色 ${avatarId} 的经验数据:`, error)
    }
  }

  // 1. 计算突破材料
  const fromPhase = getAscensionPhase(config.levelFrom)
  const toPhase = getAscensionPhase(config.levelTo)

  // 累加 Promotion[fromPhase+1] 到 Promotion[toPhase]
  for (let phase = fromPhase + 1; phase <= toPhase; phase++) {
    const phaseMaterials = materials.Promotion[phase]
    if (phaseMaterials && Object.keys(phaseMaterials).length > 0) {
      mergeMaterials(result, phaseMaterials)
    }
  }

  // 2. 计算普攻天赋材料 (A)
  // 累加 A[talentAFrom-1] 到 A[talentA-2]
  // 例如: 1→10 需要累加 A[0] 到 A[8]
  for (let level = config.talentAFrom; level < config.talentA; level++) {
    const levelMaterials = materials.A[level - 1]
    if (levelMaterials && Object.keys(levelMaterials).length > 0) {
      mergeMaterials(result, levelMaterials)
    }
  }

  // 3. 计算元素战技材料 (E)
  for (let level = config.talentEFrom; level < config.talentE; level++) {
    const levelMaterials = materials.E[level - 1]
    if (levelMaterials && Object.keys(levelMaterials).length > 0) {
      mergeMaterials(result, levelMaterials)
    }
  }

  // 4. 计算元素爆发材料 (Q)
  for (let level = config.talentQFrom; level < config.talentQ; level++) {
    const levelMaterials = materials.Q[level - 1]
    if (levelMaterials && Object.keys(levelMaterials).length > 0) {
      mergeMaterials(result, levelMaterials)
    }
  }

  return result
}

/**
 * 将材料 ID 映射转换为完整的材料信息
 */
export async function convertToCalculatedMaterials(
  materialMap: Map<number, number>,
): Promise<CalculatedMaterial[]> {
  const itemCache = await fetchWikiItemList()
  const result: CalculatedMaterial[] = []

  for (const [id, num] of materialMap) {
    const item = itemCache.get(id)
    if (item) {
      result.push({
        id,
        name: item.Name,
        icon: item.Icon,
        icon_url: getWikiItemIconUrl(item.Icon),
        num,
        level: item.R,
        rarity: item.R,
        wiki_url: `https://genshin.honeyhunterworld.com/i_${id}/?lang=CHS`,
      })
    }
    else {
      // 未知物品（可能是未上线的材料），使用默认值
      console.warn(`未找到物品信息: ID=${id}`)
      result.push({
        id,
        name: `未知物品 (${id})`,
        icon: '',
        icon_url: '',
        num,
        level: 1,
        rarity: 1,
        wiki_url: `https://genshin.honeyhunterworld.com/i_${id}/?lang=CHS`,
      })
    }
  }

  // 按稀有度降序排序
  result.sort((a, b) => b.rarity - a.rarity)
  return result
}

/**
 * 批量计算多个角色的材料需求
 */
export async function batchCalculateMaterials(
  configs: AvatarCalculatorConfig[],
): Promise<BatchCalculationResult> {
  const avatarResults: { avatarName: string, materials: CalculatedMaterial[] }[] = []
  const mergedMap = new Map<number, number>()

  for (const config of configs) {
    const materialMap = await calculateAvatarMaterials(config)

    // 合并到总计
    for (const [id, num] of materialMap) {
      const current = mergedMap.get(id) || 0
      mergedMap.set(id, current + num)
    }

    // 转换为完整信息
    const materials = await convertToCalculatedMaterials(materialMap)
    avatarResults.push({
      avatarName: config.avatar.Name,
      materials,
    })
  }

  // 转换合并后的材料
  const mergedMaterials = await convertToCalculatedMaterials(mergedMap)

  return {
    avatarResults,
    mergedMaterials,
  }
}
