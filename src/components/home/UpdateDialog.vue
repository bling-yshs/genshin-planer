<template>
  <Dialog v-model:open="openModel">
    <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col glass-card border-2 border-accent/30">
      <DialogHeader>
        <DialogTitle class="text-gradient-accent">
          ?? 发现新版本 v{{ updateAvailable?.version }}
        </DialogTitle>
      </DialogHeader>

      <div class="flex-grow overflow-y-auto py-4 space-y-4">
        <div v-if="updateAvailable?.body" class="prose prose-sm dark:prose-invert max-w-none" v-html="updateBodyHtml" />

        <div v-if="isDownloadingUpdate" class="space-y-2">
          <div class="text-sm text-muted-foreground">
            正在下载更新...
          </div>
          <div class="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              class="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-300 pulse-glow"
              :style="{ width: updateProgress.total > 0 ? `${(updateProgress.downloaded / updateProgress.total) * 100}%` : '0%' }"
            />
          </div>
          <div class="text-xs text-muted-foreground text-right">
            {{ updateProgress.total > 0 ? `${Math.round(updateProgress.downloaded / 1024 / 1024 * 100) / 100} / ${Math.round(updateProgress.total / 1024 / 1024 * 100) / 100} MB` : '准备中...' }}
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-2 flex-shrink-0">
        <Button class="glass-button sparkle hover:scale-105 active:scale-95" :disabled="isDownloadingUpdate" @click="handleDownload">
          {{ isDownloadingUpdate ? '下载中...' : '立即更新' }}
        </Button>
        <Button variant="outline" class="hover:scale-105 active:scale-95" :disabled="isDownloadingUpdate" @click="handleClose">
          稍后再说
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import type { Update } from '@tauri-apps/plugin-updater'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface UpdateProgress {
  downloaded: number
  total: number
}

const props = defineProps<{
  open: boolean
  updateAvailable: Update | null
  updateBodyHtml: string
  isDownloadingUpdate: boolean
  updateProgress: UpdateProgress
}>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'download'): void
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

function handleDownload() {
  emit('download')
}

function handleClose() {
  emit('update:open', false)
}
</script>
