/**
 * homdgcat.wiki 物品信息
 */
export interface WikiItem {
  _id: number // 物品ID
  R: number // 稀有度 (1-5)
  Name: string // 中文名称
  Desc?: string // 描述
  Icon: string // 图标文件名
  Type?: string // 物品类型
  Src?: string[] // 获取来源
}

/**
 * 计算后的材料需求
 */
export interface CalculatedMaterial {
  id: number
  name: string
  icon: string
  icon_url: string
  num: number
  level: number // 稀有度
  rarity: number
  wiki_url: string
}

/**
 * 角色材料计算结果
 */
export interface AvatarMaterialResult {
  avatarName: string
  materials: CalculatedMaterial[]
}

/**
 * 批量计算结果
 */
export interface BatchCalculationResult {
  avatarResults: AvatarMaterialResult[]
  mergedMaterials: CalculatedMaterial[] // 合并后的总材料
}
