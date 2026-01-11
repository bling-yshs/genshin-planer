<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-5xl h-[85vh] !flex !flex-col">
      <DialogHeader class="flex-shrink-0">
        <DialogTitle>角色材料计算器</DialogTitle>
        <DialogDescription>
          选择角色并配置升级目标，计算所需材料
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-hidden flex flex-col gap-4 py-4 min-h-0">
        <!-- 步骤指示器 -->
        <div class="flex items-center gap-2 text-sm flex-shrink-0">
          <span
            class="px-3 py-1 rounded-full"
            :class="step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'"
          >
            1. 选择角色
          </span>
          <span class="text-muted-foreground">→</span>
          <span
            class="px-3 py-1 rounded-full"
            :class="step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'"
          >
            2. 配置目标
          </span>
        </div>

        <!-- 步骤1: 角色选择 -->
        <div v-if="step === 1" class="flex-1 min-h-0">
          <AvatarSelector
            v-model="selectedAvatars"
            :avatars="avatarList"
            :loading="isLoadingAvatars"
          />
        </div>

        <!-- 步骤2: 配置面板 -->
        <div v-else class="flex-1 overflow-hidden flex gap-4 min-h-0">
          <!-- 左侧：角色配置 -->
          <div class="w-1/2 flex flex-col min-h-0">
            <div class="flex items-center justify-between flex-shrink-0 mb-3">
              <Button variant="ghost" size="sm" @click="step = 1">
                ← 返回选择
              </Button>
              <span class="text-sm text-muted-foreground">
                已选择 {{ selectedAvatars.length }} 个角色
              </span>
            </div>

            <!-- 快捷设置 -->
            <Card class="p-3 flex-shrink-0 mb-3">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-sm font-medium">快捷设置:</span>
                <Button size="sm" variant="outline" @click="applyPreset('1-90-10')">
                  90级 天赋10
                </Button>
                <Button size="sm" variant="outline" @click="applyPreset('1-80-8')">
                  80级 天赋8
                </Button>
                <Button size="sm" variant="outline" @click="applyPreset('1-70-6')">
                  70级 天赋6
                </Button>
              </div>
            </Card>

            <!-- 角色配置列表 -->
            <div class="flex-1 overflow-y-auto space-y-3 min-h-0">
              <AvatarConfigPanel
                v-for="avatar in selectedAvatars"
                :key="avatar._id"
                :avatar="avatar"
                :config="avatarConfigs[avatar._id]"
                @update:config="updateConfig(avatar._id, $event)"
                @remove="removeAvatar(avatar._id)"
              />
            </div>
          </div>

          <!-- 右侧：实时材料预览 -->
          <div class="w-1/2 flex flex-col min-h-0 border-l pl-4">
            <div class="flex items-center justify-between flex-shrink-0 mb-3">
              <span class="font-medium">材料预览</span>
              <span v-if="isPreviewCalculating" class="text-sm text-muted-foreground">
                计算中...
              </span>
              <span v-else class="text-sm text-muted-foreground">
                共 {{ previewMaterials.length }} 种材料
              </span>
            </div>

            <!-- 材料网格 -->
            <div class="flex-1 overflow-y-auto min-h-0">
              <div v-if="isPreviewCalculating" class="text-center py-8 text-muted-foreground">
                正在计算材料...
              </div>
              <div v-else-if="previewMaterials.length === 0" class="text-center py-8 text-muted-foreground">
                暂无材料需求
              </div>
              <div v-else class="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
                <Card
                  v-for="material in previewMaterials"
                  :key="material.id"
                  class="p-2"
                >
                  <div class="flex items-center gap-2">
                    <div class="relative w-8 h-8 flex-shrink-0">
                      <img
                        :src="getQualityBackground(material.rarity)"
                        alt=""
                        class="absolute inset-0 w-full h-full rounded object-cover"
                      >
                      <CachedImage
                        :src="material.icon_url"
                        :alt="material.name"
                        class="relative w-full h-full rounded object-cover"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="text-xs truncate">{{ material.name }}</div>
                      <div class="text-sm font-medium text-primary">× {{ material.num }}</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="flex justify-between items-center pt-4 border-t flex-shrink-0">
        <div class="text-sm text-muted-foreground">
          <span v-if="isCalculating">正在计算材料...</span>
          <span v-else-if="calculationError" class="text-destructive">
            {{ calculationError }}
          </span>
        </div>
        <div class="flex gap-2">
          <Button variant="outline" @click="isOpen = false">
            取消
          </Button>
          <Button
            v-if="step === 1"
            :disabled="selectedAvatars.length === 0"
            @click="goToStep2"
          >
            下一步 ({{ selectedAvatars.length }})
          </Button>
          <Button
            v-else
            :disabled="isCalculating"
            @click="calculateAndAdd"
          >
            {{ isCalculating ? '计算中...' : '一键添加到计划' }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import type { AvatarCalculatorConfig, WikiAvatarInfo } from '@/entity/wiki/WikiAvatar'
import type { CalculatedMaterial } from '@/entity/wiki/WikiItem'
import { fetchWikiAvatarList } from '@/service/WikiService'
import { batchCalculateMaterials } from '@/utils/materialCalculator'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import AvatarSelector from './AvatarSelector.vue'
import AvatarConfigPanel from './AvatarConfigPanel.vue'
import CachedImage from '@/components/common/CachedImage.vue'

// 导入品质背景图片
import qualityNone from '@/assets/level_background/UI_QUALITY_NONE.png'
import qualityWhite from '@/assets/level_background/UI_QUALITY_WHITE.png'
import qualityGreen from '@/assets/level_background/UI_QUALITY_GREEN.png'
import qualityBlue from '@/assets/level_background/UI_QUALITY_BLUE.png'
import qualityPurple from '@/assets/level_background/UI_QUALITY_PURPLE.png'
import qualityOrange from '@/assets/level_background/UI_QUALITY_ORANGE.png'
import qualityRed from '@/assets/level_background/UI_QUALITY_RED.png'

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

const props = defineProps<{
  open: boolean
}>()

interface AvatarPlanPayload {
  config: AvatarCalculatorConfig
  materials: CalculatedMaterial[]
}

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'add-avatar-plans', plans: AvatarPlanPayload[]): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

