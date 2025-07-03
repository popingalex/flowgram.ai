import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { System } from '../types/entity'
import { systemApi } from '../services/api'

export const useSystemStore = defineStore('system', () => {
  // 状态
  const systems = ref<System[]>([])
  const loading = ref(false)

  // 计算属性
  const systemMap = computed(() => {
    const map = new Map<string, System>()
    systems.value.forEach(system => {
      map.set(system._indexId, system)
    })
    return map
  })

  // 获取系统列表
  const fetchSystems = async () => {
    loading.value = true
    try {
      const response = await systemApi.getAll()
      systems.value = response.data || []
    } catch (error) {
      console.error('获取系统列表失败:', error)
      systems.value = []
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取系统
  const getSystemById = (id: string): System | undefined => {
    return systemMap.value.get(id)
  }

  // 创建系统
  const createSystem = async (system: Omit<System, '_indexId'>) => {
    try {
      const response = await systemApi.create(system)
      if (response.data) {
        systems.value.push(response.data)
      }
      return response.data
    } catch (error) {
      console.error('创建系统失败:', error)
      throw error
    }
  }

  // 更新系统
  const updateSystem = async (id: string, updates: Partial<System>) => {
    try {
      const response = await systemApi.update(id, updates)
      const index = systems.value.findIndex(s => s._indexId === id)
      if (index !== -1 && response.data) {
        systems.value[index] = response.data
      }
      return response.data
    } catch (error) {
      console.error('更新系统失败:', error)
      throw error
    }
  }

  // 删除系统
  const deleteSystem = async (id: string) => {
    try {
      await systemApi.delete(id)
      systems.value = systems.value.filter(s => s._indexId !== id)
    } catch (error) {
      console.error('删除系统失败:', error)
      throw error
    }
  }

  return {
    // 状态
    systems,
    loading,

    // 计算属性
    systemMap,

    // 方法
    fetchSystems,
    getSystemById,
    createSystem,
    updateSystem,
    deleteSystem
  }
})
