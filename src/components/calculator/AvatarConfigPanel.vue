<template>
  <Card class="p-3">
    <div class="flex items-start gap-3">
      <!-- 角色头像 -->
      <div class="flex-shrink-0">
        <CachedImage
          :src="getWikiAvatarIconUrl(avatar)"
          :alt="avatar.Name"
          class="w-12 h-12 rounded"
        />
      </div>

      <!-- 配置区域 -->
      <div class="flex-grow space-y-2">
        <!-- 角色名称和删除按钮 -->
        <div class="flex items-center justify-between">
          <span class="font-medium">{{ avatar.Name }}</span>
          <Button
            variant="ghost"
            size="sm"
            class="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
            @click="$emit('remove')"
          >
            ×
          </Button>
        </div>

        <!-- 等级配置 -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground w-12">等级:</span>
          <Input
            v-model.number="localConfig.levelFrom"
            type="number"
            min="1"
            max="90"
            class="w-16 h-7 text-center"
          />
          <span class="text-muted-foreground">→</span>
          <Input
            v-model.number="localConfig.levelTo"
            type="number"
            min="1"
            max="90"
            class="w-16 h-7 text-center"
          />
        </div>

        <!-- 天赋配置 -->
        <div class="grid grid-cols-3 gap-2 text-sm">
          <!-- 普攻 -->
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">A:</span>
            <Input
              v-model.number="localConfig.talentAFrom"
              type="number"
              min="1"
              max="10"
              class="w-11 h-6 text-center text-xs px-1"
            />
            <span class="text-muted-foreground">→</span>
            <Input
              v-model.number="localConfig.talentA"
              type="number"
              min="1"
              max="10"
              class="w-11 h-6 text-center text-xs px-1"
            />
          </div>

          <!-- 元素战技 -->
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">E:</span>
            <Input
              v-model.number="localConfig.talentEFrom"
              type="number"
              min="1"
              max="10"
              class="w-11 h-6 text-center text-xs px-1"
            />
            <span class="text-muted-foreground">→</span>
            <Input
              v-model.number="localConfig.talentE"
              type="number"
              min="1"
              max="10"
              class="w-11 h-6 text-center text-xs px-1"
            />
          </div>

          <!-- 元素爆发 -->
          <div class="flex items-center gap-1">
            <span class="text-muted-foreground">Q:</span>
            <Input
              v-model.number="localConfig.talentQFrom"
              type="number"
              min="1"
              max="10"
              class="w-11 h-6 text-center text-xs px-1"
            />
            <span class="text-muted-foreground">→</span>
            <Input
              v-model.number="localConfig.talentQ"
              type="number"
              min="1"
              max="10"
              class="w-11 h-6 text-center text-xs px-1"
            />
          </div>
        </div>
      </div>
    </div>
  </Card>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'
import type { AvatarCalculatorConfig, WikiAvatarInfo } from '@/entity/wiki/WikiAvatar'
import { getWikiAvatarIconUrl } from '@/service/WikiService'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import CachedImage from '@/components/common/CachedImage.vue'

const props = defineProps<{
  avatar: WikiAvatarInfo
  config: AvatarCalculatorConfig
}>()

const emit = defineEmits<{
  (e: 'update:config', value: AvatarCalculatorConfig): void
  (e: 'remove'): void
}>()

// 本地配置副本
const localConfig = reactive<AvatarCalculatorConfig>({
  avatar: props.avatar,
  levelFrom: props.config?.levelFrom ?? 1,
  levelTo: props.config?.levelTo ?? 90,
  talentAFrom: props.config?.talentAFrom ?? 1,
  talentEFrom: props.config?.talentEFrom ?? 1,
  talentQFrom: props.config?.talentQFrom ?? 1,
  talentA: props.config?.talentA ?? 10,
  talentE: props.config?.talentE ?? 10,
  talentQ: props.config?.talentQ ?? 10,
})

// 监听配置变化并同步到父组件
watch(localConfig, (newConfig) => {
  emit('update:config', { ...newConfig })
}, { deep: true })

// 监听外部配置变化
watch(() => props.config, (newConfig) => {
  if (newConfig) {
    localConfig.levelFrom = newConfig.levelFrom
    localConfig.levelTo = newConfig.levelTo
    localConfig.talentAFrom = newConfig.talentAFrom
    localConfig.talentEFrom = newConfig.talentEFrom
    localConfig.talentQFrom = newConfig.talentQFrom
    localConfig.talentA = newConfig.talentA
    localConfig.talentE = newConfig.talentE
    localConfig.talentQ = newConfig.talentQ
  }
}, { deep: true })
</script>
