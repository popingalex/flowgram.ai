import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { nanoid } from 'nanoid'
import type { ApiItem, ApiTestResult } from '../types/api'

export const useApiStore = defineStore('api', () => {
  // 状态
  const apis = ref<ApiItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 计算属性
  const apiTree = computed(() => {
    const rootItems: ApiItem[] = []
    const itemMap = new Map<string, ApiItem>()

    apis.value.forEach((api: ApiItem) => {
      itemMap.set(api._indexId, { ...api, children: [] })
    })

    apis.value.forEach((api: ApiItem) => {
      const item = itemMap.get(api._indexId)!
      if (api.parentId) {
        const parent = itemMap.get(api.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(item)
        } else {
          rootItems.push(item)
        }
      } else {
        rootItems.push(item)
      }
    })

    return rootItems
  })

  // 方法
  const addApi = (parentId?: string) => {
    const newApi: ApiItem = {
      _indexId: nanoid(),
      id: `api_${Date.now()}`,
      name: '新建 API',
      type: 'api',
      method: 'GET',
      protocol: 'https',
      endpoint: '',
      url: '',
      description: '',
      parameters: [],
      parentId,
      _status: 'new'
    }

    apis.value.push(newApi)
    return newApi
  }

  const addGroup = (parentId?: string) => {
    const newGroup: ApiItem = {
      _indexId: nanoid(),
      id: `group_${Date.now()}`,
      name: '新建分组',
      type: 'group',
      description: '',
      parentId,
      children: [],
      expanded: true,
      _status: 'new'
    }

    apis.value.push(newGroup)
    return newGroup
  }

  const updateApi = (apiId: string, updates: Partial<ApiItem>) => {
    const index = apis.value.findIndex((a: ApiItem) => a._indexId === apiId)
    if (index !== -1) {
      apis.value[index] = { ...apis.value[index], ...updates, _status: 'dirty' }
    }
  }

  const deleteItem = (id: string) => {
    const index = apis.value.findIndex((api: ApiItem) => api._indexId === id)
    if (index !== -1) {
      apis.value.splice(index, 1)
    }
  }

  const saveApi = async (api: ApiItem) => {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 500))

    const index = apis.value.findIndex((a: ApiItem) => a._indexId === api._indexId)
    if (index !== -1) {
      apis.value[index] = { ...api, _status: 'saved' }
    }
    loading.value = false
  }

  const testApi = async (_api: ApiItem) => {
    loading.value = true
    await new Promise(resolve => setTimeout(resolve, 1000))
    loading.value = false

    return {
      success: true,
      status: 200,
      data: { message: 'Test successful' },
      duration: 1000,
      timestamp: Date.now()
    } as ApiTestResult
  }

  return {
    apis,
    loading,
    error,
    apiTree,
    addApi,
    addGroup,
    updateApi,
    deleteItem,
    saveApi,
    testApi
  }
})
