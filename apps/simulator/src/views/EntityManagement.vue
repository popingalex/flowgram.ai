<template>
  <el-container direction="horizontal" class="entity-management">
    <!-- 左侧实体列表 -->
    <ManagementSidebar
      title="实体管理"
      :items="filteredEntities"
      :selected-id="selectedEntityId"
      v-model:search-text="searchText"
      search-placeholder="搜索实体ID、名称或模块..."
      create-button-text="新建实体"
      :create-disabled="!!hasUnsavedNew"
      :loading="loading"
      @select="selectEntity"
      @create="handleAddEntity"
      @refresh="handleRefresh"
    >
      <template #default="{ items, selectedId, onSelect }">
        <div v-for="entity in items" :key="entity.id">
          <ManagementListItem
            :item="entity"
            :is-selected="selectedId === entity.id"
            :modules="modules"
            @select="onSelect"
          >
            <template #content="{ item }">
              <!-- 实体不再支持属性，移除属性标签显示 -->
            </template>
          </ManagementListItem>
        </div>

        <!-- 空状态 -->
        <el-empty
          v-if="items.length === 0"
          description="暂无实体数据"
          :image-size="100"
        />
      </template>
    </ManagementSidebar>

    <!-- 右侧详情区域 -->
    <el-main class="detail-area">
      <router-view
        :selected-entity="selectedEntity"
        :is-dirty="isDirty"
        :is-saving="isSaving"
        :can-save="canSave"
        @save="handleSave"
        @undo="handleUndo"
        @delete="handleDelete"
      />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEntityStore } from '../stores/entityStore'
import { useModuleStore } from '../stores/moduleStore'
import { ManagementSidebar, ManagementListItem } from '../components/common'
import type { Entity } from '../types'

const route = useRoute()
const router = useRouter()
const entityStore = useEntityStore()
const moduleStore = useModuleStore()

// 搜索文本
const searchText = ref('')

// 计算属性
const entities = computed(() => entityStore.entities)
const modules = computed(() => moduleStore.modules)
const loading = computed(() => entityStore.loading)
const selectedEntityId = computed(() => route.params.id as string)

// 根据URL中的原始id找到对应的实体
const selectedEntity = computed(() => {
  if (!selectedEntityId.value) return null

  if (selectedEntityId.value === '$new') {
    // 确保新建实体存在
    if (!entityStore.newEntity) {
      entityStore.createNewEntity()
    }
    return entityStore.newEntity
  }

  // 根据原始id找到原始实体
  const originalEntity = entities.value.find((e: any) => e.id === selectedEntityId.value)
  if (!originalEntity) return null

  // 根据_indexId找到workingCopy（这里假设workingCopy就是实体本身，实际可能需要从store获取）
  return originalEntity
}) as any

// 过滤后的实体列表
const filteredEntities = computed(() => {
  if (!searchText.value.trim()) return entities.value

  const searchLower = searchText.value.toLowerCase()
    return entities.value.filter((entity: any) => {
    // 搜索实体ID和名称
    const matchesBasic =
      entity.id?.toLowerCase().includes(searchLower) ||
      entity.name?.toLowerCase().includes(searchLower)

    // 搜索关联的模块
    const matchesModules = entity.modules?.some((moduleId: string) =>
      moduleId?.toLowerCase().includes(searchLower)
    )

    return matchesBasic || matchesModules
  })
})

// 编辑状态
const isDirty = computed(() => entityStore.isDirty)
const isSaving = computed(() => entityStore.isSaving)
const canSave = computed(() => {
  if (!selectedEntity.value) return false
  return isDirty.value && selectedEntity.value.name?.trim()
})

// 检查是否有未保存的新建实体
const hasUnsavedNew = computed(() => {
  return selectedEntityId.value === '$new' && entityStore.newEntity
})

// 选择实体
const selectEntity = (entity: any) => {
  if (isDirty.value) {
    ElMessageBox.confirm(
      '当前有未保存的修改，是否继续？',
      '提示',
      {
        confirmButtonText: '继续',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.push(`/management/entities/${entity.id}`)
    }).catch(() => {
      // 用户取消
    })
  } else {
    router.push(`/management/entities/${entity.id}`)
  }
}

// 添加实体
const handleAddEntity = () => {
  if (hasUnsavedNew.value) {
    ElMessage.warning('请先保存当前新建的实体')
    return
  }

  entityStore.createNewEntity()
  router.push('/management/entities/$new')
}

// 刷新数据
const handleRefresh = async () => {
  await entityStore.fetchEntities()
  await moduleStore.fetchModules()
  ElMessage.success('数据已刷新')
}

// 保存实体
const handleSave = async () => {
  if (!selectedEntity.value) return

  try {
    await entityStore.saveEntity(selectedEntity.value)
    ElMessage.success('保存成功')

    // 如果是新建实体，保存后跳转到编辑页面
    if (selectedEntityId.value === '$new' && selectedEntity.value.id) {
      router.replace(`/management/entities/${selectedEntity.value.id}`)
    }
  } catch (error) {
    ElMessage.error('保存失败')
    console.error('保存实体失败:', error)
  }
}

// 撤销修改
const handleUndo = () => {
  entityStore.resetChanges()
  ElMessage.info('已撤销修改')
}

// 删除实体
const handleDelete = async () => {
  if (!selectedEntity.value) return

  try {
    await ElMessageBox.confirm(
      `确定要删除实体 "${selectedEntity.value.name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )

    await entityStore.deleteEntity(selectedEntity.value._indexId)
    ElMessage.success('删除成功')

    // 删除后跳转到列表
    const remainingEntities = entities.value
    if (remainingEntities.length > 0) {
      router.push(`/management/entities/${remainingEntities[0].id}`)
    } else {
      router.push('/management/entities')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
      console.error('删除实体失败:', error)
    }
  }
}

// 默认选中逻辑：有实体时选第一个
watch(
  () => [entities.value, route.params.id, loading.value],
  ([newEntities, newId, isLoading]) => {
    if (isLoading) return

    // 只有在没有选中ID且有实体数据时，才自动选中第一个
    if (!newId && Array.isArray(newEntities) && newEntities.length > 0) {
      const firstEntity = newEntities[0] as any
      console.log('自动选中第一个实体:', firstEntity.id)
      router.replace(`/management/entities/${firstEntity.id}`)
    }
  },
  { immediate: true }
)

// 初始化
onMounted(async () => {
  console.log('EntityManagement组件初始化')
  try {
    await entityStore.fetchEntities()
    await moduleStore.fetchModules()
    console.log('数据加载完成，实体数量:', entities.value.length)
  } catch (error) {
    console.error('数据加载失败:', error)
  }
})
</script>

<style scoped>
.entity-management {
  height: 100%;
}

.component-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 8px;
}

.component-tag {
  font-size: 11px;
}

.detail-area {
  padding: 0;
  background: var(--el-bg-color);
}
</style>
