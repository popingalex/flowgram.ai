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
            module.attributes.push({ ...attribute, _indexId: nanoid() });
          }
        });
      },

      removeAttributeFromModule: (moduleId, attributeId) => {
        set((state) => {
          const module = state.modules.find((m) => m.id === moduleId);
          if (module?.attributes) {
            const attrIndex = module.attributes.findIndex((a) => a.id === attributeId);
            if (attrIndex > -1) {
              module.attributes.splice(attrIndex, 1);
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
