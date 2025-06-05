import { nanoid } from 'nanoid';

import { ExtendedJsonSchema } from '../typings/extended-json-schema';
import { FlowDocumentJSON } from '../typings';
import { Entity } from '../services/types';

// 不需要"稳定"的nanoid，直接用随机的

/**
 * 将EntityStore的实体数据转换为工作流数据
 */
export function entityToWorkflowData(entity: Entity): FlowDocumentJSON {
  return {
    nodes: [
      {
        id: 'start_0',
        type: 'start',
        meta: {
          position: {
            x: 180,
            y: 381.75,
          },
        },
        data: {
          title: 'Start',
          // 将所有实体信息和属性都放在outputs中，使用nanoid索引设计
          outputs: convertEntityToOutputs(entity),
        },
      },
      {
        id: 'end_0',
        type: 'end',
        meta: {
          position: {
            x: 600,
            y: 381.75,
          },
        },
        data: {
          title: 'End',
          outputs: {
            type: 'object',
            properties: {
              result: {
                type: 'string',
              },
            },
          },
        },
      },
    ],
    edges: [
      {
        sourceNodeID: 'start_0',
        targetNodeID: 'end_0',
      },
    ],
  };
}

/**
 * 将实体完整信息转换为outputs格式
 * 使用nanoid索引设计：nanoid作为key，原始属性保存在id/name字段中
 */
function convertEntityToOutputs(entity: Entity) {
  const properties: Record<string, ExtendedJsonSchema> = {};

  // 1. 实体meta属性 - 使用固定的key格式，与FormEntityMetas匹配
  properties['__entity_id'] = {
    type: 'string',
    title: entity.id,
    default: entity.id,
    category: 'meta',
    id: 'id',
    _indexId: '__entity_id',
  };

  properties['__entity_name'] = {
    type: 'string',
    title: entity.name,
    default: entity.name,
    category: 'meta',
    id: 'name',
    _indexId: '__entity_name',
  };

  properties['__entity_description'] = {
    type: 'string',
    title: entity.description || '',
    default: entity.description || '',
    category: 'meta',
    id: 'description',
    _indexId: '__entity_description',
  };

  console.log('wtf', entity.attributes);
  // 2. 实体自身属性 - 使用属性的索引ID
  entity.attributes.forEach((attr) => {
    if (!attr._indexId) {
      console.error('Entity attribute missing _indexId:', attr);
      throw new Error(`Entity attribute ${attr.id} is missing _indexId. This should not happen.`);
    }

    const propertyData: ExtendedJsonSchema = {
      type: attr.type === 'n' ? 'number' : attr.type === 's' ? 'string' : 'string',
      title: attr.name,
      category: 'entity',
      id: attr.id,
      _indexId: attr._indexId,
      ...(attr.enumClassId && { enumClassId: attr.enumClassId }),
      isEntityProperty: true,
    };

    // debugger;
    // 🔍 调试用：为vehicle的vehicle_yard_id属性添加调试nanoid
    if (entity.id === 'vehicle' && attr.name === '集结点id') {
      propertyData.debugNanoid = nanoid();
      console.log('🔍 添加调试nanoid到vehicle_yard_id:', propertyData.debugNanoid);
    }

    properties[attr._indexId] = propertyData;
  });

  // 3. 模块属性将在WorkflowEditor中注入，这里不添加占位符

  return {
    type: 'object',
    properties,
  };
}

/**
 * 从outputs中提取实体meta属性
 */
export function extractEntityMetaFromOutputs(outputs: any) {
  const meta: Record<string, any> = {};

  if (outputs?.properties) {
    Object.entries(outputs.properties).forEach(([propertyKey, prop]) => {
      const extProp = prop as ExtendedJsonSchema;
      if (extProp.category === 'meta') {
        const metaKey = propertyKey.replace('__entity_', '');
        meta[metaKey] = extProp.default;
      }
    });
  }

  return meta;
}

/**
 * 从outputs中提取实体自身属性
 */
export function extractEntityPropertiesFromOutputs(outputs: any) {
  const properties: Record<string, ExtendedJsonSchema> = {};

  if (outputs?.properties) {
    Object.entries(outputs.properties).forEach(([propertyKey, prop]) => {
      const extProp = prop as ExtendedJsonSchema;
      if (extProp.category === 'entity') {
        properties[propertyKey] = extProp;
      }
    });
  }

  return properties;
}

/**
 * 从outputs中提取模块属性（按模块分组）
 */
export function extractModulePropertiesFromOutputs(outputs: any) {
  const moduleGroups: Record<string, Record<string, ExtendedJsonSchema>> = {};

  if (outputs?.properties) {
    Object.entries(outputs.properties).forEach(([propertyKey, prop]) => {
      const extProp = prop as ExtendedJsonSchema;
      if (extProp.category === 'module' && extProp.moduleId) {
        // 使用moduleId分组，而不是依赖key格式
        const moduleId = extProp.moduleId;
        if (!moduleGroups[moduleId]) {
          moduleGroups[moduleId] = {};
        }
        // 使用attributeId作为子key
        const attrKey = extProp.attributeId || propertyKey;
        moduleGroups[moduleId][attrKey] = extProp;
      }
    });
  }

  return moduleGroups;
}
