import { useMemo } from 'react';

import { create } from 'zustand';
import { nanoid } from 'nanoid';

import type { Entity, ItemStatus } from '../services/types';
import { entityApi } from '../services/api-service';

// 深拷贝函数 - 简化为JSON转换
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// 实体列表状态管理 - 简化版
export interface EntityListState {
  entities: Entity[];
  selectedEntityId: string | null;
  loading: boolean;
  error: string | null;

  // 基本操作
  setEntities: (entities: Entity[]) => void;
  setSelectedEntityId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 实体操作 - 直接操作实体，自动管理状态
  addEntity: (entity: Entity) => void;
  updateEntity: (indexId: string, updates: Partial<Entity>) => void;
  updateEntityField: (indexId: string, field: string, value: any) => void;
  deleteEntity: (indexId: string) => Promise<void>;
  getEntity: (indexId: string) => Entity | undefined;
  getEntityByStableId: (stableId: string) => Entity | undefined;
  clearNewEntities: () => void;

  // 属性操作
  updateEntityAttribute: (
    entityIndexId: string,
    attributeId: string,
    field: string,
    value: any
  ) => void;
  addAttributeToEntity: (entityIndexId: string) => void;
  removeAttributeFromEntity: (entityIndexId: string, attributeId: string) => void;

  // 异步操作
  loadEntities: () => Promise<void>;
  saveEntity: (entity: Entity) => Promise<void>;
  removeEntity: (id: string) => Promise<void>;
}

export const useEntityListStore = create<EntityListState>((set, get) => ({
  entities: [],
  selectedEntityId: null,
  loading: false,
  error: null,

  setEntities: (entities) => set({ entities }),
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  addEntity: (entity) =>
    set((state) => {
      const newEntity = {
        ...entity,
        _status: 'new' as const,
        _indexId: entity._indexId || nanoid(),
      };

      // 新增实体添加到顶部
      const otherEntities = state.entities.filter((e) => e._status !== 'new');
      const newEntities = state.entities.filter((e) => e._status === 'new');

      return {
        entities: [...newEntities, newEntity, ...otherEntities],
      };
    }),

  updateEntity: (indexId, updates) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity._indexId === indexId
          ? {
              ...entity,
              ...updates,
              // 🎯 如果更新中明确指定了_status，则使用指定的状态；否则自动管理状态
              _status:
                updates._status !== undefined
                  ? updates._status
                  : entity._status === 'new'
                  ? 'new'
                  : 'dirty',
            }
          : entity
      ),
    })),

  // 🎯 简化的字段更新 - 直接更新实体字段并标记为dirty
  updateEntityField: (indexId, field, value) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity._indexId === indexId
          ? {
              ...entity,
              [field]: value,
              _status: entity._status === 'new' ? 'new' : 'dirty', // 🎯 自动管理状态
            }
          : entity
      ),
    })),

  // 🎯 属性更新
  updateEntityAttribute: (entityIndexId, attributeId, field, value) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: (entity.attributes || []).map((attr) =>
                attr._indexId === attributeId ? { ...attr, [field]: value } : attr
              ),
              _status: entity._status === 'new' ? 'new' : 'dirty', // 🎯 修改属性也标记实体为dirty
            }
          : entity
      ),
    })),

  // 🎯 添加属性
  addAttributeToEntity: (entityIndexId) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: [
                ...(entity.attributes || []),
                {
                  _indexId: nanoid(),
                  id: '',
                  name: '',
                  type: 's',
                  _status: 'new' as const,
                },
              ],
              _status: entity._status === 'new' ? 'new' : 'dirty',
            }
          : entity
      ),
    })),

  // 🎯 删除属性
  removeAttributeFromEntity: (entityIndexId, attributeId) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity._indexId === entityIndexId
          ? {
              ...entity,
              attributes: (entity.attributes || []).filter((attr) => attr._indexId !== attributeId),
              _status: entity._status === 'new' ? 'new' : 'dirty',
            }
          : entity
      ),
    })),

  deleteEntity: async (indexId) => {
    const entity = get().entities.find((e) => e._indexId === indexId);
    if (!entity) {
      console.warn('⚠️ 删除失败：找不到实体', indexId);
      return;
    }

    try {
      // 如果是新增状态的实体，直接从本地删除
      if (entity._status === 'new') {
        console.log('🗑️ 删除新增实体（仅本地）:', entity.id || '无ID');
        set((state) => ({
          entities: state.entities.filter((e) => e._indexId !== indexId),
          selectedEntityId: state.selectedEntityId === indexId ? null : state.selectedEntityId,
        }));
        return;
      }

      // 已保存的实体需要调用API删除
      console.log('🗑️ 调用API删除实体:', entity.id);
      await entityApi.delete(entity.id);

      // API调用成功后，从本地状态删除
      set((state) => ({
        entities: state.entities.filter((e) => e._indexId !== indexId),
        selectedEntityId: state.selectedEntityId === indexId ? null : state.selectedEntityId,
      }));

      console.log('✅ 实体删除成功:', entity.id);
    } catch (error) {
      console.error('❌ 实体删除失败:', error);
      throw error;
    }
  },

  getEntity: (indexId) => get().entities.find((entity) => entity._indexId === indexId),

  getEntityByStableId: (stableId) => get().entities.find((entity) => entity._indexId === stableId),

  clearNewEntities: () =>
    set((state) => ({
      entities: state.entities.filter((entity) => entity._status !== 'new'),
    })),

  loadEntities: async () => {
    set({ loading: true, error: null });
    try {
      const fetchedEntities = await entityApi.getAll();

      if (!fetchedEntities || !Array.isArray(fetchedEntities)) {
        throw new Error('Invalid entities data received');
      }

      // 为实体添加索引和状态
      const entitiesWithIndex = fetchedEntities.map((entity) => ({
        ...entity,
        _indexId: entity._indexId || nanoid(),
        _status: 'saved' as const, // 🎯 从后台加载的实体都是已保存状态
        attributes: (entity.attributes || []).map((attr) => ({
          ...attr,
          _indexId: attr._indexId || nanoid(),
          _status: 'saved' as const,
        })),
      })) as Entity[];

      // 保留当前新增的实体，合并到加载的实体中
      const currentNewEntities = get().entities.filter((e) => e._status === 'new');
      const sortedLoadedEntities = entitiesWithIndex.sort((a, b) => a.id.localeCompare(b.id));

      set({
        entities: [...currentNewEntities, ...sortedLoadedEntities],
        loading: false,
      });

      console.log(
        `✅ 加载完成，共 ${currentNewEntities.length + sortedLoadedEntities.length} 个实体`
      );
    } catch (error) {
      console.error('❌ 加载实体失败:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load entities',
        loading: false,
      });
    }
  },

  saveEntity: async (entity) => {
    const { updateEntity } = get();

    // 确保实体有_indexId
    if (!entity._indexId) {
      entity._indexId = nanoid();
    }

    // 设置为保存中状态
    updateEntity(entity._indexId, { _editStatus: 'saving' });

    try {
      let savedEntity;
      if (entity._status === 'new') {
        console.log('📝 创建新实体:', entity.id);
        savedEntity = await entityApi.create(entity);
      } else {
        console.log('📝 更新实体:', entity.id);
        savedEntity = await entityApi.update(entity.id, entity);
      }

      // 更新为已保存状态，同时更新所有属性的状态
      updateEntity(entity._indexId, {
        ...savedEntity,
        _status: 'saved',
        _editStatus: undefined,
        attributes: (entity.attributes || []).map((attr) => ({
          ...attr,
          _status: 'saved' as const,
        })),
      });

      console.log('✅ 实体保存成功:', entity.id);
    } catch (error) {
      console.error('❌ 实体保存失败:', error);
      // 恢复原状态
      updateEntity(entity._indexId, { _editStatus: undefined });
      throw error;
    }
  },

  removeEntity: async (id) => {
    set({ loading: true });
    try {
      await entityApi.delete(id);
      set((state) => ({
        entities: state.entities.filter((entity) => entity.id !== id),
        loading: false,
      }));
      console.log('✅ 实体删除成功:', id);
    } catch (error) {
      console.error('❌ 实体删除失败:', error);
      set({ loading: false });
      throw error;
    }
  },
}));

