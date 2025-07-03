// API配置文件
// 统一管理API相关配置，支持环境变量覆盖

export interface ApiConfig {
  BASE_URL: string
  ENDPOINTS: {
    // 基础数据
    MODULE: string
    ENTITY: string
    SYSTEM: string
    SCENARIO: string
    BEHAVIOR: string

    // 类型相关
    TYPED: string
    TYPE_CONVERTER: string

    // 运行时
    SIMULATION: string
    EXECUTION: string
  }
  TIMEOUT: number
  RETRY_COUNT: number
  RETRY_DELAY: number
}

// 默认配置
const DEFAULT_CONFIG: ApiConfig = {
  BASE_URL: 'http://localhost:8080',
  ENDPOINTS: {
    // 基础数据 - 使用8080端口的正确端点
    MODULE: '/api/modular/modules',
    ENTITY: '/api/modular/entities',
    SYSTEM: '/api/systems',
    SCENARIO: '/api/scenarios',
    BEHAVIOR: '/api/behaviors',

    // 类型相关
    TYPED: '/api/types',
    TYPE_CONVERTER: '/api/type-converter',

    // 运行时
    SIMULATION: '/api/simulation',
    EXECUTION: '/api/execution',
  },
  TIMEOUT: 5000, // 5秒超时
  RETRY_COUNT: 3, // 重试3次
  RETRY_DELAY: 1000, // 重试间隔1秒
}

// 从环境变量读取配置
const getConfigFromEnv = (): Partial<ApiConfig> => {
  const config: Partial<ApiConfig> = {}

  // 从环境变量读取基础URL
  if (import.meta.env.VITE_API_BASE_URL) {
    config.BASE_URL = import.meta.env.VITE_API_BASE_URL
  }

  // 从环境变量读取超时配置
  if (import.meta.env.VITE_API_TIMEOUT) {
    config.TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT)
  }

  // 从环境变量读取重试配置
  if (import.meta.env.VITE_API_RETRY_COUNT) {
    config.RETRY_COUNT = parseInt(import.meta.env.VITE_API_RETRY_COUNT)
  }

  if (import.meta.env.VITE_API_RETRY_DELAY) {
    config.RETRY_DELAY = parseInt(import.meta.env.VITE_API_RETRY_DELAY)
  }

  return config
}

// 合并配置
export const API_CONFIG: ApiConfig = {
  ...DEFAULT_CONFIG,
  ...getConfigFromEnv(),
}

// 构建完整的API URL
export const buildApiUrl = (endpoint: string): string => {
  return `${API_CONFIG.BASE_URL}${endpoint}`
}

// 获取当前配置信息
export const getApiInfo = () => ({
  baseUrl: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  retryCount: API_CONFIG.RETRY_COUNT,
  retryDelay: API_CONFIG.RETRY_DELAY,
  endpoints: Object.keys(API_CONFIG.ENDPOINTS).length,
})

// 验证配置是否有效
export const validateApiConfig = (): boolean => {
  try {
    new URL(API_CONFIG.BASE_URL)
    return true
  } catch {
    console.error('Invalid API base URL:', API_CONFIG.BASE_URL)
    return false
  }
}
