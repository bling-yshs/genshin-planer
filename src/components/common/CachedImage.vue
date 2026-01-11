<template>
  <img
    :src="localUrl || placeholderSrc"
    :alt="alt"
    :class="[imgClass, { 'opacity-50': loading }]"
    v-bind="$attrs"
  >
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { getImageUrl } from '@/service/ImageCacheService'
import { ref } from 'vue'

interface Props {
  src: string
  alt?: string
  placeholder?: string
  imgClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  alt: '',
  placeholder: '',
  imgClass: '',
})

const localUrl = ref<string>('')
const loading = ref(true)

// 占位符图片（可以是 base64 或本地图片）
const placeholderSrc = computed(() => {
  return props.placeholder || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3C/svg%3E'
})

// 加载图片
async function loadImage(url: string) {
  if (!url) {
    localUrl.value = ''
    loading.value = false
    return
  }

  loading.value = true

  try {
    const cachedUrl = await getImageUrl(url)
    localUrl.value = cachedUrl
  }
  catch (error) {
    console.error('加载图片失败:', error)
    localUrl.value = ''
  }
  finally {
    loading.value = false
  }
}

// 监听 src 变化
watch(() => props.src, (newSrc) => {
  loadImage(newSrc)
}, { immediate: true })
</script>
