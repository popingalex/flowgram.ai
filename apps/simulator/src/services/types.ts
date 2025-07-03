// 服务层类型定义
// 复用现有类型系统，只添加必要的API交互类型

import type {
  Indexed,
  Attribute,
  Module,
  Entity,
  Behavior,
  System,
  Scenario
} from '../types'

// 直接复用现有类型，不重新定义
export type {
  Indexed,
  Attribute,
  Module,
  Entity,
  Behavior,
  System,
  Scenario
}

// API响应包装器
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// 简单的请求选项
export interface RequestOptions {
  timeout?: number
  retries?: number
  headers?: Record<string, string>
}
