/**
 * 仿真平台类型系统转换器
 * 负责在仿真类型系统和工作流类型系统之间进行转换
 */

import { Typed as TypedDefinition, TypedParser, Primitive as PrimitiveType } from './typed';
import { EntityPropertyType, EntityDefinition, SimulationEntity } from './entity';
import { Attribute as AttributeDefinition, AttributeParser } from './attribute';

/**
 * 仿真平台类型系统转换器
 */
export class SimulationTypeConverter {
  /**
   * 将TypedDefinition转换为EntityPropertyType
   */
  static typedToEntityProperty(typed: TypedDefinition): EntityPropertyType {
    // 处理数组类型
    if (typed.dimensions.length > 0) {
      let baseType = this.getBaseEntityPropertyType(typed);

      // 从最内层开始构建数组类型
      for (let i = typed.dimensions.length - 1; i >= 0; i--) {
        baseType = {
          type: 'array',
          items: baseType,
        };
      }

      // 保存原始类型定义以便准确转换回来
      baseType.typed = typed;
      return baseType;
    }

    // 处理复合类型
    if (typed.attributes.length > 0) {
      const properties: Record<string, EntityPropertyType> = {};
      typed.attributes.forEach((attr) => {
        properties[attr.id] = this.typedToEntityProperty(attr.type);
      });

      const result: EntityPropertyType = {
        type: 'object',
        properties,
      };

      // 保存原始类型定义
      result.typed = typed;
      return result;
    }

    // 处理基础类型
    const result = this.getBaseEntityPropertyType(typed);
    result.typed = typed;
    return result;
  }

  /**
   * 将EntityPropertyType转换为TypedDefinition
   */
  static entityPropertyToTyped(property: EntityPropertyType): TypedDefinition {
    if (property.typed) {
      return property.typed;
    }

    switch (property.type) {
      case 'boolean':
        return { dimensions: [], attributes: [], primitive: PrimitiveType.BOOLEAN };
      case 'number':
        return { dimensions: [], attributes: [], primitive: PrimitiveType.NUMBER };
      case 'string':
        return { dimensions: [], attributes: [], primitive: PrimitiveType.STRING };
      case 'array':
        if (property.items) {
          const itemType = this.entityPropertyToTyped(property.items);
          return {
            dimensions: [-1, ...itemType.dimensions],
            attributes: itemType.attributes,
            primitive: itemType.primitive,
          };
        }
        return { dimensions: [-1], attributes: [], primitive: PrimitiveType.UNKNOWN };
      case 'object':
        if (property.properties) {
          const attributes: AttributeDefinition[] = Object.entries(property.properties).map(
            ([key, prop]) => ({
              id: key,
              type: this.entityPropertyToTyped(prop),
              history: [],
            })
          );
          return { dimensions: [], attributes, primitive: null };
        }
        return { dimensions: [], attributes: [], primitive: PrimitiveType.UNKNOWN };
      default:
        return { dimensions: [], attributes: [], primitive: PrimitiveType.UNKNOWN };
    }
  }

  /**
   * 从字符串解析创建EntityPropertyType
   */
  static parseFromString(typeString: string): EntityPropertyType {
    try {
      const typed = TypedParser.fromString(typeString);
      return this.typedToEntityProperty(typed);
    } catch (error) {
      console.warn('Failed to parse type string:', typeString, error);
      return { type: 'object' };
    }
  }

  /**
   * 验证值是否符合EntityPropertyType定义
   */
  static validateValue(value: any, property: EntityPropertyType): boolean {
    try {
      switch (property.type) {
        case 'boolean':
          return typeof value === 'boolean';
        case 'number':
          return typeof value === 'number' && !isNaN(value);
        case 'string':
          return typeof value === 'string';
        case 'array':
          if (!Array.isArray(value)) return false;
          if (property.items) {
            return value.every((item) => this.validateValue(item, property.items!));
          }
          return true;
        case 'object':
          if (typeof value !== 'object' || value === null || Array.isArray(value)) {
            return false;
          }
          if (property.properties) {
            return Object.entries(property.properties).every(([key, propDef]) => {
              if (propDef.required && !(key in value)) return false;
              if (key in value) {
                return this.validateValue(value[key], propDef);
              }
              return true;
            });
          }
          return true;
        default:
          return false;
      }
    } catch (error) {
      console.warn('Validation error:', error);
      return false;
    }
  }

  /**
   * 为EntityPropertyType创建默认值
   */
  static createDefaultValue(property: EntityPropertyType): any {
    if (property.default !== undefined) {
      return this.cloneValue(property.default);
    }

    switch (property.type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'string':
        return '';
      case 'array':
        return [];
      case 'object':
        if (property.properties) {
          const obj: Record<string, any> = {};
          Object.entries(property.properties).forEach(([key, prop]) => {
            if (prop.required || prop.default !== undefined) {
              obj[key] = this.createDefaultValue(prop);
            }
          });
          return obj;
        }
        return {};
      default:
        return null;
    }
  }

