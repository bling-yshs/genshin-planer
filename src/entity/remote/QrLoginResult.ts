import type { RealnameInfo } from './RealnameInfo'
import type { TokenWrapper } from './TokenWrapper'
import type { UserInformation } from './UserInformation'

/**
 * 从响应头解析出的 Cookie Token 信息
 */
export interface ParsedCookies {
  /** 账号ID */
  account_id?: string
  /** LToken */
  ltoken?: string
  /** LToken V2 */
  ltoken_v2?: string
  /** Cookie Token */
  cookie_token?: string
  /** Cookie Token V2 */
  cookie_token_v2?: string
  /** LTUID */
  ltuid?: string
  /** LTUID V2 */
  ltuid_v2?: string
  /** Account MID V2 */
  account_mid_v2?: string
  /** LTMID V2 */
  ltmid_v2?: string
}

/**
 * 二维码登录结果接口
 * 对应 C# 中的 QrLoginResult 类
 */
export interface QrLoginResult {
  /** 登录状态 */
  status: string
  
  /** 应用ID */
  app_id: string
  
  /** 客户端类型 */
  client_type: number
  
  /** 创建时间 */
  created_at: string
  
  /** 扫描时间 */
  scanned_at: string
  
  /** 令牌列表 */
  tokens: TokenWrapper[]
  
  /** 用户信息 */
  user_info: UserInformation
  
  /** 实名信息 */
  realname_info: RealnameInfo
  
  /** 是否需要真人验证 */
  need_realperson: boolean
  
  /** 扩展信息 */
  ext: string
  
  /** 扫描游戏业务 */
  scan_game_biz: string

  /** 从响应头解析出的 Cookie 信息（Web 端 API 特有） */
  cookies?: ParsedCookies
}
