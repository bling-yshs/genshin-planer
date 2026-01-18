<template>
  <Dialog v-model:open="saveOpenModel">
    <DialogContent class="sm:max-w-md glass-card border-2">
      <DialogHeader>
        <DialogTitle class="text-gradient-accent">
          ?? 保存养成计划
        </DialogTitle>
        <DialogDescription>
          请为这个养成计划取一个名字
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-4">
        <Input
          v-model="planNameModel"
          type="text"
          placeholder="输入计划名称..."
          class="w-full glass-input"
          @keyup.enter="handleSave"
        />
        <div class="flex justify-end gap-2">
          <Button variant="outline" class="hover:scale-105 active:scale-95" @click="closeSaveDialog">
            取消
          </Button>
          <Button class="glass-button hover:scale-105 active:scale-95" @click="handleSave">
            保存
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="renameOpenModel">
    <DialogContent class="sm:max-w-md glass-card border-2">
      <DialogHeader>
        <DialogTitle class="text-gradient-accent">
          ?? 重命名计划
        </DialogTitle>
        <DialogDescription>
          输入新的计划名称
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-4 py-4">
        <Input
          v-model="planNameModel"
          type="text"
          placeholder="输入新名称..."
          class="w-full glass-input"
          @keyup.enter="handleRename"
        />
        <div class="flex justify-end gap-2">
          <Button variant="outline" class="hover:scale-105 active:scale-95" @click="closeRenameDialog">
            取消
          </Button>
          <Button class="glass-button hover:scale-105 active:scale-95" @click="handleRename">
            确认
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="deleteOpenModel">
    <DialogContent class="sm:max-w-md glass-card border-2 border-destructive/30">
      <DialogHeader>
        <DialogTitle class="text-destructive">
          删除计划
        </DialogTitle>
        <DialogDescription>
          确定要删除计划 "{{ currentPlanName }}" 吗？此操作无法撤销。
        </DialogDescription>
      </DialogHeader>
      <div class="flex justify-end gap-2 py-4">
        <Button variant="outline" class="hover:scale-105 active:scale-95" @click="closeDeleteDialog">
          取消
        </Button>
        <Button variant="destructive" class="hover:scale-105 active:scale-95" @click="handleDelete">
          删除
        </Button>
      </div>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="unsavedOpenModel">
    <DialogContent class="sm:max-w-md glass-card border-2 border-accent/30">
      <DialogHeader>
        <DialogTitle class="text-gradient-accent">
          ?? 有未保存的更改
        </DialogTitle>
        <DialogDescription>
          当前计划有未保存的更改，你要如何处理？
        </DialogDescription>
      </DialogHeader>
      <div class="flex justify-end gap-2 py-4">
        <Button variant="outline" class="hover:scale-105 active:scale-95" @click="handleUnsavedChoice('cancel')">
          取消
        </Button>
        <Button variant="secondary" class="hover:scale-105 active:scale-95" @click="handleUnsavedChoice('discard')">
          放弃更改
        </Button>
        <Button class="glass-button hover:scale-105 active:scale-95" @click="handleUnsavedChoice('save')">
          保存并继续
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  saveOpen: boolean
  renameOpen: boolean
  deleteOpen: boolean
  unsavedOpen: boolean
  planName: string
  currentPlanName: string
}>()

const emit = defineEmits<{
  (event: 'update:saveOpen', value: boolean): void
  (event: 'update:renameOpen', value: boolean): void
  (event: 'update:deleteOpen', value: boolean): void
  (event: 'update:unsavedOpen', value: boolean): void
  (event: 'update:planName', value: string): void
  (event: 'save'): void
  (event: 'rename'): void
  (event: 'delete'): void
  (event: 'unsaved-choice', choice: 'save' | 'discard' | 'cancel'): void
}>()

const saveOpenModel = computed({
  get: getSaveOpenModel,
  set: setSaveOpenModel,
})

const renameOpenModel = computed({
  get: getRenameOpenModel,
  set: setRenameOpenModel,
})

const deleteOpenModel = computed({
  get: getDeleteOpenModel,
  set: setDeleteOpenModel,
})

const unsavedOpenModel = computed({
  get: getUnsavedOpenModel,
  set: setUnsavedOpenModel,
})

const planNameModel = computed({
  get: getPlanNameModel,
  set: setPlanNameModel,
})

function getSaveOpenModel() {
  return props.saveOpen
}

function setSaveOpenModel(value: boolean) {
  emit('update:saveOpen', value)
}

function getRenameOpenModel() {
  return props.renameOpen
}

function setRenameOpenModel(value: boolean) {
  emit('update:renameOpen', value)
}

function getDeleteOpenModel() {
  return props.deleteOpen
}

function setDeleteOpenModel(value: boolean) {
  emit('update:deleteOpen', value)
}

function getUnsavedOpenModel() {
  return props.unsavedOpen
}

function setUnsavedOpenModel(value: boolean) {
  emit('update:unsavedOpen', value)
}

function getPlanNameModel() {
  return props.planName
}

function setPlanNameModel(value: string) {
  emit('update:planName', value)
}

function closeSaveDialog() {
  emit('update:saveOpen', false)
}

function closeRenameDialog() {
  emit('update:renameOpen', false)
}

function closeDeleteDialog() {
  emit('update:deleteOpen', false)
}

function handleSave() {
  emit('save')
}

function handleRename() {
  emit('rename')
}

function handleDelete() {
  emit('delete')
}

function handleUnsavedChoice(choice: 'save' | 'discard' | 'cancel') {
  emit('unsaved-choice', choice)
}
</script>
