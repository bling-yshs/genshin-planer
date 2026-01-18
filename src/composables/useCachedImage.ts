/**
 * 图片缓存 Composable
 * 提供响应式的图片 URL，自动处理缓存和加载状态
 */

import { ref, watch } from 'vue'
import { getImageUrl } from '@/service/ImageCacheService'

/**
 * 使用缓存图片
 *
 * @param remoteUrl 远程图片 URL（可以是 ref 或普通字符串）
 * @returns 响应式的本地图片 URL 和加载状态
 */
export function useCachedImage(remoteUrl: string | (() => string)) {
  const localUrl = ref<string>('')
  const loading = ref(true)
  const error = ref(false)

  const loadImage = async () => {
    const url = typeof remoteUrl === 'function' ? remoteUrl() : remoteUrl

    if (!url) {
      localUrl.value = ''
      loading.value = false
      return
    }

    loading.value = true
    error.value = false

    try {
      const cachedUrl = await getImageUrl(url)
      localUrl.value = cachedUrl
    }
    catch (err) {
      console.error('加载图片失败:', err)
      error.value = true
      localUrl.value = ''
    }
    finally {
      loading.value = false
    }
  }

  // 立即加载
  loadImage()

  // 如果是函数，监听变化
  if (typeof remoteUrl === 'function') {
    watch(remoteUrl, () => {
      loadImage()
    })
  }

  return {
    localUrl,
    loading,
    error,
    reload: loadImage,
  }
}
