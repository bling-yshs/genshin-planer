import { v4 as uuidv4, validate as uuidValidate } from 'uuid'

/**
 * HTTP请求头管理器
 * 负责管理米哈游API请求的统一请求头，确保设备ID等信息的一致性
 */
export class HttpHeaderManager {
  private static instance: HttpHeaderManager
  private deviceId: string | null = null
  private deviceFp: string | null = null
  private readonly DEVICE_ID_KEY = 'mhy_device_id'
  private readonly DEVICE_FP_KEY = 'mhy_device_fp'

  private constructor() {
    this.initializeDeviceId()
    this.initializeDeviceFp()
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): HttpHeaderManager {
    if (!HttpHeaderManager.instance) {
      HttpHeaderManager.instance = new HttpHeaderManager()
    }
    return HttpHeaderManager.instance
  }

  /**
   * 初始化设备ID
   * 如果本地存储中有设备ID则使用，否则生成新的UUID格式设备ID
   */
  private initializeDeviceId(): void {
    try {
      // 尝试从localStorage获取已保存的设备ID
      const savedDeviceId = localStorage.getItem(this.DEVICE_ID_KEY)
      // 检查是否为UUID格式
      if (savedDeviceId && uuidValidate(savedDeviceId)) {
        this.deviceId = savedDeviceId
      }
      else {
        // 生成新的UUID格式设备ID并保存
        this.deviceId = uuidv4()
        localStorage.setItem(this.DEVICE_ID_KEY, this.deviceId)
      }
    }
    catch (error) {
      console.warn('Failed to access localStorage, using temporary device ID:', error)
      // 如果无法访问localStorage，使用临时设备ID
      this.deviceId = uuidv4()
    }
  }

  /**
   * 初始化设备指纹
   */
  private initializeDeviceFp(): void {
    try {
      const savedDeviceFp = localStorage.getItem(this.DEVICE_FP_KEY)
      if (savedDeviceFp && savedDeviceFp.length === 13) {
        this.deviceFp = savedDeviceFp
      }
      else {
        // 生成新的13位设备指纹
        this.deviceFp = this.generateDeviceFp()
        localStorage.setItem(this.DEVICE_FP_KEY, this.deviceFp)
      }
    }
    catch (error) {
      console.warn('Failed to access localStorage for device fp:', error)
      this.deviceFp = this.generateDeviceFp()
    }
  }

  /**
   * 生成13位的设备指纹（小写字母和数字）
   */
  private generateDeviceFp(): string {
    const chars = '0123456789abcdef'
    let result = ''
    for (let i = 0; i < 13; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return result
  }

  /**
   * 获取当前设备ID
   */
  public getDeviceId(): string {
    if (!this.deviceId) {
      this.initializeDeviceId()
    }
    return this.deviceId!
  }

  /**
   * 获取当前设备指纹
   */
  public getDeviceFp(): string {
    if (!this.deviceFp) {
      this.initializeDeviceFp()
    }
    return this.deviceFp!
  }

  /**
   * 重新生成设备ID（用于需要更换设备标识的场景）
   */
  public regenerateDeviceId(): string {
    this.deviceId = uuidv4()
    try {
      localStorage.setItem(this.DEVICE_ID_KEY, this.deviceId)
    }
    catch (error) {
      console.warn('Failed to save new device ID to localStorage:', error)
    }
    return this.deviceId
  }

  /**
   * 重新生成设备指纹
   */
  public regenerateDeviceFp(): string {
    this.deviceFp = this.generateDeviceFp()
    try {
      localStorage.setItem(this.DEVICE_FP_KEY, this.deviceFp)
    }
    catch (error) {
      console.warn('Failed to save new device fp to localStorage:', error)
    }
    return this.deviceFp
  }

  /**
   * 获取米哈游API的标准请求头（APP端）
   */
  public getMHYHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'User-Agent': 'HYPContainer/1.1.4.133',
      'x-rpc-app_id': 'ddxf5dufpuyo',
      'x-rpc-client_type': '3',
      'x-rpc-device_id': this.getDeviceId(),
    }
  }

  /**
   * 获取米哈游Web端API的请求头（用于网页登录）
   */
  public getMHYWebHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://user.mihoyo.com',
      'Referer': 'https://user.mihoyo.com/',
      'x-rpc-app_id': 'cie2gjc0sg00',
      'x-rpc-client_type': '4',
      'x-rpc-device_id': this.getDeviceId(),
      'x-rpc-device_fp': this.getDeviceFp(),
    }
  }

  /**
   * 获取养成计算器API的请求头（需要Cookie认证）
   * @param cookies 登录后的 cookie 信息
   * @param cookies.cookie_token cookie_token
   * @param cookies.ltoken ltoken
   * @param cookies.ltuid ltuid
   */
  public getCalculatorHeaders(cookies?: { cookie_token: string, ltoken: string, ltuid: string }): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json;charset=UTF-8',
      'Accept': 'application/json, text/plain, */*',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://act.mihoyo.com',
      'Referer': 'https://act.mihoyo.com/',
      'x-rpc-device_id': this.getDeviceId(),
      'x-rpc-device_fp': this.getDeviceFp(),
      'x-rpc-platform': '4',
      'x-rpc-page': '__#',
    }
    
    // 如果有 cookie，添加到请求头
    if (cookies) {
      headers.Cookie = `cookie_token=${cookies.cookie_token}; ltoken=${cookies.ltoken}; ltuid=${cookies.ltuid}; account_id=${cookies.ltuid}`
    }
    
    return headers
  }

  /**
   * 获取带有额外请求头的米哈游API请求头
   * @param additionalHeaders 额外的请求头
   */
  public getMHYHeadersWithExtras(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.getMHYHeaders(),
      ...additionalHeaders,
    }
  }

  /**
   * 获取带有额外请求头的米哈游Web端API请求头
   * @param additionalHeaders 额外的请求头
   */
  public getMHYWebHeadersWithExtras(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return {
      ...this.getMHYWebHeaders(),
      ...additionalHeaders,
    }
  }

  /**
   * 清除保存的设备ID（用于重置场景）
   */
  public clearDeviceId(): void {
    this.deviceId = null
    try {
      localStorage.removeItem(this.DEVICE_ID_KEY)
    }
    catch (error) {
      console.warn('Failed to remove device ID from localStorage:', error)
    }
  }

  /**
   * 清除保存的设备指纹
   */
  public clearDeviceFp(): void {
    this.deviceFp = null
    try {
      localStorage.removeItem(this.DEVICE_FP_KEY)
    }
    catch (error) {
      console.warn('Failed to remove device fp from localStorage:', error)
    }
  }
}

// 导出单例实例以便直接使用
export const httpHeaderManager = HttpHeaderManager.getInstance()
