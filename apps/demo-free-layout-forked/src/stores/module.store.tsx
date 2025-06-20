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

  // 编辑相关（保留旧的编辑模式）
  startEditModule: (moduleId: string) => void;
  updateEditingModule: (moduleId: string, updates: Partial<Module>) => void;
  saveModuleEdit: (moduleId: string) => Promise<void>; // 重命名避免冲突
  resetModuleChanges: (moduleId: string) => void;
  isModuleDirty: (moduleId: string) => boolean;
  getEditingModule: (moduleId: string) => Module | null;

  // 模块操作 - 参考实体的实现方式
  addModule: (
    module: Omit<Module, '_indexId' | 'attributes'> & {
      attributes?: Omit<ModuleAttribute, '_indexId'>[];
    }
  ) => void; // 只添加到本地状态，不保存到后台
  updateModuleField: (indexId: string, field: string, value: any) => void; // 直接更新store中的模块字段
  updateModuleAttribute: (
    moduleIndexId: string,
    attributeId: string,
    field: string,
    value: any
  ) => void; // 直接更新store中的模块属性字段
  saveModule: (module: Module) => Promise<void>; // 保存完整的模块对象（参考saveEntity）
  createModule: (
    module: Omit<Module, '_indexId' | 'attributes'> & {
      attributes?: Omit<ModuleAttribute, '_indexId'>[];
    }
  ) => Promise<void>; // 直接保存到后台
  updateModule: (moduleId: string, updates: Partial<Module>) => Promise<void>;
  deleteModule: (moduleId: string) => Promise<void>;

  // 直接属性操作（非编辑模式）
  addAttributeToModuleLocal: (
    moduleIndexId: string,
    attribute?: Omit<ModuleAttribute, '_indexId'>
  ) => void; // 本地添加属性
  removeAttributeFromModuleLocal: (moduleIndexId: string, attributeIndexId: string) => void; // 本地删除属性
  addAttributeToModule: (
    moduleId: string,
    attribute: Omit<ModuleAttribute, '_indexId'>
  ) => Promise<void>;
  removeAttributeFromModule: (moduleId: string, attributeId: string) => Promise<void>;

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
        console.log('🔄 [ModuleStore] loadModules 开始加载');
        set({ loading: true, error: null });
        try {
          const modules = await moduleApi.getAll();
          console.log('🔄 [ModuleStore] API返回的原始模块数据:', {
            count: modules.length,
            firstModule: modules[0],
            modules: modules.slice(0, 3), // 只显示前3个
          });

          // 🐛 检查是否有模块缺少必要字段
          const invalidModules = modules.filter((m) => !m.id || !m.name);
          if (invalidModules.length > 0) {
            console.warn('⚠️ [ModuleStore] 发现无效模块数据:', invalidModules);
          }

          const modulesWithIndex = modules.map((m, index) => {
            // 🐛 为每个模块添加安全检查
            if (!m.id) {
              console.error(`❌ [ModuleStore] 模块 ${index} 缺少id字段:`, m);
            }
            if (!m.name) {
              console.error(`❌ [ModuleStore] 模块 ${index} 缺少name字段:`, m);
            }

            return {
              ...m,
              _indexId: m._indexId || nanoid(),
              attributes: (m.attributes || []).map((a) => ({
                ...a,
                _indexId: a._indexId || nanoid(),
                displayId: a.displayId || a.id.split('/').pop() || a.id,
              })),
            };
          });

          // 🎯 按id排序模块，确保id不为空
          const sortedModules = modulesWithIndex.sort((a, b) => {
            const idA = a.id || '';
            const idB = b.id || '';
            return idA.localeCompare(idB);
          });

          console.log('🔄 [ModuleStore] 处理后的模块数据:', {
            count: sortedModules.length,
            firstModule: sortedModules[0],
          });

          set({ modules: sortedModules, loading: false });
          console.log('✅ [ModuleStore] 模块数据已保存到store');
        } catch (error) {
          console.error('❌ [ModuleStore] 加载模块失败:', error);
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
          }
        });
      },

      // 🎯 直接更新模块字段（参考实体的updateEntityField）
      updateModuleField: (indexId, field, value) => {
        set((state) => {
          const moduleIndex = state.modules.findIndex((m) => m._indexId === indexId);
          if (moduleIndex !== -1) {
            (state.modules[moduleIndex] as any)[field] = value;
            // 标记为dirty状态
            if (state.modules[moduleIndex]._status !== 'new') {
              state.modules[moduleIndex]._status = 'dirty';
            }
          }
        });
      },

      // 🎯 直接更新模块属性字段（参考实体的updateEntityAttribute）
      updateModuleAttribute: (moduleIndexId, attributeIndexId, field, value) => {
        set((state) => {
          const moduleIndex = state.modules.findIndex((m) => m._indexId === moduleIndexId);
          if (moduleIndex !== -1) {
            const attributeIndex = state.modules[moduleIndex].attributes.findIndex(
              (attr) => attr._indexId === attributeIndexId
            );
            if (attributeIndex !== -1) {
              (state.modules[moduleIndex].attributes[attributeIndex] as any)[field] = value;
              // 标记属性为dirty状态
              if (state.modules[moduleIndex].attributes[attributeIndex]._status !== 'new') {
                state.modules[moduleIndex].attributes[attributeIndex]._status = 'dirty';
              }
              // 标记模块为dirty状态
              if (state.modules[moduleIndex]._status !== 'new') {
                state.modules[moduleIndex]._status = 'dirty';
              }
            }
          }
        });
      },

      // 🎯 保存完整的模块对象（参考实体的saveEntity）
      saveModule: async (module) => {
        const { updateModule } = get();

        // 确保模块有_indexId
        if (!module._indexId) {
          module._indexId = nanoid();
        }

        // 设置为保存中状态
        set((state) => {
          const moduleIndex = state.modules.findIndex((m) => m._indexId === module._indexId);
          if (moduleIndex !== -1) {
            state.modules[moduleIndex]._editStatus = 'saving';
          }
        });

        try {
          let savedModule;
          if (module._status === 'new') {
            console.log('📝 创建新模块:', module.id);
            savedModule = await moduleApi.create(module);
          } else {
            console.log('📝 更新模块:', module.id);
            savedModule = await moduleApi.update(module.id, module);
          }

          // 更新为已保存状态，同时更新所有属性的状态
          set((state) => {
            const moduleIndex = state.modules.findIndex((m) => m._indexId === module._indexId);
            if (moduleIndex !== -1) {
              state.modules[moduleIndex] = {
                ...savedModule,
                _indexId: module._indexId, // 保留_indexId
                _status: 'saved',
                _editStatus: undefined,
                attributes: (module.attributes || []).map((attr) => ({
                  ...attr,
                  _status: 'saved' as const,
                })),
              };
            }
          });

          console.log('✅ 模块保存成功:', module.id);
        } catch (error) {
          console.error('❌ 模块保存失败:', error);
          // 恢复原状态
          set((state) => {
            const moduleIndex = state.modules.findIndex((m) => m._indexId === module._indexId);
            if (moduleIndex !== -1) {
              state.modules[moduleIndex]._editStatus = undefined;
            }
          });
          throw error;
        }
      },

      // 🎯 保存编辑中的模块（重命名的旧方法）
      saveModuleEdit: async (moduleId) => {
        const { editingModules } = get();
        const editState = editingModules.get(moduleId);
        if (!editState || !editState.isDirty) return;

        try {
          // 🎯 关键修复：使用原始ID调用API，支持ID变更
          const originalId = editState.originalModule.id;
          const newId = editState.editingModule.id;

          console.log('📝 ModuleStore: 保存模块', {
            originalId,
            newId,
            isIdChanged: originalId !== newId,
          });

          await moduleApi.update(originalId, editState.editingModule);

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
        } catch (error) {
          console.error('💾 保存模块失败:', error);
          throw error;
        }
      },

      // 🎯 重置模块更改（保持编辑状态，但重置内容）
      resetModuleChanges: (moduleId) => {
        set((state) => {
          const editState = state.editingModules.get(moduleId);
          if (editState) {
            // 重置为原始内容，保持编辑状态
            editState.editingModule = JSON.parse(JSON.stringify(editState.originalModule));
            editState.isDirty = false;
          }
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

      // 🎯 添加新模块到本地状态（不保存到后台）
      addModule: (module) => {
        const newModule: Module = {
          ...module,
          _indexId: nanoid(),
          _status: 'new' as const, // 标记为新增状态
          attributes: (module.attributes || []).map((attr) => ({
            ...attr,
            _indexId: nanoid(),
            displayId: attr.displayId || attr.id.split('/').pop() || attr.id,
          })),
        };

        set((state) => {
          // 新增模块添加到顶部
          const otherModules = state.modules.filter((m) => m._status !== 'new');
          const newModules = state.modules.filter((m) => m._status === 'new');
          state.modules = [...newModules, newModule, ...otherModules];
        });

        console.log('✅ 添加新模块到本地状态:', newModule._indexId);
      },

      // 🎯 根据_indexId保存模块（支持新增和修改状态）
      saveModuleByIndexId: async (moduleIndexId: string) => {
        const { modules } = get();
        const module = modules.find((m) => m._indexId === moduleIndexId);
        if (!module) {
          throw new Error(`模块 ${moduleIndexId} 不存在`);
        }

        try {
          console.log('📝 ModuleStore: 保存模块', {
            indexId: moduleIndexId,
            id: module.id,
            status: module._status,
          });

          if (module._status === 'new') {
            // 新增模块：调用create API
            await moduleApi.create(module);
            console.log('✅ ModuleStore: 新增模块保存成功');
          } else {
            // 修改模块：调用update API
            await moduleApi.update(module.id, module);
            console.log('✅ ModuleStore: 更新模块保存成功');
          }

          // 更新模块状态为已保存
          set((state) => {
            const moduleIndex = state.modules.findIndex((m) => m._indexId === moduleIndexId);
            if (moduleIndex > -1) {
              state.modules[moduleIndex] = {
                ...state.modules[moduleIndex],
                _status: undefined, // 清除状态标记，表示已保存
              };
            }
          });
        } catch (error) {
          console.error('❌ ModuleStore: 保存模块失败:', error);
          throw error;
        }
      },

      // 🎯 创建新模块（直接保存到后台）
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
        } catch (error) {
          console.error('➕ 创建模块失败:', error);
          throw error;
        }
      },

      // 🎯 更新模块（直接更新，非编辑模式）
      updateModule: async (moduleId, updates) => {
        try {
          const moduleIndex = get().modules.findIndex(
            (m) => m.id === moduleId || m._indexId === moduleId
          );
          if (moduleIndex === -1) {
            throw new Error(`模块 ${moduleId} 不存在`);
          }

          const originalModule = get().modules[moduleIndex];
          const updatedModule = { ...originalModule, ...updates };

          // 🎯 关键修复：使用原始ID调用API，支持ID变更
          const originalId = originalModule.id;
          const newId = updatedModule.id;

          console.log('📝 ModuleStore: 直接更新模块', {
            originalId,
            newId,
            isIdChanged: originalId !== newId,
          });

          await moduleApi.update(originalId, updatedModule);

          set((state) => {
            state.modules[moduleIndex] = updatedModule;
          });
        } catch (error) {
          console.error('🔧 直接更新模块失败:', error);
          throw error;
        }
      },

      // 🎯 删除模块（支持新增和已保存状态）
      deleteModule: async (moduleIndexId) => {
        const { modules } = get();
        const module = modules.find((m) => m._indexId === moduleIndexId);
        if (!module) {
          console.warn('⚠️ 删除失败：找不到模块', moduleIndexId);
          return;
        }

        try {
          // 如果是新增状态的模块，直接从本地删除
          if (module._status === 'new') {
            console.log('🗑️ 删除新增模块（仅本地）:', module.id || '无ID');
            set((state) => {
              state.modules = state.modules.filter((m) => m._indexId !== moduleIndexId);
              state.editingModules.delete(moduleIndexId);
            });
            console.log('✅ 新增模块删除成功');
            return;
          }

          // 已保存的模块需要调用API删除
          console.log('🗑️ 调用API删除模块:', module.id);
          await moduleApi.delete(module.id);

          console.log('✅ ModuleStore: 删除API调用成功，重新查询后台数据同步状态');

          // 🎯 关键修复：删除后重新查询后台数据，确保前端状态与后台一致
          // 这样可以处理两种情况：
          // 1. Mock模式：真正删除，查询结果不包含该模块
          // 2. 真实后台：标记deprecated，查询结果可能仍包含但状态已变
          await get().loadModules();

          // 清除编辑状态
          set((state) => {
            state.editingModules.delete(moduleIndexId);
          });

          console.log('✅ ModuleStore: 已保存模块删除操作完成，数据已同步');
        } catch (error) {
          console.error('❌ ModuleStore: 删除失败:', error);
          throw error;
        }
      },

      // 🎯 本地添加属性到模块（不保存到后台）
      addAttributeToModuleLocal: (moduleIndexId, attribute) => {
        set((state) => {
          const moduleIndex = state.modules.findIndex((m) => m._indexId === moduleIndexId);
          if (moduleIndex === -1) {
            console.error(`模块 ${moduleIndexId} 不存在`);
            return;
          }

          const newAttribute = {
            id: '',
            name: '',
            type: 'string',
            ...attribute,
            _indexId: nanoid(),
            _status: 'new' as const, // 标记为新增状态
          };

          // 为属性添加displayId
          newAttribute.displayId =
            newAttribute.displayId || newAttribute.id.split('/').pop() || newAttribute.id;

          state.modules[moduleIndex].attributes.push(newAttribute);

          // 标记模块为dirty（如果不是新增状态）
          if (state.modules[moduleIndex]._status !== 'new') {
            state.modules[moduleIndex]._status = 'dirty';
          }

          console.log('✅ 本地添加属性到模块:', moduleIndexId, newAttribute._indexId);
        });
      },

      // 🎯 本地删除模块属性（不保存到后台）
      removeAttributeFromModuleLocal: (moduleIndexId, attributeIndexId) => {
        set((state) => {
          const moduleIndex = state.modules.findIndex((m) => m._indexId === moduleIndexId);
          if (moduleIndex === -1) {
            console.error(`模块 ${moduleIndexId} 不存在`);
            return;
          }

          const originalLength = state.modules[moduleIndex].attributes.length;
          state.modules[moduleIndex].attributes = state.modules[moduleIndex].attributes.filter(
            (attr) => attr._indexId !== attributeIndexId
          );

          if (state.modules[moduleIndex].attributes.length < originalLength) {
            // 标记模块为dirty（如果不是新增状态）
            if (state.modules[moduleIndex]._status !== 'new') {
              state.modules[moduleIndex]._status = 'dirty';
            }
            console.log('✅ 本地删除模块属性:', moduleIndexId, attributeIndexId);
          } else {
            console.warn('⚠️ 属性删除失败：找不到属性', attributeIndexId);
          }
        });
      },

      // 🎯 添加属性到模块（直接操作，非编辑模式）
      addAttributeToModule: async (moduleId, attribute) => {
        try {
          const moduleIndex = get().modules.findIndex((m) => m.id === moduleId);
          if (moduleIndex === -1) {
            throw new Error(`模块 ${moduleId} 不存在`);
          }

          const newAttribute = {
            ...attribute,
            _indexId: nanoid(),
            displayId: attribute.displayId || attribute.id.split('/').pop() || attribute.id,
          };

          const originalModule = get().modules[moduleIndex];
          const updatedModule = {
            ...originalModule,
            attributes: [...originalModule.attributes, newAttribute],
          };

          await moduleApi.update(originalModule.id, updatedModule);

          set((state) => {
            state.modules[moduleIndex] = updatedModule;
          });
        } catch (error) {
          console.error('➕ 直接添加属性失败:', error);
          throw error;
        }
      },

      // 🎯 从模块删除属性（直接操作，非编辑模式）
      removeAttributeFromModule: async (moduleId, attributeId) => {
        try {
          const moduleIndex = get().modules.findIndex((m) => m.id === moduleId);
          if (moduleIndex === -1) {
            throw new Error(`模块 ${moduleId} 不存在`);
          }

          const originalModule = get().modules[moduleIndex];
          const updatedAttributes = originalModule.attributes.filter(
            (a) => a.id !== attributeId && a._indexId !== attributeId
          );

          if (updatedAttributes.length === originalModule.attributes.length) {
            throw new Error(`属性 ${attributeId} 不存在于模块 ${moduleId} 中`);
          }

          const updatedModule = {
            ...originalModule,
            attributes: updatedAttributes,
          };

          await moduleApi.update(originalModule.id, updatedModule);

          set((state) => {
            state.modules[moduleIndex] = updatedModule;
          });
        } catch (error) {
          console.error('🗑️ 直接删除属性失败:', error);
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

        for (const moduleId of dirtyModuleIds) {
          try {
            await get().saveModuleEdit(moduleId); // 使用编辑模式的保存方法
          } catch (error) {
            console.error(`保存模块 ${moduleId} 失败:`, error);
          }
        }
      },

      // 🎯 丢弃所有更改
      discardAllChanges: () => {
        set((state) => {
          state.editingModules.clear();
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
