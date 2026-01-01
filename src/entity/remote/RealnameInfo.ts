/**
 * 实名信息接口
 * 对应 C# 中的 RealnameInfo 类
 */
export interface RealnameInfo {
  /** 是否需要实名认证 */
  required: boolean
  
  /** 操作类型 */
  action_type: string
  
  /** 操作票据 */
  action_ticket: string
}
