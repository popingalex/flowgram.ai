import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { API_CONFIG, buildApiUrl, apiRequest } from '../api/config';

// 模块数据类型
export interface ModuleAttribute {
  id: string;
  name?: string;
  type?: string;
  description?: string;
}

export interface Module {
  id: string;
  name: string;
  description?: string;
  deprecated?: boolean;
  attributes: ModuleAttribute[];
}

// Store接口
interface ModuleStoreContextType {
  modules: Module[];
  getModule: (id: string) => Module | undefined;
  getModulesByIds: (ids: string[]) => Module[];
  updateModule: (updatedModule: Module) => void;
  addModule: (newModule: Module) => void;
  deleteModule: (moduleId: string) => void;
  refreshModules: () => Promise<void>;
  loading: boolean;
}

const ModuleStoreContext = createContext<ModuleStoreContextType | undefined>(undefined);

// 从API获取模块数据
const fetchModulesFromAPI = async (): Promise<Module[]> => {
  try {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
    console.log('Fetching modules from:', url);

    const modules = await apiRequest(url);
    console.log('Fetched modules:', modules);

    return modules;
  } catch (error) {
    console.error('Failed to fetch modules from API:', error);
    throw error;
  }
};

// 创建新模块
const createModuleAPI = async (module: Module): Promise<Module> => {
  try {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.MODULE);
    const createdModule = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(module),
    });
    return createdModule;
  } catch (error) {
    console.error('Failed to create module:', error);
    throw error;
  }
};

// 更新模块
const updateModuleAPI = async (module: Module): Promise<Module> => {
  try {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${module.id}/`);
    const updatedModule = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(module),
    });
    return updatedModule;
  } catch (error) {
    console.error('Failed to update module:', error);
    throw error;
  }
};

// 删除模块
const deleteModuleAPI = async (moduleId: string): Promise<void> => {
  try {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.MODULE}${moduleId}/`);
    await apiRequest(url, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete module:', error);
    throw error;
  }
};

// Provider组件
export const ModuleStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshModules = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedModules = await fetchModulesFromAPI();
      setModules(fetchedModules);
    } catch (error) {
      console.error('Failed to refresh modules:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  const getModule = useCallback(
    (id: string) => modules.find((module) => module.id === id),
    [modules]
  );

  const getModulesByIds = useCallback(
    (ids: string[]) => ids.map((id) => getModule(id)).filter(Boolean) as Module[],
    [getModule]
  );

  const updateModule = useCallback(async (updatedModule: Module) => {
    try {
      setLoading(true);
      const result = await updateModuleAPI(updatedModule);
      setModules((prev) => prev.map((module) => (module.id === result.id ? result : module)));
      console.log('模块更新成功:', result);
    } catch (error) {
      console.error('Failed to update module:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  const addModule = useCallback(async (newModule: Module) => {
    try {
      setLoading(true);
      const result = await createModuleAPI(newModule);
      setModules((prev) => [...prev, result]);
      console.log('模块创建成功:', result);
    } catch (error) {
      console.error('Failed to create module:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteModule = useCallback(async (moduleId: string) => {
    try {
      setLoading(true);
      await deleteModuleAPI(moduleId);
      setModules((prev) => prev.filter((module) => module.id !== moduleId));
      console.log('模块删除成功:', moduleId);
    } catch (error) {
      console.error('Failed to delete module:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载模块数据
  React.useEffect(() => {
    refreshModules();
  }, [refreshModules]);

  const value: ModuleStoreContextType = {
    modules,
    getModule,
    getModulesByIds,
    updateModule,
    addModule,
    deleteModule,
    refreshModules,
    loading,
  };

  return <ModuleStoreContext.Provider value={value}>{children}</ModuleStoreContext.Provider>;
};

// Hook
export const useModuleStore = (): ModuleStoreContextType => {
  const context = useContext(ModuleStoreContext);
  if (!context) {
    throw new Error('useModuleStore must be used within a ModuleStoreProvider');
  }
  return context;
};
