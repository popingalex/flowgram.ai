// 服务层统一导出
// 提供所有API服务和配置的统一入口

// 导出配置
export { API_CONFIG, buildApiUrl, getApiInfo, validateApiConfig } from '../config/api'

// 导出类型
export * from './types'

// 导出API服务
export * from './api-service'

// 导出mock数据（避免重复导出）
export {
  MOCK_MODULES,
  MOCK_ENTITIES,
  MOCK_SYSTEMS,
  MOCK_SCENARIOS,
  getDataStats,
  findModule,
  findEntity,
  findSystem,
  findScenario,
  findEntitiesByModule,
  findModulesBySystem,
  getScenarioDetails
} from '../mock-data'