  /**
   * 获取基础EntityPropertyType
   */
  private static getBaseEntityPropertyType(typed: TypedDefinition): EntityPropertyType {
    switch (typed.primitive) {
      case PrimitiveType.BOOLEAN:
        return { type: 'boolean', default: false };
      case PrimitiveType.NUMBER:
        return { type: 'number', default: 0 };
      case PrimitiveType.STRING:
        return { type: 'string', default: '' };
      case PrimitiveType.UNKNOWN:
      default:
        return { type: 'object' };
    }
  }

  /**
   * 深度克隆值
   */
  private static cloneValue(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value;
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.cloneValue(item));
    }
    const cloned: Record<string, any> = {};
    Object.entries(value).forEach(([key, val]) => {
      cloned[key] = this.cloneValue(val);
    });
    return cloned;
  }
}

/**
 * 仿真实体转换器
 */
export class SimulationEntityConverter {
  /**
   * 将SimulationEntity转换为EntityDefinition
   */
  static simulationToEntity(simulation: SimulationEntity): EntityDefinition {
    const properties: Record<string, EntityPropertyType> = {};

    simulation.attributes.forEach((attr) => {
      properties[attr.id] = SimulationTypeConverter.typedToEntityProperty(attr.type);
      if (attr.desc) {
        properties[attr.id].description = attr.desc;
      }
      if (attr.value !== undefined) {
        properties[attr.id].default = attr.value;
      }
      // 标记为仿真类型定义
      properties[attr.id].typed = attr.type;
    });

    return {
      id: simulation.id,
      name: simulation.id, // 使用id作为默认名称
      version: '1.0.0',
      tags: [],
      description: '',
      properties,
      simulationAttributes: simulation.attributes,
      bundles: simulation.bundles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 将EntityDefinition转换为SimulationEntity
   */
  static entityToSimulation(entity: EntityDefinition): SimulationEntity {
    let attributes: AttributeDefinition[] = [];

    // 优先使用仿真属性定义
    if (entity.simulationAttributes) {
      attributes = entity.simulationAttributes;
    } else {
      // 从properties转换
      attributes = Object.entries(entity.properties).map(([key, property]) => ({
        id: key,
        type: SimulationTypeConverter.entityPropertyToTyped(property),
        name: key,
        desc: property.description,
        value: property.default,
        history: [],
      }));
    }

    return {
      id: entity.id,
      attributes,
      bundles: entity.bundles || [],
    };
  }

  /**
   * 从类型字符串创建属性定义
   */
  static createAttributeFromString(typeString: string): AttributeDefinition {
    return AttributeParser.fromString(typeString);
  }

  /**
   * 批量从类型字符串创建属性定义
   */
  static createAttributesFromStrings(typeStrings: string[]): AttributeDefinition[] {
    return typeStrings.map((str) => this.createAttributeFromString(str));
  }

  /**
   * 从属性定义创建实体
   */
  static createEntityFromAttributes(
    id: string,
    name: string,
    attributes: AttributeDefinition[],
    bundles: string[] = []
  ): EntityDefinition {
    const properties: Record<string, EntityPropertyType> = {};

    attributes.forEach((attr) => {
      properties[attr.id] = SimulationTypeConverter.typedToEntityProperty(attr.type);
      if (attr.desc) {
        properties[attr.id].description = attr.desc;
      }
      if (attr.value !== undefined) {
        properties[attr.id].default = attr.value;
      }
      // 保留原始类型定义
      properties[attr.id].typed = attr.type;
    });

    return {
      id,
      name,
      version: '1.0.0',
      tags: [],
      description: '',
      properties,
      simulationAttributes: attributes,
      bundles,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * 从类型字符串数组创建实体定义
   */
  static createEntityFromTypeStrings(
    id: string,
    name: string,
    typeStrings: string[]
  ): EntityDefinition {
    const attributes = this.createAttributesFromStrings(typeStrings);
    return this.createEntityFromAttributes(id, name, attributes);
  }

  /**
   * 合并多个实体的属性
   */
  static mergeEntities(entities: EntityDefinition[]): EntityDefinition {
    if (entities.length === 0) {
      throw new Error('Cannot merge empty entities array');
    }

    const firstEntity = entities[0];
    const mergedProperties: Record<string, EntityPropertyType> = { ...firstEntity.properties };
    const mergedAttributes: AttributeDefinition[] = [...(firstEntity.simulationAttributes || [])];
    const mergedBundles: string[] = [...(firstEntity.bundles || [])];
    const mergedTags: string[] = [...firstEntity.tags];

    for (let i = 1; i < entities.length; i++) {
      const entity = entities[i];

      // 合并属性
      Object.assign(mergedProperties, entity.properties);

      // 合并仿真属性
      if (entity.simulationAttributes) {
        mergedAttributes.push(...entity.simulationAttributes);
      }

      // 合并模块引用
      if (entity.bundles) {
        mergedBundles.push(...entity.bundles);
      }

      // 合并标签
      mergedTags.push(...entity.tags);
    }

    return {
      id: `merged-${Date.now()}`,
      name: `合并实体 (${entities.length}个)`,
      version: '1.0.0',
      tags: [...new Set(mergedTags)], // 去重
      description: `合并了${entities.length}个实体的属性`,
      properties: mergedProperties,
      simulationAttributes: mergedAttributes,
      bundles: [...new Set(mergedBundles)], // 去重
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}
