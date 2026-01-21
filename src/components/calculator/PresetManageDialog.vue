<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-3xl max-h-[85vh] flex flex-col">
      <DialogHeader>
        <DialogTitle>预设管理</DialogTitle>
        <DialogDescription>
          拖拽预设到"快捷预设区"可在外部快速访问，拖到"暂存区"则隐藏
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 overflow-y-auto space-y-4 min-h-0">
        <!-- 快捷预设区 -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <i-mdi-star class="text-yellow-500" />
              <h3 class="text-sm font-semibold">
                快捷预设区
              </h3>
              <span class="text-xs text-muted-foreground">
                (拖到此处可在外部快捷设置中显示)
              </span>
            </div>
            <Button
              size="sm"
              variant="outline"
              @click="showCreateDialog"
            >
              <i-mdi-plus class="mr-1" />
              新建预设
            </Button>
          </div>

          <VueDraggable
            v-model="localQuickPresets"
            item-key="id"
            :animation="200"
            :force-fallback="true"
            :fallback-tolerance="3"
            fallback-class="hidden"
            class="flex flex-col gap-2 min-h-[100px] p-2 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5"
            group="presets"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <Card
              v-for="preset in localQuickPresets"
              :key="preset.id"
              class="p-3 hover:shadow-md transition-shadow select-none"
            >
              <div class="flex items-center gap-2">
                <span class="drag-handle text-muted-foreground flex-shrink-0 cursor-move">
                  <i-mdi-drag />
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">
                    {{ preset.name }}
                  </div>
                  <div class="text-xs text-muted-foreground mt-1">
                    {{ formatPresetDescription(preset) }}
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="editPreset(preset)"
                  >
                    <i-mdi-pencil />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="text-destructive hover:text-destructive"
                    @click="deletePreset(preset.id)"
                  >
                    <i-mdi-delete />
                  </Button>
                </div>
              </div>
            </Card>
          </VueDraggable>


        </div>

        <!-- 暂存区 -->
        <div>
          <div class="flex items-center gap-2 mb-2">
            <i-mdi-archive class="text-muted-foreground" />
            <h3 class="text-sm font-semibold text-muted-foreground">
              暂存区
            </h3>
            <span class="text-xs text-muted-foreground">
              (暂时不使用的预设可拖到此处)
            </span>
          </div>

          <VueDraggable
            v-model="localStoragePresets"
            item-key="id"
            :animation="200"
            :force-fallback="true"
            :fallback-tolerance="3"
            fallback-class="hidden"
            class="flex flex-col gap-2 min-h-[100px] p-2 border-2 border-dashed border-muted-foreground/20 rounded-lg bg-muted/30"
            group="presets"
            handle=".drag-handle"
            @end="handleDragEnd"
          >
            <Card
              v-for="preset in localStoragePresets"
              :key="preset.id"
              class="p-3 hover:shadow-md transition-shadow select-none"
            >
              <div class="flex items-center gap-2">
                <span class="drag-handle text-muted-foreground flex-shrink-0 cursor-move">
                  <i-mdi-drag />
                </span>
                <div class="flex-1 min-w-0">
                  <div class="font-medium truncate">
                    {{ preset.name }}
                  </div>
                  <div class="text-xs text-muted-foreground mt-1">
                    {{ formatPresetDescription(preset) }}
                  </div>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    @click="editPreset(preset)"
                  >
                    <i-mdi-pencil />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    class="text-destructive hover:text-destructive"
                    @click="deletePreset(preset.id)"
                  >
                    <i-mdi-delete />
                  </Button>
                </div>
              </div>
            </Card>
          </VueDraggable>


        </div>
      </div>
    </DialogContent>
  </Dialog>

  <!-- 创建/编辑预设对话框 -->
  <Dialog v-model:open="showEditor">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ editingPreset ? '编辑预设' : '新建预设' }}</DialogTitle>
        <DialogDescription>
          设置角色的等级和天赋目标
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- 预设名称 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">预设名称</label>
          <Input
            v-model="editorForm.name"
            placeholder="例如：90级 1/9/9"
          />
        </div>

        <!-- 等级配置 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">等级范围</label>
          <div class="flex items-center gap-2">
            <Input
              v-model.number="editorForm.levelFrom"
              type="number"
              min="1"
              max="90"
              class="w-20 text-center"
            />
            <span class="text-muted-foreground">→</span>
            <Input
              v-model.number="editorForm.levelTo"
              type="number"
              min="1"
              max="90"
              class="w-20 text-center"
            />
          </div>
        </div>

        <!-- 天赋配置 -->
        <div class="space-y-2">
          <label class="text-sm font-medium">天赋等级 (普攻/战技/爆发)</label>
          <div class="grid grid-cols-3 gap-3">
            <!-- 普攻 -->
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">普攻 A</label>
              <div class="flex items-center gap-1">
                <Input
                  v-model.number="editorForm.talentAFrom"
                  type="number"
                  min="1"
                  max="10"
                  class="w-12 text-center text-sm"
                />
                <span class="text-xs text-muted-foreground">→</span>
                <Input
                  v-model.number="editorForm.talentA"
                  type="number"
                  min="1"
                  max="10"
                  class="w-12 text-center text-sm"
                />
              </div>
            </div>

            <!-- 元素战技 -->
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">战技 E</label>
              <div class="flex items-center gap-1">
                <Input
                  v-model.number="editorForm.talentEFrom"
                  type="number"
                  min="1"
                  max="10"
                  class="w-12 text-center text-sm"
                />
                <span class="text-xs text-muted-foreground">→</span>
                <Input
                  v-model.number="editorForm.talentE"
                  type="number"
                  min="1"
                  max="10"
                  class="w-12 text-center text-sm"
                />
              </div>
            </div>

            <!-- 元素爆发 -->
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">爆发 Q</label>
              <div class="flex items-center gap-1">
                <Input
                  v-model.number="editorForm.talentQFrom"
                  type="number"
                  min="1"
                  max="10"
                  class="w-12 text-center text-sm"
                />
                <span class="text-xs text-muted-foreground">→</span>
                <Input
                  v-model.number="editorForm.talentQ"
                  type="number"
                  min="1"
                  max="10"
                  class="w-12 text-center text-sm"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 预览 -->
        <div class="p-3 bg-muted rounded-lg">
          <div class="text-xs text-muted-foreground mb-1">
            预览
          </div>
          <div class="text-sm font-medium">
            {{ editorForm.name || '未命名' }}
          </div>
          <div class="text-xs text-muted-foreground mt-1">
            {{ formatPresetDescription(editorForm) }}
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="flex justify-end gap-2">
          <Button
            variant="outline"
            @click="cancelEdit"
          >
            取消
          </Button>
          <Button
            @click="savePreset"
            :disabled="!editorForm.name.trim()"
          >
            <i-mdi-check class="mr-1" />
            保存
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'
import type { AvatarPreset } from '@/store/store'
import { usePresetStore } from '@/store/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'apply-preset', preset: AvatarPreset): void
}>()

