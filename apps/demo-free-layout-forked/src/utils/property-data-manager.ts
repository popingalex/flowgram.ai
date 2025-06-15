import { nanoid } from 'nanoid';
import type { IJsonSchema } from '@flowgram.ai/form-materials';

import type { Attribute, ModuleAttribute } from '../services/types';

// 统一的属性数据接口
export interface PropertyData {
  key: string; // 唯一标识（_indexId）
  id: string; // 属性ID
  name: string; // 显示名称
  type: string; // 数据类型
  description?: string; // 描述
  required?: boolean; // 是否必需
  readonly?: boolean; // 是否只读
  category: PropertyCategory; // 属性分类
  source: PropertySource; // 数据来源
  moduleId?: string; // 所属模块ID（模块属性专用）
  meta: Record<string, any>; // 原始数据
}

export type PropertyCategory = 'entity' | 'module' | 'system' | 'custom';
export type PropertySource = 'store' | 'schema' | 'computed';

// 分组后的属性数据
export interface GroupedPropertyData {
  entity: PropertyData[]; // 实体属性
  modules: ModulePropertyGroup[]; // 模块属性分组
  system: PropertyData[]; // 系统属性
  custom: PropertyData[]; // 自定义属性
}

export interface ModulePropertyGroup {
  moduleId: string;
  moduleName: string;
  properties: PropertyData[];
}

// 过滤器接口
export interface PropertyFilter {
  type: 'category' | 'readonly' | 'nodeType' | 'custom';
  value: any;
}

export class PropertyDataManager {
  // 从实体属性转换为统一格式
  static fromEntityAttributes(attributes: Attribute[]): PropertyData[] {
    return attributes.map((attr) => ({
      key: attr._indexId || nanoid(),
      id: attr.id,
      name: attr.name || attr.id,
      type: attr.type || 'string',
      description: attr.description,
      required: false,
      readonly: attr.isModuleProperty || false,
      category: attr.isModuleProperty ? 'module' : 'entity',
      source: 'store' as PropertySource,
      moduleId: attr.isModuleProperty ? this.extractModuleId(attr.id) : undefined,
      meta: { ...attr },
    }));
  }

  // 从JsonSchema转换为统一格式
  static fromJsonSchema(schema: IJsonSchema): PropertyData[] {
    const properties = schema.properties || {};
    return Object.entries(properties).map(([key, prop]) => {
      const propData = prop as any;
      return {
        key: propData._indexId || key,
        id: propData.id || key,
        name: propData.name || propData.title || key,
        type: propData.type || 'string',
        description: propData.description,
        required: propData.isPropertyRequired || false,
        readonly: propData.isModuleProperty || false,
        category: this.inferCategory(propData),
        source: 'schema' as PropertySource,
        moduleId: propData.isModuleProperty ? this.extractModuleId(propData.id || key) : undefined,
        meta: { ...propData },
      };
    });
  }

  // 从模块属性转换为统一格式
  static fromModuleAttributes(
    attributes: ModuleAttribute[],
    moduleId: string,
    moduleName: string
  ): PropertyData[] {
    return attributes.map((attr) => ({
      key: attr._indexId || nanoid(),
      id: `${moduleId}/${attr.id}`,
      name: attr.name || attr.id,
      type: attr.type || 'string',
      description: attr.description,
      required: false,
      readonly: true, // 模块属性默认只读
      category: 'module' as PropertyCategory,
      source: 'store' as PropertySource,
      moduleId,
      meta: { ...attr, moduleName },
    }));
  }

  // 按类别分组属性
  static groupByCategory(properties: PropertyData[]): GroupedPropertyData {
    const grouped: GroupedPropertyData = {
      entity: [],
      modules: [],
      system: [],
      custom: [],
    };

    // 按模块分组的临时存储
    const moduleGroups: Record<string, PropertyData[]> = {};

    properties.forEach((prop) => {
      switch (prop.category) {
        case 'entity':
          grouped.entity.push(prop);
          break;
        case 'module':
          if (prop.moduleId) {
            if (!moduleGroups[prop.moduleId]) {
              moduleGroups[prop.moduleId] = [];
            }
            moduleGroups[prop.moduleId].push(prop);
          }
          break;
        case 'system':
          grouped.system.push(prop);
          break;
        case 'custom':
          grouped.custom.push(prop);
          break;
      }
    });

    // 转换模块分组
    grouped.modules = Object.entries(moduleGroups).map(([moduleId, props]) => ({
      moduleId,
      moduleName: props[0]?.meta?.moduleName || moduleId,
      properties: props,
    }));

    return grouped;
  }

  // 根据节点类型过滤属性
  static filterByNodeType(properties: PropertyData[], nodeType: string): PropertyData[] {
    switch (nodeType) {
      case 'start':
      case 'FlowNodeEntity':
        // Start节点只显示实体属性，不显示模块属性（模块属性在模块列表中单独显示）
        return properties.filter((prop) => prop.category === 'entity');

      case 'action':
      case 'invoke':
      case 'end':
        // 其他节点不显示实体和模块属性，只显示节点自身的输出属性
        return properties.filter((prop) => prop.category === 'custom');

      default:
        return properties.filter((prop) => prop.category === 'custom');
    }
  }

  // 根据显示模式过滤属性
  static filterByMode(properties: PropertyData[], mode: 'node' | 'sidebar'): PropertyData[] {
    if (mode === 'node') {
      // 节点模式：只显示关键属性，隐藏只读属性
      return properties.filter((prop) => !prop.readonly);
    }

    // 侧边栏模式：显示所有属性
    return properties;
  }

  // 应用多个过滤器
  static applyFilters(properties: PropertyData[], filters: PropertyFilter[]): PropertyData[] {
    return filters.reduce((filtered, filter) => {
      switch (filter.type) {
        case 'category':
          return filtered.filter((prop) => filter.value.includes(prop.category));
        case 'readonly':
          return filtered.filter((prop) => prop.readonly === filter.value);
        case 'nodeType':
          return this.filterByNodeType(filtered, filter.value);
        case 'custom':
          return filter.value(filtered);
        default:
          return filtered;
      }
    }, properties);
  }

  // 辅助方法：推断属性类别
  private static inferCategory(prop: any): PropertyCategory {
    if (prop.isSystemProperty) return 'system';
    if (prop.isModuleProperty) return 'module';
    if (prop.isEntityProperty) return 'entity';
    return 'custom';
  }

  // 辅助方法：从属性ID中提取模块ID
  private static extractModuleId(id: string): string | undefined {
    if (id.includes('/')) {
      return id.split('/')[0];
    }
    return undefined;
  }

  // 创建系统属性
  static createSystemProperties(
    entityId: string,
    entityName: string,
    entityDesc?: string
  ): PropertyData[] {
    return [
      {
        key: '$id',
        id: '$id',
        name: '实体ID',
        type: 'string',
        description: '实体的唯一标识符',
        required: true,
        readonly: true,
        category: 'system',
        source: 'computed',
        meta: { value: entityId },
      },
      {
        key: '$name',
        id: '$name',
        name: '实体名称',
        type: 'string',
        description: '实体的显示名称',
        required: true,
        readonly: true,
        category: 'system',
        source: 'computed',
        meta: { value: entityName },
      },
      {
        key: '$desc',
        id: '$desc',
        name: '实体描述',
        type: 'string',
        description: '实体的详细描述',
        required: false,
        readonly: true,
        category: 'system',
        source: 'computed',
        meta: { value: entityDesc || '' },
      },
    ];
  }
}
