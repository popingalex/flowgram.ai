import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Entity, Module, System, Behavior, Attribute, Scenario } from '@/types'

export const useSimulationStore = defineStore('simulation', () => {
  // 状态
  const entities = ref<Entity[]>([])
  const modules = ref<Module[]>([])
  const systems = ref<System[]>([])
  const scenarios = ref<Scenario[]>([])

  // 计算属性
  const entityCount = computed(() => entities.value.length)
  const moduleCount = computed(() => modules.value.length)
  const systemCount = computed(() => systems.value.length)

  // 实体管理
  const addEntity = (entity: Entity) => {
    entities.value.push(entity)
  }

  const updateEntity = (id: string, updates: Partial<Entity>) => {
    const index = entities.value.findIndex(e => e._indexId === id)
    if (index !== -1) {
      entities.value[index] = { ...entities.value[index], ...updates }
    }
  }

  const removeEntity = (id: string) => {
    entities.value = entities.value.filter(e => e._indexId !== id)
  }

  const getEntity = (id: string) => {
    return entities.value.find(e => e._indexId === id)
  }

  // 模块管理
  const addModule = (module: Module) => {
    modules.value.push(module)
  }

  const updateModule = (id: string, updates: Partial<Module>) => {
    const index = modules.value.findIndex(m => m._indexId === id)
    if (index !== -1) {
      modules.value[index] = { ...modules.value[index], ...updates }
    }
  }

  const removeModule = (id: string) => {
    modules.value = modules.value.filter(m => m._indexId !== id)
  }

  const getModule = (id: string) => {
    return modules.value.find(m => m._indexId === id)
  }

  // 系统管理
  const addSystem = (system: System) => {
    systems.value.push(system)
  }

  const updateSystem = (id: string, updates: Partial<System>) => {
    const index = systems.value.findIndex(s => s._indexId === id)
    if (index !== -1) {
      systems.value[index] = { ...systems.value[index], ...updates }
    }
  }

  const removeSystem = (id: string) => {
    systems.value = systems.value.filter(s => s._indexId !== id)
  }

  const getSystem = (id: string) => {
    return systems.value.find(s => s._indexId === id)
  }

  // 场景管理
  const addScenario = (scenario: Scenario) => {
    scenarios.value.push(scenario)
  }

  const updateScenario = (id: string, updates: Partial<Scenario>) => {
    const index = scenarios.value.findIndex(s => s._indexId === id)
    if (index !== -1) {
      scenarios.value[index] = { ...scenarios.value[index], ...updates }
    }
  }

  const removeScenario = (id: string) => {
    scenarios.value = scenarios.value.filter(s => s._indexId !== id)
  }

  const getScenario = (id: string) => {
    return scenarios.value.find(s => s._indexId === id)
  }

  // 业务逻辑方法
  const addModuleToEntity = (entityId: string, moduleId: string) => {
    const entity = getEntity(entityId)
    if (entity && !entity.modules.includes(moduleId)) {
      entity.modules.push(moduleId)
    }
  }

  const removeModuleFromEntity = (entityId: string, moduleId: string) => {
    const entity = getEntity(entityId)
    if (entity) {
      entity.modules = entity.modules.filter(id => id !== moduleId)
    }
  }

  // 实体不再支持属性，移除属性相关方法

  // JSON 序列化/反序列化
  const exportToJSON = () => {
    return {
      entities: entities.value,
      modules: modules.value,
      systems: systems.value,
      scenarios: scenarios.value
    }
  }

  const importFromJSON = (data: any) => {
    if (data.entities) entities.value = data.entities
    if (data.modules) modules.value = data.modules
    if (data.systems) systems.value = data.systems
    if (data.scenarios) scenarios.value = data.scenarios
  }

  // 数据校验
  const validateEntity = (entity: Entity): boolean => {
    return !!(entity._indexId && entity.name)
  }

  const validateModule = (module: Module): boolean => {
    return !!(module._indexId && module.name)
  }

  const validateSystem = (system: System): boolean => {
    return !!(system._indexId && system.name)
  }

  // 清理数据
  const clearAll = () => {
    entities.value = []
    modules.value = []
    systems.value = []
    scenarios.value = []
  }

  return {
    // 状态
    entities,
    modules,
    systems,
    scenarios,

    // 计算属性
    entityCount,
    moduleCount,
    systemCount,

    // 实体管理
    addEntity,
    updateEntity,
    removeEntity,
    getEntity,

    // 模块管理
    addModule,
    updateModule,
    removeModule,
    getModule,

    // 系统管理
    addSystem,
    updateSystem,
    removeSystem,
    getSystem,

    // 场景管理
    addScenario,
    updateScenario,
    removeScenario,
    getScenario,

    // 业务逻辑
    addModuleToEntity,
    removeModuleFromEntity,

    // 数据管理
    exportToJSON,
    importFromJSON,
    validateEntity,
    validateModule,
    validateSystem,
    clearAll
  }
})
