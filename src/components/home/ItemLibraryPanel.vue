<template>
  <Card class="h-full border-0 rounded-none flex flex-col glass-card">
    <CardHeader class="pb-3 flex-shrink-0 border-b border-border/30">
      <CardTitle class="text-lg text-gradient-primary font-bold">
        物品库
      </CardTitle>
      <CardDescription>点击物品添加到养成计划</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3 flex-grow flex flex-col min-h-0">
      <Input
        v-model="searchModel"
        type="text"
        placeholder="搜索物品..."
        class="w-full flex-shrink-0 glass-input"
      />

      <div class="flex-grow min-h-0 overflow-hidden">
        <DynamicScroller
          ref="scrollerRef"
          class="h-full min-h-0 scrollbar-overlay overflow-x-hidden"
          :items="rowItems"
          :min-item-size="ROW_MIN_HEIGHT"
          key-field="id"
        >
          <template #default="{ item: row, index, active }">
            <DynamicScrollerItem
              :item="row"
              :active="active"
              :size-dependencies="[row.items.length, columnCount]"
            >
              <div
                class="grid gap-2"
                :style="getRowStyle(index)"
              >
                <Card
                  v-for="item in row.items"
                  :key="item.id"
                  class="cursor-pointer glass-card border hover:border-primary/50 hover:glow-primary hover:scale-105 active:scale-95 transition-all duration-300"
                  @click="handleAdd(item)"
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
            </DynamicScrollerItem>
          </template>
        </DynamicScroller>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import type { OverallConsume } from '@/entity/OverallConsume'
import { useElementSize } from '@vueuse/core'
import { computed, ref } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DynamicScroller, DynamicScrollerItem } from 'vue-virtual-scroller'

const props = defineProps<{
  searchQuery: string
  filteredItems: OverallConsume[]
  getQualityBackground: (rarity: number | undefined) => string
}>()

const emit = defineEmits<{
  (event: 'update:searchQuery', value: string): void
  (event: 'add', item: OverallConsume): void
}>()

const MIN_ITEM_WIDTH = 155
const GRID_GAP = 8
const GRID_PADDING = 12
const ROW_MIN_HEIGHT = 56

const scrollerRef = ref<InstanceType<typeof DynamicScroller> | null>(null)
const { width: scrollerWidth } = useElementSize(scrollerRef)

const searchModel = computed({
  get: getSearchModel,
  set: setSearchModel,
})

interface RowItem {
  id: number
  items: OverallConsume[]
}

const columnCount = computed(() => {
  const availableWidth = scrollerWidth.value - GRID_PADDING * 2
  if (availableWidth <= 0) {
    return 1
  }
  return Math.max(1, Math.floor((availableWidth + GRID_GAP) / (MIN_ITEM_WIDTH + GRID_GAP)))
})

const rowItems = computed<RowItem[]>(() => {
  const columns = columnCount.value
  if (columns <= 0) {
    return []
  }

  const rows: RowItem[] = []
  const source = props.filteredItems

  for (let i = 0; i < source.length; i += columns) {
    rows.push({
      id: i / columns,
      items: source.slice(i, i + columns),
    })
  }

  return rows
})

function getSearchModel() {
  return props.searchQuery
}

function setSearchModel(value: string) {
  emit('update:searchQuery', value)
}

function handleAdd(item: OverallConsume) {
  emit('add', item)
}

function getRowStyle(index: number) {
  const isFirstRow = index === 0
  const isLastRow = index === rowItems.value.length - 1

  return {
    gridTemplateColumns: `repeat(${columnCount.value}, minmax(${MIN_ITEM_WIDTH}px, 1fr))`,
    paddingLeft: `${GRID_PADDING}px`,
    paddingRight: `${GRID_PADDING}px`,
    paddingTop: isFirstRow ? `${GRID_PADDING}px` : '0px',
    paddingBottom: isLastRow ? `${GRID_PADDING}px` : `${GRID_GAP}px`,
  }
}
</script>
