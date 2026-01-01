/**
 * 令牌包装器接口
 * 对应 C# 中的 TokenWrapper 类
 */
export interface TokenWrapper {
  /** 令牌类型 */
  token_type: number
  
  /** 令牌值 */
  token: string
}
