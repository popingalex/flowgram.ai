import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep, isEqual } from 'lodash-es';

import type { Module, ItemStatus } from '../services/types';

// 深度比较模块数据，忽略状态字段
const deepCompareModules = (module1: Module | null, module2: Module | null): boolean => {
  if (!module1 && !module2) return true;
  if (!module1 || !module2) return false;

  // 创建副本，移除状态字段进行比较
  const clean1 = cleanModuleForComparison(module1);
  const clean2 = cleanModuleForComparison(module2);

  return isEqual(clean1, clean2);
};

// 清理模块数据，移除状态字段和动态字段
const cleanModuleForComparison = (module: Module): any => {
  const cleaned = { ...module };

  // 移除模块级别的状态字段
  delete (cleaned as any)._status;
  delete (cleaned as any)._editStatus;
  delete (cleaned as any)._originalId;

  // 清理属性数组中的状态字段
  if (cleaned.attributes) {
    cleaned.attributes = cleaned.attributes.map((attr: any) => {
      const cleanedAttr = { ...attr };
      delete cleanedAttr._status;
      delete cleanedAttr._editStatus;
      return cleanedAttr;
    });
  }

  return cleaned;
};

// 当前模块编辑状态
export interface CurrentModuleState {
  // 选择状态
  selectedModuleId: string | null;

  // 编辑状态
  originalModule: Module | null;
  editingModule: Module | null;

  // 状态标记
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// 当前模块编辑操作
export interface CurrentModuleActions {
  // 选择模块（创建编辑副本）
  selectModule: (module: Module | null) => void;

  // 编辑操作
  updateProperty: (path: string, value: any) => void;
  updateModule: (updates: Partial<Module>) => void;

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

type CurrentModuleStore = CurrentModuleState & CurrentModuleActions;

// 创建当前模块编辑store，使用Immer中间件
export const useCurrentModuleStore = create<CurrentModuleStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      selectedModuleId: null,
      originalModule: null,
      editingModule: null,
      isDirty: false,
      isSaving: false,
      error: null,

      // 选择模块（创建编辑副本）
      selectModule: (module) => {
        set((state) => {
          if (!module) {
            state.selectedModuleId = null;
            state.originalModule = null;
            state.editingModule = null;
            state.isDirty = false;
            state.error = null;
            return;
          }

          // 🎯 优化：避免不必要的重新创建工作副本
          if (state.selectedModuleId === module._indexId) {
            console.log('🔄 模块已选中，跳过重新创建工作副本:', module.id);
            return;
          }

          // 创建副本，避免修改外部对象
          const moduleCopy = cloneDeep(module);

          // 🔑 模块应该在加载时就有_indexId，这里不应该重新生成
          if (!moduleCopy._indexId) {
            console.error('[CurrentModule] 模块缺少_indexId，这不应该发生！', moduleCopy);
            moduleCopy._indexId = nanoid(); // 仅作为后备方案
          }

          console.log('🔄 创建新的模块工作副本:', module.id);
          state.selectedModuleId = moduleCopy._indexId;
          state.originalModule = cloneDeep(moduleCopy);
          state.editingModule = cloneDeep(moduleCopy);
          state.isDirty = false;
          state.error = null;
        });
      },

      // 更新属性（支持深度路径）
      updateProperty: (path, value) => {
        set((state) => {
          if (!state.editingModule || !state.originalModule) return;

          // 简单路径处理，支持 "id", "name" 等
          if (path.includes('.')) {
            // 复杂路径暂时不支持
            console.warn('Complex path not supported yet:', path);
            return;
          }

          (state.editingModule as any)[path] = value;

          // 🎯 修复：使用深度比较检查是否有变化
          state.isDirty = !deepCompareModules(state.editingModule, state.originalModule);
          state.error = null;
        });
      },

      // 更新整个模块的部分字段
      updateModule: (updates) => {
        set((state) => {
          if (!state.editingModule || !state.originalModule) return;

          Object.assign(state.editingModule, updates);

          // 🎯 修复：使用深度比较检查是否有变化
          state.isDirty = !deepCompareModules(state.editingModule, state.originalModule);
          state.error = null;
        });
      },

