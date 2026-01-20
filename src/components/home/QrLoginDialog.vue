<template>
  <Dialog v-model:open="openModel">
    <DialogContent class="sm:max-w-md bg-background border-2">
      <DialogHeader>
        <DialogTitle class="text-gradient-primary">
          米哈游登录二维码
        </DialogTitle>
        <DialogDescription>
          请使用米游社APP扫描二维码登录
        </DialogDescription>
      </DialogHeader>

      <div class="flex flex-col items-center space-y-4 py-4">
        <div v-if="qrLoginBase64" class="border rounded-lg p-4 bg-white">
          <img
            :src="qrLoginBase64"
            alt="登录二维码"
            class="w-64 h-64 object-contain"
          >
        </div>
        <div v-else class="text-center text-muted-foreground">
          二维码加载中...
        </div>

        <div class="text-center space-y-2">
          <div v-if="qrCountdown" class="text-2xl font-mono font-bold" :class="qrCountdown === '已过期' ? 'text-destructive' : 'text-primary'">
            {{ qrCountdown }}
          </div>
          <div class="text-sm text-muted-foreground">
            <span v-if="isPolling" class="flex items-center justify-center gap-1">
              <span class="animate-pulse">●</span> 正在等待扫码...
            </span>
            <span v-else-if="qrCountdown === '已过期'">
              二维码已过期，请重新获取
            </span>
            <span v-else>
              请使用米游社扫描二维码
            </span>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const props = defineProps<{
  open: boolean
  qrLoginBase64: string | null
  qrCountdown: string
  isPolling: boolean
}>()

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
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
</script>
