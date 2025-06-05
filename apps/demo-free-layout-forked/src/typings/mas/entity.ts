import { IJsonSchema as JsonSchema } from '@flowgram.ai/form-materials';

import { Typed as TypedDefinition, TypedParser } from './typed';
import { SimulationEntityConverter } from './type-converter';
import { Attribute } from './attribute';

/**
 * 实体属性数据类型定义（用于和Java后端对应）
 */
export interface EntityPropertyType {
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'unknown';
  /** 属性描述 */
  description?: string;
  /** 默认值 */
  default?: any;
  /** 是否必需 */
  required?: boolean;
  /** 枚举值（用于选择类型） */
  enum?: any[];
  /** 数组元素类型 */
  items?: EntityPropertyType;
  /** 对象属性定义 */
  properties?: Record<string, EntityPropertyType>;
  /** 新增：仿真平台类型定义 */
  typed?: TypedDefinition;
}

/**
 * 实体完整定义
 */
export interface EntityDefinition {
  /** 实体唯一标识 */
  id: string;
  /** 实体名称 */
  name: string;
  /** 实体版本 */
  version: string;
  /** 实体标签 */
  tags: string[];
  /** 实体描述 */
  description: string;
  /** 实体属性定义 */
  properties: Record<string, EntityPropertyType>;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
  /** 新增：仿真平台属性定义 */
  simulationAttributes?: Attribute[];
  /** 新增：引用的模块列表 */
  bundles?: string[];
}

/**
 * 工作流展示用的实体数据
 */
export interface WorkflowEntityData {
  /** 实体ID */
  entityId: string;
  /** 显示名称 */
  displayName: string;
  /** 简要描述 */
  summary?: string;
  /** 标签 */
  tags: string[];
  /** 版本 */
  version: string;
  /** 属性值 */
  propertyValues?: Record<string, any>;
}

/**
 * 实体定义到工作流数据的转换器
 */
export class EntityTransformer {
  static toWorkflowData(
    entity: EntityDefinition,
    propertyValues?: Record<string, any>
  ): WorkflowEntityData {
    return {
      entityId: entity.id,
      displayName: entity.name,
      summary: entity.description,
      tags: entity.tags,
      version: entity.version,
      propertyValues: propertyValues || this.getDefaultPropertyValues(entity),
    };
  }

  static getDefaultPropertyValues(entity: EntityDefinition): Record<string, any> {
    const values: Record<string, any> = {};

    // 优先从properties获取默认值
    Object.entries(entity.properties).forEach(([key, propDef]) => {
      if (propDef.default !== undefined) {
        values[key] = propDef.default;
      }
    });

    // 从仿真属性获取默认值
    if (entity.simulationAttributes) {
      entity.simulationAttributes.forEach((attr) => {
        if (attr.value !== undefined && values[attr.id] === undefined) {
          values[attr.id] = attr.value;
        } else if (values[attr.id] === undefined) {
          // 使用类型系统创建默认值
          values[attr.id] = TypedParser.createDefaultValue(attr.type);
        }
      });
    }

    return values;
  }

  /**
   * 从仿真实体创建工作流数据
   */
  static fromSimulationEntity(simulation: SimulationEntity): WorkflowEntityData {
    const entity = SimulationEntityConverter.simulationToEntity(simulation);
    return this.toWorkflowData(entity);
  }

  /**
   * 从类型字符串数组创建实体定义
   */
  static createFromTypeStrings(id: string, name: string, typeStrings: string[]): EntityDefinition {
    return SimulationEntityConverter.createEntityFromTypeStrings(id, name, typeStrings);
  }
}

/**
 * 默认实体定义
 */
export const defaultEntityDefinition: EntityDefinition = {
  id: '',
  name: '新实体',
  version: '1.0.0',
  tags: [],
  description: '',
  properties: {},
  simulationAttributes: [],
  bundles: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * 导出所有类型和工具
 */
export { SimulationTypeConverter, SimulationEntityConverter } from './type-converter';

/**
 * 实体属性到工作流输出转换器
 *
 * 根据用户要求，实体属性相当于工作流的outputs
 * 这个转换器将实体的properties转换为工作流引擎可用的outputs格式
 */
export class EntityToWorkflowConverter {
  /**
   * 将实体属性转换为工作流outputs
   *
   * @param entityProperties 实体属性定义
   * @returns 工作流outputs JsonSchema
   */
  static convertToOutputs(entityProperties: Record<string, EntityPropertyType>): JsonSchema {
    const properties: Record<string, any> = {};

    Object.entries(entityProperties).forEach(([key, prop]) => {
      properties[key] = this.convertPropertyType(prop);
    });

    return {
      type: 'object',
      properties,
    } as JsonSchema;
  }

  /**
   * 将单个实体属性转换为工作流属性
   */
  private static convertPropertyType(prop: EntityPropertyType): any {
    const base: any = {
      type: prop.type,
      description: prop.description,
    };

    // 设置默认值
    if (prop.default !== undefined) {
      base.default = prop.default;
    }

    // 处理枚举（实体系统支持，工作流系统转换时去掉）
    // enum在工作流系统中不直接支持，但可以通过其他方式实现

    switch (prop.type) {
      case 'array':
        if (prop.items) {
          base.items = this.convertPropertyType(prop.items);
        }
        break;
      case 'object':
        if (prop.properties) {
          base.properties = {};
          Object.entries(prop.properties).forEach(([key, subProp]) => {
            base.properties[key] = this.convertPropertyType(subProp);
          });
        }
        break;
    }

    return base;
  }

  /**
   * 从实体定义生成完整的工作流outputs
   */
  static fromEntityDefinition(entity: EntityDefinition): JsonSchema {
    return this.convertToOutputs(entity.properties);
  }

  /**
   * 验证实体属性是否可以转换为工作流outputs
   */
  static canConvert(entityProperties: Record<string, EntityPropertyType>): boolean {
    try {
      this.convertToOutputs(entityProperties);
      return true;
    } catch (error) {
      console.warn('Entity properties cannot be converted to workflow outputs:', error);
      return false;
    }
  }
}

/**
 * 工具函数：快速将实体定义转换为outputs
 */
export function entityToOutputs(entity: EntityDefinition): JsonSchema {
  return EntityToWorkflowConverter.fromEntityDefinition(entity);
}

/**
 * 工具函数：快速将实体属性转换为outputs
 */
export function propertiesToOutputs(properties: Record<string, EntityPropertyType>): JsonSchema {
  return EntityToWorkflowConverter.convertToOutputs(properties);
}

/**
 * 仿真实体类型定义
 */
export interface SimulationEntity {
  /** 实体ID */
  id: string;
  /** 实体名称 */
  name: string;
  /** 实体类型 */
  type: string;
  /** 实体描述 */
  description?: string;
  /** 实体属性 */
  properties: Record<string, any>;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 仿真平台属性定义 */
  attributes?: Attribute[];
  /** 引用的模块列表 */
  bundles?: string[];
}
