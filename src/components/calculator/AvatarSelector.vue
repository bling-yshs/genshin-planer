<template>
  <div class="flex flex-col h-full min-h-0">
    <!-- 搜索和筛选 -->
    <div class="flex gap-2 mb-3 flex-shrink-0 px-0.5 pt-0.5">
      <Input
        v-model="searchQuery"
        type="text"
        placeholder="搜索角色名称..."
        class="flex-1"
      />
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="outline" size="sm">
            {{ elementFilter ? ELEMENT_NAMES[elementFilter] || elementFilter : '全部元素' }}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="elementFilter = ''">
            全部元素
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            v-for="element in elements"
            :key="element"
            @click="elementFilter = element"
          >
            {{ ELEMENT_NAMES[element] || element }}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- 角色网格 -->
    <div class="flex-1 overflow-y-auto min-h-0">
      <div v-if="loading" class="text-center py-8 text-muted-foreground">
        正在加载角色列表...
      </div>
      <div v-else-if="!hasVisibleAvatars" class="text-center py-8 text-muted-foreground">
        没有找到匹配的角色
      </div>
      <div v-else class="grid grid-cols-6 gap-2">
        <div
          v-for="avatar in sortedAvatars"
          v-show="isVisible(avatar)"
          :key="avatar._id"
          class="flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-colors"
          :class="isSelected(avatar) ? 'bg-primary/10 border-primary' : 'hover:bg-accent'"
          @click="toggleSelect(avatar)"
        >
          <div class="relative">
            <CachedImage
              :src="getWikiAvatarIconUrl(avatar)"
              :alt="avatar.Name"
              class="w-14 h-14 rounded"
            />
            <div
              v-if="isSelected(avatar)"
              class="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs"
            >
              ✓
            </div>
            <!-- 稀有度标识 -->
            <div
              class="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1 text-[10px] rounded"
              :class="avatar.Grade === 5 ? 'bg-amber-500 text-white' : 'bg-purple-500 text-white'"
            >
              {{ avatar.Grade }}★
            </div>
          </div>
          <span class="text-xs mt-1 text-center truncate w-full">{{ avatar.Name }}</span>
        </div>
      </div>
    </div>

    <!-- 已选择的角色（移到底部） -->
    <AnimatePresence>
      <Motion
        v-if="modelValue.length > 0"
        :initial="{ opacity: 0, height: 0, marginTop: 0 }"
        :animate="{ opacity: 1, height: 'auto', marginTop: 12 }"
        :exit="{ opacity: 0, height: 0, marginTop: 0 }"
        :transition="{ duration: 0.3, ease: 'easeOut' }"
        class="overflow-hidden"
      >
        <div class="flex gap-2 flex-wrap p-2 bg-muted rounded-lg max-h-24 overflow-y-auto">
          <AnimatePresence>
            <Motion
              v-for="avatar in modelValue"
              :key="avatar._id"
              :initial="{ opacity: 0, scale: 0.8 }"
              :animate="{ opacity: 1, scale: 1 }"
              :exit="{ opacity: 0, scale: 0.8 }"
              :transition="{ duration: 0.2, ease: 'easeOut' }"
              class="flex items-center gap-1 px-2 py-1 bg-background rounded text-sm"
            >
              <CachedImage :src="getWikiAvatarIconUrl(avatar)" class="w-5 h-5 rounded" alt="" />
              <span>{{ avatar.Name }}</span>
              <button
                class="ml-1 text-muted-foreground hover:text-destructive"
                @click="toggleSelect(avatar)"
              >
                ×
              </button>
            </Motion>
          </AnimatePresence>
        </div>
      </Motion>
    </AnimatePresence>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AnimatePresence, Motion } from 'motion-v'
import type { WikiAvatarInfo } from '@/entity/wiki/WikiAvatar'
import { ELEMENT_NAMES } from '@/entity/wiki/WikiAvatar'
import { getWikiAvatarIconUrl } from '@/service/WikiService'
import { Button } from '@/components/ui/button'
import CachedImage from '@/components/common/CachedImage.vue'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const props = defineProps<{
  avatars: WikiAvatarInfo[]
  loading: boolean
  modelValue: WikiAvatarInfo[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: WikiAvatarInfo[]): void
}>()

const searchQuery = ref('')
const elementFilter = ref('')

// 获取所有元素类型
const elements = computed(() => {
  const elementSet = new Set<string>()
  for (const avatar of props.avatars) {
    if (avatar.Element) {
      elementSet.add(avatar.Element)
    }
  }
  return Array.from(elementSet)
})

// 排序后的完整角色列表（不过滤，只排序）
const sortedAvatars = computed(() => {
  return [...props.avatars].sort((a, b) => b.Grade - a.Grade)
})

// 判断角色是否应该显示（用于 v-show）
function isVisible(avatar: WikiAvatarInfo): boolean {
  // 按元素筛选
  if (elementFilter.value && avatar.Element !== elementFilter.value) {
    return false
  }
  // 按名称搜索
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    if (!avatar.Name.toLowerCase().includes(query)) {
      return false
    }
  }
  return true
}

// 是否有可见的角色（用于显示空状态）
const hasVisibleAvatars = computed(() => {
  return sortedAvatars.value.some(avatar => isVisible(avatar))
})

// 检查角色是否已选中
function isSelected(avatar: WikiAvatarInfo): boolean {
  return props.modelValue.some(a => a._id === avatar._id)
}

// 切换选中状态
function toggleSelect(avatar: WikiAvatarInfo) {
  const index = props.modelValue.findIndex(a => a._id === avatar._id)
  if (index === -1) {
    // 添加
    emit('update:modelValue', [...props.modelValue, avatar])
  }
  else {
    // 移除
    const newValue = [...props.modelValue]
    newValue.splice(index, 1)
    emit('update:modelValue', newValue)
  }
}
</script>
