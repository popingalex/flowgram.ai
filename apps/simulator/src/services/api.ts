import type { Entity, Module, System, ApiResponse } from './types'
import { apiService } from './api-service'

// API基础配置
const API_BASE_URL = 'http://localhost:8080/api'

// 通用HTTP请求函数
async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  return response.json()
}

// 实体API - 直接使用现有的apiService
export const entityApi = {
  // 获取所有实体
  async getAll(): Promise<ApiResponse<Entity[]>> {
    return apiService.getEntities()
  },

  // 根据ID获取实体
  async getById(id: string): Promise<ApiResponse<Entity>> {
    const response = await apiService.getEntities()
    if (response.success && response.data) {
      const entity = response.data.find(e => e._indexId === id)
      if (entity) {
        return { success: true, data: entity }
      }
    }
    return { success: false, error: `Entity with id ${id} not found` }
  },

  // 创建实体
  async create(entity: Omit<Entity, '_indexId'>): Promise<ApiResponse<Entity>> {
    return apiService.createEntity(entity)
  },

  // 更新实体
  async update(id: string, entity: Partial<Entity>): Promise<ApiResponse<Entity>> {
    return apiService.updateEntity(id, entity)
  },

  // 删除实体
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiService.deleteEntity(id)
  },
}

// 模块API - 直接使用现有的apiService
export const moduleApi = {
  // 获取所有模块
  async getAll(): Promise<ApiResponse<Module[]>> {
    return apiService.getModules()
  },

  // 根据ID获取模块
  async getById(id: string): Promise<ApiResponse<Module>> {
    const response = await apiService.getModules()
    if (response.success && response.data) {
      const module = response.data.find(m => m._indexId === id)
      if (module) {
        return { success: true, data: module }
      }
    }
    return { success: false, error: `Module with id ${id} not found` }
  },

  // 创建模块
  async create(module: Omit<Module, '_indexId'>): Promise<ApiResponse<Module>> {
    return apiService.createModule(module)
  },

  // 更新模块
  async update(id: string, module: Partial<Module>): Promise<ApiResponse<Module>> {
    return apiService.updateModule(id, module)
  },

  // 删除模块
  async delete(id: string): Promise<ApiResponse<void>> {
    return apiService.deleteModule(id)
  },
}

// 系统API - 使用现有的系统API
export const systemApi = {
  // 获取所有系统
  async getAll(): Promise<ApiResponse<System[]>> {
    return apiService.getSystems()
  },

  // 根据ID获取系统
  async getById(id: string): Promise<ApiResponse<System>> {
    const response = await apiService.getSystems()
    if (response.success && response.data) {
      const system = response.data.find((s: System) => s._indexId === id)
      if (system) {
        return { success: true, data: system }
      }
    }
    return { success: false, error: `System with id ${id} not found` }
  },

  // 创建系统（暂时不支持）
  async create(system: Omit<System, '_indexId'>): Promise<ApiResponse<System>> {
    return { success: false, error: 'System creation not implemented yet' }
  },

  // 更新系统（暂时不支持）
  async update(id: string, system: Partial<System>): Promise<ApiResponse<System>> {
    return { success: false, error: 'System update not implemented yet' }
  },

  // 删除系统（暂时不支持）
  async delete(id: string): Promise<ApiResponse<void>> {
    return { success: false, error: 'System deletion not implemented yet' }
  },
}

// 行为API - 暂时使用简单的mock实现
export const behaviorApi = {
  // 获取远程行为
  async getRemoteBehaviors(): Promise<ApiResponse<any[]>> {
    return { success: true, data: [] }
  },

  // 获取本地行为
  async getLocalBehaviors(): Promise<ApiResponse<any[]>> {
    return { success: true, data: [] }
  },

  // 获取脚本行为
  async getScriptBehaviors(): Promise<ApiResponse<any[]>> {
    return { success: true, data: [] }
  },

  // 创建远程行为
  async createRemoteBehavior(behavior: any): Promise<ApiResponse<any>> {
    return { success: false, error: 'Remote behavior creation not implemented yet' }
  },

  // 创建本地行为
  async createLocalBehavior(behavior: any): Promise<ApiResponse<any>> {
    return { success: false, error: 'Local behavior creation not implemented yet' }
  },

  // 创建脚本行为
  async createScriptBehavior(behavior: any): Promise<ApiResponse<any>> {
    return { success: false, error: 'Script behavior creation not implemented yet' }
  },
}
