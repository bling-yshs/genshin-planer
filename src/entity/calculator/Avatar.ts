/**
 * 养成计算器 - 角色相关接口定义
 */

export interface Avatar {
  id: number
  name: string
  icon: string
  weapon_cat_id: number
  avatar_level: number
  element_attr_id: number
  max_level: number
  item_icon: string
  talent_icons: string[]
  side_icon: string
  profile_pictures: ProfilePicture[]
  talents: Talent[]
  skill_list: SkillList[]
  wiki_url: string
  wiki_recommend_weapon_url: string
  wiki_reliquary_url: string
  wiki_recommend_skill_url: string
}

export interface ProfilePicture {
  avatar_id: string
  costume_id: string
  icon: string
  profile_picture_id: string
}

export interface SkillList {
  id: number
  group_id: number
  name: string
  icon: string
  max_level: number
  is_proud: boolean
  pos_name: PosName
}

export type PosName = '普通攻击' | '元素战技' | '元素爆发' | ''

export interface Talent {
  id: number
  name: string
  icon: string
}

/**
 * 全角色列表响应
 */
export interface AllAvatarListResponse {
  list: Avatar[]
  total: number
}

/**
 * 武器信息
 */
export interface Weapon {
  id: number
  name: string
  icon: string
  weapon_cat_id: number
  weapon_level: number
  max_level: number
  is_recommend: boolean
  wiki_url: string
}

/**
 * 武器列表响应
 */
export interface WeaponListResponse {
  list: Weapon[]
  total: number
}

/**
 * 批量计算请求中的技能项
 */
export interface BatchComputeSkillItem {
  id: number
  level_current: number
  level_target: number
}

/**
 * 批量计算请求中的武器项
 */
export interface BatchComputeWeaponItem {
  id: number
  name: string
  icon: string
  weapon_cat_id: number
  weapon_level: number
  max_level: number
  level_current: number
  level_target: number
}

/**
 * 批量计算请求中的角色项
 */
export interface BatchComputeAvatarItem {
  avatar_id: number
  avatar_level_current: number
  avatar_level_target: number
  element_attr_id: number
  skill_list: BatchComputeSkillItem[]
  weapon?: BatchComputeWeaponItem
  from_user_sync: boolean
}

/**
 * 批量计算请求体
 */
export interface BatchComputeRequest {
  items: BatchComputeAvatarItem[]
  lang: string
  region: string
  uid: string
}

/**
 * 消耗物品
 */
export interface ConsumeItem {
  id: number
  name: string
  icon: string
  num: number
  wiki_url: string
  level: number
  icon_url: string
  lack_num: number
}

/**
 * 批量计算响应
 */
export interface BatchComputeResponse {
  overall_consume: ConsumeItem[]
  has_user_info: boolean
}
