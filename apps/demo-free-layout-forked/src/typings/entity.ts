/**
 * 实体属性数据类型定义
 */
export interface EntityPropertyType {
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
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
    Object.entries(entity.properties).forEach(([key, propDef]) => {
      if (propDef.default !== undefined) {
        values[key] = propDef.default;
      }
    });
    return values;
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