const presetStore = usePresetStore()

const isOpen = computed({
  get: () => props.open,
  set: value => emit('update:open', value),
})

// 本地拖拽列表（避免直接修改 store）
const localQuickPresets = ref<AvatarPreset[]>([])
const localStoragePresets = ref<AvatarPreset[]>([])

// 监听 store 变化，同步到本地
watch(
  () => [presetStore.quickPresets, presetStore.storagePresets],
  () => {
    localQuickPresets.value = [...presetStore.quickPresets]
    localStoragePresets.value = [...presetStore.storagePresets]
  },
  { immediate: true, deep: true },
)

// 拖拽结束后，同步到 store
function handleDragEnd() {
  presetStore.setQuickPresets(localQuickPresets.value)
  presetStore.setStoragePresets(localStoragePresets.value)
}

// 编辑器状态
const showEditor = ref(false)
const editingPreset = ref<AvatarPreset | null>(null)

interface EditorForm {
  name: string
  levelFrom: number
  levelTo: number
  talentAFrom: number
  talentEFrom: number
  talentQFrom: number
  talentA: number
  talentE: number
  talentQ: number
}

const editorForm = reactive<EditorForm>({
  name: '',
  levelFrom: 1,
  levelTo: 90,
  talentAFrom: 1,
  talentEFrom: 1,
  talentQFrom: 1,
  talentA: 10,
  talentE: 10,
  talentQ: 10,
})

// 格式化预设描述
function formatPresetDescription(preset: Partial<EditorForm>): string {
  const levelPart = `${preset.levelFrom ?? 1}→${preset.levelTo ?? 90}级`
  const talentPart = `${preset.talentAFrom ?? 1}/${preset.talentEFrom ?? 1}/${preset.talentQFrom ?? 1}→${preset.talentA ?? 10}/${preset.talentE ?? 10}/${preset.talentQ ?? 10}`
  return `${levelPart}, ${talentPart}`
}

// 显示创建对话框
function showCreateDialog() {
  editingPreset.value = null
  resetEditorForm()
  showEditor.value = true
}

// 编辑预设
function editPreset(preset: AvatarPreset) {
  editingPreset.value = preset
  editorForm.name = preset.name
  editorForm.levelFrom = preset.levelFrom
  editorForm.levelTo = preset.levelTo
  editorForm.talentAFrom = preset.talentAFrom
  editorForm.talentEFrom = preset.talentEFrom
  editorForm.talentQFrom = preset.talentQFrom
  editorForm.talentA = preset.talentA
  editorForm.talentE = preset.talentE
  editorForm.talentQ = preset.talentQ
  showEditor.value = true
}

// 保存预设
function savePreset() {
  if (!editorForm.name.trim()) {
    return
  }

  if (editingPreset.value) {
    // 更新现有预设
    presetStore.updatePreset(editingPreset.value.id, { ...editorForm })
  }
  else {
    // 创建新预设（默认添加到暂存区）
    presetStore.addPreset({ ...editorForm })
  }

  showEditor.value = false
  resetEditorForm()
}

// 取消编辑
function cancelEdit() {
  showEditor.value = false
  resetEditorForm()
}

// 重置编辑器表单
function resetEditorForm() {
  editorForm.name = ''
  editorForm.levelFrom = 1
  editorForm.levelTo = 90
  editorForm.talentAFrom = 1
  editorForm.talentEFrom = 1
  editorForm.talentQFrom = 1
  editorForm.talentA = 10
  editorForm.talentE = 10
  editorForm.talentQ = 10
  editingPreset.value = null
}

// 删除预设
function deletePreset(id: string) {
  if (confirm('确定要删除这个预设吗？')) {
    presetStore.deletePreset(id)
  }
}
</script>
