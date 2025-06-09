import React from 'react';

import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { enableMapSet } from 'immer';

// 启用 Immer 的 MapSet 插件
enableMapSet();

import type { Module, ModuleAttribute } from '../services/types';
import { moduleApi } from '../services/api-service';

// Re-export types for convenience
export type { Module, ModuleAttribute };

// 模块编辑状态
interface ModuleEditState {
  originalModule: Module;
  editingModule: Module;
  isDirty: boolean;
}

// Store State
export interface ModuleStoreState {
  modules: Module[]; // 原始模块列表
  editingModules: Map<string, ModuleEditState>; // 正在编辑的模块副本
  loading: boolean;
  error: string | null;
}

// Store Actions
export interface ModuleActions {
  loadModules: () => Promise<void>;
  getModulesByIds: (ids: string[]) => Module[];

  // 编辑相关
  startEditModule: (moduleId: string) => void;
  updateEditingModule: (moduleId: string, updates: Partial<Module>) => void;
  saveModule: (moduleId: string) => Promise<void>;
  cancelEditModule: (moduleId: string) => void;
  isModuleDirty: (moduleId: string) => boolean;
  getEditingModule: (moduleId: string) => Module | null;

  // 模块操作
  createModule: (
    module: Omit<Module, '_indexId' | 'attributes'> & {
      attributes?: Omit<ModuleAttribute, '_indexId'>[];
    }
  ) => Promise<void>;
  deleteModule: (moduleId: string) => Promise<void>;

  // 属性操作
  addAttributeToEditingModule: (
    moduleId: string,
    attribute: Omit<ModuleAttribute, '_indexId'>
  ) => void;
  updateAttributeInEditingModule: (
    moduleId: string,
    attributeId: string,
    updates: Partial<ModuleAttribute>
  ) => void;
  removeAttributeFromEditingModule: (moduleId: string, attributeId: string) => void;

  // 批量操作
  saveAllDirtyModules: () => Promise<void>;
  discardAllChanges: () => void;
  getDirtyModuleIds: () => string[];

  // 智能dirty检测
  checkModuleReallyDirty: (editState: ModuleEditState) => boolean;
}

export type ModuleStore = ModuleStoreState & ModuleActions;

