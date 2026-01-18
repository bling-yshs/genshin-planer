/**
 * 全局初始化函数
 * 在应用启动时执行一次性初始化操作
 */

import { BaseDirectory, exists, mkdir } from '@tauri-apps/plugin-fs'

/**
 * 初始化应用
 */
export async function initApp(): Promise<void> {
  try {
    // 初始化图片缓存目录
    const CACHE_DIR = 'image_cache'
    const dirExists = await exists(CACHE_DIR, { baseDir: BaseDirectory.AppCache })
    if (!dirExists) {
      await mkdir(CACHE_DIR, { baseDir: BaseDirectory.AppCache, recursive: true })
      console.log('图片缓存目录已创建')
    }

    console.log('应用初始化完成')
  }
  catch (error) {
    console.error('应用初始化失败:', error)
  }
}
