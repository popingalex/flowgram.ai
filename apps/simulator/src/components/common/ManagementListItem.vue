<template>
  <el-card
    shadow="hover"
    class="management-list-item"
    :class="{ active: isSelected }"
    @click="$emit('select', item)"
  >
    <div class="item-header">
      <div class="item-info">
        <div class="item-id">{{ item.id || item._indexId }}</div>
        <div v-if="item.name && item.name.trim()" class="item-name">
          {{ item.name }}
        </div>
      </div>

      <!-- 统计标签 -->
      <div class="item-stats">
        <slot name="stats" :item="item">
          <!-- 默认统计标签 -->
          <el-tooltip
            v-if="getModuleCount(item) > 0"
            :content="getModuleTooltip(item)"
            placement="left"
          >
            <el-tag type="success" size="small">
              模: {{ getModuleCount(item) }}
            </el-tag>
          </el-tooltip>

          <el-tag
            v-if="getAttributeCount(item) > 0"
            type="primary"
            size="small"
          >
            属: {{ getAttributeCount(item) }}
          </el-tag>

          <el-tag
            v-if="getBehaviorCount(item) > 0"
            type="warning"
            size="small"
          >
            行: {{ getBehaviorCount(item) }}
          </el-tag>
        </slot>
      </div>
    </div>

    <!-- 描述（只有非空时才显示） -->
    <div
      v-if="item.description && item.description.trim()"
      class="item-description"
    >
      {{ item.description }}
    </div>

    <!-- 自定义内容插槽 -->
    <slot name="content" :item="item" />
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  item: any
  isSelected?: boolean
  modules?: any[] // 用于显示模块详情的tooltip
}

interface Emits {
  (e: 'select', item: any): void
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false
})

const emit = defineEmits<Emits>()

// 获取模块数量
const getModuleCount = (item: any): number => {
  return item.modules?.length || item.bundles?.length || item.moduleIds?.length || 0
}

// 获取属性数量
const getAttributeCount = (item: any): number => {
  return item.attributes?.length || 0
}

// 获取行为数量
const getBehaviorCount = (item: any): number => {
  return item.behaviors?.length || 0
}

// 获取模块tooltip内容
const getModuleTooltip = (item: any): string => {
  const moduleIds = item.modules || item.bundles || item.moduleIds || []
  if (moduleIds.length === 0) return ''

  const lines = ['关联模块：']
  moduleIds.forEach((moduleId: string) => {
    const module = props.modules?.find(m => m.id === moduleId)
    const displayText = module?.name || moduleId
    lines.push(`• ${displayText}`)
  })

  return lines.join('\n')
}
</script>

<style scoped>
.management-list-item {
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s;
}

.management-list-item:hover {
  transform: translateY(-2px);
}

.management-list-item.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.item-info {
  flex: 1;
}

.item-id {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-color-primary);
  margin-bottom: 4px;
}

.item-name {
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.item-stats {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-end;
}

.item-description {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-bottom: 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
