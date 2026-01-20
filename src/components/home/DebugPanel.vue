<template>
  <Card class="mb-4 glass-card border-2">
    <CardHeader class="py-2 px-4">
      <CardTitle class="text-sm flex items-center gap-2">
        🔧 调试信息
        <button
          class="text-muted-foreground hover:text-foreground transition-colors"
          :title="showDebugInfo ? '隐藏敏感信息' : '显示敏感信息'"
          @click="toggleDebug"
        >
          <i-mdi-eye-outline v-if="showDebugInfo" class="size-4" />
          <i-mdi-eye-off-outline v-else class="size-4" />
        </button>
      </CardTitle>
    </CardHeader>
    <CardContent class="py-2 px-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
        <div class="space-y-1">
          <div class="text-muted-foreground">
            UID:
          </div>
          <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (gameTokens?.uid || '未获取') : '***'">
            {{ showDebugInfo ? (gameTokens?.uid || '-') : (gameTokens?.uid ? '***' : '-') }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-muted-foreground">
            ltuid:
          </div>
          <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (gameTokens?.ltuid || '未获取') : '***'">
            {{ showDebugInfo ? (gameTokens?.ltuid || '-') : (gameTokens?.ltuid ? '***' : '-') }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-muted-foreground">
            ltoken:
          </div>
          <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (gameTokens?.ltoken || '未获取') : '***'">
            {{ showDebugInfo ? (gameTokens?.ltoken ? `${gameTokens.ltoken.slice(0, 20)}...` : '-') : (gameTokens?.ltoken ? '***' : '-') }}
          </div>
        </div>
        <div class="space-y-1">
          <div class="text-muted-foreground">
            cookie_token:
          </div>
          <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (gameTokens?.cookie_token || '未获取') : '***'">
            {{ showDebugInfo ? (gameTokens?.cookie_token ? `${gameTokens.cookie_token.slice(0, 20)}...` : '-') : (gameTokens?.cookie_token ? '***' : '-') }}
          </div>
        </div>
      </div>
      <div class="flex gap-2 flex-wrap mt-3">
        <Button size="sm" class="glass-button hover:scale-105 active:scale-95" @click="handleLogin">
          📲 扫码登录
        </Button>
        <Button size="sm" variant="default" class="glass-button hover:scale-105 active:scale-95" :disabled="inventoryProgress.isLoading" @click="handleFetchInventory">
          📦 {{ inventoryProgress.isLoading ? '获取中...' : '获取背包物品列表' }}
        </Button>
        <Button size="sm" variant="outline" class="hover:scale-105 active:scale-95" @click="handleTest">
          🧪 测试
        </Button>
        <Button
          size="sm"
          variant="outline"
          class="hover:scale-105 active:scale-95"
          @click="handleShowDeviceInfo"
        >
          📱 设备信息
        </Button>
        <Button variant="destructive" size="sm" class="hover:scale-105 active:scale-95" @click="handleClearTestData">
          🗑️ 清除数据
        </Button>
        <Button size="sm" variant="outline" class="hover:scale-105 active:scale-95" :disabled="isCheckingUpdate" @click="handleCheckUpdate">
          🔄 {{ isCheckingUpdate ? '检查中...' : '检查更新' }}
        </Button>
      </div>
      <AnimatePresence>
        <Motion
          v-if="inventoryProgress.isLoading"
          :initial="{ opacity: 0, y: -8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.3, ease: 'easeOut' }"
          class="mt-6"
        >
          <div class="flex w-full items-start">
            <template v-for="(item, index) in inventorySteps" :key="item.step">
              <div
                v-if="index > 0"
                class="flex-1 h-0.5 mt-2.5 transition-colors duration-300"
                :class="item.step <= inventoryProgress.currentStep ? 'bg-primary' : 'bg-muted'"
              />
              <div class="flex flex-col items-center">
                <div
                  class="size-5 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                  :class="[
                    item.step < inventoryProgress.currentStep ? 'border-primary bg-primary' : '',
                    item.step === inventoryProgress.currentStep ? 'border-primary bg-background' : '',
                    item.step > inventoryProgress.currentStep ? 'border-muted bg-background' : '',
                  ]"
                >
                  <i-mdi-check v-if="item.step < inventoryProgress.currentStep" class="size-3 text-primary-foreground" />
                  <i-mdi-loading v-else-if="item.step === inventoryProgress.currentStep" class="size-3 text-primary spinner-rotate" />
                  <i-mdi-circle-small v-else class="size-4 text-muted" />
                </div>
                <span
                  class="mt-1.5 text-[10px] font-medium transition-colors duration-300 whitespace-nowrap"
                  :class="[
                    item.step < inventoryProgress.currentStep ? 'text-foreground' : '',
                    item.step === inventoryProgress.currentStep ? 'text-primary' : '',
                    item.step > inventoryProgress.currentStep ? 'text-muted-foreground' : '',
                  ]"
                >
                  {{ item.title }}
                </span>
              </div>
            </template>
          </div>
        </Motion>
      </AnimatePresence>

    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { GameTokens } from '@/store/store'
import { AnimatePresence, Motion } from 'motion-v'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import CachedImage from '@/components/common/CachedImage.vue'

interface InventoryProgress {
  isLoading: boolean
  currentStep: number
}

interface InventoryStep {
  step: number
  title: string
}

defineProps<{
  showDebugInfo: boolean
  gameTokens: GameTokens | null
  inventoryProgress: InventoryProgress
  inventorySteps: InventoryStep[]
  isCheckingUpdate: boolean
}>()

const emit = defineEmits<{
  (event: 'toggle-debug'): void
  (event: 'login'): void
  (event: 'fetch-inventory'): void
  (event: 'test'): void
  (event: 'show-device-info'): void
  (event: 'clear-test-data'): void
  (event: 'check-update'): void
}>()

function toggleDebug() {
  emit('toggle-debug')
}

function handleLogin() {
  emit('login')
}

function handleFetchInventory() {
  emit('fetch-inventory')
}

function handleTest() {
  emit('test')
}

function handleShowDeviceInfo() {
  emit('show-device-info')
}

function handleClearTestData() {
  emit('clear-test-data')
}

function handleCheckUpdate() {
  emit('check-update')
}
</script>
