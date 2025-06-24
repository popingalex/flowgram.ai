import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep, isEqual } from 'lodash-es';

import type { Entity, ItemStatus } from '../services/types';

// 深度比较实体数据，忽略状态字段
const deepCompareEntities = (entity1: Entity | null, entity2: Entity | null): boolean => {
  if (!entity1 && !entity2) return true;
  if (!entity1 || !entity2) return false;

  // 创建副本，移除状态字段进行比较
  const clean1 = cleanEntityForComparison(entity1);
  const clean2 = cleanEntityForComparison(entity2);

  // 🎯 特殊处理：bundles字段的undefined和空数组视为相等
  const bundles1 = clean1.bundles || [];
  const bundles2 = clean2.bundles || [];

  if (bundles1.length === 0 && bundles2.length === 0) {
    // 如果两个都是空的，创建副本并统一设为空数组进行比较
    clean1.bundles = [];
    clean2.bundles = [];
  }

  const areEqual = isEqual(clean1, clean2);

  // 🔍 添加详细的调试日志
  console.log('🔍 [DeepCompare] 实体深度比较:', {
    entity1Id: entity1.id,
    entity2Id: entity2.id,
    areEqual,
    bundles1: entity1.bundles,
    bundles2: entity2.bundles,
    cleanBundles1: clean1.bundles,
    cleanBundles2: clean2.bundles,
    clean1Keys: Object.keys(clean1).sort(),
    clean2Keys: Object.keys(clean2).sort(),
    jsonEqual: JSON.stringify(clean1) === JSON.stringify(clean2),
  });

  // 如果不相等，详细分析差异
  if (!areEqual) {
    const allKeys = new Set([...Object.keys(clean1), ...Object.keys(clean2)]);
    const differences: string[] = [];

    for (const key of allKeys) {
      if (!(key in clean1)) {
        differences.push(`${key}: missing in original`);
      } else if (!(key in clean2)) {
        differences.push(`${key}: missing in editing`);
      } else if (JSON.stringify(clean1[key]) !== JSON.stringify(clean2[key])) {
        differences.push(
          `${key}: ${JSON.stringify(clean1[key])} vs ${JSON.stringify(clean2[key])}`
        );
      }
    }

    console.log('❌ [DeepCompare] 发现差异:', differences);
  }

  return areEqual;
};

