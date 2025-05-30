import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { apiRequest, buildApiUrl, API_CONFIG } from '../api/config';

// 模块属性接口
export interface ModuleAttribute {
  id: string;
  type: string;
  name: string;
  description?: string;
  enumClassId?: string;
}

// 模块接口
export interface Module {
  id: string;
  name: string;
  description?: string;
  deprecated: boolean;
  attributes: ModuleAttribute[];
}

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
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
      const modules = await apiRequest(url);
      setState((prev) => ({ ...prev, modules, loading: false }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 获取单个模块
  const getModule = (id: string): Module | undefined =>
    state.modules.find((module) => module.id === id);

  // 添加模块
  const addModule = async (module: Omit<Module, 'deprecated'>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
      const newModule = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ ...module, deprecated: false }),
      });
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
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${id}/`);
      const updatedModule = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
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
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${id}/`);
      await apiRequest(url, { method: 'DELETE' });
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
