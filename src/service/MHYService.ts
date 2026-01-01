import type { AllAvatarListResponse, Avatar, BatchComputeAvatarItem, BatchComputeResponse, BatchComputeWeaponItem, Weapon, WeaponListResponse } from '@/entity/calculator/Avatar'
import type { MHYApiResponse } from '@/entity/MHY.ts'
import type { QrLogin } from '@/entity/remote/QrLogin.ts'
import type { QrLoginResult } from '@/entity/remote/QrLoginResult.ts'
import { fetch } from '@tauri-apps/plugin-http'
import CryptoJS from 'crypto-js'
import QRCode from 'qrcode'
import { httpHeaderManager } from '@/entity/HttpHeaderManager'

export async function fetchMHYLoginQRCode(): Promise<QrLogin> {
  // 请求米哈游服务器获取二维码信息（Web端）
  const response = await fetch('https://passport-api.mihoyo.com/account/ma-cn-passport/web/createQRLogin', {
    method: 'POST',
    headers: httpHeaderManager.getMHYWebHeaders(),
    body: JSON.stringify({}),
  })

  if (!response.ok) {
    throw new Error(`无法获取二维码，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<QrLogin> = await response.json()

  // 检查响应是否有效
  if (res.retcode !== 0) {
    throw new Error(`获取二维码失败: ${res.message}`)
  }

  return res.data
}

// 辅助函数：生成二维码图像
export async function generateQRCode(text: string): Promise<string> {
  return QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 4,
    scale: 4,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  })
}

/**
 * 从 Set-Cookie 头解析 cookie 值
 */
function parseCookieValue(setCookieHeader: string, cookieName: string): string | undefined {
  // Set-Cookie 格式: name=value; Path=/; Domain=...; ...
  const regex = new RegExp(`${cookieName}=([^;]+)`)
  const match = setCookieHeader.match(regex)
  return match ? match[1] : undefined
}

/**
 * 获取二维码登录结果（Web端）
 * @param ticket 登录票据
 * @returns 登录状态信息，包含从响应头解析的 cookie
 */
export async function fetchMHYLoginResult(ticket: string): Promise<QrLoginResult> {
  const response = await fetch('https://passport-api.mihoyo.com/account/ma-cn-passport/web/queryQRLoginStatus', {
    method: 'POST',
    headers: httpHeaderManager.getMHYWebHeaders(),
    body: JSON.stringify({ ticket }),
  })

  if (!response.ok) {
    throw new Error(`无法获取二维码登录结果，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<QrLoginResult> = await response.json()

  // 检查响应是否有效
  if (res.retcode !== 0) {
    throw new Error(`获取二维码登录结果失败: ${res.message}`)
  }

  // 解析响应头中的 Set-Cookie
  const cookies: Record<string, string> = {}
  const setCookieHeaders = response.headers.getSetCookie?.() || []
  
  // 如果 getSetCookie 不可用，尝试从 headers 中获取
  if (setCookieHeaders.length === 0) {
    const setCookieHeader = response.headers.get('set-cookie')
    if (setCookieHeader) {
      // 单个 set-cookie 头可能包含多个 cookie（以逗号分隔，但要注意日期中的逗号）
      setCookieHeaders.push(setCookieHeader)
    }
  }

  // 解析每个 Set-Cookie 头
  for (const header of setCookieHeaders) {
    // 提取各种 token
    const cookieNames = [
      'account_id',
      'account_id_v2',
      'ltoken',
      'ltoken_v2',
      'ltuid',
      'ltuid_v2',
      'cookie_token',
      'cookie_token_v2',
      'account_mid_v2',
      'ltmid_v2',
    ]
    
    for (const name of cookieNames) {
      const value = parseCookieValue(header, name)
      if (value && value !== '') {
        cookies[name] = value
      }
    }
  }

  // 将解析的 cookie 附加到结果中
  res.data.cookies = {
    account_id: cookies.account_id || cookies.account_id_v2,
    ltoken: cookies.ltoken,
    ltoken_v2: cookies.ltoken_v2,
    ltuid: cookies.ltuid || cookies.ltuid_v2,
    ltuid_v2: cookies.ltuid_v2,
    cookie_token: cookies.cookie_token,
    cookie_token_v2: cookies.cookie_token_v2,
    account_mid_v2: cookies.account_mid_v2,
    ltmid_v2: cookies.ltmid_v2,
  }

  console.log('解析到的 Cookies:', res.data.cookies)

  return res.data
}

// 常量定义
const SALT_X4 = 'xV8v4Qu54lUKrEYFZkJhB8cuOh9Asafs'
const MHY_BASE_URL = 'https://api-takumi.mihoyo.com'
const API_BASE_URL = 'https://api-takumi-record.mihoyo.com'
const REFERER_URL = 'https://webstatic.mihoyo.com/'

/**
 * 养成计算器角色信息接口
 */
export interface CalculatorAvatar {
  id: number
  name: string
  icon: string
  element_attr_id: number
  weapon_cat_id: number
  level: number
  max_level: number
  is_selected?: boolean
}

/**
 * 养成计算器角色列表响应
 */
export interface CalculatorAvatarListResponse {
  list: CalculatorAvatar[]
  total: number
}

/**
 * 获取养成计算器角色列表（同步用户已拥有的角色）
 * @param uid 原神UID
 * @param cookies 登录后的 cookie 信息
 * @param cookies.cookie_token cookie_token
 * @param cookies.ltoken ltoken
 * @param cookies.ltuid ltuid
 * @param region 服务器区域，默认 cn_gf01（国服）
 * @param page 页码，默认1
 * @param size 每页数量，默认200
 * @returns 角色列表
 */
export async function fetchCalculatorAvatarList(
  uid: string,
  cookies: { cookie_token: string, ltoken: string, ltuid: string },
  region: string = 'cn_gf01',
  page: number = 1,
  size: number = 200,
): Promise<CalculatorAvatarListResponse> {
  const body = {
    uid,
    region,
    element_attr_ids: [],
    weapon_cat_ids: [],
    page,
    size,
    lang: 'zh-cn',
  }
  console.log('fetchCalculatorAvatarList body:', body)
  
  const response = await fetch(`${MHY_BASE_URL}/event/e20200928calculate/v1/sync/avatar/list`, {
    method: 'POST',
    headers: httpHeaderManager.getCalculatorHeaders(cookies),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`获取角色列表失败，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<CalculatorAvatarListResponse> = await response.json()

  if (res.retcode !== 0) {
    throw new Error(`获取角色列表失败: ${res.message}`)
  }

  return res.data
}

// 用户和UID信息接口
export interface UserAndUid {
  uid: string
  ltuid: string
  ltoken: string
  cookie_token: string
}

// 角色数据接口
export interface CharacterData {
  role_id: string
}

// 角色信息接口
export interface Character {
  id: number
  name: string
  element: string
  fetter: number
  level: number
  rarity: number
  weapon: {
    id: number
    name: string
    level: number
    promote_level: number
    type_name: string
    desc: string
    affix_level: number
  }
  reliquaries: Array<{
    id: number
    name: string
    icon: string
    pos: number
    rarity: number
    level: number
    set: {
      id: number
      name: string
      affixes: Array<{
        activation_number: number
        effect: string
      }>
    }
    pos_name: string
  }>
  constellations: Array<{
    id: number
    name: string
    icon: string
    effect: string
    is_actived: boolean
    pos: number
  }>
  actived_constellation_num: number
  costumes: Array<{
    id: number
    name: string
    icon: string
  }>
  external: {
    icon: string
    side_icon: string
    constellation_icon: string
  }
}

// 列表包装器接口
export interface ListWrapper<T> {
  list: T[]
}

// API响应接口
export interface Response<T> {
  retcode: number
  message: string
  data: T | null
}

/**
 * 生成随机字符串
 * @param length 字符串长度
 * @returns 随机字符串
 */
function generateRandomString(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 获取当前时间戳（秒）
 * @returns 时间戳
 */
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * 生成数据签名
 * @param query 查询参数
 * @param body 请求体
 * @returns 签名相关的请求头
 */
function generateDataSign(query = '', body = ''): Record<string, string> {
  const timestamp = getCurrentTimestamp()
  const randomStr = generateRandomString(6)

  // 构建签名字符串：salt=xxx&t=xxx&r=xxx&b=xxx&q=xxx
  const signString = `salt=${SALT_X4}&t=${timestamp}&r=${randomStr}&b=${body}&q=${query}`

  // 使用MD5生成签名
  const sign = CryptoJS.MD5(signString).toString()

  return {
    'x-rpc-app_version': '2.71.1',
    'x-rpc-client_type': '5',
    'x-rpc-device_id': httpHeaderManager.getDeviceId(),
    'DS': `${timestamp},${randomStr},${sign}`,
  }
}

/**
 * 构建Cookie字符串
 * @param userAndUid 用户信息
 * @returns Cookie字符串
 */
function buildCookieString(userAndUid: UserAndUid): string {
  return `ltuid=${userAndUid.ltuid}; ltoken=${userAndUid.ltoken}; cookie_token=${userAndUid.cookie_token}`
}

/**
 * 获取游戏记录API的完整请求头
 * @param userAndUid 用户信息
 * @param additionalHeaders 额外的请求头
 * @returns 完整的请求头
 */
function getGameRecordHeaders(
  userAndUid: UserAndUid,
  additionalHeaders: Record<string, string> = {},
): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 miHoYoBBS/2.71.1',
    'Referer': REFERER_URL,
    'Cookie': buildCookieString(userAndUid),
    'x-rpc-tool_verison': 'v5.0.1-ys',
    ...httpHeaderManager.getMHYHeaders(),
    ...additionalHeaders,
  }
}

/**
 * 用token换取ltoken和cookie_token
 * @param token 登录成功后获得的token
 * @returns 包含ltoken和cookie_token的用户信息
 */
export async function fetchGameTokens(token: string): Promise<{
  ltuid: string
  ltoken: string
  cookie_token: string
}> {
  try {
    // 第一步：获取ltoken
    const ltokenResponse = await fetch('https://passport-api.mihoyo.com/account/auth/api/getLTokenBySToken', {
      method: 'POST',
      headers: httpHeaderManager.getMHYHeadersWithExtras({
        Accept: 'application/json',
      }),
      body: JSON.stringify({ stoken: token }),
    })

    if (!ltokenResponse.ok) {
      throw new Error(`Failed to get ltoken: ${ltokenResponse.status}`)
    }

    const ltokenData = await ltokenResponse.json()
    if (ltokenData.retcode !== 0) {
      throw new Error(`LToken API error: ${ltokenData.message}`)
    }

    const { ltoken, ltuid } = ltokenData.data

    // 第二步：获取cookie_token
    const cookieTokenResponse = await fetch(
      'https://passport-api.mihoyo.com/account/auth/api/getCookieAccountInfoBySToken',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'x-rpc-app_id': 'ddxf5dufpuyo',
          'x-rpc-client_type': '3',
          'x-rpc-device_id': httpHeaderManager.getDeviceId(),
        },
        body: JSON.stringify({ stoken: token }),
      },
    )

    if (!cookieTokenResponse.ok) {
      throw new Error(`Failed to get cookie token: ${cookieTokenResponse.status}`)
    }

    const cookieTokenData = await cookieTokenResponse.json()
    if (cookieTokenData.retcode !== 0) {
      throw new Error(`Cookie token API error: ${cookieTokenData.message}`)
    }

    const { cookie_token } = cookieTokenData.data

    return {
      ltuid,
      ltoken,
      cookie_token,
    }
  }
  catch (error) {
    console.error('Error exchanging token for game tokens:', error)
    throw error
  }
}

/**
 * 获取角色列表 - 对应C#中的GetCharacterListAsync方法
 * @param userAndUid 用户和UID信息
 * @returns 角色列表响应
 */
export async function getCharacterListAsync(userAndUid: UserAndUid): Promise<Response<ListWrapper<Character>>> {
  try {
    const url = `${API_BASE_URL}/game_record/app/genshin/api/character`
    const requestBody = JSON.stringify({ role_id: userAndUid.uid })

    // 生成数据签名
    const signHeaders = generateDataSign('', requestBody)

    // 构建完整的请求头
    const headers = {
      ...getGameRecordHeaders(userAndUid),
      ...signHeaders,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody,
    })

    if (!response.ok) {
      throw new Error(`Failed to get character list: ${response.status}`)
    }

    const data = await response.json()

    // 检查API响应
    if (data.retcode !== 0) {
      // 如果是1034错误（需要验证），可以在这里处理
      if (data.retcode === 1034) {
        throw new Error('需要进行人机验证，请稍后重试')
      }
      throw new Error(`API error: ${data.message || 'Unknown error'}`)
    }

    return data as Response<ListWrapper<Character>>
  }
  catch (error) {
    console.error('Error getting character list:', error)
    throw error
  }
}

/**
 * 获取角色详细信息
 * @param userAndUid 用户和UID信息
 * @param characterIds 角色ID列表
 * @returns 角色详细信息响应
 */
export async function getCharacterDetailAsync(
  userAndUid: UserAndUid,
  characterIds: number[],
): Promise<Response<ListWrapper<Character>>> {
  try {
    const url = `${API_BASE_URL}/game_record/app/genshin/api/character/detail`
    const requestBody = JSON.stringify({
      role_id: userAndUid.uid,
      character_ids: characterIds,
    })

    // 生成数据签名
    const signHeaders = generateDataSign('', requestBody)

    // 构建完整的请求头
    const headers = {
      ...getGameRecordHeaders(userAndUid),
      ...signHeaders,
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: requestBody,
    })

    if (!response.ok) {
      throw new Error(`Failed to get character detail: ${response.status}`)
    }

    const data = await response.json()

    // 检查API响应
    if (data.retcode !== 0) {
      if (data.retcode === 1034) {
        throw new Error('需要进行人机验证，请稍后重试')
      }
      throw new Error(`API error: ${data.message || 'Unknown error'}`)
    }

    return data as Response<ListWrapper<Character>>
  }
  catch (error) {
    console.error('Error getting character detail:', error)
    throw error
  }
}

/**
 * 获取玩家基本信息
 * @param userAndUid 用户和UID信息
 * @returns 玩家基本信息响应
 */
export async function getPlayerInfoAsync(userAndUid: UserAndUid): Promise<Response<any>> {
  try {
    const url = `${API_BASE_URL}/game_record/app/genshin/api/index?role_id=${userAndUid.uid}&server=cn_gf01`

    // 生成数据签名
    const query = `role_id=${userAndUid.uid}&server=cn_gf01`
    const signHeaders = generateDataSign(query, '')

    // 构建完整的请求头
    const headers = {
      ...getGameRecordHeaders(userAndUid),
      ...signHeaders,
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to get player info: ${response.status}`)
    }

    const data = await response.json()

    // 检查API响应
    if (data.retcode !== 0) {
      if (data.retcode === 1034) {
        throw new Error('需要进行人机验证，请稍后重试')
      }
      throw new Error(`API error: ${data.message || 'Unknown error'}`)
    }

    return data
  }
  catch (error) {
    console.error('Error getting player info:', error)
    throw error
  }
}

/**
 * 获取每日便笺（树脂、委托等信息）
 * @param userAndUid 用户和UID信息
 * @returns 每日便笺响应
 */
export async function getDailyNoteAsync(userAndUid: UserAndUid): Promise<Response<any>> {
  try {
    const url = `${API_BASE_URL}/game_record/app/genshin/api/dailyNote?role_id=${userAndUid.uid}&server=cn_gf01`

    // 生成数据签名
    const query = `role_id=${userAndUid.uid}&server=cn_gf01`
    const signHeaders = generateDataSign(query, '')

    // 构建完整的请求头
    const headers = {
      ...getGameRecordHeaders(userAndUid),
      ...signHeaders,
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      throw new Error(`Failed to get daily note: ${response.status}`)
    }

    const data = await response.json()

    // 检查API响应
    if (data.retcode !== 0) {
      if (data.retcode === 1034) {
        throw new Error('需要进行人机验证，请稍后重试')
      }
      throw new Error(`API error: ${data.message || 'Unknown error'}`)
    }

    return data
  }
  catch (error) {
    console.error('Error getting daily note:', error)
    throw error
  }
}

/**
 * 获取全角色列表（不需要登录，返回游戏中所有角色信息）
 * @param page 页码，默认1
 * @param size 每页数量，默认200
 * @returns 角色列表
 */
export async function fetchAllAvatarList(
  page: number = 1,
  size: number = 200,
): Promise<AllAvatarListResponse> {
  const body = {
    element_attr_ids: [],
    weapon_cat_ids: [],
    page,
    size,
    is_all: true,
    lang: 'zh-cn',
  }
  
  const response = await fetch(`${MHY_BASE_URL}/event/e20200928calculate/v1/avatar/list`, {
    method: 'POST',
    headers: httpHeaderManager.getCalculatorHeaders(),
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`获取全角色列表失败，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<AllAvatarListResponse> = await response.json()

  if (res.retcode !== 0) {
    throw new Error(`获取全角色列表失败: ${res.message}`)
  }

  console.log('全角色列表:', res.data)
  return res.data
}

/**
 * 批量计算材料消耗
 * @param uid 原神UID
 * @param items 要计算的角色列表
 * @param cookies 登录后的 cookie 信息
 * @param cookies.cookie_token cookie_token
 * @param cookies.ltoken ltoken
 * @param cookies.ltuid ltuid
 * @param region 服务器区域，默认 cn_gf01
 * @returns 计算结果
 */
export async function fetchBatchCompute(
  uid: string,
  items: BatchComputeAvatarItem[],
  cookies: { cookie_token: string, ltoken: string, ltuid: string },
  region: string = 'cn_gf01',
): Promise<BatchComputeResponse> {
  const body = {
    items,
    lang: 'zh-cn',
    region,
    uid,
  }
  
  console.log('批量计算请求:', body)
  
  // 添加额外的请求头
  const headers = {
    ...httpHeaderManager.getCalculatorHeaders(cookies),
    'x-rpc-cal_type': '0',
    'x-rpc-stat_platform': 'PC',
  }
  
  const response = await fetch(`${MHY_BASE_URL}/event/e20200928calculate/v3/batch_compute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`批量计算失败，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<BatchComputeResponse> = await response.json()

  if (res.retcode !== 0) {
    throw new Error(`批量计算失败: ${res.message}`)
  }

  console.log('批量计算结果:', res.data)
  return res.data
}

/**
 * 批量计算武器材料消耗
 * @param uid 原神UID
 * @param weapons 要计算的武器列表
 * @param cookies 登录后的 cookie 信息
 * @param cookies.cookie_token cookie_token
 * @param cookies.ltoken ltoken
 * @param cookies.ltuid ltuid
 * @param region 服务器区域，默认 cn_gf01
 * @returns 计算结果
 */
export async function fetchBatchComputeWeapons(
  uid: string,
  weapons: BatchComputeWeaponItem[],
  cookies: { cookie_token: string, ltoken: string, ltuid: string },
  region: string = 'cn_gf01',
): Promise<BatchComputeResponse> {
  // 构造请求体：items 数组中包含 weapon 对象
  const items = weapons.map(weapon => ({
    weapon: {
      id: weapon.id,
      level_current: weapon.level_current,
      level_target: weapon.max_level,
    },
  }))

  const body = {
    items,
    lang: 'zh-cn',
    region,
    uid,
  }
  
  console.log('批量计算武器请求:', body)
  
  // 添加额外的请求头
  const headers = {
    ...httpHeaderManager.getCalculatorHeaders(cookies),
    'x-rpc-cal_type': '1', // 武器计算类型可能需要设为 1？参考 curl 里的 x-rpc-cal_type: 1
    'x-rpc-stat_platform': 'PC',
  }
  
  const response = await fetch(`${MHY_BASE_URL}/event/e20200928calculate/v3/batch_compute`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`批量计算武器失败，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<BatchComputeResponse> = await response.json()

  if (res.retcode !== 0) {
    throw new Error(`批量计算武器失败: ${res.message}`)
  }

  console.log('批量计算武器结果:', res.data)
  return res.data
}

/**
 * 将角色信息转换为批量计算请求格式
 * 固定计算 1→90 等级，天赋 10/10/10
 * @param avatar 角色信息
 * @returns 批量计算角色项
 */
export function convertAvatarToBatchComputeItem(avatar: Avatar): BatchComputeAvatarItem {
  // 获取需要升级的技能（普通攻击、元素战技、元素爆发，max_level > 1）
  const skillList = avatar.skill_list
    .filter(skill => !skill.is_proud) // 排除被动天赋
    .map(skill => ({
      id: skill.group_id, // 使用 group_id 作为技能 ID
      level_current: 1,
      level_target: skill.max_level, // 通常是 10
    }))
  
  // 添加被动天赋（level 1→1）
  const passiveSkills = avatar.skill_list
    .filter(skill => skill.is_proud)
    .map(skill => ({
      id: skill.group_id, // 使用 group_id 作为技能 ID
      level_current: 1,
      level_target: 1,
    }))
  
  return {
    avatar_id: avatar.id,
    avatar_level_current: 1,
    avatar_level_target: 90,
    element_attr_id: avatar.element_attr_id,
    skill_list: [...skillList, ...passiveSkills],
    from_user_sync: false,
  }
}

/**
 * 游戏角色信息
 */
export interface GameRole {
  game_biz: string
  region: string
  game_uid: string
  nickname: string
  level: number
  is_chosen: boolean
  region_name: string
  is_official: boolean
}

/**
 * 获取用户绑定的游戏角色列表（用于获取 UID）
 */
export async function fetchUserGameRoles(cookies: {
  ltoken: string
  ltuid: string
  cookie_token?: string
}): Promise<GameRole[]> {
  const cookieString = [
    `ltoken=${cookies.ltoken}`,
    `ltuid=${cookies.ltuid}`,
    cookies.cookie_token ? `cookie_token=${cookies.cookie_token}` : '',
  ].filter(Boolean).join('; ')

  const response = await fetch('https://passport-api.mihoyo.com/binding/api/getUserGameRolesByLtoken?game_biz=hk4e_cn', {
    method: 'GET',
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Origin': 'https://act.mihoyo.com',
      'Referer': 'https://act.mihoyo.com/',
      'Cookie': cookieString,
      'x-rpc-device_id': httpHeaderManager.getDeviceId(),
    },
  })

  if (!response.ok) {
    throw new Error(`获取游戏角色列表失败，状态码: ${response.status}`)
  }

  const res = await response.json() as { retcode: number, message: string, data: { list: GameRole[] } }

  if (res.retcode !== 0) {
    throw new Error(`获取游戏角色列表失败: ${res.message}`)
  }

  return res.data.list
}

/**
 * 获取全部武器列表
 * @param page 页码
 * @param size 每页数量
 */
export async function fetchWeaponList(
  page: number = 1,
  size: number = 1000,
): Promise<Weapon[]> {
  const body = {
    weapon_cat_ids: [],
    weapon_levels: [],
    page,
    size,
    lang: 'zh-cn',
  }

  const response = await fetch(`${MHY_BASE_URL}/event/e20200928calculate/v1/weapon/list`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'https://webstatic.mihoyo.com',
      'Referer': 'https://webstatic.mihoyo.com/',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    throw new Error(`获取武器列表失败，状态码: ${response.status}`)
  }

  const res: MHYApiResponse<WeaponListResponse> = await response.json()

  if (res.retcode !== 0) {
    throw new Error(`获取武器列表失败: ${res.message}`)
  }

  console.log(`获取全部武器: ${res.data.list.length} 把 (共 ${res.data.total} 把)`)
  return res.data.list
}

/**
 * 将武器信息转换为批量计算请求格式
 * 固定计算 1→90 等级
 * @param weapon 武器信息
 * @returns 批量计算武器项
 */
export function convertWeaponToBatchComputeItem(weapon: Weapon): BatchComputeWeaponItem {
  return {
    id: weapon.id,
    name: weapon.name,
    icon: weapon.icon,
    weapon_cat_id: weapon.weapon_cat_id,
    weapon_level: weapon.weapon_level,
    max_level: weapon.max_level,
    level_current: 1,
    level_target: weapon.max_level,
  }
}
