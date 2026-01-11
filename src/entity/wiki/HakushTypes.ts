/**
 * Hakush 数据源类型定义
 * 数据来源: https://cnb.cool/bling-team/yuhengbei/-/git/raw/main/output/hakush/gi/
 */

// ============ 基础类型 ============

export type HakushElement = 'Cryo' | 'Anemo' | 'Pyro' | 'Hydro' | 'Geo' | 'Electro' | 'Dendro'
export type HakushRank = 'QUALITY_ORANGE' | 'QUALITY_PURPLE' | 'QUALITY_ORANGE_SP'
export type HakushWeaponType = 'WEAPON_SWORD_ONE_HAND' | 'WEAPON_CATALYST' | 'WEAPON_CLAYMORE' | 'WEAPON_BOW' | 'WEAPON_POLE'
export type HakushItemType = 'ITEM_MATERIAL' | 'ITEM_VIRTUAL'
export type HakushMaterialType = 'MATERIAL_EXCHANGE' | 'MATERIAL_AVATAR_MATERIAL' | 'MATERIAL_EXP_FRUIT' | 'MATERIAL_NONE' | string

// ============ 角色数据 ============

/**
 * 角色基础信息 (来自 character.json)
 */
export interface HakushCharacterInfo {
  birth: [number, number] // 生日 [月, 日]
  icon: string // 图标名称，如 "UI_AvatarIcon_Ganyu"
  rank: HakushRank // 稀有度
  weapon: HakushWeaponType // 武器类型
  release: string // 发布日期，如 "2021-01-12 06:00:00"
  element: HakushElement // 元素类型
  EN: string // 英文名
  desc: string // 描述
  KR: string // 韩文名
  CHS: string // 中文简体名
  JP: string // 日文名
}

/**
 * 角色材料数据中的单个材料项
 */
export interface HakushMaterial {
  Name: string // 材料名称
  Id: number // 材料 ID
  Count: number // 数量
  Rank: number // 稀有度 (1-5)
}

/**
 * 角色突破阶段数据
 */
export interface HakushAscensionPhase {
  Mats: HakushMaterial[] // 所需材料列表
  Cost: number // 摩拉消耗
}

/**
 * 角色天赋等级数据
 */
export interface HakushTalentLevel {
  Mats: HakushMaterial[] // 所需材料列表
  Cost: number // 摩拉消耗
}

/**
 * 角色材料数据 (来自 character/{id}.json 的 Materials 字段)
 */
export interface HakushCharacterMaterials {
  Ascensions: HakushAscensionPhase[] // 6个突破阶段 (对应等级突破 20/40/50/60/70/80)
  Talents: HakushTalentLevel[][] // 3个天赋 × 每个9级
}

/**
 * 完整角色数据 (来自 character/{id}.json)
 */
export interface HakushCharacterData {
  Name: string // 角色名称
  Desc: string // 描述
  Weapon: string // 武器类型
  Rarity: string // 稀有度
  Element: string // 元素
  Icon: string // 图标
  LevelEXP: number[] // 每级所需经验值数组 (索引0对应1级，索引89对应90级)
  Materials: HakushCharacterMaterials // 材料数据
  Special: boolean // 是否为特殊角色
  // ... 其他字段省略，我们只需要这些
}

// ============ 物品数据 ============

/**
 * 物品数据 (来自 item_all.json)
 */
export interface HakushItem {
  Name: string // 物品名称
  Desc: string // 描述
  Rank: number // 稀有度 (1-5)
  Icon: string // 图标名称，如 "UI_ItemIcon_104003"
  ItemType: HakushItemType // 物品类型
  MaterialType: HakushMaterialType // 材料类型
  JumpDescs: string[] // 跳转描述
  SourceList: string[] // 来源列表
  Title: string // 标题
  Effect: string // 效果
  Special: string // 特殊说明
  Type: string // 类型分类
  Week?: number // 周几可获取 (天赋书等)
}

// ============ 武器数据 ============

/**
 * 武器数据 (来自 weapon.json)
 */
export interface HakushWeapon {
  icon: string // 图标名称
  rank: number // 稀有度
  type: string // 武器类型
  EN: string // 英文名
  desc: string // 描述
  KR: string // 韩文名
  CHS: string // 中文简体名
  JP: string // 日文名
  skin?: boolean // 是否为皮肤
}

// ============ API 响应类型 ============

/**
 * 角色列表 API 响应 (character.json)
 */
export interface HakushCharacterListResponse {
  [id: string]: HakushCharacterInfo
}

/**
 * 物品列表 API 响应 (item_all.json)
 */
export interface HakushItemListResponse {
  [id: string]: HakushItem
}

/**
 * 武器列表 API 响应 (weapon.json)
 */
export interface HakushWeaponListResponse {
  [id: string]: HakushWeapon
}
