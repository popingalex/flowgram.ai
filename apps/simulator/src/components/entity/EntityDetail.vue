<template>
  <div class="entity-detail">
    <!-- 顶部操作栏 -->
    <div class="detail-header">
      <div class="header-info">
        <h3>{{ currentEntity?.name || '新建实体' }}</h3>
      </div>

      <div class="header-actions">
        <el-button
          type="primary"
          :icon="Check"
          :loading="isSaving"
          :disabled="!canSave"
          @click="$emit('save')"
        >
          保存
        </el-button>
        <el-button
          :icon="RefreshLeft"
          :disabled="!isDirty"
          @click="$emit('undo')"
        >
          撤销
        </el-button>
        <el-button
          type="danger"
          :icon="Delete"
          :disabled="!currentEntity"
          @click="$emit('delete')"
        >
          删除
        </el-button>
      </div>
    </div>

    <!-- 内容区域 -->
    <el-scrollbar class="detail-content">
      <div v-if="!currentEntity" class="empty-state">
        <el-empty description="请选择一个实体进行编辑" :image-size="120" />
      </div>

      <div v-else class="form-container">
        <!-- 基础信息 -->
        <el-card class="form-section">
          <template #header>
            <span>基础信息</span>
          </template>

          <el-form :model="formData" label-width="100px">
            <el-form-item label="实体ID" required>
              <el-input
                v-model="formData.id"
                placeholder="请输入实体ID"
                @input="updateField('id', $event)"
              />
            </el-form-item>

            <el-form-item label="名称" required>
              <el-input
                v-model="formData.name"
                placeholder="请输入实体名称"
                @input="updateField('name', $event)"
              />
            </el-form-item>

            <el-form-item label="描述">
              <el-input
                v-model="formData.description"
                type="textarea"
                :rows="3"
                placeholder="请输入实体描述"
                @input="updateField('description', $event)"
              />
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 实体不再支持属性，移除实体属性卡片 -->

        <!-- 关联模块 -->
        <el-card class="form-section">
          <template #header>
            <span>关联模块</span>
          </template>

          <div class="module-search">
            <el-input
              v-model="moduleSearchText"
              placeholder="搜索模块ID、名称或属性..."
              :prefix-icon="Search"
              clearable
            />
          </div>

          <UniversalTable
            ref="moduleTableRef"
            :data="treeModuleData"
            :columns="moduleColumns"
            :max-rows="10"
            :height="400"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            row-key="_indexId"
            :show-selection="true"
            :show-actions="false"
            @selection-change="handleModuleSelectionChange"
          />
        </el-card>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Check, RefreshLeft, Delete, Plus, Search, Box, Document } from '@element-plus/icons-vue'
import { useEntityStore } from '../../stores/entityStore'
import { useModuleStore } from '../../stores/moduleStore'
import type { Entity, Attribute } from '../../types'
import { nanoid } from 'nanoid'
import { UniversalTable, type TableColumn } from '../common'

// Props
interface Props {
  selectedEntity?: Entity | null
  isDirty?: boolean
  isSaving?: boolean
  canSave?: boolean
  id?: string // 添加id prop用于路由参数
}

const props = withDefaults(defineProps<Props>(), {
  selectedEntity: null,
  isDirty: false,
  isSaving: false,
  canSave: false,
  id: undefined
})

// Emits
const emit = defineEmits<{
  save: []
  undo: []
  delete: []
}>()

// Route
const route = useRoute()

// Stores
const entityStore = useEntityStore()
const moduleStore = useModuleStore()

// 搜索状态 - 移除属性搜索，只保留模块搜索
const moduleSearchText = ref('')

// 表格引用
const moduleTableRef = ref()

// 当前实体（从props或路由获取）
const currentEntity = computed(() => {
  // 优先使用props传入的实体
  if (props.selectedEntity) {
    return props.selectedEntity
  }

  // 从路由参数获取实体ID
  const entityId = props.id || route.params.id as string
  if (entityId && entityId !== '$new') {
    // 由于store中使用entity.id作为_indexId，所以直接匹配_indexId
    return entityStore.entities.find(e => e._indexId === entityId)
  }

  return null
})

// 表单数据
const formData = ref({
  id: '',
  name: '',
  description: ''
})

// 实体不再支持属性，移除属性表格列定义

// 模块表格列定义
const moduleColumns: TableColumn[] = [
  {
    prop: 'id',
    label: 'ID',
    width: 150,
    showOverflowTooltip: true
  },
  {
    prop: 'name',
    label: '名称',
    showOverflowTooltip: true
  }
]

// 计算属性
// 实体不再支持属性，移除filteredAttributes计算属性

const filteredModules = computed(() => {
  const modules = moduleStore.modules
  if (!modules.length) return []

  if (!moduleSearchText.value.trim()) {
    return modules
  }

  const searchLower = moduleSearchText.value.toLowerCase()
  return modules.filter(module =>
    module.id?.toLowerCase().includes(searchLower) ||
    module.name?.toLowerCase().includes(searchLower) ||
    module.attributes?.some(attr =>
      attr.id?.toLowerCase().includes(searchLower) ||
      attr.name?.toLowerCase().includes(searchLower)
    )
  )
})

