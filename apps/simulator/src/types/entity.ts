// 重新导出现有类型系统的类型
export type {
  Entity,
  Module,
  Attribute,
  System,
  Scenario,
  Behavior,
  Indexed
} from './index'

export type {
  ApiResponse
} from '../services/types'

// 分页响应接口
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}
