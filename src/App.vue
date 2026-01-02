<template>
  <div class="min-h-screen bg-background p-6">
    <div class="mx-auto">
      <!-- 调试信息区域 -->
      <Card class="mb-4">
        <CardHeader class="py-2 px-4">
          <CardTitle class="text-sm flex items-center gap-2">
            🔧 调试信息
            <button
              class="text-muted-foreground hover:text-foreground transition-colors"
              :title="showDebugInfo ? '隐藏敏感信息' : '显示敏感信息'"
              @click="showDebugInfo = !showDebugInfo"
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
              <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (authStore.gameTokens?.uid || '未获取') : '***'">
                {{ showDebugInfo ? (authStore.gameTokens?.uid || '-') : (authStore.gameTokens?.uid ? '***' : '-') }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground">
                ltuid:
              </div>
              <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (authStore.gameTokens?.ltuid || '未获取') : '***'">
                {{ showDebugInfo ? (authStore.gameTokens?.ltuid || '-') : (authStore.gameTokens?.ltuid ? '***' : '-') }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground">
                ltoken:
              </div>
              <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (authStore.gameTokens?.ltoken || '未获取') : '***'">
                {{ showDebugInfo ? (authStore.gameTokens?.ltoken ? `${authStore.gameTokens.ltoken.slice(0, 20)}...` : '-') : (authStore.gameTokens?.ltoken ? '***' : '-') }}
              </div>
            </div>
            <div class="space-y-1">
              <div class="text-muted-foreground">
                cookie_token:
              </div>
              <div class="bg-muted p-1.5 rounded truncate" :title="showDebugInfo ? (authStore.gameTokens?.cookie_token || '未获取') : '***'">
                {{ showDebugInfo ? (authStore.gameTokens?.cookie_token ? `${authStore.gameTokens.cookie_token.slice(0, 20)}...` : '-') : (authStore.gameTokens?.cookie_token ? '***' : '-') }}
              </div>
            </div>
          </div>
          <div class="flex gap-2 flex-wrap mt-3">
            <Button size="sm" @click="openLoginQRCode">
              📲 扫码登录
            </Button>
            <Button size="sm" variant="default" :disabled="inventoryProgress.isLoading" @click="fetchAllAvatarsInventory">
              📦 {{ inventoryProgress.isLoading ? '获取中...' : '获取背包物品列表' }}
            </Button>
            <Button size="sm" variant="outline" @click="testFn">
              🧪 测试
            </Button>
            <Button size="sm" variant="outline" @click="showDeviceInfo">
              📱 设备信息
            </Button>
            <Button variant="destructive" size="sm" @click="clearTestData">
              🗑️ 清除数据
            </Button>
            <Button size="sm" variant="outline" :disabled="isCheckingUpdate" @click="handleCheckUpdate(false)">
              🔄 {{ isCheckingUpdate ? '检查中...' : '检查更新' }}
            </Button>
          </div>
          <!-- 获取背包物品进度条 -->
          <div v-if="inventoryProgress.isLoading" class="mt-3">
            <div class="flex w-full items-start">
              <template v-for="(item, index) in inventorySteps" :key="item.step">
                <!-- 连线（除了第一个） -->
                <div
                  v-if="index > 0"
                  class="flex-1 h-0.5 mt-2.5 transition-colors duration-300"
                  :class="item.step <= inventoryProgress.currentStep ? 'bg-primary' : 'bg-muted'"
                />
                <!-- 步骤点 -->
                <div class="flex flex-col items-center">
                  <div
                    class="size-5 rounded-full border-2 flex items-center justify-center transition-all duration-300"
                    :class="[
                      item.step < inventoryProgress.currentStep ? 'border-primary bg-primary' : '',
                      item.step === inventoryProgress.currentStep ? 'border-primary bg-background' : '',
                      item.step > inventoryProgress.currentStep ? 'border-muted bg-background' : '',
                    ]"
                  >
                    <!-- 已完成：打勾 -->
                    <svg v-if="item.step < inventoryProgress.currentStep" class="size-3 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                    </svg>
                    <!-- 进行中：转圈 -->
                    <svg v-else-if="item.step === inventoryProgress.currentStep" class="size-3 text-primary" style="animation: spin 1s linear infinite;" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <!-- 未开始：小圆点 -->
                    <span v-else class="size-1.5 rounded-full bg-muted" />
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
          </div>
        </CardContent>
      </Card>

      <!-- 可调整大小的左右布局容器 -->
      <ResizablePanelGroup direction="horizontal" class="rounded-lg border max-h-[90vh] min-h-[90vh]">
        <ResizablePanel :default-size="50" :min-size="30">
          <Card class="h-full border-0 rounded-none flex flex-col">
            <CardHeader class="pb-3 flex-shrink-0">
              <CardTitle class="text-lg">
                物品库
              </CardTitle>
              <CardDescription>点击物品添加到养成计划</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3 flex-grow flex flex-col min-h-0">
              <Input
                v-model="searchQuery"
                type="text"
                placeholder="搜索物品..."
                class="w-full flex-shrink-0"
              />

              <!-- 物品网格 -->
              <div class="flex-grow overflow-y-auto scrollbar-overlay min-h-0">
                <div class="grid grid-cols-[repeat(auto-fill,minmax(155px,1fr))] gap-2 p-3">
                  <Card
                    v-for="item in filteredItems"
                    :key="item.id"
                    class="cursor-pointer transition-colors hover:bg-accent hover:text-accent-foreground p-1"
                    @click="addToPlan(item)"
                  >
                    <CardContent class="flex items-center gap-2 p-2">
                      <div class="relative size-8 flex-shrink-0">
                        <img
                          :src="getQualityBackground(item.level)"
                          alt=""
                          class="absolute inset-0 size-full rounded object-cover"
                        >
                        <img
                          :src="item.icon_url"
                          :alt="item.name"
                          class="relative size-full rounded object-cover"
                        >
                      </div>
                      <div class="flex-1 min-w-0">
                        <div class="truncate font-medium text-xs">
                          {{ item.name }}
                        </div>
                        <div class="text-xs text-muted-foreground">
                          拥有: {{ item.actualNum }}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>

        <!-- 可拖动的分隔条 -->
        <ResizableHandle with-handle />
        <ResizablePanel :default-size="50" :min-size="42">
          <Card class="h-full border-0 rounded-none flex flex-col">
            <CardHeader class="pb-3 flex-shrink-0">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <CardTitle class="text-lg">
                    养成计划
                  </CardTitle>
                  <!-- 计划切换下拉菜单 -->
                  <DropdownMenu>
                    <DropdownMenuTrigger as-child>
                      <Button variant="outline" size="sm" class="h-7 gap-1 text-xs">
                        <span class="max-w-32 truncate">{{ currentPlanName }}</span>
                        <span v-if="hasUnsavedChanges" class="text-amber-500">*</span>
                        <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd" />
                        </svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" class="w-56">
                      <DropdownMenuItem @click="createNewPlan">
                        <svg class="mr-2 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                        </svg>
                        新建空白计划
                      </DropdownMenuItem>
                      <DropdownMenuSeparator v-if="savedPlans.length > 0" />
                      <DropdownMenuItem
                        v-for="plan in savedPlans"
                        :key="plan.id"
                        :class="plan.id === currentPlanId ? 'bg-accent' : ''"
                        @click="tryLoadPlan(plan.id)"
                      >
                        <svg class="mr-2 size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M3.75 3A1.75 1.75 0 002 4.75v10.5c0 .966.784 1.75 1.75 1.75h12.5A1.75 1.75 0 0018 15.25v-8.5A1.75 1.75 0 0016.25 5h-4.836a.25.25 0 01-.177-.073L9.823 3.513A1.75 1.75 0 008.586 3H3.75z" clip-rule="evenodd" />
                        </svg>
                        <span class="truncate">{{ plan.name }}</span>
                        <span v-if="plan.id === currentPlanId" class="ml-auto text-primary">✓</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <!-- 操作按钮 -->
                <div class="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 px-2"
                    title="保存"
                    @click="quickSave"
                  >
                    💾
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 px-2"
                    title="另存为"
                    @click="openSaveAsDialog"
                  >
                    📤
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 px-2"
                    title="重命名"
                    :disabled="!currentPlanId"
                    @click="openRenameDialog"
                  >
                    ✏️
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 px-2 text-destructive hover:text-destructive"
                    title="删除"
                    :disabled="!currentPlanId"
                    @click="openDeleteDialog"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
              <CardDescription>管理你的材料需求</CardDescription>
              <Button
                variant="outline"
                size="sm"
                class="mt-2 w-fit"
                @click="showCalculatorDialog = true"
              >
                📊 快速添加角色材料
              </Button>
            </CardHeader>
            <CardContent class="flex-grow flex flex-col min-h-0">
              <div
                v-if="cultivationPlan.length === 0"
                class="text-center py-8 flex-grow flex flex-col items-center justify-center"
              >
                <div class="text-muted-foreground">
                  点击上方「快速添加角色材料」批量添加，或点击左侧物品手动添加
                </div>
              </div>

              <div v-else class="flex flex-col flex-grow min-h-0 space-y-3">
                <div class="flex flex-col gap-2 flex-shrink-0">
                  <!-- 筛选按钮 -->
                  <div class="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      :class="planFilter === 'all' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''"
                      @click="setPlanFilter('all')"
                    >
                      默认
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      :class="planFilter === 'shortage' ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' : ''"
                      @click="setPlanFilter('shortage')"
                    >
                      仅查看缺少物品
                    </Button>
                  </div>
                </div>

                <div class="flex-grow overflow-y-auto scrollbar-overlay min-h-0 pb-3">
                  <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 p-1">
                    <Card
                      v-for="planItem in filteredPlan"
                      :key="planItem.id"
                      class="relative border-l-2 p-1 transition-colors hover:bg-accent/50"
                      :class="planItem.shortage > 0 ? 'border-l-destructive' : 'border-l-green-500'"
                    >
                      <!-- 删除按钮 -->
                      <button
                        class="absolute -top-1 -right-1 size-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs opacity-0 hover:opacity-100 transition-opacity z-10"
                        title="删除"
                        @click.stop="removeFromPlan(planItem.id)"
                      >
                        ×
                      </button>
                      <CardContent class="p-2">
                        <div class="flex items-start gap-2">
                          <div class="relative size-8 flex-shrink-0">
                            <img
                              :src="getQualityBackground(planItem.level)"
                              alt=""
                              class="absolute inset-0 size-full rounded object-cover"
                            >
                            <img
                              :src="planItem.icon_url"
                              :alt="planItem.name"
                              class="relative size-full rounded object-cover"
                            >
                          </div>
                          <div class="flex-1 min-w-0">
                            <div class="truncate font-medium text-xs leading-tight">
                              {{ planItem.name }}
                            </div>
                            <div class="text-[10px] text-muted-foreground mt-0.5">
                              拥有: {{ planItem.actualNum }}
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center gap-1 mt-2">
                          <span class="text-[10px] text-muted-foreground">需要:</span>
                          <Input
                            v-model.number="planItem.requiredNum"
                            type="number"
                            min="0"
                            class="h-6 text-xs px-1 flex-1"
                            @input="calculateShortage(planItem)"
                          />
                        </div>
                        <div
                          class="text-[10px] font-medium mt-1 text-center"
                          :class="planItem.shortage > 0 ? 'text-destructive' : 'text-green-600'"
                        >
                          {{ planItem.shortage > 0 ? `缺少 ${planItem.shortage}` : '✓ 充足' }}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>

    <!-- Toast 通知组件 -->
    <Toaster />

    <!-- QR Code Dialog -->
    <Dialog v-model:open="showQRDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>米哈游登录二维码</DialogTitle>
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

    <!-- 角色选择 Dialog -->
    <Dialog v-model:open="showAvatarDialog">
      <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>选择角色计算材料</DialogTitle>
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
              class="flex flex-col items-center p-2 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
              @click="calculateAvatarMaterials(avatar)"
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

    <!-- 保存计划 Dialog -->
    <Dialog v-model:open="showSaveDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>💾 保存养成计划</DialogTitle>
          <DialogDescription>
            请为这个养成计划取一个名字
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-4">
          <Input
            v-model="newPlanName"
            type="text"
            placeholder="输入计划名称..."
            class="w-full"
            @keyup.enter="saveCurrentPlan"
          />
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showSaveDialog = false">
              取消
            </Button>
            <Button @click="saveCurrentPlan">
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 重命名计划 Dialog -->
    <Dialog v-model:open="showRenameDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>✏️ 重命名计划</DialogTitle>
          <DialogDescription>
            输入新的计划名称
          </DialogDescription>
        </DialogHeader>
        <div class="flex flex-col gap-4 py-4">
          <Input
            v-model="newPlanName"
            type="text"
            placeholder="输入新名称..."
            class="w-full"
            @keyup.enter="renamePlan"
          />
          <div class="flex justify-end gap-2">
            <Button variant="outline" @click="showRenameDialog = false">
              取消
            </Button>
            <Button @click="renamePlan">
              确认
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 删除确认 Dialog -->
    <Dialog v-model:open="showDeleteConfirmDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>🗑️ 删除计划</DialogTitle>
          <DialogDescription>
            确定要删除计划 "{{ currentPlanName }}" 吗？此操作无法撤销。
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2 py-4">
          <Button variant="outline" @click="showDeleteConfirmDialog = false">
            取消
          </Button>
          <Button variant="destructive" @click="deleteCurrentPlan">
            删除
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 未保存更改提示 Dialog -->
    <Dialog v-model:open="showUnsavedDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>⚠️ 有未保存的更改</DialogTitle>
          <DialogDescription>
            当前计划有未保存的更改，你要如何处理？
          </DialogDescription>
        </DialogHeader>
        <div class="flex justify-end gap-2 py-4">
          <Button variant="outline" @click="handleUnsavedChoice('cancel')">
            取消
          </Button>
          <Button variant="secondary" @click="handleUnsavedChoice('discard')">
            放弃更改
          </Button>
          <Button @click="handleUnsavedChoice('save')">
            保存并继续
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    <!-- 角色材料计算器 Dialog -->
    <AvatarCalculatorDialog
      v-model:open="showCalculatorDialog"
      @add-materials="handleAddCalculatedMaterials"
    />

    <!-- 更新提示 Dialog -->
    <Dialog v-model:open="showUpdateDialog">
      <DialogContent class="sm:max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>🎉 发现新版本 v{{ updateAvailable?.version }}</DialogTitle>
        </DialogHeader>

        <div class="flex-grow overflow-y-auto py-4 space-y-4">
          <div v-if="updateAvailable?.body" class="prose prose-sm dark:prose-invert max-w-none" v-html="updateBodyHtml" />

          <!-- 下载进度 -->
          <div v-if="isDownloadingUpdate" class="space-y-2">
            <div class="text-sm text-muted-foreground">
              正在下载更新...
            </div>
            <div class="w-full bg-muted rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-300"
                :style="{ width: updateProgress.total > 0 ? `${(updateProgress.downloaded / updateProgress.total) * 100}%` : '0%' }"
              />
            </div>
            <div class="text-xs text-muted-foreground text-right">
              {{ updateProgress.total > 0 ? `${Math.round(updateProgress.downloaded / 1024 / 1024 * 100) / 100} / ${Math.round(updateProgress.total / 1024 / 1024 * 100) / 100} MB` : '准备中...' }}
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-2 flex-shrink-0">
          <Button :disabled="isDownloadingUpdate" @click="handleDownloadAndInstall">
            {{ isDownloadingUpdate ? '下载中...' : '立即更新' }}
          </Button>
          <Button variant="outline" :disabled="isDownloadingUpdate" @click="showUpdateDialog = false">
            稍后再说
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { Avatar } from '@/entity/calculator/Avatar'
import type { PlanItem, SavedPlan } from '@/entity/InventoryItem.ts'
import type { QrLogin } from '@/entity/remote/QrLogin.ts'
import type { CalculatedMaterial } from '@/entity/wiki/WikiItem'
import { marked } from 'marked'
import { computed, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue'
import { toast } from 'vue-sonner'
import qualityBlue from '@/assets/level_background/UI_QUALITY_BLUE.png'
import qualityGreen from '@/assets/level_background/UI_QUALITY_GREEN.png'
// 导入品质背景图片
import qualityNone from '@/assets/level_background/UI_QUALITY_NONE.png'
import qualityOrange from '@/assets/level_background/UI_QUALITY_ORANGE.png'
import qualityPurple from '@/assets/level_background/UI_QUALITY_PURPLE.png'
import qualityRed from '@/assets/level_background/UI_QUALITY_RED.png'
import qualityWhite from '@/assets/level_background/UI_QUALITY_WHITE.png'
import AvatarCalculatorDialog from '@/components/calculator/AvatarCalculatorDialog.vue'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Toaster } from '@/components/ui/sonner'
import { httpHeaderManager } from '@/entity/HttpHeaderManager'
import {
  convertAvatarToBatchComputeItem,
  convertWeaponToBatchComputeItem,

  fetchAllAvatarList,

  fetchBatchCompute,
  fetchBatchComputeWeapons,
  fetchMHYLoginQRCode,
  fetchMHYLoginResult,
  fetchUserGameRoles,
  fetchWeaponList,
  generateQRCode,
} from '@/service/MHYService.ts'
import { checkForUpdate, downloadAndInstallUpdate, relaunchApp } from '@/service/UpdateService'
import { useAuthStore } from '@/store/store'
import 'vue-sonner/style.css'

// 根据稀有度获取背景图片
function getQualityBackground(rarity: number | undefined): string {
  switch (rarity) {
    case 0:
      return qualityNone
    case 1:
      return qualityWhite
    case 2:
      return qualityGreen
    case 3:
      return qualityBlue
    case 4:
      return qualityPurple
    case 5:
      return qualityOrange
    case 105:
      return qualityRed
    default:
      return qualityWhite
  }
}

// 接口定义 - 兼容原有数据格式
interface OverallConsume {
  id: number
  name: string
  icon: string
  num: number
  wiki_url: string
  level: number
  icon_url: string
  lack_num: number
  rarity?: number // 稀有度，默认为1
  actualNum?: number // 计算出的实际拥有数量
}

// 响应式数据
const showDebugInfo = ref(false)
const searchQuery = ref('')
const items = ref<OverallConsume[]>([])
const cultivationPlan = ref<PlanItem[]>([])
const planFilter = ref<'all' | 'shortage'>('all')
const loginPayload = ref<string | null>(null)

// 使用 store 管理认证数据
const authStore = useAuthStore()

// Dialog 状态
const showQRDialog = ref(false)
const showAvatarDialog = ref(false)

// 多套计划管理相关状态
const savedPlans = ref<SavedPlan[]>([])
const currentPlanId = ref<string | null>(null)
const showSaveDialog = ref(false)
const showRenameDialog = ref(false)
const showDeleteConfirmDialog = ref(false)
const showUnsavedDialog = ref(false)
const pendingPlanId = ref<string | null>(null) // 待切换的计划 ID
const newPlanName = ref('')
const hasUnsavedChanges = ref(false)
const SAVED_PLANS_KEY = 'mhy_saved_plans'
const CURRENT_PLAN_ID_KEY = 'mhy_current_plan_id'

// 角色选择器状态
const allAvatars = ref<Avatar[]>([])
const isLoadingAvatars = ref(false)

// 角色材料计算器状态
const showCalculatorDialog = ref(false)

// 获取背包物品进度条状态
const inventoryProgress = ref({
  isLoading: false,
  currentStep: 0, // 0=未开始, 1-5=各阶段
})

// 步骤定义
const inventorySteps = [
  { step: 1, title: '获取角色列表' },
  { step: 2, title: '获取武器列表' },
  { step: 3, title: '计算武器材料' },
  { step: 4, title: '计算角色材料' },
  { step: 5, title: '完成' },
]

// 更新检查状态
const showUpdateDialog = ref(false)
const updateAvailable = shallowRef<Awaited<ReturnType<typeof checkForUpdate>>>(null)
const isCheckingUpdate = ref(false)
const isDownloadingUpdate = ref(false)
const updateProgress = ref({ downloaded: 0, total: 0 })

// 更新内容 markdown 渲染
const updateBodyHtml = computed(() => {
  if (!updateAvailable.value?.body)
    return ''
  return marked(updateAvailable.value.body)
})

// 计算属性
const filteredItems = computed(() => {
  if (!searchQuery.value) {
    return items.value
  }

  const query = searchQuery.value.trim()

  // 优先精确匹配 ID
  const idMatch = items.value.filter(item => item.id.toString() === query)
  if (idMatch.length > 0) {
    return idMatch
  }

  // 否则模糊搜索名字
  return items.value.filter(item => item.name.toLowerCase().includes(query.toLowerCase()))
})

// 动态计算养成计划（自动同步背包数据）
const computedPlan = computed(() => {
  return cultivationPlan.value.map((planItem) => {
    // 从最新的背包数据中获取实际数量
    const inventoryItem = items.value.find(item => item.id === planItem.id)
    const actualNum = inventoryItem?.actualNum ?? planItem.actualNum ?? 0
    const shortage = Math.max(0, planItem.requiredNum - actualNum)
    return {
      ...planItem,
      actualNum,
      shortage,
    }
  })
})

const filteredPlan = computed(() => {
  if (planFilter.value === 'shortage') {
    return computedPlan.value.filter(item => item.shortage > 0)
  }
  return computedPlan.value
})

// LocalStorage 缓存 Key
const INVENTORY_CACHE_KEY = 'mhy_inventory_items'

// 方法
function loadItemsData() {
  try {
    const cachedData = localStorage.getItem(INVENTORY_CACHE_KEY)
    if (cachedData) {
      items.value = JSON.parse(cachedData)
      console.log('从缓存加载物品数据成功:', items.value.length, '个物品')
    }
    else {
      console.log('没有缓存的物品数据')
    }
  }
  catch (error) {
    console.error('加载缓存数据失败:', error)
  }
}

// 保存物品数据到缓存
function saveItemsToCache() {
  try {
    localStorage.setItem(INVENTORY_CACHE_KEY, JSON.stringify(items.value))
    console.log('物品数据已缓存')
  }
  catch (error) {
    console.error('缓存物品数据失败:', error)
  }
}

// 排除的角色名称列表
const EXCLUDED_AVATAR_NAMES = ['奇偶·女性', '奇偶·男性', '旅行者']

// 获取全角色+全武器数据作为背包物品数据集
async function fetchAllAvatarsInventory() {
  const tokens = authStore.gameTokens
  if (!tokens?.uid || !tokens?.cookie_token || !tokens?.ltoken || !tokens?.ltuid) {
    toast('请先登录获取游戏令牌', { duration: 3000 })
    return
  }

  // 初始化进度条
  inventoryProgress.value = { isLoading: true, currentStep: 1 }

  try {
    // 获取全角色列表
    const avatarList = await fetchAllAvatarList()

    // 过滤掉旅行者和奇偶角色
    const validAvatars = avatarList.list.filter(
      avatar => !EXCLUDED_AVATAR_NAMES.includes(avatar.name),
    )

    console.log(`全角色列表: ${avatarList.total} 个，过滤后: ${validAvatars.length} 个`)
    inventoryProgress.value = { isLoading: true, currentStep: 2 }

    // 获取所有类型的武器
    const allWeapons = await fetchWeaponList()
    console.log(`全武器列表: ${allWeapons.length} 把`)

    inventoryProgress.value = { isLoading: true, currentStep: 3 }

    // 将所有角色转换为计算请求格式
    const avatarComputeItems = validAvatars.map(avatar => convertAvatarToBatchComputeItem(avatar))

    // 将所有武器转换为计算请求格式
    const weaponComputeItems = allWeapons.map(weapon => convertWeaponToBatchComputeItem(weapon))

    console.log('角色计算请求:', avatarComputeItems.length)
    console.log('武器计算请求:', weaponComputeItems.length)

    // 调用批量计算 API（串行请求，避免限流）
    // 1. 先获取武器消耗
    const weaponResult = await fetchBatchComputeWeapons(
      tokens.uid,
      weaponComputeItems,
      {
        cookie_token: tokens.cookie_token,
        ltoken: tokens.ltoken,
        ltuid: tokens.ltuid,
      },
    )
    console.log('武器计算结果:', weaponResult)

    // 2. 等待 1 秒
    const apiDelay = 1000
    await new Promise(resolve => setTimeout(resolve, apiDelay))

    // 3. 再获取角色消耗
    inventoryProgress.value = { isLoading: true, currentStep: 4 }
    const avatarResult = await fetchBatchCompute(
      tokens.uid,
      avatarComputeItems,
      {
        cookie_token: tokens.cookie_token,
        ltoken: tokens.ltoken,
        ltuid: tokens.ltuid,
      },
    )
    console.log('角色计算结果:', avatarResult)

    // 合并计算结果
    const combinedConsume = [...avatarResult.overall_consume]

    // 遍历武器计算结果，合并到总结果中
    weaponResult.overall_consume.forEach((weaponItem) => {
      const existingItem = combinedConsume.find(item => item.id === weaponItem.id)
      if (existingItem) {
        // 计算两个结果分别推导出的“持有量”
        const stock1 = existingItem.num - existingItem.lack_num
        const stock2 = weaponItem.num - weaponItem.lack_num

        // 实际持有量取最大值（因为是同一个背包）
        const realStock = Math.max(stock1, stock2)

        // 更新总需求
        existingItem.num += weaponItem.num

        // 反推新的 lack_num，以保证 num - lack_num === realStock
        // 这样可以确保最终显示的“背包数量”是正确的去重后的数量
        existingItem.lack_num = Math.max(0, existingItem.num - realStock)
      }
      else {
        combinedConsume.push(weaponItem)
      }
    })

    // 将计算结果转换为物品库格式
    items.value = combinedConsume.map(item => ({
      ...item,
      actualNum: item.lack_num === 0 ? item.num : item.num - item.lack_num,
    }))

    inventoryProgress.value = { isLoading: true, currentStep: 5 }

    toast('背包物品列表获取成功！', {
      description: `${validAvatars.length} 个角色 + ${allWeapons.length} 把武器，共 ${items.value.length} 种物品`,
      duration: 3000,
    })

    // 保存到缓存
    saveItemsToCache()
  }
  catch (error) {
    console.error('获取背包物品列表失败:', error)
    toast('获取背包物品列表失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
  finally {
    // 延迟隐藏进度条，让用户看到完成状态
    setTimeout(() => {
      inventoryProgress.value = { isLoading: false, currentStep: 0 }
    }, 800)
  }
}

async function testFn() {
  console.log('hello')
}

function addToPlan(item: OverallConsume) {
  // 检查是否已经在计划中
  const existingIndex = cultivationPlan.value.findIndex(planItem => planItem.id === item.id)

  if (existingIndex !== -1) {
    toast('添加失败', {
      description: `${item.name} 已经存在于你的养成计划中`,
      duration: 3000,
    })
    return
  }

  const planItem: PlanItem = {
    ...item,
    rarity: item.rarity || 1, // 默认稀有度为1
    requiredNum: 1,
    shortage: 0,
  }

  calculateShortage(planItem)
  cultivationPlan.value.push(planItem)

  // 保存到本地存储
  savePlanToStorage()

  // 显示成功提示
  toast('物品已添加到养成计划', {
    description: `${item.name} 已成功添加到养成计划`,
    duration: 2000,
  })
}

function removeFromPlan(itemId: number) {
  const index = cultivationPlan.value.findIndex(item => item.id === itemId)
  if (index !== -1) {
    cultivationPlan.value.splice(index, 1)
    savePlanToStorage()
  }
}

// 处理计算器添加的材料
function handleAddCalculatedMaterials(materials: CalculatedMaterial[]) {
  let addedCount = 0
  let updatedCount = 0

  for (const material of materials) {
    // 检查是否已经在计划中
    const existingIndex = cultivationPlan.value.findIndex(planItem => planItem.id === material.id)

    // 尝试从背包数据中获取物品信息（优先使用米哈游 API 的数据）
    const inventoryItem = items.value.find(item => item.id === material.id)

    if (existingIndex !== -1) {
      // 已存在，累加数量
      cultivationPlan.value[existingIndex]!.requiredNum += material.num
      calculateShortage(cultivationPlan.value[existingIndex]!)
      updatedCount++
    }
    else {
      // 不存在，新增
      const actualNum = inventoryItem?.actualNum ?? 0

      const planItem: PlanItem = {
        id: material.id,
        // 优先使用米哈游 API 返回的数据
        name: inventoryItem?.name ?? material.name,
        icon: inventoryItem?.icon ?? material.icon,
        icon_url: inventoryItem?.icon_url ?? material.icon_url ?? '',
        num: material.num,
        level: inventoryItem?.level ?? material.level,
        rarity: inventoryItem?.rarity ?? material.rarity,
        wiki_url: material.wiki_url,
        actualNum,
        requiredNum: material.num,
        shortage: Math.max(0, material.num - actualNum),
      }

      cultivationPlan.value.push(planItem)
      addedCount++
    }
  }

  // 保存到本地存储
  savePlanToStorage()

  // 显示成功提示
  const messages: string[] = []
  if (addedCount > 0) {
    messages.push(`新增 ${addedCount} 种材料`)
  }
  if (updatedCount > 0) {
    messages.push(`更新 ${updatedCount} 种材料`)
  }

  toast('材料已添加到养成计划', {
    description: messages.join('，'),
    duration: 3000,
  })
}

function calculateShortage(planItem: PlanItem) {
  const shortage = planItem.requiredNum - (planItem.actualNum || 0)
  planItem.shortage = Math.max(0, shortage)
  // 每次计算后保存到本地存储
  savePlanToStorage()
}

function setPlanFilter(filter: 'all' | 'shortage') {
  planFilter.value = filter
  localStorage.setItem('planFilter', filter)
}

function savePlanToStorage() {
  localStorage.setItem('cultivationPlan', JSON.stringify(cultivationPlan.value))
  localStorage.setItem('planFilter', planFilter.value)
  // 标记有未保存的修改
  if (currentPlanId.value) {
    hasUnsavedChanges.value = true
  }
}

function loadPlanFromStorage() {
  // 恢复过滤状态
  const savedFilter = localStorage.getItem('planFilter')
  if (savedFilter && (savedFilter === 'all' || savedFilter === 'shortage')) {
    planFilter.value = savedFilter as 'all' | 'shortage'
  }

  // 加载所有已保存的计划
  loadAllSavedPlans()

  // 尝试恢复上次选中的计划
  const lastPlanId = localStorage.getItem(CURRENT_PLAN_ID_KEY)
  if (lastPlanId && savedPlans.value.find(p => p.id === lastPlanId)) {
    loadPlanById(lastPlanId, false)
  }
  else {
    // 恢复临时养成计划
    const saved = localStorage.getItem('cultivationPlan')
    if (saved) {
      try {
        const savedPlan = JSON.parse(saved)
        // 恢复保存的计划，只计算 shortage 但不触发保存
        cultivationPlan.value = savedPlan.map((item: PlanItem) => {
          const planItem = { ...item }
          // 只计算 shortage，不调用 calculateShortage 避免触发保存
          const shortage = planItem.requiredNum - (planItem.actualNum || 0)
          planItem.shortage = Math.max(0, shortage)
          return planItem
        })
      }
      catch (error) {
        console.error('加载保存的计划失败:', error)
      }
    }
  }
}

// ============ 多套计划管理方法 ============

// 生成 UUID
function generatePlanId(): string {
  return `plan_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}

// 加载所有已保存的计划
function loadAllSavedPlans() {
  try {
    const saved = localStorage.getItem(SAVED_PLANS_KEY)
    if (saved) {
      savedPlans.value = JSON.parse(saved)
    }
  }
  catch (error) {
    console.error('加载已保存计划列表失败:', error)
    savedPlans.value = []
  }
}

// 保存所有计划到 localStorage
function persistAllPlans() {
  localStorage.setItem(SAVED_PLANS_KEY, JSON.stringify(savedPlans.value))
}

// 当前计划名称
const currentPlanName = computed(() => {
  if (!currentPlanId.value) {
    return '未保存的计划'
  }
  const plan = savedPlans.value.find(p => p.id === currentPlanId.value)
  return plan ? plan.name : '未保存的计划'
})

// 打开保存对话框
function openSaveDialog() {
  newPlanName.value = currentPlanId.value ? currentPlanName.value : ''
  showSaveDialog.value = true
}

// 打开另存为对话框
function openSaveAsDialog() {
  newPlanName.value = ''
  showSaveDialog.value = true
}

// 保存当前计划
function saveCurrentPlan() {
  const name = newPlanName.value.trim()
  if (!name) {
    toast('请输入计划名称', { duration: 2000 })
    return
  }

  const now = Date.now()

  if (currentPlanId.value && newPlanName.value === currentPlanName.value) {
    // 覆盖保存现有计划
    const planIndex = savedPlans.value.findIndex(p => p.id === currentPlanId.value)
    if (planIndex !== -1) {
      savedPlans.value[planIndex] = {
        ...savedPlans.value[planIndex]!,
        items: JSON.parse(JSON.stringify(cultivationPlan.value)),
        updatedAt: now,
      }
    }
    toast('计划已保存', { description: name, duration: 2000 })
  }
  else {
    // 创建新计划
    const newPlan: SavedPlan = {
      id: generatePlanId(),
      name,
      items: JSON.parse(JSON.stringify(cultivationPlan.value)),
      createdAt: now,
      updatedAt: now,
    }
    savedPlans.value.push(newPlan)
    currentPlanId.value = newPlan.id
    localStorage.setItem(CURRENT_PLAN_ID_KEY, newPlan.id)
    toast('计划已保存', { description: name, duration: 2000 })
  }

  hasUnsavedChanges.value = false
  persistAllPlans()
  showSaveDialog.value = false
}

// 快速保存（覆盖当前计划）
function quickSave() {
  if (!currentPlanId.value) {
    openSaveDialog()
    return
  }

  const planIndex = savedPlans.value.findIndex(p => p.id === currentPlanId.value)
  if (planIndex !== -1) {
    savedPlans.value[planIndex] = {
      ...savedPlans.value[planIndex]!,
      items: JSON.parse(JSON.stringify(cultivationPlan.value)),
      updatedAt: Date.now(),
    }
    hasUnsavedChanges.value = false
    persistAllPlans()
    toast('计划已保存', { description: currentPlanName.value, duration: 2000 })
  }
}

// 尝试切换计划（检查未保存的更改）
function tryLoadPlan(planId: string) {
  if (planId === currentPlanId.value) {
    return
  }

  if (hasUnsavedChanges.value) {
    pendingPlanId.value = planId
    showUnsavedDialog.value = true
  }
  else {
    loadPlanById(planId, true)
  }
}

// 加载指定计划
function loadPlanById(planId: string, showToast = true) {
  const plan = savedPlans.value.find(p => p.id === planId)
  if (!plan) {
    toast('计划不存在', { duration: 2000 })
    return
  }

  cultivationPlan.value = JSON.parse(JSON.stringify(plan.items))
  currentPlanId.value = planId
  hasUnsavedChanges.value = false
  localStorage.setItem(CURRENT_PLAN_ID_KEY, planId)
  localStorage.setItem('cultivationPlan', JSON.stringify(cultivationPlan.value))

  if (showToast) {
    toast('已切换到计划', { description: plan.name, duration: 2000 })
  }
}

// 处理未保存对话框的选择
function handleUnsavedChoice(choice: 'save' | 'discard' | 'cancel') {
  showUnsavedDialog.value = false

  if (choice === 'cancel') {
    pendingPlanId.value = null
    return
  }

  if (choice === 'save') {
    if (currentPlanId.value) {
      quickSave()
    }
    else {
      // 如果当前是未保存的计划，打开保存对话框
      openSaveDialog()
      return
    }
  }

  // 切换到待定计划
  if (pendingPlanId.value) {
    if (pendingPlanId.value === 'NEW') {
      doCreateNewPlan()
    }
    else {
      loadPlanById(pendingPlanId.value, true)
    }
    pendingPlanId.value = null
  }
}

// 新建空白计划
function createNewPlan() {
  if (hasUnsavedChanges.value) {
    pendingPlanId.value = 'NEW'
    showUnsavedDialog.value = true
  }
  else {
    doCreateNewPlan()
  }
}

function doCreateNewPlan() {
  cultivationPlan.value = []
  currentPlanId.value = null
  hasUnsavedChanges.value = false
  localStorage.removeItem(CURRENT_PLAN_ID_KEY)
  localStorage.setItem('cultivationPlan', JSON.stringify([]))
  toast('已创建新计划', { duration: 2000 })
}

// 打开重命名对话框
function openRenameDialog() {
  if (!currentPlanId.value) {
    toast('请先保存当前计划', { duration: 2000 })
    return
  }
  newPlanName.value = currentPlanName.value
  showRenameDialog.value = true
}

// 重命名计划
function renamePlan() {
  const name = newPlanName.value.trim()
  if (!name) {
    toast('请输入计划名称', { duration: 2000 })
    return
  }

  if (!currentPlanId.value) {
    return
  }

  const planIndex = savedPlans.value.findIndex(p => p.id === currentPlanId.value)
  if (planIndex !== -1) {
    savedPlans.value[planIndex]!.name = name
    savedPlans.value[planIndex]!.updatedAt = Date.now()
    persistAllPlans()
    toast('已重命名为', { description: name, duration: 2000 })
  }

  showRenameDialog.value = false
}

// 打开删除确认对话框
function openDeleteDialog() {
  if (!currentPlanId.value) {
    toast('当前计划尚未保存', { duration: 2000 })
    return
  }
  showDeleteConfirmDialog.value = true
}

// 删除当前计划
function deleteCurrentPlan() {
  if (!currentPlanId.value) {
    return
  }

  const planName = currentPlanName.value
  savedPlans.value = savedPlans.value.filter(p => p.id !== currentPlanId.value)
  persistAllPlans()

  // 重置到新计划状态
  currentPlanId.value = null
  cultivationPlan.value = []
  hasUnsavedChanges.value = false
  localStorage.removeItem(CURRENT_PLAN_ID_KEY)
  localStorage.setItem('cultivationPlan', JSON.stringify([]))

  showDeleteConfirmDialog.value = false
  toast('计划已删除', { description: planName, duration: 2000 })
}

let qrLogin = ref<QrLogin | null>(null)
let qrLoginBase64 = ref<string | null>(null)

// 二维码倒计时相关
const qrExpireTime = ref<number>(0)
const qrCountdown = ref<string>('')
const isPolling = ref(false)
let pollingTimer: ReturnType<typeof setInterval> | null = null
let countdownTimer: ReturnType<typeof setInterval> | null = null

// 解析二维码过期时间
function parseQRExpireTime(url: string): number {
  try {
    const urlObj = new URL(url)
    const expire = urlObj.searchParams.get('expire')
    return expire ? Number.parseInt(expire, 10) : 0
  }
  catch {
    return 0
  }
}

// 更新倒计时显示
function updateCountdown() {
  if (qrExpireTime.value === 0) {
    qrCountdown.value = ''
    return
  }

  const now = Math.floor(Date.now() / 1000)
  const remaining = qrExpireTime.value - now

  if (remaining <= 0) {
    qrCountdown.value = '已过期'
    stopPolling()
    toast('二维码已过期', { description: '请重新获取', duration: 3000 })
    return
  }

  const minutes = Math.floor(remaining / 60)
  const seconds = remaining % 60
  qrCountdown.value = `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// 停止轮询
function stopPolling() {
  isPolling.value = false
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// 处理登录成功
async function handleLoginSuccess(loginResult: Awaited<ReturnType<typeof fetchMHYLoginResult>>) {
  stopPolling()
  showQRDialog.value = false

  authStore.setQrLoginResult(loginResult)

  if (loginResult.cookies) {
    const cookies = loginResult.cookies

    try {
      // 自动获取用户的游戏 UID
      toast('正在获取游戏角色信息...', { duration: 2000 })
      const gameRoles = await fetchUserGameRoles({
        ltoken: cookies.ltoken || '',
        ltuid: cookies.ltuid || cookies.account_id || '',
        cookie_token: cookies.cookie_token || '',
      })

      if (gameRoles.length === 0) {
        toast('未找到原神游戏角色', {
          description: '请确认账号已绑定原神角色',
          duration: 5000,
        })
        return
      }

      // 使用第一个角色的 UID
      const firstRole = gameRoles[0]!
      authStore.setGameTokens({
        uid: firstRole.game_uid,
        ltuid: cookies.ltuid || cookies.account_id || '',
        ltoken: cookies.ltoken || '',
        cookie_token: cookies.cookie_token || '',
      })

      toast('登录成功！', {
        description: `UID: ${firstRole.game_uid} (${firstRole.nickname}) - ${firstRole.region_name}`,
        duration: 5000,
      })
    }
    catch (error) {
      console.error('获取游戏角色失败:', error)
      toast('获取游戏角色失败', {
        description: error instanceof Error ? error.message : '未知错误',
        duration: 5000,
      })
    }
  }
}

// 轮询检查扫码状态
async function pollLoginResult() {
  if (!qrLogin.value || !isPolling.value)
    return

  try {
    const loginResult = await fetchMHYLoginResult(qrLogin.value.ticket)
    console.log('扫码状态:', loginResult.status)

    if (loginResult.status === 'Confirmed') {
      await handleLoginSuccess(loginResult)
    }
  }
  catch (error) {
    console.error('检查扫码状态失败:', error)
  }
}

// 打开登录二维码
async function openLoginQRCode() {
  try {
    // 先停止之前的轮询
    stopPolling()

    toast('正在获取二维码...', { duration: 2000 })
    const result = await fetchMHYLoginQRCode()
    qrLogin.value = result
    qrLoginBase64.value = await generateQRCode(result.url)

    // 解析过期时间
    qrExpireTime.value = parseQRExpireTime(result.url)
    updateCountdown()

    // 打开对话框
    showQRDialog.value = true

    // 开始倒计时
    countdownTimer = setInterval(updateCountdown, 1000)

    // 开始轮询（每5秒）
    isPolling.value = true
    pollingTimer = setInterval(pollLoginResult, 5000)

    toast('请使用米游社扫描二维码', { duration: 3000 })
  }
  catch (error) {
    console.error('获取二维码失败:', error)
    toast('获取二维码失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
}

// 监听 Dialog 关闭时停止轮询
watch(showQRDialog, (newVal) => {
  if (!newVal) {
    stopPolling()
  }
})

// 组件卸载时清理
onUnmounted(() => {
  stopPolling()
})

// 获取登录结果
function clearTestData() {
  qrLogin.value = null
  loginPayload.value = null
  qrExpireTime.value = 0
  qrCountdown.value = ''
  stopPolling()
  authStore.clearAuthData()
  toast('测试数据已清除', { duration: 2000 })
}

// 显示设备信息
function showDeviceInfo() {
  const deviceId = httpHeaderManager.getDeviceId()
  const deviceFp = httpHeaderManager.getDeviceFp()
  toast('设备信息', {
    description: `设备ID: ${deviceId}\n设备指纹: ${deviceFp}`,
    duration: 10000,
  })
  console.log('设备ID:', deviceId)
  console.log('设备指纹:', deviceFp)
}

// 计算角色材料
async function calculateAvatarMaterials(avatar: Avatar) {
  const tokens = authStore.gameTokens
  if (!tokens?.uid || !tokens?.cookie_token || !tokens?.ltoken || !tokens?.ltuid) {
    toast('请先登录获取游戏令牌', { duration: 3000 })
    return
  }

  try {
    toast(`正在计算 ${avatar.name} 的材料...`, { duration: 2000 })

    // 将角色转换为请求格式
    const computeItem = convertAvatarToBatchComputeItem(avatar)

    console.log('计算项:', computeItem)

    // 调用批量计算 API
    const result = await fetchBatchCompute(
      tokens.uid,
      [computeItem],
      {
        cookie_token: tokens.cookie_token,
        ltoken: tokens.ltoken,
        ltuid: tokens.ltuid,
      },
    )

    toast(`${avatar.name} 材料计算完成！`, {
      description: `共需 ${result.overall_consume.length} 种材料，请查看控制台`,
      duration: 5000,
    })

    // 关闭 dialog
    showAvatarDialog.value = false
  }
  catch (error) {
    console.error('计算材料失败:', error)
    toast('计算材料失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
}

// 生命周期
onMounted(async () => {
  await loadItemsData()
  loadPlanFromStorage()
  // 启动后自动检查更新
  handleCheckUpdate(true)
})

// ============ 更新检查方法 ============

// 检查更新
async function handleCheckUpdate(silent = false) {
  if (isCheckingUpdate.value)
    return

  isCheckingUpdate.value = true
  try {
    const update = await checkForUpdate()
    if (update) {
      updateAvailable.value = update
      showUpdateDialog.value = true
      toast('发现新版本', {
        description: `版本 ${update.version} 可用`,
        duration: 5000,
      })
    }
    else if (!silent) {
      toast('已是最新版本', { duration: 3000 })
    }
  }
  catch (error) {
    console.error('检查更新失败:', error)
    if (!silent) {
      toast('检查更新失败', {
        description: error instanceof Error ? error.message : '未知错误',
        duration: 5000,
      })
    }
  }
  finally {
    isCheckingUpdate.value = false
  }
}

// 下载并安装更新
async function handleDownloadAndInstall() {
  if (!updateAvailable.value || isDownloadingUpdate.value)
    return

  isDownloadingUpdate.value = true
  updateProgress.value = { downloaded: 0, total: 0 }

  try {
    toast('正在下载更新...', { duration: 2000 })

    await downloadAndInstallUpdate(updateAvailable.value, (progress) => {
      if (progress.event === 'Started' && progress.contentLength) {
        updateProgress.value.total = progress.contentLength
      }
      else if (progress.event === 'Progress' && progress.downloaded) {
        updateProgress.value.downloaded += progress.downloaded
      }
      else if (progress.event === 'Finished') {
        toast('下载完成，正在安装...', { duration: 2000 })
      }
    })

    // Windows 上安装时应用会自动退出，这是正常行为
    // 其他平台需要手动重启
    toast('更新安装完成，即将重启应用...', { duration: 3000 })
    setTimeout(async () => {
      await relaunchApp()
    }, 1000)
  }
  catch (error) {
    console.error('下载安装更新失败:', error)
    toast('更新失败', {
      description: error instanceof Error ? error.message : '未知错误',
      duration: 5000,
    })
  }
  finally {
    isDownloadingUpdate.value = false
  }
}
</script>

<style scoped>
/* 悬浮滚动条样式 */
.scrollbar-overlay {
  /* 设置滚动条样式 */
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.5) transparent;
}

/* Webkit 浏览器滚动条样式 */
.scrollbar-overlay::-webkit-scrollbar {
  width: 8px;
}

.scrollbar-overlay::-webkit-scrollbar-track {
  background: transparent;
}

.scrollbar-overlay::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.5);
  border-radius: 4px;
  border: 2px solid transparent;
  background-clip: content-box;
}

.scrollbar-overlay::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.8);
}

/* 转圈动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
