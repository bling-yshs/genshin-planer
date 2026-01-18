<template>
  <Card class="h-full border-0 rounded-none flex flex-col glass-card">
    <CardHeader class="pb-3 flex-shrink-0 border-b border-border/30">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <CardTitle class="text-lg text-gradient-accent font-bold">
            养成计划
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger as-child>
              <Button variant="outline" size="sm" class="h-7 gap-1 text-xs">
                <span class="max-w-32 truncate">{{ currentPlanName }}</span>
                <span v-if="hasUnsavedChanges" class="text-amber-500">*</span>
                <i-mdi-chevron-down class="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" class="w-56">
              <DropdownMenuItem @click="handleCreatePlan">
                <i-mdi-plus class="mr-2 size-4" />
                新建空白计划
              </DropdownMenuItem>
              <DropdownMenuSeparator v-if="savedPlans.length > 0" />
              <DropdownMenuItem
                v-for="plan in savedPlans"
                :key="plan.id"
                :class="plan.id === currentPlanId ? 'bg-accent' : ''"
                @click="handleSelectPlan(plan.id)"
              >
                <i-mdi-folder class="mr-2 size-4" />
                <span class="truncate">{{ plan.name }}</span>
                <span v-if="plan.id === currentPlanId" class="ml-auto text-primary">✓</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div class="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2"
            title="保存"
            @click="handleQuickSave"
          >
            💾
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2"
            title="另存为"
            @click="handleOpenSaveAs"
          >
            📤
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2"
            title="重命名"
            :disabled="!currentPlanId"
            @click="handleOpenRename"
          >
            ✏️
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="h-7 px-2 text-destructive hover:text-destructive"
            title="删除"
            :disabled="!currentPlanId"
            @click="handleOpenDelete"
          >
            🗑️
          </Button>
        </div>
      </div>
      <CardDescription>管理你的材料需求</CardDescription>
      <Button
        variant="outline"
        size="sm"
        class="mt-2 w-fit glass-button sparkle hover:scale-105 active:scale-95"
        @click="handleOpenCalculator"
      >
        📊 快速添加角色材料
      </Button>
    </CardHeader>
    <CardContent class="flex-grow flex flex-col min-h-0">
      <div
        v-if="isPlanEmpty"
        class="text-center py-8 flex-grow flex flex-col items-center justify-center"
      >
        <div class="text-muted-foreground">
          点击上方「快速添加角色材料」批量添加，或点击左侧物品手动添加
        </div>
      </div>

      <div v-else class="flex flex-col flex-grow min-h-0 space-y-3">
        <div class="flex flex-col gap-2 flex-shrink-0">
          <Tabs :model-value="planFilter" @update:model-value="(value) => handleSetFilter(value as 'all' | 'shortage')">
            <TabsList class="w-fit h-9 p-1 gap-1">
              <TabsTrigger value="all" class="relative px-3 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <motion.span
                  v-if="planFilter === 'all'"
                  layoutId="tab-indicator"
                  class="absolute inset-0 rounded-md bg-background shadow-sm"
                  :transition="{ type: 'spring', stiffness: 380, damping: 30 }"
                />
                <span class="relative z-10">默认</span>
              </TabsTrigger>
              <TabsTrigger value="shortage" class="relative px-3 py-1.5 data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <motion.span
                  v-if="planFilter === 'shortage'"
                  layoutId="tab-indicator"
                  class="absolute inset-0 rounded-md bg-background shadow-sm"
                  :transition="{ type: 'spring', stiffness: 380, damping: 30 }"
                />
                <span class="relative z-10">仅查看缺少物品</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div class="flex-grow overflow-y-auto scrollbar-overlay min-h-0 pb-3 space-y-4">
          <div v-if="filteredAvatarPlans.length > 0" class="space-y-2">
            <div class="text-xs font-medium text-muted-foreground">
              角色材料
            </div>
            <div class="space-y-3">
              <Card
                v-for="avatarPlan in filteredAvatarPlans"
                :key="avatarPlan.plan.id"
                class="border-l-4 border-r border-t border-b transition-all duration-300 shadow-none"
                :class="avatarPlan.shortageCount > 0 ? 'border-l-destructive bg-destructive/5 hover:bg-destructive/10' : 'border-l-green-500 bg-green-500/5 hover:bg-green-500/10'"
              >
                  <CardContent class="p-3 space-y-3">
                    <div class="flex items-start gap-3">
                      <div class="flex-shrink-0">
                        <CachedImage
                          :src="getWikiAvatarIconUrl(avatarPlan.plan.config.avatar)"
                          :alt="avatarPlan.plan.config.avatar.Name"
                          class="size-12 rounded"
                        />
                      </div>
                      <div class="flex-1 space-y-2">
                        <div class="flex items-center justify-between">
                          <span class="font-medium text-sm">{{ avatarPlan.plan.config.avatar.Name }}</span>
                          <button
                            class="size-6 flex items-center justify-center rounded-full text-muted-foreground hover:text-destructive transition-colors"
                            title="删除"
                            @click.stop="handleRemoveAvatarPlan(avatarPlan.plan.id)"
                          >
                            ×
                          </button>
                        </div>
                        <div class="flex items-center gap-2 text-xs flex-wrap">
                          <span class="text-muted-foreground w-12">等级:</span>
                          <Input
                            v-model.number="avatarPlan.plan.config.levelFrom"
                            type="number"
                            min="1"
                            max="90"
                            class="w-16 h-7 text-center"
                            @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                          />
                          <span class="text-muted-foreground">→</span>
                          <Input
                            v-model.number="avatarPlan.plan.config.levelTo"
                            type="number"
                            min="1"
                            max="90"
                            class="w-16 h-7 text-center"
                            @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                          />
                        </div>
                        <div class="grid grid-cols-3 gap-2 text-xs">
                          <div class="flex items-center gap-1">
                            <span class="text-muted-foreground">A:</span>
                            <Input
                              v-model.number="avatarPlan.plan.config.talentAFrom"
                              type="number"
                              min="1"
                              max="10"
                              class="w-11 h-6 text-center text-[10px] px-1"
                              @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                            />
                            <span class="text-muted-foreground">→</span>
                            <Input
                              v-model.number="avatarPlan.plan.config.talentA"
                              type="number"
                              min="1"
                              max="10"
                              class="w-11 h-6 text-center text-[10px] px-1"
                              @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                            />
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="text-muted-foreground">E:</span>
                            <Input
                              v-model.number="avatarPlan.plan.config.talentEFrom"
                              type="number"
                              min="1"
                              max="10"
                              class="w-11 h-6 text-center text-[10px] px-1"
                              @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                            />
                            <span class="text-muted-foreground">→</span>
                            <Input
                              v-model.number="avatarPlan.plan.config.talentE"
                              type="number"
                              min="1"
                              max="10"
                              class="w-11 h-6 text-center text-[10px] px-1"
                              @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                            />
                          </div>
                          <div class="flex items-center gap-1">
                            <span class="text-muted-foreground">Q:</span>
                            <Input
                              v-model.number="avatarPlan.plan.config.talentQFrom"
                              type="number"
                              min="1"
                              max="10"
                              class="w-11 h-6 text-center text-[10px] px-1"
                              @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                            />
                            <span class="text-muted-foreground">→</span>
                            <Input
                              v-model.number="avatarPlan.plan.config.talentQ"
                              type="number"
                              min="1"
                              max="10"
                              class="w-11 h-6 text-center text-[10px] px-1"
                              @input="handleAvatarPlanInput(avatarPlan.plan.id)"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="border-t pt-2 space-y-1.5">
                      <div class="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>材料 {{ avatarPlan.totalMaterials }} 种</span>
                        <span v-if="avatarPlanLoading[avatarPlan.plan.id]" class="text-primary">
                          计算中...
                        </span>
                        <span
                          v-else
                          :class="avatarPlan.shortageCount > 0 ? 'text-destructive' : 'text-green-600'"
                        >
                          {{ avatarPlan.shortageCount > 0 ? `缺少 ${avatarPlan.shortageCount} 种` : '已充足' }}
                        </span>
                      </div>

                      <div v-if="avatarPlan.displayMaterials.length === 0" class="text-[10px] text-muted-foreground text-center py-2">
                        暂无材料需求
                      </div>
                      <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                        <Card
                          v-for="material in avatarPlan.displayMaterials"
                          :key="material.id"
                          class="gap-1.5 p-1.5"
                        >
                          <div class="flex items-center gap-2">
                            <div class="relative size-8 flex-shrink-0">
                              <img
                                :src="getQualityBackground(material.rarity)"
                                alt=""
                                class="absolute inset-0 size-full rounded object-cover"
                              >
                              <CachedImage
                                :src="material.icon_url"
                                :alt="material.name"
                                class="relative size-full rounded object-cover"
                              />
                            </div>
                            <div class="flex-1 min-w-0">
                              <div class="text-xs truncate">
                                {{ material.name }}
                              </div>
                              <div class="text-[10px] text-muted-foreground">
                                拥有: {{ material.actualNum }}
                              </div>
                              <div class="text-[10px] text-muted-foreground">
                                需要: {{ material.num }}
                              </div>
                            </div>
                          </div>
                          <div
                            class="text-[10px] font-medium mt-0.5 leading-tight text-center"
                            :class="material.shortage > 0 ? 'text-destructive' : 'text-green-600'"
                          >
                            {{ material.shortage > 0 ? `缺少 ${material.shortage}` : '已充足' }}
                          </div>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          </div>

          <div v-if="filteredPlan.length > 0" class="space-y-2">
            <div class="text-xs font-medium text-muted-foreground">
              自定义材料
            </div>
            <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-2 p-1">
              <Card
                v-for="planItem in filteredPlan"
                :key="planItem.id"
                class="relative border-l-4 border-r border-t border-b p-1 transition-all duration-300 shadow-none"
                :class="planItem.shortage > 0 ? 'border-l-destructive bg-destructive/5 hover:bg-destructive/10' : 'border-l-green-500 bg-green-500/5 hover:bg-green-500/10'"
              >
                  <button
                    class="absolute -top-1 -right-1 size-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs opacity-0 hover:opacity-100 transition-opacity z-10"
                    title="删除"
                    @click.stop="handleRemovePlanItem(planItem.id)"
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
                        @input="handleUpdateShortage(planItem)"
                      />
                    </div>
                    <div
                      class="text-[10px] font-medium mt-0.5 leading-tight text-center"
                      :class="planItem.shortage > 0 ? 'text-destructive' : 'text-green-600'"
                    >
                      {{ planItem.shortage > 0 ? `缺少 ${planItem.shortage}` : '已充足' }}
                    </div>
                  </CardContent>
                </Card>
              </div>
          </div>

          <div
            v-if="filteredAvatarPlans.length === 0 && filteredPlan.length === 0"
            class="text-center text-muted-foreground py-8"
          >
            当前筛选下暂无材料
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { CalculatedMaterial } from '@/entity/wiki/WikiItem'
import type { WikiAvatarInfo } from '@/entity/wiki/WikiAvatar'
import type { AvatarPlan, PlanItem, SavedPlan } from '@/entity/InventoryItem'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { motion } from 'motion-v'
import CachedImage from '@/components/common/CachedImage.vue'

