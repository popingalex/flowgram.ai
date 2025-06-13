import { useShallow } from 'zustand/react/shallow';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { Entity } from '../services/types';
import { entityApi } from '../services/api-service';

// 实体列表状态管理
export interface EntityListState {
  entities: Entity[];
  selectedEntityId: string | null;
  loading: boolean;
  error: string | null;

  // 状态操作
  setEntities: (entities: Entity[]) => void;
  setSelectedEntityId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // 实体操作
  addEntity: (entity: Entity) => void;
  updateEntity: (id: string, entity: Partial<Entity>) => void;
  deleteEntity: (id: string) => void;
  getEntity: (id: string) => Entity | undefined;
  getEntityByStableId: (stableId: string) => Entity | undefined;

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
    set((state) => ({
      entities: [...state.entities, entity],
    })),

  updateEntity: (id, updates) =>
    set((state) => ({
      entities: state.entities.map((entity) =>
        entity.id === id || entity._indexId === id ? { ...entity, ...updates } : entity
      ),
    })),

  deleteEntity: (id) =>
    set((state) => ({
      entities: state.entities.filter((entity) => entity.id !== id && entity._indexId !== id),
      selectedEntityId: state.selectedEntityId === id ? null : state.selectedEntityId,
    })),

  getEntity: (id) => get().entities.find((entity) => entity.id === id),
  getEntityByStableId: (stableId) => get().entities.find((entity) => entity._indexId === stableId),

  loadEntities: async () => {
    set({ loading: true, error: null });
    try {
      const fetchedEntities = await entityApi.getAll();

      if (!fetchedEntities || !Array.isArray(fetchedEntities)) {
        throw new Error('Invalid entities data received');
      }

      // 为没有索引ID的实体和属性生成稳定的索引
      const entitiesWithIndex = fetchedEntities.map((entity) => {
        // 为实体生成稳定的_indexId
        if (!entity._indexId) {
          entity._indexId = nanoid();
        }

        return {
          ...entity,
          attributes: (entity.attributes || []).map((attr) => {
            if (!attr._indexId) {
              attr._indexId = nanoid();
            }
            return attr;
          }),
        };
      });

      set({
        entities: entitiesWithIndex,
        loading: false,
      });

      console.log(
        `[EntityStore] 加载完成，共 ${entitiesWithIndex.length} 个实体:`,
        entitiesWithIndex
      );
    } catch (error) {
      console.error('Failed to load entities:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to load entities',
        loading: false,
        entities: [],
      });
    }
  },

  saveEntity: async (entity) => {
    set({ loading: true, error: null });
    try {
      // 确保实体有稳定的_indexId
      if (!entity._indexId) {
        entity._indexId = nanoid();
      }

      const savedEntity = await entityApi.update(entity.id, entity);

      set((state) => {
        const existingIndex = state.entities.findIndex(
          (e) => e.id === savedEntity.id || e._indexId === savedEntity._indexId
        );

        if (existingIndex >= 0) {
          // 更新现有实体
          const newEntities = [...state.entities];
          newEntities[existingIndex] = savedEntity;
          return { entities: newEntities, loading: false };
        } else {
          // 添加新实体
          return {
            entities: [...state.entities, savedEntity],
            loading: false,
          };
        }
      });
    } catch (error) {
      console.error('Failed to save entity:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to save entity',
        loading: false,
      });
    }
  },

  removeEntity: async (entityId) => {
    set({ loading: true, error: null });
    try {
      await entityApi.delete(entityId);

      set((state) => ({
        entities: state.entities.filter(
          (entity) => entity.id !== entityId && entity._indexId !== entityId
        ),
        selectedEntityId: state.selectedEntityId === entityId ? null : state.selectedEntityId,
        loading: false,
      }));
    } catch (error) {
      console.error('Failed to delete entity:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to delete entity',
        loading: false,
      });
    }
  },
}));

// 便捷的选择器hooks
export const useEntityList = () =>
  useEntityListStore(
    useShallow((state) => ({
      entities: state.entities,
      loading: state.loading,
      error: state.error,
    }))
  );

export const useEntityListActions = () =>
  useEntityListStore(
    useShallow((state) => ({
      loadEntities: state.loadEntities,
      getEntity: state.getEntity,
      getEntityByStableId: state.getEntityByStableId,
      addEntity: state.addEntity,
      updateEntity: state.updateEntity,
      deleteEntity: state.deleteEntity,
      setEntities: state.setEntities,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  );