      // 🎯 核心修复：使用Immer安全地直接修改属性
      updateAttributeProperty: (attributeIndexId, field, value) => {
        set((state) => {
          console.log('🔍 使用Immer更新模块属性字段:', {
            attributeIndexId,
            field,
            value,
          });

          // 找到目标属性
          const targetAttribute = state.editingModule!.attributes!.find(
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
            state.isDirty = !deepCompareModules(state.editingModule, state.originalModule);
            state.error = null;

            console.log('🔍 Immer模块属性字段更新完成:', {
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
          if (!state.editingModule || !state.originalModule) return;

          if (!state.editingModule.attributes) {
            state.editingModule.attributes = [];
          }

          // 确保新属性有正确的状态
          const newAttribute = {
            ...attribute,
            _status: attribute._status || 'new', // 默认为新增状态
          };

          // 🎯 修复：新属性添加到末尾，符合用户直觉
          state.editingModule.attributes.push(newAttribute);
          // 🎯 修复：使用深度比较检查是否有变化
          state.isDirty = !deepCompareModules(state.editingModule, state.originalModule);
          state.error = null;
        });
      },

      // 删除属性
      removeAttribute: (attributeIndexId) => {
        set((state) => {
          console.log('🗑️ Store: 开始删除模块属性:', {
            attributeIndexId,
            hasEditingModule: !!state.editingModule,
            hasAttributes: !!state.editingModule?.attributes,
            attributesCount: state.editingModule?.attributes?.length || 0,
          });

          if (!state.editingModule || !state.originalModule) {
            console.error('🗑️ Store: 没有正在编辑的模块');
            return;
          }

          if (!state.editingModule.attributes) {
            console.error('🗑️ Store: 模块没有属性数组');
            state.editingModule.attributes = [];
            return;
          }

          const index = state.editingModule.attributes.findIndex(
            (attr: any) => attr._indexId === attributeIndexId
          );

          console.log('🗑️ Store: 查找结果:', {
            attributeIndexId,
            foundIndex: index,
            属性列表: state.editingModule.attributes.map((attr: any) => ({
              id: attr.id,
              name: attr.name,
              _indexId: attr._indexId,
            })),
          });

          if (index !== -1) {
            const deletedAttr = state.editingModule.attributes[index];

            // 使用Immer的splice方法删除
            state.editingModule.attributes.splice(index, 1);

            // 🎯 修复：使用深度比较检查是否有变化
            state.isDirty = !deepCompareModules(state.editingModule, state.originalModule);
            state.error = null;

            console.log('🗑️ Store: 删除成功:', {
              deletedAttr: {
                id: deletedAttr.id,
                name: deletedAttr.name,
                _indexId: deletedAttr._indexId,
              },
              remainingCount: state.editingModule.attributes.length,
              isDirty: state.isDirty,
            });
          } else {
            console.warn('🗑️ Store: 未找到要删除的属性:', {
              searchingFor: attributeIndexId,
              availableIds: state.editingModule.attributes.map((attr: any) => attr._indexId),
            });
          }
        });
      },

      // 重置更改
      resetChanges: () => {
        set((state) => {
          if (!state.originalModule) return;

          state.editingModule = cloneDeep(state.originalModule);
          state.isDirty = false;
          state.error = null;
        });
      },

      // 保存更改（调用实际的API）
      saveChanges: async () => {
        const currentState = get();
        if (!currentState.editingModule) return;

        console.log('💾 开始保存模块:', {
          id: currentState.editingModule.id,
          name: currentState.editingModule.name,
          desc: currentState.editingModule.desc,
          attributesCount: currentState.editingModule.attributes?.length || 0,
        });

        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // 🎯 使用ModuleStore的saveModule方法
          const { useModuleStore } = require('./module.store');
          const savedModule = await useModuleStore
            .getState()
            .saveModule(currentState.editingModule);

          console.log('💾 模块保存API返回结果:', {
            id: savedModule?.id,
            name: savedModule?.name,
            desc: savedModule?.desc,
            attributesCount: savedModule?.attributes?.length || 0,
          });

          // 🎯 保存成功后重新加载模块列表，确保新模块出现在列表中
          await useModuleStore.getState().loadModules();

          // 🎯 关键修复：从ModuleStore获取最新的模块数据，而不是使用旧的editingModule
          const moduleStore = useModuleStore.getState();
          const latestModule = moduleStore.modules.find(
            (m: any) =>
              m._indexId === currentState.editingModule!._indexId ||
              m.id === currentState.editingModule!.id
          );

          console.log('💾 从ModuleStore获取的最新模块数据:', {
            found: !!latestModule,
            id: latestModule?.id,
            name: latestModule?.name,
            desc: latestModule?.desc,
            attributesCount: latestModule?.attributes?.length || 0,
          });

          set((state) => {
            // 使用从ModuleStore获取的最新数据，而不是旧的editingModule
            const moduleToUse = latestModule || state.editingModule;
            state.originalModule = cloneDeep(moduleToUse);
            state.editingModule = cloneDeep(moduleToUse);
            state.isDirty = false;
            state.isSaving = false;
          });

          console.log('✅ 模块保存成功，状态已同步:', currentState.editingModule.id);
        } catch (error) {
          console.error('❌ 模块保存失败:', error);
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : 'Save failed';
          });
          throw error; // 重新抛出错误，让调用者知道保存失败
        }
      },

      // 设置错误状态
      setError: (error) => {
        set({ error });
      },

      // 设置保存状态
      setSaving: (saving) => {
        set({ isSaving: saving });
      },
    })),
    {
      name: 'current-module-store',
    }
  )
);

// Selector hooks for better performance
export const useCurrentModule = () =>
  useCurrentModuleStore(
    useShallow((state) => ({
      selectedModuleId: state.selectedModuleId,
      originalModule: state.originalModule,
      editingModule: state.editingModule,
      isDirty: state.isDirty,
      isSaving: state.isSaving,
      error: state.error,
    }))
  );

export const useCurrentModuleActions = () =>
  useCurrentModuleStore(
    useShallow((state) => ({
      selectModule: state.selectModule,
      updateProperty: state.updateProperty,
      updateModule: state.updateModule,
      updateAttributeProperty: state.updateAttributeProperty,
      addAttribute: state.addAttribute,
      removeAttribute: state.removeAttribute,
      saveChanges: state.saveChanges,
      resetChanges: state.resetChanges,
      setError: state.setError,
      setSaving: state.setSaving,
    }))
  );