// 状态
const step = ref(1)
const avatarList = ref<WikiAvatarInfo[]>([])
const selectedAvatars = ref<WikiAvatarInfo[]>([])
const avatarConfigs = reactive<Record<number, AvatarCalculatorConfig>>({})
const isLoadingAvatars = ref(false)
const isCalculating = ref(false)
const calculationError = ref('')

// 实时预览状态
const previewMaterials = ref<CalculatedMaterial[]>([])
const isPreviewCalculating = ref(false)
let previewDebounceTimer: ReturnType<typeof setTimeout> | null = null

// 移除 onMounted 预加载，改为懒加载（在 watch(isOpen) 中触发）

async function loadAvatarList() {
  if (avatarList.value.length > 0) {
    return
  }
  isLoadingAvatars.value = true
  try {
    avatarList.value = await fetchWikiAvatarList()
  }
  catch (error) {
    console.error('加载角色列表失败:', error)
  }
  finally {
    isLoadingAvatars.value = false
  }
}

// 监听选中角色变化，初始化配置
watch(selectedAvatars, (newAvatars) => {
  for (const avatar of newAvatars) {
    if (!avatarConfigs[avatar._id]) {
      avatarConfigs[avatar._id] = createDefaultConfig(avatar)
    }
  }
}, { deep: true })

// 创建默认配置
function createDefaultConfig(avatar: WikiAvatarInfo): AvatarCalculatorConfig {
  return {
    avatar,
    levelFrom: 1,
    levelTo: 90,
    talentAFrom: 1,
    talentEFrom: 1,
    talentQFrom: 1,
    talentA: 10,
    talentE: 10,
    talentQ: 10,
  }
}

// 更新配置
function updateConfig(avatarId: number, config: AvatarCalculatorConfig) {
  avatarConfigs[avatarId] = config
  // 触发实时计算
  triggerPreviewCalculation()
}

// 触发实时预览计算（防抖）
function triggerPreviewCalculation() {
  if (previewDebounceTimer) {
    clearTimeout(previewDebounceTimer)
  }
  previewDebounceTimer = setTimeout(() => {
    calculatePreview()
  }, 300)
}

// 计算预览材料
async function calculatePreview() {
  if (selectedAvatars.value.length === 0) {
    previewMaterials.value = []
    return
  }

  isPreviewCalculating.value = true
  try {
    const configs = selectedAvatars.value.map(avatar => avatarConfigs[avatar._id])
    const result = await batchCalculateMaterials(configs)
    previewMaterials.value = result.mergedMaterials
  }
  catch (error) {
    console.error('预览计算失败:', error)
  }
  finally {
    isPreviewCalculating.value = false
  }
}

// 进入步骤2
function goToStep2() {
  step.value = 2
  // 进入步骤2时立即计算
  triggerPreviewCalculation()
}

// 移除角色
function removeAvatar(avatarId: number) {
  selectedAvatars.value = selectedAvatars.value.filter(a => a._id !== avatarId)
  delete avatarConfigs[avatarId]

  if (selectedAvatars.value.length === 0) {
    step.value = 1
    previewMaterials.value = []
  }
  else {
    // 重新计算预览
    triggerPreviewCalculation()
  }
}

// 应用预设
function applyPreset(preset: string) {
  const presets: Record<string, Partial<AvatarCalculatorConfig>> = {
    '1-90-10': { levelFrom: 1, levelTo: 90, talentAFrom: 1, talentEFrom: 1, talentQFrom: 1, talentA: 10, talentE: 10, talentQ: 10 },
    '1-80-8': { levelFrom: 1, levelTo: 80, talentAFrom: 1, talentEFrom: 1, talentQFrom: 1, talentA: 8, talentE: 8, talentQ: 8 },
    '1-70-6': { levelFrom: 1, levelTo: 70, talentAFrom: 1, talentEFrom: 1, talentQFrom: 1, talentA: 6, talentE: 6, talentQ: 6 },
  }

  const config = presets[preset]
  if (config) {
    for (const avatar of selectedAvatars.value) {
      avatarConfigs[avatar._id] = {
        ...avatarConfigs[avatar._id],
        ...config,
      }
    }
    // 应用预设后重新计算
    triggerPreviewCalculation()
  }
}

// 计算并添加材料
async function calculateAndAdd() {
  isCalculating.value = true
  calculationError.value = ''

  try {
    const configs = selectedAvatars.value.map(avatar => avatarConfigs[avatar._id])
    const result = await batchCalculateMaterials(configs)

    const avatarPlans: AvatarPlanPayload[] = configs.map((config, index) => ({
      config,
      materials: result.avatarResults[index]?.materials ?? [],
    }))

    emit('add-avatar-plans', avatarPlans)
    isOpen.value = false

    // 重置状态
    step.value = 1
    selectedAvatars.value = []
    previewMaterials.value = []
  }
  catch (error) {
    console.error('计算材料失败:', error)
    calculationError.value = error instanceof Error ? error.message : '计算失败'
  }
  finally {
    isCalculating.value = false
  }
}

// 监听弹窗打开，确保角色列表已加载
watch(isOpen, async (newVal) => {
  if (newVal && avatarList.value.length === 0) {
    await loadAvatarList()
  }
})
</script>
