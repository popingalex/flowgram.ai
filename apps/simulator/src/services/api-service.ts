// API服务 - 简化版本
// 提供基本的API调用和mock数据降级功能

import { nanoid } from 'nanoid'
import { API_CONFIG, buildApiUrl } from '../config/api'
import { MOCK_MODULES, MOCK_ENTITIES, MOCK_SYSTEMS, MOCK_SCENARIOS } from '../mock-data'
import type { ApiResponse, RequestOptions, Module, Entity, System, Scenario } from './types'

class ApiService {
  private useMockMode = false  // 改为false，优先使用真实API请求

  // 基础HTTP请求方法
  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { timeout = API_CONFIG.TIMEOUT, retries = API_CONFIG.RETRY_COUNT, headers, ...fetchOptions } = options

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(buildApiUrl(endpoint), {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        success: true,
        data,
      }
    } catch (error) {
      clearTimeout(timeoutId)
      console.warn(`API请求失败: ${endpoint}`, error)

      // 自动降级到mock数据
      if (!this.useMockMode) {
        console.log('自动切换到mock模式')
        return this.handleMockFallback<T>(endpoint, fetchOptions.method || 'GET')
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : '请求失败',
      }
    }
  }

  // Mock数据降级处理
  private handleMockFallback<T>(endpoint: string, method: string): ApiResponse<T> {
    try {
      if (method === 'GET') {
        if (endpoint.includes('/modular/modules')) {
          // 转换mock模块数据
          const modules = MOCK_MODULES.map((module: any) => ({
            ...module,
            _indexId: module.id || module._indexId,
            attributes: module.attributes || [],
            behaviors: module.behaviors || []
          }))
          return { success: true, data: modules as T }
        }
        if (endpoint.includes('/modular/entities')) {
          // 转换mock实体数据
          const entities = MOCK_ENTITIES.map((entity: any) => ({
            ...entity,
            _indexId: entity.id || entity._indexId,
            attributes: entity.attributes || [],
            modules: entity.modules || []
          }))
          return { success: true, data: entities as T }
        }
                if (endpoint.includes('/systems')) {
          // 转换mock系统数据
          const systems = MOCK_SYSTEMS.map((system: any) => {
            // 从participants中提取components作为moduleIds
            const moduleIds: string[] = []
            if (system.participants && Array.isArray(system.participants)) {
              system.participants.forEach((participant: any) => {
                if (participant.components && Array.isArray(participant.components)) {
                  moduleIds.push(...participant.components)
                }
              })
            }

            console.log(`系统 ${system.id} 转换:`, {
              原始participants: system.participants,
              提取的moduleIds: moduleIds
            })

            return {
              ...system,
              _indexId: system.id || system._indexId,
              moduleIds: [...new Set(moduleIds)], // 去重
              behaviors: system.behaviors || []
            }
          })
          return { success: true, data: systems as T }
        }
        if (endpoint.includes('/scenarios')) {
          return { success: true, data: MOCK_SCENARIOS as T }
        }
      }

      return {
        success: false,
        error: '未找到对应的mock数据',
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mock数据处理失败',
      }
    }
  }

  // 模块相关API
  async getModules(): Promise<ApiResponse<Module[]>> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.MODULE)
    if (response.success && response.data) {
      // 转换API数据格式：id -> _indexId
      response.data = response.data.map((module: any) => ({
        ...module,
        _indexId: module.id || module._indexId,
        attributes: module.attributes || [],
        behaviors: module.behaviors || []
      }))
    }
    return response as ApiResponse<Module[]>
  }

  async getModule(id: string): Promise<ApiResponse<Module>> {
    return this.request<Module>(`${API_CONFIG.ENDPOINTS.MODULE}/${id}`)
  }

  async createModule(module: Omit<Module, '_indexId'>): Promise<ApiResponse<Module>> {
    const newModule = { ...module, _indexId: nanoid() }
    return this.request<Module>(API_CONFIG.ENDPOINTS.MODULE, {
      method: 'POST',
      body: JSON.stringify(newModule),
    })
  }

  async updateModule(id: string, module: Partial<Module>): Promise<ApiResponse<Module>> {
    return this.request<Module>(`${API_CONFIG.ENDPOINTS.MODULE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(module),
    })
  }

  async deleteModule(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${API_CONFIG.ENDPOINTS.MODULE}/${id}`, {
      method: 'DELETE',
    })
  }

  // 实体相关API
  async getEntities(): Promise<ApiResponse<Entity[]>> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.ENTITY)
    if (response.success && response.data) {
      // 转换API数据格式：id -> _indexId
      response.data = response.data.map((entity: any) => ({
        ...entity,
        _indexId: entity.id || entity._indexId,
        attributes: entity.attributes || [],
        modules: entity.modules || []
      }))
    }
    return response as ApiResponse<Entity[]>
  }

  async getEntity(id: string): Promise<ApiResponse<Entity>> {
    return this.request<Entity>(`${API_CONFIG.ENDPOINTS.ENTITY}/${id}`)
  }

  async createEntity(entity: Omit<Entity, '_indexId'>): Promise<ApiResponse<Entity>> {
    const newEntity = { ...entity, _indexId: nanoid() }
    return this.request<Entity>(API_CONFIG.ENDPOINTS.ENTITY, {
      method: 'POST',
      body: JSON.stringify(newEntity),
    })
  }

  async updateEntity(id: string, entity: Partial<Entity>): Promise<ApiResponse<Entity>> {
    return this.request<Entity>(`${API_CONFIG.ENDPOINTS.ENTITY}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(entity),
    })
  }

  async deleteEntity(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`${API_CONFIG.ENDPOINTS.ENTITY}/${id}`, {
      method: 'DELETE',
    })
  }

  // 系统相关API
  async getSystems(): Promise<ApiResponse<System[]>> {
    const response = await this.request<any[]>(API_CONFIG.ENDPOINTS.SYSTEM)
    if (response.success && response.data) {
      // 转换API数据格式：id -> _indexId
      response.data = response.data.map((system: any) => {
        // 从participants中提取components作为moduleIds
        const moduleIds: string[] = []
        if (system.participants && Array.isArray(system.participants)) {
          system.participants.forEach((participant: any) => {
            if (participant.components && Array.isArray(participant.components)) {
              moduleIds.push(...participant.components)
            }
          })
        }

        return {
          ...system,
          _indexId: system.id || system._indexId,
          moduleIds: [...new Set(moduleIds)], // 去重，如果没有participants则使用原有的moduleIds
          behaviors: system.behaviors || []
        }
      })
    }
    return response as ApiResponse<System[]>
  }

  async getSystem(id: string): Promise<ApiResponse<System>> {
    return this.request<System>(`${API_CONFIG.ENDPOINTS.SYSTEM}/${id}`)
  }

  // 场景相关API
  async getScenarios(): Promise<ApiResponse<Scenario[]>> {
    return this.request<Scenario[]>(API_CONFIG.ENDPOINTS.SCENARIO)
  }

  async getScenario(id: string): Promise<ApiResponse<Scenario>> {
    return this.request<Scenario>(`${API_CONFIG.ENDPOINTS.SCENARIO}/${id}`)
  }

  // 模式切换
  toggleMockMode(): boolean {
    this.useMockMode = !this.useMockMode
    console.log(`API模式切换: ${this.useMockMode ? 'Mock' : 'Real'}`)
    return this.useMockMode
  }

  getApiMode(): 'mock' | 'real' {
    return this.useMockMode ? 'mock' : 'real'
  }
}

export const apiService = new ApiService()
export default apiService
