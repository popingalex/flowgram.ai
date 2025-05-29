import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

import { useModuleStore, Module } from '../entity-property-type-selector/module-store';

// 属性类型
export interface Attribute {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  enumClassId?: string;
}

// 实体类型 - 继承自模块
export interface Entity extends Module {
  bundle_ids: string[]; // 绑定的模块ID列表
}

// Store接口
interface EntityStoreContextType {
  entities: Entity[];
  getEntity: (id: string) => Entity | undefined;
  getEntityOwnAttributes: (entity: Entity) => Attribute[]; // 获取实体自身属性（ID不含'/'）
  getEntityModuleAttributes: (entity: Entity) => Attribute[]; // 获取来自模块的属性（ID含'/'）
  refreshEntities: () => Promise<void>;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  addModuleToEntity: (entityId: string, moduleId: string) => void;
  removeModuleFromEntity: (entityId: string, moduleId: string) => void;
  loading: boolean;
}

const EntityStoreContext = createContext<EntityStoreContextType | undefined>(undefined);

// 模拟API调用
const fetchEntitiesFromAPI = async (): Promise<Entity[]> => {
  try {
    const response = await fetch('/api/entities');
    if (!response.ok) {
      throw new Error('Failed to fetch entities');
    }
    return await response.json();
  } catch (error) {
    console.warn('Failed to fetch entities from API, using mock data:', error);

    // 模拟数据（基于数据库真实数据，但已整合了模块属性）
    return [
      {
        id: 'terrain',
        name: '地形',
        description: undefined,
        attributes: [
          // 假设terrain模块的属性（ID带'/'）
          { id: 'terrain/height', name: '高度', type: 'n' },
          { id: 'terrain/material', name: '材质', type: 's' },
        ],
        bundle_ids: ['terrain'],
      },
      {
        id: 'river_node',
        name: '河流节点',
        description: undefined,
        attributes: [
          // 实体自身属性（ID不带'/'）
          { id: 'width', name: '宽度', type: 'n' },
          { id: 'depth', name: '深度', type: 'n' },
          { id: 'elevation', name: '高程', type: 'n' },
          { id: 'inputs', name: '输入', type: '(node:s,control:n,velocity:n)[3][]' },
          { id: 'outputs', name: '输出', type: '(node:s,control:n,velocity:n)[3][]' },
          // 来自模块的属性（ID带'/'）
          { id: 'transform/position', name: '位置', type: 'n[3]' },
        ],
        bundle_ids: [],
      },
      {
        id: 'vehicle',
        name: '载具',
        description: undefined,
        attributes: [
          // 实体自身属性
          { id: 'vehicle_yard_id', name: '集结点id', type: 's' },
          // 来自模块的属性
          { id: 'transform/position', name: '位置', type: 'n[3]' },
          { id: 'transform/rotation', name: '旋转', type: 'n[3]' },
          { id: 'controlled/status', name: '状态', type: 's' },
          { id: 'vehicle/type', name: '载具类型', type: 's' },
        ],
        bundle_ids: ['mobile', 'transform', 'controlled', 'container', 'vehicle'],
      },
    ];
  }
};

// 工具函数：根据属性ID判断是否为实体自身属性
const isOwnAttribute = (attributeId: string): boolean => !attributeId.includes('/');

// 工具函数：根据属性ID判断是否为模块属性
const isModuleAttribute = (attributeId: string): boolean => attributeId.includes('/');

// Provider组件
export const EntityStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const { getModulesByIds } = useModuleStore();

  const refreshEntities = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedEntities = await fetchEntitiesFromAPI();
      setEntities(fetchedEntities);
    } catch (error) {
      console.error('Failed to refresh entities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getEntity = useCallback(
    (id: string) => entities.find((entity) => entity.id === id),
    [entities]
  );

  const getEntityOwnAttributes = useCallback(
    (entity: Entity) => entity.attributes.filter((attr) => isOwnAttribute(attr.id)),
    []
  );

  const getEntityModuleAttributes = useCallback(
    (entity: Entity) => entity.attributes.filter((attr) => isModuleAttribute(attr.id)),
    []
  );

  const updateEntity = useCallback((entityId: string, updates: Partial<Entity>) => {
    setEntities((prev) =>
      prev.map((entity) => (entity.id === entityId ? { ...entity, ...updates } : entity))
    );
  }, []);

  const addModuleToEntity = useCallback(
    (entityId: string, moduleId: string) => {
      const modules = getModulesByIds([moduleId]);
      if (modules.length === 0) return;

      const module = modules[0];
      setEntities((prev) =>
        prev.map((entity) => {
          if (entity.id !== entityId) return entity;

          // 检查是否已绑定
          if (entity.bundle_ids.includes(moduleId)) return entity;

          // 添加模块属性到实体属性列表
          const newAttributes = [...entity.attributes];
          module.attributes.forEach((moduleAttr) => {
            // 检查是否已存在相同ID的属性
            if (!newAttributes.some((attr) => attr.id === moduleAttr.id)) {
              newAttributes.push(moduleAttr);
            }
          });

          return {
            ...entity,
            bundle_ids: [...entity.bundle_ids, moduleId],
            attributes: newAttributes,
          };
        })
      );
    },
    [getModulesByIds]
  );

  const removeModuleFromEntity = useCallback((entityId: string, moduleId: string) => {
    setEntities((prev) =>
      prev.map((entity) => {
        if (entity.id !== entityId) return entity;

        // 移除模块ID
        const newBundleIds = entity.bundle_ids.filter((id) => id !== moduleId);

        // 移除来自该模块的属性
        const newAttributes = entity.attributes.filter(
          (attr) => !attr.id.startsWith(`${moduleId}/`)
        );

        return {
          ...entity,
          bundle_ids: newBundleIds,
          attributes: newAttributes,
        };
      })
    );
  }, []);

  // 组件挂载时加载实体数据
  React.useEffect(() => {
    refreshEntities();
  }, [refreshEntities]);

  const value: EntityStoreContextType = {
    entities,
    getEntity,
    getEntityOwnAttributes,
    getEntityModuleAttributes,
    refreshEntities,
    updateEntity,
    addModuleToEntity,
    removeModuleFromEntity,
    loading,
  };

  return <EntityStoreContext.Provider value={value}>{children}</EntityStoreContext.Provider>;
};

// Hook
export const useEntityStore = (): EntityStoreContextType => {
  const context = useContext(EntityStoreContext);
  if (!context) {
    throw new Error('useEntityStore must be used within a EntityStoreProvider');
  }
  return context;
};
