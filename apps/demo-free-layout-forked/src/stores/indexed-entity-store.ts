import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { BaseEntity, BaseAttribute, HasModules } from '../types/indexed';
import { entityApi } from '../services/api-service';
import {
  BaseIndexedStoreState,
  BaseIndexedStoreActions,
  addIndexToItemWithAttributes,
  updateNestedField,
  findByPath,
  isItemDirty,
  canSaveItem,
} from './base-indexed-store';

// 实体类型定义
export interface Entity extends BaseEntity {
  // 继承BaseEntity的所有属性
}

export interface EntityAttribute extends BaseAttribute {
  // 继承BaseAttribute的所有属性
}

// 实体Store状态
interface EntityStoreState extends BaseIndexedStoreState<Entity> {
  entities: Entity[]; // 兼容性别名
}

// 实体Store动作
interface EntityStoreActions extends BaseIndexedStoreActions<Entity> {
  // 实体特定方法
  updateEntityField: (entityIndexId: string, field: keyof Entity, value: any) => void;
  updateEntityAttribute: (
    entityIndexId: string,
    attributeIndexId: string,
    field: keyof EntityAttribute,
    value: any
  ) => void;

  // 属性管理
  addEntityAttribute: (entityIndexId: string) => void;
  deleteEntityAttribute: (entityIndexId: string, attributeIndexId: string) => void;

  // 模块关联管理
  linkModulesToEntity: (entityIndexId: string, moduleIndexIds: string[]) => void;
  unlinkModuleFromEntity: (entityIndexId: string, moduleIndexId: string) => void;

  // 兼容性方法
  loadEntities: () => Promise<void>;
  saveEntity: (entityIndexId: string) => Promise<void>;
  isEntityDirty: (entityIndexId: string) => boolean;
  canSaveEntity: (entityIndexId: string) => boolean;
}

