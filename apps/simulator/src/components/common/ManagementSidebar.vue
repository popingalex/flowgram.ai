<template>
  <div class="management-sidebar">
    <div class="sidebar-header">
      <!-- 标签页（可选） -->
      <div v-if="tabs && tabs.length > 0" class="sidebar-tabs">
        <el-tabs :model-value="activeTab" @tab-click="handleTabClick">
          <el-tab-pane
            v-for="tab in tabs"
            :key="tab.name"
            :label="tab.label"
            :name="tab.name"
          />
        </el-tabs>
      </div>

      <!-- 搜索框和操作按钮在同一行 -->
      <div class="search-actions">
        <el-input
          :model-value="searchText"
          @update:model-value="$emit('update:searchText', $event)"
          :placeholder="searchPlaceholder"
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <div class="action-buttons">
          <el-button
            type="primary"
            :icon="Plus"
            @click="$emit('create')"
            :disabled="createDisabled"
            square
          />
          <el-button
            :icon="Refresh"
            @click="$emit('refresh')"
            :loading="loading"
            square
          />
        </div>
      </div>
    </div>

    <!-- 列表内容 -->
    <div class="list-content">
      <slot
        :items="items"
        :selected-id="selectedId"
        :search-text="searchText"
        :loading="loading"
        :on-select="handleSelect"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElTabs, ElTabPane } from 'element-plus'
import { Search, Plus, Refresh } from '@element-plus/icons-vue'

interface Tab {
  name: string
  label: string
}

interface Props {
  title: string
  items: any[]
  selectedId?: string
  searchText: string
  searchPlaceholder?: string
  loading?: boolean
  createButtonText?: string
  createDisabled?: boolean
  tabs?: Tab[]
  activeTab?: string
}

interface Emits {
  (e: 'update:searchText', value: string): void
  (e: 'update:activeTab', value: string): void
  (e: 'select', item: any): void
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'tab-change', tab: any): void
}

const props = withDefaults(defineProps<Props>(), {
  searchPlaceholder: '搜索...',
  loading: false,
  createButtonText: '新建',
  createDisabled: false
})

const emit = defineEmits<Emits>()

const handleSelect = (item: any) => {
  emit('select', item)
}

const handleTabClick = (tab: any) => {
  emit('update:activeTab', tab.props.name)
  emit('tab-change', tab)
}
</script>

<style scoped>
.management-sidebar {
  width: 350px;
  border-right: 1px solid var(--el-border-color);
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
}

.sidebar-header {
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color);
}

.sidebar-tabs {
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  flex: 1;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

:deep(.el-card__body) {
  padding: 8px;
}
</style>
