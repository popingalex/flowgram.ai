import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
// import axios from 'axios' // 暂时未使用
import type { Entity, Attribute, Module } from '../types/entities'

// Mock数据导入
import entitiesData from '../mock-data/entities.json'
import modulesData from '../mock-data/modules.json'

export const useEntitiesStore = defineStore('entities', () => {
  // 状态
  const entities = ref<Entity[]>([])
  const modules = ref<Module[]>([])
  const loading = ref(false)
  const currentEntity = ref<Entity | null>(null)

  // 计算属性
  const entitiesWithStats = computed(() => {
    return entities.value.map(entity => ({
      ...entity,
      attributeCount: entity.attributes?.length || 0,
      moduleCount: entity.bundles?.length || 0
    }))
  })

  // 初始化数据
  const initializeData = async () => {
    loading.value = true
    try {
      // 处理实体数据，确保每个实体和属性都有 _indexId
      const processedEntities = (entitiesData as any[]).map(entity => ({
        ...entity,
        _indexId: entity._indexId || nanoid(),
        _status: 'saved' as const,
        attributes: (entity.attributes || []).map((attr: any) => ({
          ...attr,
          _indexId: attr._indexId || nanoid(),
          _status: 'saved' as const
        }))
      }))

      // 处理模块数据
      const processedModules = (modulesData as any[]).map(module => ({
        ...module,
        _indexId: module._indexId || nanoid(),
        _status: 'saved' as const,
        attributes: (module.attributes || []).map((attr: any) => ({
          ...attr,
          _indexId: attr._indexId || nanoid(),
          _status: 'saved' as const
        }))
      }))

      entities.value = processedEntities
      modules.value = processedModules

      console.log('✅ 数据初始化完成:', {
        entities: entities.value.length,
        modules: modules.value.length
      })
    } catch (error) {
      console.error('❌ 数据初始化失败:', error)
    } finally {
      loading.value = false
    }
  }

  // 选择当前实体
  const selectEntity = (entityId: string) => {
    const entity = entities.value.find(e => e._indexId === entityId)
    if (entity) {
      currentEntity.value = { ...entity } // 创建副本用于编辑
      console.log('📝 选择实体:', entity.id)
    }
  }

  // 清除选择
  const clearSelection = () => {
    currentEntity.value = null
  }

  // 添加新实体
  const addEntity = () => {
    const newEntity: Entity = {
      _indexId: nanoid(),
      id: '',
      name: '',
      description: '',
      attributes: [],
      bundles: [],
      _status: 'new'
    }

    entities.value.unshift(newEntity)
    selectEntity(newEntity._indexId)
    console.log('➕ 添加新实体:', newEntity._indexId)
  }

  // 更新实体字段
  const updateEntityField = (field: keyof Entity, value: any) => {
    if (currentEntity.value) {
      (currentEntity.value as any)[field] = value
      currentEntity.value._status = 'modified'
      console.log('🔄 更新实体字段:', field, value)
    }
  }

  // 添加属性
  const addAttribute = () => {
    if (currentEntity.value) {
      const newAttribute: Attribute = {
        _indexId: nanoid(),
        id: '',
        name: '',
        type: 'string',
        description: '',
        _status: 'new'
      }

      currentEntity.value.attributes.push(newAttribute)
      currentEntity.value._status = 'modified'
      console.log('➕ 添加属性:', newAttribute._indexId)
    }
  }

  // 更新属性
  const updateAttribute = (attributeId: string, field: keyof Attribute, value: any) => {
    if (currentEntity.value) {
      const attribute = currentEntity.value.attributes.find(a => a._indexId === attributeId)
      if (attribute) {
        (attribute as any)[field] = value
        attribute._status = 'modified'
        currentEntity.value._status = 'modified'
        console.log('🔄 更新属性:', attributeId, field, value)
      }
    }
  }

  // 删除属性
  const removeAttribute = (attributeId: string) => {
    if (currentEntity.value) {
      const index = currentEntity.value.attributes.findIndex(a => a._indexId === attributeId)
      if (index > -1) {
        currentEntity.value.attributes.splice(index, 1)
        currentEntity.value._status = 'modified'
        console.log('🗑️ 删除属性:', attributeId)
      }
    }
  }

  // 保存实体
  const saveEntity = async () => {
    if (!currentEntity.value) return

    loading.value = true
    try {
      // 这里应该调用实际的API，现在先更新本地数据
      const index = entities.value.findIndex(e => e._indexId === currentEntity.value!._indexId)
      if (index > -1) {
        entities.value[index] = { ...currentEntity.value, _status: 'saved' }
      }

      currentEntity.value._status = 'saved'
      console.log('💾 保存实体成功:', currentEntity.value.id)
    } catch (error) {
      console.error('❌ 保存实体失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  // 撤销修改
  const revertEntity = () => {
    if (currentEntity.value) {
      const originalEntity = entities.value.find(e => e._indexId === currentEntity.value!._indexId)
      if (originalEntity) {
        currentEntity.value = { ...originalEntity }
        console.log('↩️ 撤销修改:', originalEntity.id)
      }
    }
  }

  // 删除实体
  const deleteEntity = async (entityId: string) => {
    loading.value = true
    try {
      const index = entities.value.findIndex(e => e._indexId === entityId)
      if (index > -1) {
        entities.value.splice(index, 1)
        if (currentEntity.value?._indexId === entityId) {
          clearSelection()
        }
        console.log('🗑️ 删除实体:', entityId)
      }
    } catch (error) {
      console.error('❌ 删除实体失败:', error)
      throw error
    } finally {
      loading.value = false
    }
  }

  return {
    // 状态
    entities,
    modules,
    loading,
    currentEntity,

    // 计算属性
    entitiesWithStats,

    // 方法
    initializeData,
    selectEntity,
    clearSelection,
    addEntity,
    updateEntityField,
    addAttribute,
    updateAttribute,
    removeAttribute,
    saveEntity,
    revertEntity,
    deleteEntity
  }
})
