import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

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

// 模拟API调用 - 实际应该从后端获取
const fetchModulesFromAPI = async (): Promise<Module[]> => {
  try {
    // TODO: 替换为实际的API调用
    const response = await fetch('/api/modules');
    if (!response.ok) {
      throw new Error('Failed to fetch modules');
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch modules from API, using mock data:', error);

    // 返回模拟数据
    return [
      {
        id: 'transform',
        name: '变换',
        description: '基础变换模块',
        attributes: [
          { id: 'transform/coordinates', name: '坐标', type: 'n[3]' },
          { id: 'transform/position', name: '位置', type: 'n[3]' },
          { id: 'transform/rotation', name: '旋转', type: 'n[3]' },
          { id: 'transform/scale', name: '缩放', type: 'n[3]' },
        ],
      },
      {
        id: 'controlled',
        name: '可控制的',
        description: '控制相关模块',
        attributes: [
          { id: 'controlled/commands', name: '指令集合', type: '(command:s,args:u)[]' },
          { id: 'controlled/standby_position', name: '待机位置', type: 'n[3]' },
          { id: 'controlled/work_position', name: '工作位置', type: 'n[3]' },
          { id: 'controlled/action', name: '行为', type: 's' },
          { id: 'controlled/stance', name: '姿态', type: 's' },
          { id: 'controlled/status', name: '状态', type: 's' },
        ],
      },
      {
        id: 'vehicle',
        name: '载具',
        description: '载具相关模块',
        attributes: [
          { id: 'vehicle/loading_area', name: '装货位置', type: 's' },
          { id: 'vehicle/unloading_area', name: '卸货位置', type: 's' },
          { id: 'vehicle/type', name: '载具类型', type: 's' },
        ],
      },
    ];
  }
};

// Provider组件
export const ModuleStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshModules = useCallback(async () => {
    setLoading(true);
    try {
      // 强制重新获取干净的数据
      const fetchedModules = await fetchModulesFromAPI();
      setModules(fetchedModules);
    } catch (error) {
      console.error('Failed to refresh modules:', error);
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

  const updateModule = useCallback((updatedModule: Module) => {
    console.log('更新模块:', updatedModule);
    setModules((prev) =>
      prev.map((module) => (module.id === updatedModule.id ? updatedModule : module))
    );
  }, []);

  const addModule = useCallback((newModule: Module) => {
    setModules((prev) => [...prev, newModule]);
  }, []);

  const deleteModule = useCallback((moduleId: string) => {
    setModules((prev) => prev.filter((module) => module.id !== moduleId));
  }, []);

  // 组件挂载时强制加载干净的模块数据
  React.useEffect(() => {
    // 强制清空现有数据，重新加载
    setModules([]);
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
