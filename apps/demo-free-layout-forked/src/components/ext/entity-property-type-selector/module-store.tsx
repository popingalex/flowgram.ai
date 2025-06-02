import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import type { Module, ModuleAttribute } from '../../../services/types';
import { moduleApi } from '../../../services/api-service';

// 重新导出类型
export type { Module, ModuleAttribute };

// 状态接口
interface ModuleStoreState {
  modules: Module[];
  loading: boolean;
  error: string | null;
}

// 上下文接口
interface ModuleStoreContextType extends ModuleStoreState {
  refreshModules: () => Promise<void>;
  getModule: (id: string) => Module | undefined;
  getModulesByIds: (ids: string[]) => Module[];
  addModule: (module: Omit<Module, 'deprecated'>) => Promise<void>;
  updateModule: (id: string, updates: Partial<Module>) => Promise<void>;
  deleteModule: (id: string) => Promise<void>;
}

// 创建上下文
const ModuleStoreContext = createContext<ModuleStoreContextType | undefined>(undefined);

// Provider组件
interface ModuleStoreProviderProps {
  children: ReactNode;
}

export const ModuleStoreProvider: React.FC<ModuleStoreProviderProps> = ({ children }) => {
  const [state, setState] = useState<ModuleStoreState>({
    modules: [],
    loading: false,
    error: null,
  });

  // 获取所有模块
  const refreshModules = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const modules = await moduleApi.getAll();
      setState((prev) => ({ ...prev, modules, loading: false }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 获取单个模块
  const getModule = (id: string): Module | undefined =>
    state.modules.find((module) => module.id === id);

  // 根据ID数组获取多个模块
  const getModulesByIds = (ids: string[]): Module[] =>
    state.modules.filter((module) => ids.includes(module.id));

  // 添加模块
  const addModule = async (module: Omit<Module, 'deprecated'>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const newModule = await moduleApi.create(module);
      setState((prev) => ({
        ...prev,
        modules: [...prev.modules, newModule],
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 更新模块
  const updateModule = async (id: string, updates: Partial<Module>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const updatedModule = await moduleApi.update(id, updates);
      setState((prev) => ({
        ...prev,
        modules: prev.modules.map((module) => (module.id === id ? updatedModule : module)),
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 删除模块
  const deleteModule = async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      await moduleApi.delete(id);
      setState((prev) => ({
        ...prev,
        modules: prev.modules.filter((module) => module.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 初始化时加载模块
  useEffect(() => {
    refreshModules();
  }, []);

  const contextValue: ModuleStoreContextType = {
    ...state,
    refreshModules,
    getModule,
    getModulesByIds,
    addModule,
    updateModule,
    deleteModule,
  };

  return <ModuleStoreContext.Provider value={contextValue}>{children}</ModuleStoreContext.Provider>;
};

// Hook
export const useModuleStore = (): ModuleStoreContextType => {
  const context = useContext(ModuleStoreContext);
  if (!context) {
    throw new Error('useModuleStore must be used within a ModuleStoreProvider');
  }
  return context;
};
