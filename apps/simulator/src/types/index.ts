// 导入完整的类型系统
export * from './typed'
export * from './type-converter'
import type { Typed } from './typed'
import { nanoid } from 'nanoid'

// 基础索引接口
export interface Indexed {
  _indexId: string
}

// 属性（带类型和值，需要索引）
export interface Attribute extends Indexed {
  id?: string // 原始ID
  name: string
  type: Typed | string // 支持字符串类型（简化版）
  value: any
  description?: string
  required?: boolean // 是否必需
}

// 模块（可复用的属性和行为组合）
export interface Module extends Indexed {
  id?: string // 原始ID，用于URL路由
  name: string
  description?: string
  attributes: Attribute[]
  behaviors: Behavior[]
}

// 实体（带模块的实体，统一了实体和模块结构）
export interface Entity extends Indexed {
  id?: string // 原始ID，用于URL路由
  name: string
  description?: string
  modules: string[] // 关联的模块ID
  // 实体不再支持属性，只有模块可以有属性
  _status?: 'new' | 'editing' | 'saved' // 编辑状态
}

// 行为（三种类型：远程、内置、脚本）
export interface Behavior extends Indexed {
  name: string
  type: 'remote' | 'builtin' | 'script'
  description?: string
  config: any // 行为配置，根据类型不同而不同
}

// 系统（与模块关联，包含行为）
export interface System extends Indexed {
  name: string
  description?: string
  moduleIds: string[] // 关联的模块ID
  behaviors: Behavior[]
}

// 场景（完整的仿真场景定义）
export interface Scenario extends Indexed {
  name: string
  description?: string
  entities: Entity[]
  modules: Module[]
  systems: System[]
  metadata?: Record<string, any>
}

// 工具类 - 使用导入的类型转换器
export class AttributeUtils {
  static createAttribute(name: string, type: Typed, value: any): Attribute {
    return {
      _indexId: nanoid(),
      name,
      type,
      value
    }
  }

  static validateValue(attribute: Attribute): boolean {
    // 基础验证逻辑 - 复杂验证由 TypeConverter 处理
    return attribute.value !== undefined && attribute.value !== null
  }
}

export class EntityUtils {
  static createEntity(name: string, description?: string): Entity {
    return {
      _indexId: nanoid(),
      name,
      description,
      modules: []
    }
  }

  static addModule(entity: Entity, moduleId: string): Entity {
    if (!entity.modules.includes(moduleId)) {
      entity.modules.push(moduleId)
    }
    return entity
  }

  static removeModule(entity: Entity, moduleId: string): Entity {
    entity.modules = entity.modules.filter(id => id !== moduleId)
    return entity
  }
}

export class ModuleUtils {
  static createModule(name: string, description?: string): Module {
    return {
      _indexId: nanoid(),
      name,
      description,
      attributes: [],
      behaviors: []
    }
  }
}

export class BehaviorUtils {
  static createBehavior(name: string, type: 'remote' | 'builtin' | 'script', config: any = {}): Behavior {
    return {
      _indexId: nanoid(),
      name,
      type,
      config
    }
  }
}

export class SystemUtils {
  static createSystem(name: string, description?: string): System {
    return {
      _indexId: nanoid(),
      name,
      description,
      moduleIds: [],
      behaviors: []
    }
  }
}

export class ScenarioUtils {
  static createScenario(name: string, description?: string): Scenario {
    return {
      _indexId: nanoid(),
      name,
      description,
      entities: [],
      modules: [],
      systems: []
    }
  }
}
