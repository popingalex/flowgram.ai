// HTTP方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

// 参数作用域类型
export type ParameterScope = 'header' | 'path' | 'query' | 'body'

// 参数类型
export interface ApiParameter {
  _indexId: string // nanoid索引
  id: string // 参数名
  name: string // 参数显示名称
  type: string // 参数类型
  scope: ParameterScope // 参数作用域
  required: boolean // 是否必填
  enabled?: boolean // 是否启用
  defaultValue?: any // 默认值
  description?: string // 描述
  enum?: string[] // 枚举值
}

// API项目类型
export interface ApiItem {
  _indexId: string // nanoid索引
  id: string // API ID
  name: string // API名称
  type: 'api' | 'group' // 类型：API或分组
  method?: HttpMethod // HTTP方法（仅API有）
  protocol?: 'http' | 'https' // 协议（仅API有）
  endpoint?: string // 端点地址（仅API有）
  url?: string // 路径（仅API有）
  body?: any // 请求体（仅API有）
  description?: string // 描述
  parameters?: ApiParameter[] // 参数列表（仅API有）
  parentId?: string // 父级ID（用于分组）
  children?: ApiItem[] // 子项目（用于分组）
  expanded?: boolean // 是否展开（用于树形显示）
  _status?: 'saved' | 'new' | 'dirty' | 'saving' // 状态
}

// API树节点类型
export interface ApiTreeNode {
  _indexId: string
  id: string
  name: string
  type: 'api' | 'group'
  method?: HttpMethod
  children?: ApiTreeNode[]
  expanded?: boolean
  parentId?: string
}

// API测试结果类型
export interface ApiTestResult {
  success: boolean
  status?: number
  statusText?: string
  data?: any
  error?: string
  duration: number // 耗时（毫秒）
  timestamp: number // 时间戳
}

// API历史记录类型
export interface ApiHistory {
  _indexId: string
  apiId: string
  timestamp: number
  parameters: Record<string, any>
  result: ApiTestResult
}