// 树形模块数据 - 选中的排在前面
const treeModuleData = computed(() => {
  const modules = filteredModules.value.map(module => ({
    id: module.id, // ID列显示真正的ID
    name: module.name, // 名称列显示真正的名称
    _indexId: module._indexId, // 保留索引ID用于选择
    hasChildren: module.attributes && module.attributes.length > 0,
    children: module.attributes?.map(attr => ({
      id: attr.id, // 属性的ID
      name: attr.name, // 属性的名称
      _indexId: attr._indexId, // 保留索引ID
      hasChildren: false
    })) || []
  }))

  // 如果没有当前实体，直接返回
  if (!currentEntity.value?.modules) return modules

  // 获取实体关联的模块ID列表
  const entityModuleIds = (currentEntity.value.modules as any[]).map(m =>
    typeof m === 'string' ? m : m.id
  )

  // 分离选中和未选中的模块
  const selectedModules = modules.filter(module => entityModuleIds.includes(module.id))
  const unselectedModules = modules.filter(module => !entityModuleIds.includes(module.id))

  // 选中的排在前面
  return [...selectedModules, ...unselectedModules]
})

// 已选中的模块数据（用于表格默认选中）
const selectedModuleData = computed(() => {
  if (!currentEntity.value?.modules) return []

  // 获取实体关联的模块ID列表
  const entityModuleIds = (currentEntity.value.modules as any[]).map(m =>
    typeof m === 'string' ? m : m.id
  )

  // 根据实体的modules字段找到对应的模块数据
  return filteredModules.value.filter(module =>
    entityModuleIds.includes(module.id || module._indexId)
  )
})

// 监听当前实体变化，更新表单数据
watch(
  () => currentEntity.value,
  (newEntity) => {
    if (newEntity) {
      formData.value = {
        id: newEntity.id || '',
        name: newEntity.name || '',
        description: newEntity.description || ''
      }
      entityStore.setEditingEntity(newEntity)
    } else {
      formData.value = {
        id: '',
        name: '',
        description: ''
      }
    }
  },
  { immediate: true }
)

// 手动触发模块选中的函数
const syncModuleSelection = () => {
  if (moduleTableRef.value && currentEntity.value?.modules && treeModuleData.value.length > 0) {
    console.log('=== 手动触发模块选中 ===')
    console.log('当前实体:', currentEntity.value?.name)
    console.log('实体关联的模块原始数据:', currentEntity.value.modules)

    // 清除所有选中状态
    moduleTableRef.value.clearSelection()

    // 获取实体关联的模块ID列表
    const entityModuleIds = currentEntity.value.modules.map((m: any) =>
      typeof m === 'string' ? m : m.id
    )
    console.log('提取的模块ID列表:', entityModuleIds)

    console.log('表格数据总数:', treeModuleData.value.length)
    console.log('表格数据示例:', treeModuleData.value.slice(0, 3).map(m => ({ id: m.id, name: m.name, _indexId: m._indexId })))

    let selectedCount = 0
    // 选中对应的行
    treeModuleData.value.forEach(row => {
      if (row.id && entityModuleIds.includes(row.id)) {
        console.log('选中模块:', row.id, row.name)
        moduleTableRef.value.toggleRowSelection(row, true)
        selectedCount++
      }
    })

    console.log('应该选中的模块数量:', selectedCount)
    console.log('========================')
  }
}

// 同步模块选中状态
watch(
  () => [currentEntity.value?.modules, treeModuleData.value],
  () => {
    console.log('=== watch触发 ===')
    syncModuleSelection()
  },
  { immediate: true, deep: true }
)

// 确保实体数据已加载
onMounted(async () => {
  if (entityStore.entities.length === 0) {
    await entityStore.fetchEntities()
  }

  // 页面加载完成后，等待一下再触发选中
  await nextTick()
  setTimeout(() => {
    syncModuleSelection()
  }, 100)
})

// 更新字段
const updateField = (field: keyof Entity, value: any) => {
  entityStore.updateEntityProperty(field, value)
}

// 实体不再支持属性，移除属性相关的处理函数

// 处理模块选择变化
const handleModuleSelectionChange = (selectedModules: any[]) => {
  const moduleIds = selectedModules.map(module => module.id)
  // 转换为对象数组格式以匹配后端数据结构
  const moduleObjects = selectedModules.map(module => ({
    id: module.id,
    name: module.name
  }))
  entityStore.updateEntityProperty('modules', moduleObjects)
}

// 初始化模块数据
moduleStore.fetchModules()
</script>

<style scoped>
.entity-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  border-bottom: 1px solid var(--el-border-color);
  background: var(--el-bg-color);
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h3 {
  margin: 0;
  color: var(--el-text-color-primary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

.detail-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;
}

.empty-state {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-container {
  max-width: 1200px;
  margin: 0 auto;
}

.form-section {
  margin-bottom: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.attribute-search,
.module-search {
  margin-bottom: 16px;
}

.empty-attributes,
.empty-modules {
  text-align: center;
  padding: 40px;
}

.attribute-list,
.module-list {
  margin-top: 16px;
}

.module-attributes {
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 4px;
  margin: 8px 0;
}

.attributes-header {
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--el-text-color-primary);
}

.attributes-content {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.attribute-tag {
  font-size: 12px;
}

.module-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.module-icon {
  color: var(--el-color-primary);
}

.attribute-icon {
  color: var(--el-color-success);
}
</style>
