import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { API_CONFIG, buildApiUrl, apiRequest } from '../api/config';

// 实体属性类型
export interface Attribute {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  enumClassId?: string;
}

// 实体数据类型
export interface Entity {
  id: string;
  name: string;
  description?: string;
  deprecated?: boolean;
  attributes: Attribute[];
  bundles?: string[]; // 关联的模块ID列表
}

// Store接口
interface EntityStoreContextType {
  entities: Entity[];
  getEntity: (id: string) => Entity | undefined;
  updateEntity: (updatedEntity: Entity) => void;
  addEntity: (newEntity: Entity) => void;
  deleteEntity: (entityId: string) => void;
  refreshEntities: () => Promise<void>;
  loading: boolean;
}

const EntityStoreContext = createContext<EntityStoreContextType | undefined>(undefined);

// 从API获取实体数据
const fetchEntitiesFromAPI = async (): Promise<Entity[]> => {
  try {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
    console.log('Fetching entities from:', url);

    const entities = await apiRequest(url);
    console.log('Fetched entities:', entities);

    return entities;
  } catch (error) {
    console.error('Failed to fetch entities from API:', error);
    throw error;
  }
};

// 创建新实体
const createEntityAPI = async (entity: Entity): Promise<Entity> => {
  try {
    const url = buildApiUrl(API_CONFIG.ENDPOINTS.ENTITY);
    const createdEntity = await apiRequest(url, {
      method: 'POST',
      body: JSON.stringify(entity),
    });
    return createdEntity;
  } catch (error) {
    console.error('Failed to create entity:', error);
    throw error;
  }
};

// 更新实体
const updateEntityAPI = async (entity: Entity): Promise<Entity> => {
  try {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${entity.id}/`);
    const updatedEntity = await apiRequest(url, {
      method: 'PUT',
      body: JSON.stringify(entity),
    });
    return updatedEntity;
  } catch (error) {
    console.error('Failed to update entity:', error);
    throw error;
  }
};

// 删除实体
const deleteEntityAPI = async (entityId: string): Promise<void> => {
  try {
    const url = buildApiUrl(`${API_CONFIG.ENDPOINTS.ENTITY}${entityId}/`);
    await apiRequest(url, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Failed to delete entity:', error);
    throw error;
  }
};

// Provider组件
export const EntityStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshEntities = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedEntities = await fetchEntitiesFromAPI();
      setEntities(fetchedEntities);
    } catch (error) {
      console.error('Failed to refresh entities:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  const getEntity = useCallback(
    (id: string) => entities.find((entity) => entity.id === id),
    [entities]
  );

  const updateEntity = useCallback(async (updatedEntity: Entity) => {
    try {
      setLoading(true);
      const result = await updateEntityAPI(updatedEntity);
      setEntities((prev) => prev.map((entity) => (entity.id === result.id ? result : entity)));
      console.log('实体更新成功:', result);
    } catch (error) {
      console.error('Failed to update entity:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntity = useCallback(async (newEntity: Entity) => {
    try {
      setLoading(true);
      const result = await createEntityAPI(newEntity);
      setEntities((prev) => [...prev, result]);
      console.log('实体创建成功:', result);
    } catch (error) {
      console.error('Failed to create entity:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEntity = useCallback(async (entityId: string) => {
    try {
      setLoading(true);
      await deleteEntityAPI(entityId);
      setEntities((prev) => prev.filter((entity) => entity.id !== entityId));
      console.log('实体删除成功:', entityId);
    } catch (error) {
      console.error('Failed to delete entity:', error);
      // 可以在这里添加错误提示
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件挂载时加载实体数据
  React.useEffect(() => {
    refreshEntities();
  }, [refreshEntities]);

  const value: EntityStoreContextType = {
    entities,
    getEntity,
    updateEntity,
    addEntity,
    deleteEntity,
    refreshEntities,
    loading,
  };

  return <EntityStoreContext.Provider value={value}>{children}</EntityStoreContext.Provider>;
};

// Hook
export const useEntityStore = (): EntityStoreContextType => {
  const context = useContext(EntityStoreContext);
  if (!context) {
    throw new Error('useEntityStore must be used within an EntityStoreProvider');
  }
  return context;
};
