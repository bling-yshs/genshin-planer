/**
 * 用户信息接口
 * 对应 C# 中的 UserInformation 类
 */
export interface UserInformation {
  /** 账户ID */
  aid: string
  
  /** 用户ID */
  mid: string
  
  /** 账户名称 */
  account_name: string
  
  /** 邮箱地址 */
  email: string
  
  /** 邮箱是否已验证 */
  is_email_verify: number
  
  /** 区号 */
  area_code: string
  
  /** 手机号 */
  mobile: string
  
  /** 安全区号 */
  safe_area_code: string
  
  /** 安全手机号 */
  safe_mobile: string
  
  /** 真实姓名 */
  realname: string
  
  /** 身份证号 */
  identity_code: string
  
  /** 重新绑定区号 */
  rebind_area_code: string
  
  /** 重新绑定手机号 */
  rebind_mobile: string
  
  /** 重新绑定手机号时间 */
  rebind_mobile_time: string
  
  /** 关联链接 */
  links: any[]
  
  /** 国家 */
  country: string
  
  /** 密码时间 */
  password_time: string
  
  /** 是否成年人 */
  is_adult: number
  
  /** 未掩码邮箱 */
  unmasked_email: string
  
  /** 未掩码邮箱类型 */
  unmasked_email_type: number
}
