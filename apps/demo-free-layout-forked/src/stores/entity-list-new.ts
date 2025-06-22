// 基于抽象框架的实体Store实现

import { nanoid } from 'nanoid';

import { createIndexedStore } from './base/indexed-store-base';
import { IndexedStoreConfig } from './base/indexed-store';
import { Entity, Attribute } from '../services/types';
import { entityApi } from '../services/api-service';

// 🔑 实体Store配置
const entityStoreConfig: IndexedStoreConfig<Entity> = {
  // API端点配置
  apiEndpoints: {
    getAll: () => entityApi.getAll(),
    create: (entity: Entity) => entityApi.create(entity),
    update: (id: string, entity: Entity) => entityApi.update(id, entity),
    delete: (id: string) => entityApi.delete(id),
  },

  // 数据处理配置
  ensureIndexId: (entity: Partial<Entity>): Entity => ({
    id: entity.id || '',
    name: entity.name || '',
    description: entity.description || '',
    deprecated: entity.deprecated || false,
    attributes: entity.attributes || [],
    bundles: entity.bundles || [],
    _indexId: entity._indexId || nanoid(),
    _status: entity._status || 'saved',
    _editStatus: entity._editStatus,
  }),

  validateItem: (entity: Entity): boolean => !!(entity.id && entity.name),

  // 子属性配置
  childrenConfig: {
    fieldName: 'attributes',
    ensureChildIndexId: (attr: Attribute): Attribute => ({
      ...attr,
      _indexId: attr._indexId || nanoid(),
    }),
  },
};

// 🔑 创建实体Store
export const useEntityListStore = createIndexedStore(entityStoreConfig, 'EntityList');

// 🔑 扩展方法：实体特有的操作
export const EntityListStoreExtensions = {
  // 添加新实体
  addNewEntity: () => {
    const newEntity: Entity = {
      id: `new_entity_${Date.now()}`,
      name: '新实体',
      description: '',
      deprecated: false,
      attributes: [],
      bundles: [],
      _indexId: nanoid(),
      _status: 'new',
    };

    useEntityListStore.setState((state) => {
      state.items.push(newEntity as any);
    });

    console.log('➕ [EntityList] 添加新实体:', newEntity.id);
    return newEntity._indexId;
  },

  // 添加新属性
  addNewAttribute: (entityIndexId: string) => {
    const newAttribute: Attribute = {
      id: `new_attr_${Date.now()}`,
      name: '新属性',
      type: 's',
      description: '',
      _indexId: nanoid(),
    };

    useEntityListStore.setState((state) => {
      const entityIndex = state.items.findIndex((e) => e._indexId === entityIndexId);
      if (entityIndex !== -1) {
        (state.items[entityIndex] as any).attributes.push(newAttribute);

        // 标记实体为dirty
        if (state.items[entityIndex]._status !== 'new') {
          (state.items[entityIndex] as any)._status = 'dirty';
        }
      }
    });

    console.log('➕ [EntityList] 添加新属性:', newAttribute.id);
    return newAttribute._indexId;
  },

  // 更新属性字段
  updateAttributeField: (
    entityIndexId: string,
    attributeIndexId: string,
    field: string,
    value: any
  ) => {
    useEntityListStore.setState((state) => {
      const entityIndex = state.items.findIndex((e) => e._indexId === entityIndexId);
      if (entityIndex !== -1) {
        const entity = state.items[entityIndex] as any;
        const attrIndex = entity.attributes.findIndex((a: any) => a._indexId === attributeIndexId);

        if (attrIndex !== -1) {
          entity.attributes[attrIndex][field] = value;

          // 标记实体为dirty
          if (entity._status !== 'new') {
            entity._status = 'dirty';
          }
        }
      }
    });
  },

  // 删除属性
  deleteAttribute: (entityIndexId: string, attributeIndexId: string) => {
    useEntityListStore.setState((state) => {
      const entityIndex = state.items.findIndex((e) => e._indexId === entityIndexId);
      if (entityIndex !== -1) {
        const entity = state.items[entityIndex] as any;
        entity.attributes = entity.attributes.filter((a: any) => a._indexId !== attributeIndexId);

        // 标记实体为dirty
        if (entity._status !== 'new') {
          entity._status = 'dirty';
        }
      }
    });

    console.log('🗑️ [EntityList] 删除属性:', attributeIndexId);
  },

  // 获取实体的索引ID函数
  getEntityIndexId: (entity: Entity) => entity._indexId,

  // 获取属性的索引ID函数
  getAttributeIndexId: (attribute: Attribute) => attribute._indexId,
};
