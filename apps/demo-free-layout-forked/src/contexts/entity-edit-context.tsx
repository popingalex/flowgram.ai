import { type ReactNode, createContext, useContext, useRef, useMemo, useCallback } from 'react';

import { devtools } from 'zustand/middleware';
import { createStore, useStore } from 'zustand';
import { cloneDeep, set as lodashSet, get as lodashGet } from 'lodash-es';

import type { Entity } from '../services/types';

// 编辑状态
interface EntityEditState {
  originalEntity: Entity;
  editingEntity: Entity;
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// 编辑操作
interface EntityEditActions {
  updateProperty: (path: string, value: any) => void;
  updateEntity: (updates: Partial<Entity>) => void;
  resetChanges: () => void;
  saveChanges: () => Promise<void>;
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
}

type EntityEditStore = EntityEditState & EntityEditActions;

// 创建编辑store的工厂函数
const createEntityEditStore = (initialEntity: Entity) =>
  createStore<EntityEditStore>()(
    devtools(
      (set, get) => ({
        // 初始状态
        originalEntity: initialEntity,
        editingEntity: cloneDeep(initialEntity),
        isDirty: false,
        isSaving: false,
        error: null,

        // 更新属性（支持深度路径）
        updateProperty: (path, value) => {
          set(
            (state) => {
              const newEditingEntity = cloneDeep(state.editingEntity);
              lodashSet(newEditingEntity, path, value);

              // 检查是否有变化
              const isDirty =
                JSON.stringify(newEditingEntity) !== JSON.stringify(state.originalEntity);

              return {
                editingEntity: newEditingEntity,
                isDirty,
                error: null, // 清除错误
              };
            },
            false,
            `updateProperty:${path}`
          );
        },

        // 更新整个实体的部分字段
        updateEntity: (updates) => {
          set(
            (state) => {
              const newEditingEntity = { ...state.editingEntity, ...updates };
              const isDirty =
                JSON.stringify(newEditingEntity) !== JSON.stringify(state.originalEntity);

              return {
                editingEntity: newEditingEntity,
                isDirty,
                error: null,
              };
            },
            false,
            'updateEntity'
          );
        },

        // 重置更改
        resetChanges: () => {
          set(
            (state) => ({
              editingEntity: cloneDeep(state.originalEntity),
              isDirty: false,
              error: null,
            }),
            false,
            'resetChanges'
          );
        },

        // 保存更改（这里只是示例，实际需要调用API）
        saveChanges: async () => {
          const { editingEntity, originalEntity } = get();

          set({ isSaving: true, error: null }, false, 'saveChanges:start');

          try {
            // TODO: 调用实际的保存API
            console.log('Saving entity:', editingEntity);

            // 🔧 移除模拟异步保存的延迟，直接完成保存
            set(
              {
                originalEntity: cloneDeep(editingEntity),
                isDirty: false,
                isSaving: false,
              },
              false,
              'saveChanges:success'
            );
          } catch (error) {
            set(
              {
                isSaving: false,
                error: error instanceof Error ? error.message : 'Save failed',
              },
              false,
              'saveChanges:error'
            );
          }
        },

        // 设置错误
        setError: (error) => {
          set({ error }, false, 'setError');
        },

        // 设置保存状态
        setSaving: (saving) => {
          set({ isSaving: saving }, false, 'setSaving');
        },
      }),
      { name: 'entity-edit-store' }
    )
  );

// Context类型
export type EntityEditStoreApi = ReturnType<typeof createEntityEditStore>;

// 创建Context
export const EntityEditContext = createContext<EntityEditStoreApi | null>(null);

// Provider组件属性
export interface EntityEditProviderProps {
  entity: Entity;
  children: ReactNode;
}

// Provider组件
export const EntityEditProvider = ({ entity, children }: EntityEditProviderProps) => {
  const storeRef = useRef<EntityEditStoreApi | null>(null);

  // 只在entity变化时重新创建store（使用稳定的_indexId而不是可变的id）
  const currentEntityId = storeRef.current?.getState().originalEntity._indexId;
  const newEntityId = entity._indexId;

  if (storeRef.current === null || currentEntityId !== newEntityId) {
    storeRef.current = createEntityEditStore(entity);
  }

  return (
    <EntityEditContext.Provider value={storeRef.current}>{children}</EntityEditContext.Provider>
  );
};

// 自定义Hook - 选择器版本
export const useEntityEdit = <T,>(selector: (store: EntityEditStore) => T): T => {
  const entityEditContext = useContext(EntityEditContext);

  if (entityEditContext === null) {
    throw new Error('useEntityEdit must be used within EntityEditProvider');
  }

  return useStore(entityEditContext, selector);
};

// 自定义Hook - 便捷版本（获取完整状态和操作）
export const useEntityEditStore = () => useEntityEdit((state) => state);

// 自定义Hook - 只获取状态
export const useEntityEditState = () => {
  const state = useEntityEdit((state) => state);

  return useMemo(
    () => ({
      originalEntity: state.originalEntity,
      editingEntity: state.editingEntity,
      isDirty: state.isDirty,
      isSaving: state.isSaving,
      error: state.error,
    }),
    [state.originalEntity, state.editingEntity, state.isDirty, state.isSaving, state.error]
  );
};

// 自定义Hook - 只获取操作
export const useEntityEditActions = () => {
  const state = useEntityEdit((state) => state);

  return useMemo(
    () => ({
      updateProperty: state.updateProperty,
      updateEntity: state.updateEntity,
      resetChanges: state.resetChanges,
      saveChanges: state.saveChanges,
      setError: state.setError,
      setSaving: state.setSaving,
    }),
    [
      state.updateProperty,
      state.updateEntity,
      state.resetChanges,
      state.saveChanges,
      state.setError,
      state.setSaving,
    ]
  );
};

// 导出类型
export type { EntityEditStore, EntityEditState, EntityEditActions };
