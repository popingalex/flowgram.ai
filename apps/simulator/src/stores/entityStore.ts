import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Entity, Attribute } from '../types'
import { apiService } from '../services/api-service'

export const useEntityStore = defineStore('entity', () => {
  // 状态
  const entities = ref<Entity[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const newEntity = ref<Entity | null>(null)
  const editingEntity = ref<Entity | null>(null)
  const originalEntity = ref<Entity | null>(null)

  // 计算属性
  const isDirty = computed(() => {
    if (!editingEntity.value || !originalEntity.value) return false
    return JSON.stringify(editingEntity.value) !== JSON.stringify(originalEntity.value)
  })

  const isSaving = computed(() => saving.value)

  // 获取实体列表
  const fetchEntities = async () => {
    loading.value = true
    try {
      const response = await apiService.getEntities()
      // 转换API数据格式：id -> _indexId
      const rawEntities = response.data || []
      entities.value = rawEntities.map((entity: any) => ({
        ...entity,
        _indexId: entity.id || entity._indexId // 使用id作为_indexId
        // 实体不再支持属性，移除attributes字段
      }))
    } catch (error) {
      console.error('获取实体列表失败:', error)
      entities.value = []
    } finally {
      loading.value = false
    }
  }

  // 创建新实体
  const createNewEntity = () => {
    const entity: any = {
      _indexId: '',
      name: '',
      description: '',
      modules: [],
      _status: 'new'
    }
    newEntity.value = entity
    editingEntity.value = { ...entity }
    originalEntity.value = { ...entity }
  }

  // 设置编辑实体
  const setEditingEntity = (entity: Entity | null) => {
    if (entity) {
      editingEntity.value = { ...entity }
      originalEntity.value = { ...entity }
    } else {
      editingEntity.value = null
      originalEntity.value = null
    }
    newEntity.value = null
  }

  // 更新实体属性
  const updateEntityProperty = (property: keyof Entity, value: any) => {
    if (editingEntity.value) {
      (editingEntity.value as any)[property] = value
    }
  }

  // 实体不再支持属性，移除所有属性相关的方法

  // 保存实体
  const saveEntity = async (entity: any) => {
    saving.value = true
    try {
      let savedEntity: any

      if (entity._status === 'new') {
        // 新建实体
        const response = await apiService.createEntity(entity)
        savedEntity = response.data
        entities.value.push(savedEntity)
        newEntity.value = null
      } else {
        // 更新实体
        const response = await apiService.updateEntity(entity._indexId, entity)
        savedEntity = response.data
        const index = entities.value.findIndex((e: any) => e._indexId === entity._indexId)
        if (index !== -1) {
          entities.value[index] = savedEntity
        }
      }

      // 更新编辑状态
      editingEntity.value = { ...savedEntity }
      originalEntity.value = { ...savedEntity }

      return savedEntity
    } catch (error) {
      console.error('保存实体失败:', error)
      throw error
    } finally {
      saving.value = false
    }
  }

  // 删除实体
  const deleteEntity = async (entityId: string) => {
    try {
      await apiService.deleteEntity(entityId)
      entities.value = entities.value.filter((e: any) => e._indexId !== entityId)

      // 清空编辑状态
      if ((editingEntity.value as any)?._indexId === entityId) {
        editingEntity.value = null
        originalEntity.value = null
      }
    } catch (error) {
      console.error('删除实体失败:', error)
      throw error
    }
  }

  // 重置修改
  const resetChanges = () => {
    if (originalEntity.value) {
      editingEntity.value = { ...originalEntity.value }
    }
  }

  // 清空状态
  const clearState = () => {
    entities.value = []
    editingEntity.value = null
    originalEntity.value = null
    newEntity.value = null
    loading.value = false
    saving.value = false
  }

  return {
    // 状态
    entities,
    loading,
    saving,
    newEntity,
    editingEntity,
    originalEntity,

    // 计算属性
    isDirty,
    isSaving,

    // 方法
    fetchEntities,
    createNewEntity,
    setEditingEntity,
    updateEntityProperty,
    saveEntity,
    deleteEntity,
    resetChanges,
    clearState
  }
})