// Create the store using Zustand
export const useModuleStore = create<ModuleStore>()(
  devtools(
    immer((set, get) => ({
      modules: [],
      editingModules: new Map(),
      loading: false,
      error: null,

      loadModules: async () => {
        set({ loading: true, error: null });
        try {
          const modules = await moduleApi.getAll();
          const modulesWithIndex = modules.map((m) => ({
            ...m,
            _indexId: m._indexId || nanoid(),
            attributes: (m.attributes || []).map((a) => ({
              ...a,
              _indexId: a._indexId || nanoid(),
              displayId: a.displayId || a.id.split('/').pop() || a.id,
            })),
          }));
          set({ modules: modulesWithIndex, loading: false });
          console.log('🔄 ModuleStore: 加载完成', { count: modulesWithIndex.length });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      getModulesByIds: (ids) => {
        const { modules } = get();
        return modules.filter((m) => ids.includes(m.id) || ids.includes(m._indexId || ''));
      },

      // 🎯 开始编辑模块 - 创建副本
      startEditModule: (moduleId) => {
        set((state) => {
          const originalModule = state.modules.find((m) => m.id === moduleId);
          if (originalModule && !state.editingModules.has(moduleId)) {
            const editingModule = JSON.parse(JSON.stringify(originalModule)); // 深拷贝
            state.editingModules.set(moduleId, {
              originalModule,
              editingModule,
              isDirty: false,
            });
            console.log('📝 开始编辑模块:', moduleId);
          }
        });
      },

      // 🎯 更新编辑中的模块
      updateEditingModule: (moduleId, updates) => {
        set((state) => {
          const editState = state.editingModules.get(moduleId);
          if (editState) {
            Object.assign(editState.editingModule, updates);

            // 🎯 智能dirty检测：检查是否真的有变化
            editState.isDirty = get().checkModuleReallyDirty(editState);
            console.log('🔧 更新编辑模块:', {
              moduleId,
              updates,
              isDirty: editState.isDirty,
            });
          }
        });
      },

      // 🎯 保存模块
      saveModule: async (moduleId) => {
        const { editingModules } = get();
        const editState = editingModules.get(moduleId);
        if (!editState || !editState.isDirty) return;

        try {
          await moduleApi.update(moduleId, editState.editingModule);

          set((state) => {
            // 更新原始模块列表
            const moduleIndex = state.modules.findIndex((m) => m.id === moduleId);
            if (moduleIndex > -1) {
              state.modules[moduleIndex] = { ...editState.editingModule };
            }

            // 更新编辑状态
            editState.originalModule = { ...editState.editingModule };
            editState.isDirty = false;
          });

          console.log('💾 保存模块成功:', moduleId);
        } catch (error) {
          console.error('💾 保存模块失败:', error);
          throw error;
        }
      },

      // 🎯 取消编辑
      cancelEditModule: (moduleId) => {
        set((state) => {
          const editState = state.editingModules.get(moduleId);
          if (editState) {
            console.log('❌ 取消编辑模块:', {
              moduleId,
              originalAttrs: editState.originalModule.attributes.length,
              editingAttrs: editState.editingModule.attributes.length,
            });
          }
          state.editingModules.delete(moduleId);
        });
      },

      // 🎯 检查模块是否有未保存的更改
      isModuleDirty: (moduleId) => {
        const { editingModules } = get();
        return editingModules.get(moduleId)?.isDirty || false;
      },

      // 🎯 获取编辑中的模块
      getEditingModule: (moduleId) => {
        const { editingModules, modules } = get();
        const editState = editingModules.get(moduleId);
        if (editState) {
          return editState.editingModule;
        }
        // 如果没有编辑副本，返回原始模块
        return modules.find((m) => m.id === moduleId) || null;
      },

      // 🎯 创建新模块
      createModule: async (module) => {
        const newModule: Module = {
          ...module,
          _indexId: nanoid(),
          attributes: (module.attributes || []).map((attr) => ({
            ...attr,
            _indexId: nanoid(),
            displayId: attr.displayId || attr.id.split('/').pop() || attr.id,
          })),
        };

        try {
          await moduleApi.create(newModule);
          set((state) => {
            state.modules.push(newModule);
          });
          console.log('➕ 创建模块成功:', newModule.id);
        } catch (error) {
          console.error('➕ 创建模块失败:', error);
          throw error;
        }
      },

      // 🎯 删除模块
      deleteModule: async (moduleId) => {
        try {
          await moduleApi.delete(moduleId);
          set((state) => {
            state.modules = state.modules.filter((m) => m.id !== moduleId);
            state.editingModules.delete(moduleId);
          });
          console.log('🗑️ 删除模块成功:', moduleId);
        } catch (error) {
          console.error('🗑️ 删除模块失败:', error);
          throw error;
        }
      },

      // 🎯 添加属性到编辑中的模块
      addAttributeToEditingModule: (moduleId, attribute) => {
        set((state) => {
          // 确保模块正在编辑中
          if (!state.editingModules.has(moduleId)) {
            get().startEditModule(moduleId);
          }

          const editState = state.editingModules.get(moduleId);
          if (editState) {
            const newAttribute = {
              ...attribute,
              _indexId: nanoid(),
              displayId: attribute.displayId || attribute.id.split('/').pop() || attribute.id,
            };
            editState.editingModule.attributes.push(newAttribute);

            // 🎯 智能dirty检测：检查是否真的有变化
            editState.isDirty = get().checkModuleReallyDirty(editState);
            console.log('➕ 添加属性到编辑模块:', {
              moduleId,
              attributeId: newAttribute.id,
              isDirty: editState.isDirty,
            });
          }
        });
      },

      // 🎯 更新编辑中模块的属性
      updateAttributeInEditingModule: (moduleId, attributeId, updates) => {
        set((state) => {
          const editState = state.editingModules.get(moduleId);
          if (editState) {
            const attrIndex = editState.editingModule.attributes.findIndex(
              (a) => a.id === attributeId || a._indexId === attributeId
            );
            if (attrIndex > -1) {
              Object.assign(editState.editingModule.attributes[attrIndex], updates);

              // 🎯 智能dirty检测：检查是否真的有变化
              editState.isDirty = get().checkModuleReallyDirty(editState);
              console.log('🔧 更新编辑模块属性:', {
                moduleId,
                attributeId,
                updates,
                isDirty: editState.isDirty,
              });
            }
          }
        });
      },

      // 🎯 从编辑中的模块删除属性
      removeAttributeFromEditingModule: (moduleId, attributeId) => {
        set((state) => {
          const editState = state.editingModules.get(moduleId);
          if (editState) {
            const attrIndex = editState.editingModule.attributes.findIndex(
              (a) => a.id === attributeId || a._indexId === attributeId
            );
            if (attrIndex > -1) {
              const deletedAttr = editState.editingModule.attributes[attrIndex];
              editState.editingModule.attributes.splice(attrIndex, 1);

              // 🎯 智能dirty检测：检查是否真的有变化
              editState.isDirty = get().checkModuleReallyDirty(editState);
              console.log('🗑️ 从编辑模块删除属性:', {
                moduleId,
                attributeId: deletedAttr.id,
                isDirty: editState.isDirty,
              });
            }
          }
        });
      },

      // 🎯 保存所有有更改的模块
      saveAllDirtyModules: async () => {
        const { editingModules } = get();
        const dirtyModuleIds = Array.from(editingModules.entries())
          .filter(([_, editState]) => editState.isDirty)
          .map(([moduleId, _]) => moduleId);

        if (dirtyModuleIds.length === 0) return;

        console.log('💾 批量保存模块:', dirtyModuleIds);

        for (const moduleId of dirtyModuleIds) {
          try {
            await get().saveModule(moduleId);
          } catch (error) {
            console.error(`保存模块 ${moduleId} 失败:`, error);
          }
        }
      },

      // 🎯 丢弃所有更改
      discardAllChanges: () => {
        set((state) => {
          state.editingModules.clear();
          console.log('❌ 丢弃所有模块更改');
        });
      },

      // 🎯 获取有更改的模块ID列表
      getDirtyModuleIds: () => {
        const { editingModules } = get();
        return Array.from(editingModules.entries())
          .filter(([_, editState]) => editState.isDirty)
          .map(([moduleId, _]) => moduleId);
      },

      // 🎯 智能dirty检测：深度比较模块是否真的有变化
      checkModuleReallyDirty: (editState) => {
        const { originalModule, editingModule } = editState;

        // 比较基本属性
        if (
          originalModule.id !== editingModule.id ||
          originalModule.name !== editingModule.name ||
          originalModule.description !== editingModule.description
        ) {
          return true;
        }

        // 比较属性数量
        if (originalModule.attributes.length !== editingModule.attributes.length) {
          return true;
        }

        // 比较每个属性（按id排序后比较，忽略_indexId）
        const originalAttrs = [...originalModule.attributes].sort((a, b) =>
          a.id.localeCompare(b.id)
        );
        const editingAttrs = [...editingModule.attributes].sort((a, b) => a.id.localeCompare(b.id));

        for (let i = 0; i < originalAttrs.length; i++) {
          const orig = originalAttrs[i];
          const edit = editingAttrs[i];

          if (
            orig.id !== edit.id ||
            orig.name !== edit.name ||
            orig.type !== edit.type ||
            orig.description !== edit.description
          ) {
            return true;
          }
        }

        // 如果所有比较都通过，说明没有实质性变化
        return false;
      },
    })),
    { name: 'module-store' }
  )
);

// Provider 组件
interface ModuleStoreProviderProps {
  children: React.ReactNode;
}

export const ModuleStoreProvider: React.FC<ModuleStoreProviderProps> = ({ children }) => {
  const { loadModules } = useModuleStore();

  React.useEffect(() => {
    loadModules();
  }, []);

  return <>{children}</>;
};
