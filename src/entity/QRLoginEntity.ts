/**
 * 米哈游二维码登录相关实体类型定义
 */

/**
 * 二维码登录响应数据
 */
export interface MHYLoginQRCodeResponse {
  /** 二维码登录URL */
  url: string
  /** 登录票据 */
  ticket: string
  /** Base64编码的二维码图像 */
  qrCodeBase64: string
}

/**
 * 二维码登录状态枚举
 */
export enum QRLoginStatus {
  /** 等待扫描 */
  WAITING = 'waiting',
  /** 已扫描，等待确认 */
  SCANNED = 'scanned',
  /** 登录成功 */
  SUCCESS = 'success',
  /** 登录失败 */
  FAILED = 'failed',
  /** 二维码过期 */
  EXPIRED = 'expired',
}

/**
 * 二维码登录状态查询响应
 */
export interface QRLoginStatusResponse {
  /** 登录状态 */
  status: QRLoginStatus
  /** 状态消息 */
  message?: string
  /** 登录成功后的用户信息（可选） */
  userInfo?: {
    uid: string
    nickname: string
    avatar?: string
  }
  /** 登录成功后的认证令牌（可选） */
  token?: string
}

/**
 * 米哈游登录成功后的用户信息
 */
export interface MHYUserInfo {
  /** 用户ID */
  uid: string
  /** 用户昵称 */
  nickname: string
  /** 头像URL */
  avatar?: string
  /** 邮箱 */
  email?: string
  /** 手机号 */
  mobile?: string
}

/**
 * 米哈游登录成功响应
 */
export interface MHYLoginSuccessResponse {
  /** 用户信息 */
  userInfo: MHYUserInfo
  /** 认证令牌 */
  token: string
  /** Cookie字符串 */
  cookies: string
  /** 游戏令牌信息 */
  gameTokens?: {
    /** 原神相关令牌 */
    genshin?: {
      ltuid: string
      ltoken: string
      cookie_token: string
    }
    /** 星穹铁道相关令牌 */
    starrail?: {
      ltuid: string
      ltoken: string
      cookie_token: string
    }
  }
}