// 创建实体Store
export const useIndexedEntityStore = create<EntityStoreState & EntityStoreActions>((set, get) => ({
  // 状态
  items: [],
  entities: [], // 兼容性别名
  loading: false,
  error: null,

  // 基础CRUD
  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const rawEntities = await entityApi.getAll();
      console.log('📊 加载原始实体数据:', rawEntities.length, '个');

      // 为实体和属性添加索引
      const indexedEntities = rawEntities.map((entity) =>
        addIndexToItemWithAttributes({
          ...entity,
          moduleIds: [], // 初始化模块关联数组
          attributes: entity.attributes || [],
        })
      );

      console.log('🔗 实体索引化完成:', indexedEntities.length, '个');
      set({
        items: indexedEntities,
        entities: indexedEntities, // 兼容性
        loading: false,
      });
    } catch (error) {
      console.error('❌ 加载实体失败:', error);
      set({ error: String(error), loading: false });
    }
  },

  addItem: (entityData) => {
    const newEntity = addIndexToItemWithAttributes({
      ...entityData,
      moduleIds: [],
      attributes: [],
      _status: 'new',
    });

    set((state) => ({
      items: [...state.items, newEntity],
      entities: [...state.items, newEntity],
    }));

    console.log('➕ 添加新实体:', newEntity._indexId);
  },

  updateItem: (indexId, updates) => {
    set((state) => {
      const updatedItems = state.items.map((item) =>
        item._indexId === indexId
          ? { ...item, ...updates, _status: item._status === 'new' ? 'new' : 'modified' }
          : item
      );
      return {
        items: updatedItems,
        entities: updatedItems,
      };
    });
  },

  deleteItem: (indexId) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item._indexId !== indexId);
      return {
        items: updatedItems,
        entities: updatedItems,
      };
    });
    console.log('🗑️ 删除实体:', indexId);
  },

  // 字段更新
  updateField: (indexPath, field, value) => {
    console.log('🔄 更新字段:', { indexPath, field, value });

    set((state) => {
      const updatedItems = updateNestedField(state.items, indexPath, field as string, value);
      return {
        items: updatedItems,
        entities: updatedItems,
      };
    });
  },

  // 状态管理
  setItemStatus: (indexId, status) => {
    set((state) => ({
      items: state.items.map((item) =>
        item._indexId === indexId ? { ...item, _status: status } : item
      ),
      entities: state.items.map((item) =>
        item._indexId === indexId ? { ...item, _status: status } : item
      ),
    }));
  },

  resetItem: (indexId) => {
    // TODO: 实现重置逻辑
    console.log('🔄 重置实体:', indexId);
  },

  saveItem: async (indexId) => {
    const entity = get().items.find((item) => item._indexId === indexId);
    if (!entity) return;

    set((state) => ({
      items: state.items.map((item) =>
        item._indexId === indexId ? { ...item, _editStatus: 'saving' } : item
      ),
      entities: state.items.map((item) =>
        item._indexId === indexId ? { ...item, _editStatus: 'saving' } : item
      ),
    }));

    try {
      if (entity._status === 'new') {
        await entityApi.create(entity);
      } else {
        await entityApi.update(entity.id, entity);
      }

      set((state) => ({
        items: state.items.map((item) =>
          item._indexId === indexId ? { ...item, _status: 'saved', _editStatus: 'idle' } : item
        ),
        entities: state.items.map((item) =>
          item._indexId === indexId ? { ...item, _status: 'saved', _editStatus: 'idle' } : item
        ),
      }));

      console.log('✅ 实体保存成功:', indexId);
    } catch (error) {
      set((state) => ({
        items: state.items.map((item) =>
          item._indexId === indexId ? { ...item, _status: 'error', _editStatus: 'idle' } : item
        ),
        entities: state.items.map((item) =>
          item._indexId === indexId ? { ...item, _status: 'error', _editStatus: 'idle' } : item
        ),
      }));
      console.error('❌ 实体保存失败:', error);
      throw error;
    }
  },

  // 查询
  getItem: (indexId) => get().items.find((item) => item._indexId === indexId),

  getItemByPath: (indexPath) => findByPath(get().items, indexPath),

  isItemDirty: (indexId) => {
    const entity = get().items.find((item) => item._indexId === indexId);
    return entity ? isItemDirty(entity) : false;
  },

  canSaveItem: (indexId) => {
    const entity = get().items.find((item) => item._indexId === indexId);
    return entity ? canSaveItem(entity) : false;
  },

  // 实体特定方法
  updateEntityField: (entityIndexId, field, value) => {
    get().updateField([entityIndexId], field, value);
  },

  updateEntityAttribute: (entityIndexId, attributeIndexId, field, value) => {
    get().updateField([entityIndexId, attributeIndexId], field, value);
  },

  // 属性管理
  addEntityAttribute: (entityIndexId) => {
    const newAttribute: EntityAttribute = {
      _indexId: nanoid(),
      _status: 'new',
      id: '',
      name: '',
      type: 'string',
      description: '',
    };

    set((state) => ({
      items: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: [...entity.attributes, newAttribute],
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
      entities: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: [...entity.attributes, newAttribute],
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
    }));

    console.log('➕ 添加新属性到实体:', entityIndexId);
  },

  deleteEntityAttribute: (entityIndexId, attributeIndexId) => {
    set((state) => ({
      items: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: entity.attributes.filter((attr) => attr._indexId !== attributeIndexId),
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
      entities: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: entity.attributes.filter((attr) => attr._indexId !== attributeIndexId),
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
    }));

    console.log('🗑️ 删除属性:', attributeIndexId, '从实体:', entityIndexId);
  },

  // 模块关联管理
  linkModulesToEntity: (entityIndexId, moduleIndexIds) => {
    set((state) => ({
      items: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              moduleIds: [...new Set([...entity.moduleIds, ...moduleIndexIds])],
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
      entities: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              moduleIds: [...new Set([...entity.moduleIds, ...moduleIndexIds])],
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
    }));

    console.log('🔗 关联模块到实体:', { entityIndexId, moduleIndexIds });
  },

  unlinkModuleFromEntity: (entityIndexId, moduleIndexId) => {
    set((state) => ({
      items: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              moduleIds: entity.moduleIds.filter((id) => id !== moduleIndexId),
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
      entities: state.items.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              moduleIds: entity.moduleIds.filter((id) => id !== moduleIndexId),
              _status: entity._status === 'new' ? 'new' : 'modified',
            }
          : entity
      ),
    }));

    console.log('🔗 取消模块关联:', { entityIndexId, moduleIndexId });
  },

  // 兼容性方法
  loadEntities: () => get().loadItems(),
  saveEntity: (entityIndexId) => get().saveItem(entityIndexId),
  isEntityDirty: (entityIndexId) => get().isItemDirty(entityIndexId),
  canSaveEntity: (entityIndexId) => get().canSaveItem(entityIndexId),
}));

// 导出hooks
export const useIndexedEntityState = () =>
  useIndexedEntityStore((state) => ({
    items: state.items,
    entities: state.entities,
    loading: state.loading,
    error: state.error,
  }));

export const useIndexedEntityActions = () =>
  useIndexedEntityStore((state) => ({
    loadItems: state.loadItems,
    addItem: state.addItem,
    updateItem: state.updateItem,
    deleteItem: state.deleteItem,
    updateField: state.updateField,
    setItemStatus: state.setItemStatus,
    resetItem: state.resetItem,
    saveItem: state.saveItem,
    getItem: state.getItem,
    getItemByPath: state.getItemByPath,
    isItemDirty: state.isItemDirty,
    canSaveItem: state.canSaveItem,
    updateEntityField: state.updateEntityField,
    updateEntityAttribute: state.updateEntityAttribute,
    addEntityAttribute: state.addEntityAttribute,
    deleteEntityAttribute: state.deleteEntityAttribute,
    linkModulesToEntity: state.linkModulesToEntity,
    unlinkModuleFromEntity: state.unlinkModuleFromEntity,
    loadEntities: state.loadEntities,
    saveEntity: state.saveEntity,
    isEntityDirty: state.isEntityDirty,
    canSaveEntity: state.canSaveEntity,
  }));
