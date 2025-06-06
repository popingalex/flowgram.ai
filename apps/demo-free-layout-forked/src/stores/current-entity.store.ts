import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep } from 'lodash-es';

import type { Entity } from '../services/types';

// 当前实体编辑状态
export interface CurrentEntityState {
  // 选择状态
  selectedEntityId: string | null;

  // 编辑状态
  originalEntity: Entity | null;
  editingEntity: Entity | null;

  // 状态标记
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// 当前实体编辑操作
export interface CurrentEntityActions {
  // 选择实体（创建编辑副本）
  selectEntity: (entity: Entity | null) => void;

  // 编辑操作
  updateProperty: (path: string, value: any) => void;
  updateEntity: (updates: Partial<Entity>) => void;

  // 单个属性更新（使用Immer，安全的直接修改）
  updateAttributeProperty: (attributeIndexId: string, field: string, value: any) => void;
  addAttribute: (attribute: any) => void;
  removeAttribute: (attributeIndexId: string) => void;

  // 保存/重置
  saveChanges: () => Promise<void>;
  resetChanges: () => void;

  // 状态管理
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
}

type CurrentEntityStore = CurrentEntityState & CurrentEntityActions;

// 创建当前实体编辑store，使用Immer中间件
export const useCurrentEntityStore = create<CurrentEntityStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      selectedEntityId: null,
      originalEntity: null,
      editingEntity: null,
      isDirty: false,
      isSaving: false,
      error: null,

      // 选择实体（创建编辑副本）
      selectEntity: (entity) => {
        set((state) => {
          if (!entity) {
            state.selectedEntityId = null;
            state.originalEntity = null;
            state.editingEntity = null;
            state.isDirty = false;
            state.error = null;
            return;
          }

          // 创建副本，避免修改外部对象
          const entityCopy = cloneDeep(entity);

          // 确保实体有稳定的_indexId
          if (!entityCopy._indexId) {
            entityCopy._indexId = nanoid();
          }

          state.selectedEntityId = entityCopy._indexId;
          state.originalEntity = cloneDeep(entityCopy);
          state.editingEntity = cloneDeep(entityCopy);
          state.isDirty = false;
          state.error = null;
        });
      },

      // 更新属性（支持深度路径）
      updateProperty: (path, value) => {
        set((state) => {
          if (!state.editingEntity || !state.originalEntity) return;

          // 简单路径处理，支持 "id", "name" 等
          if (path.includes('.')) {
            // 复杂路径暂时不支持
            console.warn('Complex path not supported yet:', path);
            return;
          }

          (state.editingEntity as any)[path] = value;

          // 检查是否有变化
          state.isDirty =
            JSON.stringify(state.editingEntity) !== JSON.stringify(state.originalEntity);
          state.error = null;
        });
      },

      // 更新整个实体的部分字段
      updateEntity: (updates) => {
        set((state) => {
          if (!state.editingEntity || !state.originalEntity) return;

          Object.assign(state.editingEntity, updates);

          state.isDirty =
            JSON.stringify(state.editingEntity) !== JSON.stringify(state.originalEntity);
          state.error = null;
        });
      },

      // 🎯 核心修复：使用Immer安全地直接修改属性
      updateAttributeProperty: (attributeIndexId, field, value) => {
        set((state) => {
          console.log('🔍 使用Immer更新属性字段:', {
            attributeIndexId,
            field,
            value,
          });

          // 找到目标属性
          const targetAttribute = state.editingEntity!.attributes!.find(
            (attr: any) => attr._indexId === attributeIndexId
          );

          if (targetAttribute) {
            // 🎯 使用Immer，可以安全地直接修改
            (targetAttribute as any)[field] = value;

            // 检查是否有变化
            state.isDirty =
              JSON.stringify(state.editingEntity!) !== JSON.stringify(state.originalEntity!);
            state.error = null;

            console.log('🔍 Immer属性字段更新完成:', {
              属性ID: attributeIndexId,
              字段: field,
              新值: value,
              isDirty: state.isDirty,
            });
          }
        });
      },