interface AvatarPlanMaterialView extends CalculatedMaterial {
  actualNum: number
  shortage: number
}

interface AvatarPlanView {
  plan: AvatarPlan
  displayMaterials: AvatarPlanMaterialView[]
  shortageCount: number
  totalMaterials: number
}

defineProps<{
  currentPlanName: string
  hasUnsavedChanges: boolean
  savedPlans: SavedPlan[]
  currentPlanId: string | null
  planFilter: 'all' | 'shortage'
  isPlanEmpty: boolean
  filteredAvatarPlans: AvatarPlanView[]
  avatarPlanLoading: Record<string, boolean>
  filteredPlan: PlanItem[]
  getQualityBackground: (rarity: number | undefined) => string
  getWikiAvatarIconUrl: (avatar: WikiAvatarInfo) => string
}>()

const emit = defineEmits<{
  (event: 'create-plan'): void
  (event: 'select-plan', planId: string): void
  (event: 'quick-save'): void
  (event: 'open-save-as'): void
  (event: 'open-rename'): void
  (event: 'open-delete'): void
  (event: 'open-calculator'): void
  (event: 'set-filter', filter: 'all' | 'shortage'): void
  (event: 'avatar-plan-input', planId: string): void
  (event: 'remove-avatar-plan', planId: string): void
  (event: 'remove-plan-item', itemId: number): void
  (event: 'update-shortage', planItem: PlanItem): void
}>()

function handleCreatePlan() {
  emit('create-plan')
}

function handleSelectPlan(planId: string) {
  emit('select-plan', planId)
}

function handleQuickSave() {
  emit('quick-save')
}

function handleOpenSaveAs() {
  emit('open-save-as')
}

function handleOpenRename() {
  emit('open-rename')
}

function handleOpenDelete() {
  emit('open-delete')
}

function handleOpenCalculator() {
  emit('open-calculator')
}

function handleSetFilter(filter: 'all' | 'shortage') {
  emit('set-filter', filter)
}

function handleAvatarPlanInput(planId: string) {
  emit('avatar-plan-input', planId)
}

function handleRemoveAvatarPlan(planId: string) {
  emit('remove-avatar-plan', planId)
}

function handleRemovePlanItem(itemId: number) {
  emit('remove-plan-item', itemId)
}

function handleUpdateShortage(planItem: PlanItem) {
  emit('update-shortage', planItem)
}
</script>