// 清理实体数据，移除状态字段和动态字段
const cleanEntityForComparison = (entity: Entity): any => {
  console.log('🧹 [CleanEntity] 清理前的实体:', {
    id: entity.id,
    keys: Object.keys(entity).sort(),
    bundles: entity.bundles,
    moduleIds: (entity as any).moduleIds,
    attributes: entity.attributes?.map((attr) => ({
      id: attr.id,
      _indexId: (attr as any)._indexId,
      _status: (attr as any)._status,
    })),
  });

  const cleaned = { ...entity };

  // 移除实体级别的状态字段和索引字段
  delete (cleaned as any)._status;
  delete (cleaned as any)._editStatus;
  delete (cleaned as any)._originalId;
  delete (cleaned as any)._indexId; // 🎯 修复：移除索引字段
  delete (cleaned as any).moduleIds; // 🎯 修复：移除moduleIds字段，只比较bundles

  // 🎯 修复：统一处理bundles字段，undefined和空数组都视为空数组
  if (!cleaned.bundles || !Array.isArray(cleaned.bundles) || cleaned.bundles.length === 0) {
    cleaned.bundles = []; // 统一为空数组
  } else {
    cleaned.bundles = [...cleaned.bundles].sort(); // 排序
  }

  // 清理属性数组中的状态字段和索引字段，并按id排序确保比较一致性
  if (cleaned.attributes) {
    cleaned.attributes = cleaned.attributes
      .map((attr: any) => {
        const cleanedAttr = { ...attr };
        delete cleanedAttr._status;
        delete cleanedAttr._editStatus;
        delete cleanedAttr._indexId; // 🎯 修复：移除属性的索引字段
        delete cleanedAttr._id; // 🎯 修复：移除可能存在的旧索引字段
        return cleanedAttr;
      })
      .sort((a: any, b: any) => a.id.localeCompare(b.id)); // 按id排序
  }

  console.log('🧹 [CleanEntity] 清理后的实体:', {
    id: entity.id,
    keys: Object.keys(cleaned).sort(),
    bundles: cleaned.bundles,
    attributes: cleaned.attributes?.map((attr) => ({
      id: attr.id,
      keys: Object.keys(attr).sort(),
    })),
  });

  return cleaned;
};

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

  // 刷新实体数据
  refreshEntity: (entityId: string) => Promise<void>;

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

          // 🎯 优化：避免不必要的重新创建工作副本
          if (state.selectedEntityId === entity._indexId) {
            console.log('🔄 实体已选中，跳过重新创建工作副本:', entity.id);
            return;
          }

          // 创建副本，避免修改外部对象
          const entityCopy = cloneDeep(entity);

          // 🔑 实体应该在加载时就有_indexId，这里不应该重新生成
          if (!entityCopy._indexId) {
            console.error('[CurrentEntity] 实体缺少_indexId，这不应该发生！', entityCopy);
            entityCopy._indexId = nanoid(); // 仅作为后备方案
          }

          console.log('🔄 创建新的工作副本:', entity.id);
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

          // 🎯 修复：使用深度比较检查是否有变化
          state.isDirty = !deepCompareEntities(state.editingEntity, state.originalEntity);
          state.error = null;
        });
      },

      // 更新整个实体的部分字段
      updateEntity: (updates) => {
        set((state) => {
          if (!state.editingEntity || !state.originalEntity) return;

          console.log('🔄 [UpdateEntity] 更新实体字段:', {
            entityId: state.editingEntity.id,
            updates,
            beforeUpdate: {
              bundles: state.editingEntity.bundles,
              moduleIds: (state.editingEntity as any).moduleIds,
            },
          });

          Object.assign(state.editingEntity, updates);

          console.log('🔄 [UpdateEntity] 更新后状态:', {
            entityId: state.editingEntity.id,
            afterUpdate: {
              bundles: state.editingEntity.bundles,
              moduleIds: (state.editingEntity as any).moduleIds,
            },
          });

          // 🎯 修复：使用深度比较检查是否有变化
          const wasDirty = state.isDirty;
          state.isDirty = !deepCompareEntities(state.editingEntity, state.originalEntity);

          console.log('🔄 [UpdateEntity] Dirty状态变化:', {
            entityId: state.editingEntity.id,
            wasDirty,
            nowDirty: state.isDirty,
            stateChanged: wasDirty !== state.isDirty,
          });

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

            // 状态管理：如果不是新增状态，标记为已修改
            if (targetAttribute._status !== 'new') {
              targetAttribute._status = 'modified';
            }

            // 🎯 修复：使用深度比较检查是否有变化
            state.isDirty = !deepCompareEntities(state.editingEntity, state.originalEntity);
            state.error = null;

            console.log('🔍 Immer属性字段更新完成:', {
              属性ID: attributeIndexId,
              字段: field,
              新值: value,
              状态: targetAttribute._status,
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

          // 确保新属性有正确的状态
          const newAttribute = {
            ...attribute,
            _status: attribute._status || 'new', // 默认为新增状态
          };

          // 🎯 修复：新属性添加到末尾，保持添加顺序的直觉性
          state.editingEntity.attributes.push(newAttribute);
          // 🎯 修复：使用深度比较检查是否有变化
          state.isDirty = !deepCompareEntities(state.editingEntity, state.originalEntity);
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

            // 🎯 修复：使用深度比较检查是否有变化
            state.isDirty = !deepCompareEntities(state.editingEntity, state.originalEntity);
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

      // 保存更改（调用实际的API）
      saveChanges: async () => {
        const currentState = get();
        if (!currentState.editingEntity) return;

        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // 🎯 使用EntityListStore的saveEntity方法，它会处理ID转换
          const { useEntityListStore } = require('./entity-list');
          await useEntityListStore.getState().saveEntity(currentState.editingEntity);

          set((state) => {
            state.originalEntity = cloneDeep(state.editingEntity);
            state.isDirty = false;
            state.isSaving = false;
          });

          console.log('✅ 实体保存成功:', currentState.editingEntity.id);
        } catch (error) {
          console.error('❌ 实体保存失败:', error);
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

      // 刷新实体数据
      refreshEntity: async (entityId) => {
        const currentState = get();

        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // 导入API服务
          const { entityApi } = require('../services/api-service');

          // 从API获取最新的实体数据
          const refreshedEntity = await entityApi.getById(entityId);

          if (!refreshedEntity) {
            throw new Error('实体不存在');
          }

          // 确保实体有_indexId
          if (!refreshedEntity._indexId) {
            refreshedEntity._indexId = currentState.editingEntity?._indexId || nanoid();
          }

          // 确保属性有_indexId
          if (refreshedEntity.attributes) {
            refreshedEntity.attributes = refreshedEntity.attributes.map((attr: any) => ({
              ...attr,
              _indexId: attr._indexId || nanoid(),
              _status: 'saved' as const,
            }));
          }

          // 更新当前编辑的实体
          set((state) => {
            const updatedEntity = {
              ...refreshedEntity,
              _status: 'saved' as const,
            };

            state.originalEntity = cloneDeep(updatedEntity);
            state.editingEntity = cloneDeep(updatedEntity);
            state.isDirty = false;
            state.isSaving = false;
            state.error = null;
          });

          // 同时更新实体列表中的数据
          const { useEntityListStore } = require('./entity-list');
          const entityListStore = useEntityListStore.getState();
          const entityInList = entityListStore.entities.find((e: Entity) => e.id === entityId);

          if (entityInList && entityInList._indexId) {
            entityListStore.updateEntity(entityInList._indexId, {
              ...refreshedEntity,
              _status: 'saved' as const,
            });
          }

          console.log('✅ 实体数据刷新成功:', entityId);
        } catch (error) {
          console.error('❌ 实体数据刷新失败:', error);
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : 'Refresh failed';
          });
          throw error;
        }
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
      refreshEntity: state.refreshEntity,
      setError: state.setError,
      setSaving: state.setSaving,
    }))
  );
