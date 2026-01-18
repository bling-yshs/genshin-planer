<template>
  <Dialog v-model:open="openModel">
    <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col glass-card border-2">
      <DialogHeader>
        <DialogTitle class="text-gradient-accent">
          选择角色计算材料
        </DialogTitle>
        <DialogDescription>
          点击角色计算 1→90 等级 + 天赋 10/10/10 所需材料
        </DialogDescription>
      </DialogHeader>

      <div class="flex-grow overflow-y-auto py-4">
        <div v-if="allAvatars.length === 0" class="text-center text-muted-foreground py-8">
          <div v-if="isLoadingAvatars">
            正在加载角色列表...
          </div>
          <div v-else>
            暂无角色数据
          </div>
        </div>
        <div v-else class="grid grid-cols-6 gap-3">
          <div
            v-for="avatar in allAvatars"
            :key="avatar.id"
            class="flex flex-col items-center p-2 rounded-lg glass-card cursor-pointer hover:glow-primary hover:scale-105 active:scale-95 transition-all duration-300"
            @click="handleSelectAvatar(avatar)"
          >
              <img
                :src="avatar.icon"
                :alt="avatar.name"
                class="w-16 h-16 rounded"
              >
              <span class="text-xs mt-1 text-center truncate w-full">{{ avatar.name }}</span>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Avatar } from '@/entity/calculator/Avatar'
import { computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const props = defineProps<{
  open: boolean
  allAvatars: Avatar[]
  isLoadingAvatars: boolean
}>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'select-avatar', avatar: Avatar): void
}>()

const openModel = computed({
  get: getOpenModel,
  set: setOpenModel,
})

function getOpenModel() {
  return props.open
}

function setOpenModel(value: boolean) {
  emit('update:open', value)
}

function handleSelectAvatar(avatar: Avatar) {
  emit('select-avatar', avatar)
}
</script>
