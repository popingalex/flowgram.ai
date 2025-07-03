import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Module } from '../types/entity'
import { moduleApi } from '../services/api'

export const useModuleStore = defineStore('module', () => {
  // 状态
  const modules = ref<Module[]>([])
  const loading = ref(false)

  // 计算属性
  const moduleMap = computed(() => {
    const map = new Map<string, Module>()
    modules.value.forEach(module => {
      if (module.id) {
        map.set(module.id, module)
      }
    })
    return map
  })

  // 获取模块列表
  const fetchModules = async () => {
    loading.value = true
    try {
      const response = await moduleApi.getAll()
      modules.value = response.data || []
    } catch (error) {
      console.error('获取模块列表失败:', error)
      modules.value = []
    } finally {
      loading.value = false
    }
  }

  // 根据ID获取模块
  const getModuleById = (id: string): Module | undefined => {
    return moduleMap.value.get(id)
  }

  // 创建模块
  const createModule = async (module: Omit<Module, 'id'>) => {
    try {
      const response = await moduleApi.create(module)
      if (response.data) {
        modules.value.push(response.data)
      }
      return response.data
    } catch (error) {
      console.error('创建模块失败:', error)
      throw error
    }
  }

  // 更新模块
  const updateModule = async (id: string, updates: Partial<Module>) => {
    try {
      const response = await moduleApi.update(id, updates)
      const index = modules.value.findIndex(m => m.id === id)
      if (index !== -1 && response.data) {
        modules.value[index] = response.data
      }
      return response.data
    } catch (error) {
      console.error('更新模块失败:', error)
      throw error
    }
  }

  // 删除模块
  const deleteModule = async (id: string) => {
    try {
      await moduleApi.delete(id)
      modules.value = modules.value.filter(m => m.id !== id)
    } catch (error) {
      console.error('删除模块失败:', error)
      throw error
    }
  }

  return {
    // 状态
    modules,
    loading,

    // 计算属性
    moduleMap,

    // 方法
    fetchModules,
    getModuleById,
    createModule,
    updateModule,
    deleteModule
  }
})
