import { useShallow } from 'zustand/react/shallow';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep } from 'lodash-es';
import { set as lodashSet } from 'lodash-es';

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

  // 单个属性更新（避免数组重建）
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

// 创建当前实体编辑store
export const useCurrentEntityStore = create<CurrentEntityStore>()(
  devtools(
    (set, get) => ({
      // 初始状态
      selectedEntityId: null,
      originalEntity: null,
      editingEntity: null,
      isDirty: false,
      isSaving: false,
      error: null,

      // 选择实体（创建编辑副本）
      selectEntity: (entity) => {
        if (!entity) {
          set(
            {
              selectedEntityId: null,
              originalEntity: null,
              editingEntity: null,
              isDirty: false,
              error: null,
            },
            false,
            'selectEntity:null'
          );
          return;
        }

        // 确保实体有稳定的_indexId
        if (!entity._indexId) {
          entity._indexId = nanoid();
        }

        set(
          {
            selectedEntityId: entity._indexId,
            originalEntity: cloneDeep(entity),
            editingEntity: cloneDeep(entity),
            isDirty: false,
            error: null,
          },
          false,
          'selectEntity'
        );
      },

      // 更新属性（支持深度路径）
      updateProperty: (path, value) => {
        const { editingEntity, originalEntity } = get();
        if (!editingEntity || !originalEntity) return;

        const newEditingEntity = cloneDeep(editingEntity);
        lodashSet(newEditingEntity, path, value);

        // 检查是否有变化
        const isDirty = JSON.stringify(newEditingEntity) !== JSON.stringify(originalEntity);

        set(
          {
            editingEntity: newEditingEntity,
            isDirty,
            error: null,
          },
          false,
          `updateProperty:${path}`
        );
      },

      // 更新整个实体的部分字段
      updateEntity: (updates) => {
        const { editingEntity, originalEntity } = get();
        if (!editingEntity || !originalEntity) return;

        const newEditingEntity = { ...editingEntity, ...updates };
        const isDirty = JSON.stringify(newEditingEntity) !== JSON.stringify(originalEntity);

        set(
          {
            editingEntity: newEditingEntity,
            isDirty,
            error: null,
          },
          false,
          'updateEntity'
        );
      },

      // 更新单个属性字段（避免数组重建，保持input焦点）
      updateAttributeProperty: (attributeIndexId, field, value) => {
        const { editingEntity, originalEntity } = get();
        if (!editingEntity || !originalEntity || !editingEntity.attributes) return;

        // 在原数组中直接找到并更新对应属性，避免创建新数组
        const newEditingEntity = cloneDeep(editingEntity);
        const targetAttribute = newEditingEntity.attributes.find(
          (attr) => (attr as any)._indexId === attributeIndexId
        );

        if (targetAttribute) {
          (targetAttribute as any)[field] = value;

          // 检查是否有变化
          const isDirty = JSON.stringify(newEditingEntity) !== JSON.stringify(originalEntity);

          set(
            {
              editingEntity: newEditingEntity,
              isDirty,
              error: null,
            },
            false,
            `updateAttributeProperty:${attributeIndexId}.${field}`
          );
        }
      },

      // 添加新属性
      addAttribute: (attribute) => {
        const { editingEntity, originalEntity } = get();
        if (!editingEntity || !originalEntity) return;

        const newEditingEntity = cloneDeep(editingEntity);
        if (!newEditingEntity.attributes) {
          newEditingEntity.attributes = [];
        }
        newEditingEntity.attributes.push(attribute);

        const isDirty = JSON.stringify(newEditingEntity) !== JSON.stringify(originalEntity);

        set(
          {
            editingEntity: newEditingEntity,
            isDirty,
            error: null,
          },
          false,
          'addAttribute'
        );
      },

      // 删除属性
      removeAttribute: (attributeIndexId) => {
        const { editingEntity, originalEntity } = get();
        if (!editingEntity || !originalEntity || !editingEntity.attributes) return;

        const newEditingEntity = cloneDeep(editingEntity);
        newEditingEntity.attributes = newEditingEntity.attributes.filter(
          (attr) => (attr as any)._indexId !== attributeIndexId
        );

        const isDirty = JSON.stringify(newEditingEntity) !== JSON.stringify(originalEntity);

        set(
          {
            editingEntity: newEditingEntity,
            isDirty,
            error: null,
          },
          false,
          'removeAttribute'
        );
      },

      // 重置更改
      resetChanges: () => {
        const { originalEntity } = get();
        if (!originalEntity) return;

        set(
          {
            editingEntity: cloneDeep(originalEntity),
            isDirty: false,
            error: null,
          },
          false,
          'resetChanges'
        );
      },

      // 保存更改（这里只是示例，实际需要调用API）
      saveChanges: async () => {
        const { editingEntity } = get();
        if (!editingEntity) return;

        set({ isSaving: true, error: null }, false, 'saveChanges:start');

        try {
          // TODO: 调用实际的保存API
          console.log('Saving entity:', editingEntity);

          // 模拟异步保存
          await new Promise((resolve) => setTimeout(resolve, 1000));

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
