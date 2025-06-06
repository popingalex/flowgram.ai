import React from 'react';

import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

import type { Module, ModuleAttribute } from '../services/types';
import { moduleApi } from '../services/api-service';

// Re-export types for convenience
export type { Module, ModuleAttribute };

// Store State
export interface ModuleStoreState {
  modules: Module[];
  loading: boolean;
  error: string | null;
}

// Store Actions
export interface ModuleActions {
  loadModules: () => Promise<void>;
  getModulesByIds: (ids: string[]) => Module[];
  createModule: (
    module: Omit<Module, '_indexId' | 'attributes'> & {
      attributes?: Omit<ModuleAttribute, '_indexId'>[];
    }
  ) => void;
  addModule: (
    module: Omit<Module, '_indexId' | 'attributes'> & {
      attributes?: Omit<ModuleAttribute, '_indexId'>[];
    }
  ) => void;
  updateModule: (id: string, updates: Partial<Module>) => void;
  deleteModule: (id: string) => void;
  addAttributeToModule: (moduleId: string, attribute: Omit<ModuleAttribute, '_indexId'>) => void;
  removeAttributeFromModule: (moduleId: string, attributeId: string) => void;
}

export type ModuleStore = ModuleStoreState & ModuleActions;

// Create the store using Zustand
export const useModuleStore = create<ModuleStore>()(
  devtools(
    immer((set, get) => ({
      modules: [],
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
              displayId: a.displayId || a.id.split('/').pop() || a.id, // 去掉模块前缀，只保留属性名
            })),
          }));
          set({ modules: modulesWithIndex, loading: false });
        } catch (error) {
          set({ error: (error as Error).message, loading: false });
        }
      },

      getModulesByIds: (ids) => {
        const { modules } = get();
        return modules.filter((m) => ids.includes(m.id));
      },

      createModule: (module) => {
        set((state) => {
          const newModule: Module = {
            ...module,
            _indexId: nanoid(),
            attributes: (module.attributes || []).map((attr) => ({
              ...attr,
              _indexId: nanoid(),
              displayId: attr.displayId || attr.id.split('/').pop() || attr.id, // 去掉模块前缀，只保留属性名
            })),
          };
          state.modules.push(newModule);
        });
      },

      addModule: (module) => {
        set((state) => {
          const newModule: Module = {
            ...module,
            _indexId: nanoid(),
            attributes: (module.attributes || []).map((attr) => ({
              ...attr,
              _indexId: nanoid(),
              displayId: attr.displayId || attr.id.split('/').pop() || attr.id, // 去掉模块前缀，只保留属性名
            })),
          };
          state.modules.push(newModule);
        });
      },

      updateModule: (id, updates) => {
        set((state) => {
          const module = state.modules.find((m) => m.id === id);
          if (module) {
            Object.assign(module, updates);
          }
        });
      },

      deleteModule: (id) => {
        set((state) => {
          state.modules = state.modules.filter((m) => m.id !== id);
        });
      },

      addAttributeToModule: (moduleId, attribute) => {
        set((state) => {
          const module = state.modules.find((m) => m.id === moduleId);
          if (module) {
            if (!module.attributes) module.attributes = [];
            module.attributes.push({
              ...attribute,
              _indexId: nanoid(),
              displayId: attribute.displayId || attribute.id.split('/').pop() || attribute.id, // 去掉模块前缀，只保留属性名
            });
          }
        });
      },

      removeAttributeFromModule: (moduleId, attributeId) => {
        set((state) => {
          console.log('🗑️ ModuleStore: 删除模块属性:', { moduleId, attributeId });
          const module = state.modules.find((m) => m.id === moduleId);
          if (module?.attributes) {
            // 先尝试用ID查找，再尝试用_indexId查找
            let attrIndex = module.attributes.findIndex((a) => a.id === attributeId);
            if (attrIndex === -1) {
              attrIndex = module.attributes.findIndex((a) => a._indexId === attributeId);
            }

            console.log('🗑️ ModuleStore: 查找结果:', {
              attrIndex,
              attributesCount: module.attributes.length,
              searchingFor: attributeId,
              availableIds: module.attributes.map((a) => ({ id: a.id, _indexId: a._indexId })),
            });

            if (attrIndex > -1) {
              const deletedAttr = module.attributes[attrIndex];
              module.attributes.splice(attrIndex, 1);
              console.log('🗑️ ModuleStore: 删除成功:', {
                deletedAttr: { id: deletedAttr.id, _indexId: deletedAttr._indexId },
                remainingCount: module.attributes.length,
              });
            } else {
              console.warn('🗑️ ModuleStore: 未找到要删除的属性');
            }
          }
        });
      },
    })),
    { name: 'module-store' }
  )
);

// Provider 组件 (Zustand 不需要 Provider，但为了兼容现有代码)
interface ModuleStoreProviderProps {
  children: React.ReactNode;
}

export const ModuleStoreProvider: React.FC<ModuleStoreProviderProps> = ({ children }) => {
  const { loadModules } = useModuleStore();

  // 初始化时加载数据 - 只执行一次
  React.useEffect(() => {
    loadModules();
  }, []); // 空依赖数组，只在组件挂载时执行一次

  return <>{children}</>;
};
