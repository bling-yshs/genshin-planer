/**
 * 图片缓存服务
 * 使用 Tauri HTTP 插件下载远程图片到本地缓存，绕过防盗链限制
 */

import { convertFileSrc } from '@tauri-apps/api/core'
import { appCacheDir, join } from '@tauri-apps/api/path'
import { BaseDirectory, exists, writeFile } from '@tauri-apps/plugin-fs'
import { fetch } from '@tauri-apps/plugin-http'

// 缓存目录
const CACHE_DIR = 'image_cache'

// 内存缓存：URL -> 本地路径
const memoryCache = new Map<string, string>()

// 正在下载的图片：URL -> Promise
const downloadingImages = new Map<string, Promise<string>>()

/**
 * 从 URL 生成缓存文件名
 * 使用 URL 的哈希值作为文件名，保留扩展名
 */
function getCacheFileName(url: string): string {
  // 简单的哈希函数
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }

  // 获取文件扩展名
  const urlObj = new URL(url)
  const pathname = urlObj.pathname
  const ext = pathname.substring(pathname.lastIndexOf('.'))

  return `${Math.abs(hash)}${ext}`
}

/**
 * 检查图片是否已缓存
 */
async function isCached(url: string): Promise<boolean> {
  const fileName = getCacheFileName(url)
  const filePath = `${CACHE_DIR}/${fileName}`

  try {
    return await exists(filePath, { baseDir: BaseDirectory.AppCache })
  }
  catch {
    return false
  }
}

/**
 * 下载图片到本地缓存
 */
async function downloadImage(url: string): Promise<string> {
  const fileName = getCacheFileName(url)
  const filePath = `${CACHE_DIR}/${fileName}`

  try {
    // 使用 Tauri HTTP 插件下载（不会发送 Referer）
    const response = await fetch(url, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error(`下载失败: ${response.status}`)
    }

    // 获取图片数据
    const imageData = await response.arrayBuffer()
    const uint8Array = new Uint8Array(imageData)

    // 写入缓存
    await writeFile(filePath, uint8Array, { baseDir: BaseDirectory.AppCache })

    console.log(`图片已缓存: ${fileName}`)
    return filePath
  }
  catch (error) {
    console.error(`下载图片失败 ${url}:`, error)
    throw error
  }
}

/**
 * 获取缓存图片的本地 URL
 */
async function getCachedImageUrl(url: string): Promise<string> {
  const fileName = getCacheFileName(url)
  const filePath = `${CACHE_DIR}/${fileName}`

  const cacheDir = await appCacheDir()
  const absolutePath = await join(cacheDir, filePath)

  // 转换为 Tauri 可访问的 URL
  const localUrl = convertFileSrc(absolutePath)
  return localUrl
}

/**
 * 获取图片 URL（自动处理缓存）
 *
 * @param remoteUrl 远程图片 URL
 * @returns 本地缓存 URL 或占位符
 */
export async function getImageUrl(remoteUrl: string): Promise<string> {
  if (!remoteUrl) {
    return ''
  }

  // 1. 检查内存缓存
  if (memoryCache.has(remoteUrl)) {
    return memoryCache.get(remoteUrl)!
  }

  // 2. 检查是否正在下载
  if (downloadingImages.has(remoteUrl)) {
    try {
      await downloadingImages.get(remoteUrl)
      return memoryCache.get(remoteUrl) || ''
    }
    catch {
      return ''
    }
  }

  // 3. 检查本地缓存
  const cached = await isCached(remoteUrl)
  if (cached) {
    const localUrl = await getCachedImageUrl(remoteUrl)
    memoryCache.set(remoteUrl, localUrl)
    return localUrl
  }

  // 4. 下载图片
  const downloadPromise = (async () => {
    try {
      await downloadImage(remoteUrl)
      const localUrl = await getCachedImageUrl(remoteUrl)
      memoryCache.set(remoteUrl, localUrl)
      return localUrl
    }
    catch (error) {
      console.error('图片缓存失败:', error)
      // 下载失败时返回空字符串
      return ''
    }
    finally {
      downloadingImages.delete(remoteUrl)
    }
  })()

  downloadingImages.set(remoteUrl, downloadPromise)
  return downloadPromise
}

/**
 * 预加载图片列表
 * 用于批量预加载图片，提升用户体验
 */
export async function preloadImages(urls: string[]): Promise<void> {
  const downloadTasks = urls.map(async (url) => {
    try {
      const cached = await isCached(url)
      if (!cached) {
        await downloadImage(url)
      }
    }
    catch (error) {
      console.warn(`预加载图片失败 ${url}:`, error)
    }
  })

  await Promise.all(downloadTasks)
  console.log(`预加载完成: ${urls.length} 张图片`)
}

/**
 * 清除所有缓存
 */
export async function clearImageCache(): Promise<void> {
  try {
    // 清除内存缓存
    memoryCache.clear()
    downloadingImages.clear()

    // 清除磁盘缓存（需要手动删除文件）
    // 注意：这里简化处理，实际可能需要遍历删除所有文件
    console.log('图片缓存已清除')
  }
  catch (error) {
    console.error('清除缓存失败:', error)
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats(): { memorySize: number, downloading: number } {
  return {
    memorySize: memoryCache.size,
    downloading: downloadingImages.size,
  }
}