// Hook导出 - 使用 useMemo 缓存返回对象
export const useEntityList = () => {
  const entities = useEntityListStore((state) => state.entities);
  const selectedEntityId = useEntityListStore((state) => state.selectedEntityId);
  const loading = useEntityListStore((state) => state.loading);
  const error = useEntityListStore((state) => state.error);

  return useMemo(
    () => ({
      entities,
      selectedEntityId,
      loading,
      error,
    }),
    [entities, selectedEntityId, loading, error]
  );
};

export const useEntityListActions = () => {
  const setEntities = useEntityListStore((state) => state.setEntities);
  const setSelectedEntityId = useEntityListStore((state) => state.setSelectedEntityId);
  const setLoading = useEntityListStore((state) => state.setLoading);
  const setError = useEntityListStore((state) => state.setError);
  const addEntity = useEntityListStore((state) => state.addEntity);
  const updateEntity = useEntityListStore((state) => state.updateEntity);
  const updateEntityField = useEntityListStore((state) => state.updateEntityField);
  const updateEntityAttribute = useEntityListStore((state) => state.updateEntityAttribute);
  const addAttributeToEntity = useEntityListStore((state) => state.addAttributeToEntity);
  const removeAttributeFromEntity = useEntityListStore((state) => state.removeAttributeFromEntity);
  const deleteEntity = useEntityListStore((state) => state.deleteEntity);
  const getEntity = useEntityListStore((state) => state.getEntity);
  const getEntityByStableId = useEntityListStore((state) => state.getEntityByStableId);
  const clearNewEntities = useEntityListStore((state) => state.clearNewEntities);
  const loadEntities = useEntityListStore((state) => state.loadEntities);
  const saveEntity = useEntityListStore((state) => state.saveEntity);
  const removeEntity = useEntityListStore((state) => state.removeEntity);

  return useMemo(
    () => ({
      setEntities,
      setSelectedEntityId,
      setLoading,
      setError,
      addEntity,
      updateEntity,
      updateEntityField,
      updateEntityAttribute,
      addAttributeToEntity,
      removeAttributeFromEntity,
      deleteEntity,
      getEntity,
      getEntityByStableId,
      clearNewEntities,
      loadEntities,
      saveEntity,
      removeEntity,
    }),
    [
      setEntities,
      setSelectedEntityId,
      setLoading,
      setError,
      addEntity,
      updateEntity,
      updateEntityField,
      updateEntityAttribute,
      addAttributeToEntity,
      removeAttributeFromEntity,
      deleteEntity,
      getEntity,
      getEntityByStableId,
      clearNewEntities,
      loadEntities,
      saveEntity,
      removeEntity,
    ]
  );
};
