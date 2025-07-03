// 统一数据管理器 - 唯一的数据源目录
// 所有数据都从真实后端API获取，用于开发和测试

import type {
  Module,
  Entity,
  System,
  Scenario
} from '../services/types'

// 导入所有数据文件
import modulesData from './modules.json'
import entitiesData from './entities.json'
import systemsData from './systems.json'
import scenariosData from './scenarios.json'

// 导出统一的数据接口
export const MOCK_MODULES = modulesData as unknown as Module[]
export const MOCK_ENTITIES = entitiesData as unknown as Entity[]
export const MOCK_SYSTEMS = systemsData as unknown as System[]
export const MOCK_SCENARIOS = scenariosData as any[] // 暂时使用any，因为JSON中存储的是ID而不是完整对象

// 数据统计和元信息
export const getDataStats = () => ({
  modules: MOCK_MODULES.length,
  entities: MOCK_ENTITIES.length,
  systems: MOCK_SYSTEMS.length,
  scenarios: MOCK_SCENARIOS.length,
  lastUpdated: new Date().toISOString(),
  dataSource: 'simulator-mock-data',
})

// 便捷查询函数
export const findModule = (id: string) =>
  MOCK_MODULES.find((module) => module._indexId === id || (module as any).id === id)

export const findEntity = (id: string) =>
  MOCK_ENTITIES.find((entity) => entity._indexId === id || (entity as any).id === id)

export const findSystem = (id: string) =>
  MOCK_SYSTEMS.find((system) => system._indexId === id || (system as any).id === id)

export const findScenario = (id: string) =>
  MOCK_SCENARIOS.find((scenario) => scenario._indexId === id || (scenario as any).id === id)

// 根据模块ID查找相关实体
export const findEntitiesByModule = (moduleId: string) =>
  MOCK_ENTITIES.filter((entity) =>
    entity.modules.includes(moduleId)
  )

// 根据系统ID查找相关模块
export const findModulesBySystem = (systemId: string) => {
  const system = findSystem(systemId)
  if (!system) return []

  return system.moduleIds
    .map((moduleId: string) => findModule(moduleId))
    .filter(Boolean) as Module[]
}

// 获取场景的完整信息（包含关联的实体、模块、系统）
export const getScenarioDetails = (scenarioId: string) => {
  const scenario = findScenario(scenarioId)
  if (!scenario) return null

  return {
    ...scenario,
    entitiesDetails: scenario.entities
      .map((entityId: string) => findEntity(entityId))
      .filter(Boolean),
    modulesDetails: scenario.modules
      .map((moduleId: string) => findModule(moduleId))
      .filter(Boolean),
    systemsDetails: scenario.systems
      .map((systemId: string) => findSystem(systemId))
      .filter(Boolean),
  }
}

// 重置数据到初始状态
export const resetMockData = () => {
  console.log('Mock数据已重置到初始状态')
  return {
    modules: MOCK_MODULES.length,
    entities: MOCK_ENTITIES.length,
    systems: MOCK_SYSTEMS.length,
    scenarios: MOCK_SCENARIOS.length,
  }
}
