import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

import { apiRequest, buildApiUrl, API_CONFIG } from '../api/config';

// 实体属性接口
export interface EntityAttribute {
  id: string;
  type: string;
  name: string;
  description?: string;
  enumClassId?: string;
}

// 实体接口
export interface Entity {
  id: string;
  name: string;
  description?: string;
  deprecated: boolean;
  bundles?: string[];
  attributes: EntityAttribute[];
}

// 状态接口
interface EntityStoreState {
  entities: Entity[];
  loading: boolean;
  error: string | null;
}

// 上下文接口
interface EntityStoreContextType extends EntityStoreState {
  refreshEntities: () => Promise<void>;
  getEntity: (id: string) => Entity | undefined;
  addEntity: (entity: Omit<Entity, 'deprecated'>) => Promise<void>;
  updateEntity: (id: string, updates: Partial<Entity>) => Promise<void>;
  deleteEntity: (id: string) => Promise<void>;
}

// 创建上下文
const EntityStoreContext = createContext<EntityStoreContextType | undefined>(undefined);

// Provider组件
interface EntityStoreProviderProps {
  children: ReactNode;
}

export const EntityStoreProvider: React.FC<EntityStoreProviderProps> = ({ children }) => {
  const [state, setState] = useState<EntityStoreState>({
    entities: [],
    loading: false,
    error: null,
  });

  // 获取所有实体
  const refreshEntities = async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
      const entities = await apiRequest(url);
      setState((prev) => ({ ...prev, entities, loading: false }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 获取单个实体
  const getEntity = (id: string): Entity | undefined =>
    state.entities.find((entity) => entity.id === id);

  // 添加实体
  const addEntity = async (entity: Omit<Entity, 'deprecated'>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
      const newEntity = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify({ ...entity, deprecated: false }),
      });
      setState((prev) => ({
        ...prev,
        entities: [...prev.entities, newEntity],
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 更新实体
  const updateEntity = async (id: string, updates: Partial<Entity>) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${id}/`);
      const updatedEntity = await apiRequest(url, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setState((prev) => ({
        ...prev,
        entities: prev.entities.map((entity) => (entity.id === id ? updatedEntity : entity)),
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 删除实体
  const deleteEntity = async (id: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${id}/`);
      await apiRequest(url, { method: 'DELETE' });
      setState((prev) => ({
        ...prev,
        entities: prev.entities.filter((entity) => entity.id !== id),
        loading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({ ...prev, error: error.message, loading: false }));
    }
  };

  // 初始化时加载实体
  useEffect(() => {
    refreshEntities();
  }, []);

  const contextValue: EntityStoreContextType = {
    ...state,
    refreshEntities,
    getEntity,
    addEntity,
    updateEntity,
    deleteEntity,
  };

  return <EntityStoreContext.Provider value={contextValue}>{children}</EntityStoreContext.Provider>;
};

// Hook
export const useEntityStore = (): EntityStoreContextType => {
  const context = useContext(EntityStoreContext);
  if (!context) {
    throw new Error('useEntityStore must be used within an EntityStoreProvider');
  }
  return context;
};