      // 添加新属性
      addAttribute: (attribute) => {
        set((state) => {
          if (!state.editingEntity || !state.originalEntity) return;

          if (!state.editingEntity.attributes) {
            state.editingEntity.attributes = [];
          }

          state.editingEntity.attributes.push(attribute);
          state.isDirty = true;
          state.error = null;
        });
      },

      // 删除属性
      removeAttribute: (attributeIndexId) => {
        set((state) => {
          console.log('🗑️ Store: 开始删除属性:', {
            attributeIndexId,
            hasEditingEntity: !!state.editingEntity,
            hasAttributes: !!state.editingEntity?.attributes,
            attributesCount: state.editingEntity?.attributes?.length || 0,
          });

          if (!state.editingEntity || !state.originalEntity) {
            console.error('🗑️ Store: 没有正在编辑的实体');
            return;
          }

          if (!state.editingEntity.attributes) {
            console.error('🗑️ Store: 实体没有属性数组');
            state.editingEntity.attributes = [];
            return;
          }

          const index = state.editingEntity.attributes.findIndex(
            (attr: any) => attr._indexId === attributeIndexId
          );

          console.log('🗑️ Store: 查找结果:', {
            attributeIndexId,
            foundIndex: index,
            属性列表: state.editingEntity.attributes.map((attr: any) => ({
              id: attr.id,
              name: attr.name,
              _indexId: attr._indexId,
            })),
          });

          if (index !== -1) {
            const deletedAttr = state.editingEntity.attributes[index];

            // 使用Immer的splice方法删除
            state.editingEntity.attributes.splice(index, 1);

            state.isDirty = true;
            state.error = null;

            console.log('🗑️ Store: 删除成功:', {
              deletedAttr: {
                id: deletedAttr.id,
                name: deletedAttr.name,
                _indexId: deletedAttr._indexId,
              },
              remainingCount: state.editingEntity.attributes.length,
              isDirty: state.isDirty,
            });
          } else {
            console.warn('🗑️ Store: 未找到要删除的属性:', {
              searchingFor: attributeIndexId,
              availableIds: state.editingEntity.attributes.map((attr: any) => attr._indexId),
            });
          }
        });
      },

      // 重置更改
      resetChanges: () => {
        set((state) => {
          if (!state.originalEntity) return;

          state.editingEntity = cloneDeep(state.originalEntity);
          state.isDirty = false;
          state.error = null;
        });
      },

      // 保存更改（这里只是示例，实际需要调用API）
      saveChanges: async () => {
        const currentState = get();
        if (!currentState.editingEntity) return;

        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // TODO: 调用实际的保存API
          console.log('Saving entity:', currentState.editingEntity);

          // 模拟异步保存
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set((state) => {
            state.originalEntity = cloneDeep(state.editingEntity);
            state.isDirty = false;
            state.isSaving = false;
          });
        } catch (error) {
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : 'Save failed';
          });
        }
      },

      // 设置错误
      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      // 设置保存状态
      setSaving: (saving) => {
        set((state) => {
          state.isSaving = saving;
        });
      },
    })),
    { name: 'current-entity-store' }
  )
);

// 便捷的选择器hooks - 使用useShallow避免无限重新渲染
export const useCurrentEntity = () =>
  useCurrentEntityStore(
    useShallow((state) => ({
      selectedEntityId: state.selectedEntityId,
      originalEntity: state.originalEntity,
      editingEntity: state.editingEntity,
      isDirty: state.isDirty,
      isSaving: state.isSaving,
      error: state.error,
    }))
  );

export const useCurrentEntityActions = () =>
  useCurrentEntityStore(
    useShallow((state) => ({
      selectEntity: state.selectEntity,
      updateProperty: state.updateProperty,
      updateEntity: state.updateEntity,
      updateAttributeProperty: state.updateAttributeProperty,
      addAttribute: state.addAttribute,
      removeAttribute: state.removeAttribute,
      saveChanges: state.saveChanges,
      resetChanges: state.resetChanges,
      setError: state.setError,
      setSaving: state.setSaving,
    }))
  );
