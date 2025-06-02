import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
  useEffect,
} from 'react';

import { nanoid } from 'nanoid';

import { useModuleStore } from '../entity-property-type-selector/module-store';
import type { Entity, Attribute } from '../../../services/types';
import { entityApi } from '../../../services/api-service';
import {
  StoreEntityData,
  StoreAttribute,
  JSONSchemaEntityData,
  JSONSchemaProperty,
  EntityCompleteProperties,
  isStoreEntityData,
  isJSONSchemaEntityData,
} from './types';

// 重新导出类型
export type { Entity, Attribute };
export type { EntityCompleteProperties, JSONSchemaEntityData, JSONSchemaProperty } from './types';

// Store接口
interface EntityStoreContextType {
  entities: Entity[];
  getEntity: (id: string) => Entity | undefined;
  getEntityOwnAttributes: (entity: Entity) => Attribute[]; // 获取实体自身属性
  getEntityModuleAttributes: (entity: Entity) => Attribute[]; // 获取来自模块的属性
  getEntityCompleteProperties: (entityId: string) => EntityCompleteProperties | null; // 获取完整属性结构
  refreshEntities: () => Promise<void>;
  updateEntity: (entityId: string, updates: Partial<Entity>) => void;
  addModuleToEntity: (entityId: string, moduleId: string) => void;
  removeModuleFromEntity: (entityId: string, moduleId: string) => void;
  loading: boolean;
  // 新增：属性变化事件
  onEntityPropertiesChange: (
    callback: (entityId: string, properties: EntityCompleteProperties) => void
  ) => () => void;
}

const EntityStoreContext = createContext<EntityStoreContextType | undefined>(undefined);

// Provider组件
export const EntityStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const { getModulesByIds } = useModuleStore();

  // 属性变化监听器
  const [propertyChangeListeners, setPropertyChangeListeners] = useState<
    Array<(entityId: string, properties: EntityCompleteProperties) => void>
  >([]);

  // 缓存nanoid映射，避免重复生成
  const nanoidCache = new Map<string, string>();

  const generateStableNanoid = useCallback((key: string): string => {
    if (!nanoidCache.has(key)) {
      nanoidCache.set(key, nanoid());
    }
    return nanoidCache.get(key)!;
  }, []);

  // 将Store格式的属性转换为JSONSchema格式
  const convertToJSONSchemaProperty = useCallback(
    (attr: Attribute, isEntityProp = false, moduleId?: string): JSONSchemaProperty => {
      const nanoidKey = generateStableNanoid(
        isEntityProp ? `entity_${attr.id}` : `module_${moduleId}_${attr.id}`
      );

      const propertyValue: JSONSchemaProperty = {
        // 保留所有原始属性作为meta属性（除了会冲突的字段）
        id: attr.id,
        name: attr.name || attr.id, // 如果name为空，使用id作为默认值
        description: attr.description,
        enumClassId: attr.enumClassId,
        // 转换后的JSONSchema字段
        type:
          attr.type === 'n'
            ? 'number'
            : attr.type === 's'
            ? 'string'
            : attr.type?.includes('[')
            ? 'array'
            : 'string',
        ...(attr.type?.includes('[') && {
          items: {
            type:
              attr.type?.replace(/\[|\]/g, '') === 'n'
                ? 'number'
                : attr.type?.replace(/\[|\]/g, '') === 's'
                ? 'string'
                : 'string',
          },
        }),
        // 索引信息
        _id: nanoidKey,
        // 分类标记
        ...(isEntityProp && { isEntityProperty: true }),
        ...(!isEntityProp && { isModuleProperty: true, moduleId }),
      };

      return propertyValue;
    },
    [generateStableNanoid]
  );

  const refreshEntities = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedEntities = await entityApi.getAll();
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

  const getEntityOwnAttributes = useCallback((entity: Entity) => entity.attributes, []);

  const getEntityModuleAttributes = useCallback(
    (entity: Entity) => {
      if (!entity.bundles || entity.bundles.length === 0) return [];

      const modules = getModulesByIds(entity.bundles);
      const moduleAttributes: Attribute[] = [];

      modules.forEach((module) => {
        module.attributes.forEach((attr) => {
          moduleAttributes.push(attr);
        });
      });

      return moduleAttributes;
    },
    [getModulesByIds]
  );

  // 获取实体的完整属性结构（两种格式）
  const getEntityCompleteProperties = useCallback(
    (entityId: string): EntityCompleteProperties | null => {
      const entity = getEntity(entityId);
      if (!entity) {
        console.warn(`Entity not found: ${entityId}`);
        return null;
      }

      // 获取实体自身属性
      const entityAttributes = getEntityOwnAttributes(entity);

      // 获取模块属性
      const moduleAttributes = getEntityModuleAttributes(entity);

      // 构建JSONSchema格式的属性集合
      const properties: Record<string, JSONSchemaProperty> = {};

      // 添加实体自身属性
      entityAttributes.forEach((attr) => {
        const nanoidKey = generateStableNanoid(`entity_${attr.id}`);
        properties[nanoidKey] = convertToJSONSchemaProperty(attr, true);
      });

      // 添加模块属性
      moduleAttributes.forEach((attr) => {
        // 解析模块属性ID格式：moduleId/attrId
        const [moduleId, attrId] = attr.id.includes('/')
          ? attr.id.split('/', 2)
          : ['unknown', attr.id];

        const nanoidKey = generateStableNanoid(`module_${moduleId}_${attrId}`);
        properties[nanoidKey] = convertToJSONSchemaProperty(attr, false, moduleId);
      });

      const jsonSchemaData: JSONSchemaEntityData = {
        type: 'object',
        properties,
      };

      // 验证数据结构
      if (!isJSONSchemaEntityData(jsonSchemaData)) {
        console.error('Generated JSONSchema data is invalid:', jsonSchemaData);
        return null;
      }

      // 返回两种相同格式的数据（都是nanoid索引）
      return {
        allProperties: jsonSchemaData, // 用于节点显示
        editableProperties: jsonSchemaData, // 用于抽屉编辑
      };
    },
    [
      getEntity,
      getEntityOwnAttributes,
      getEntityModuleAttributes,
      convertToJSONSchemaProperty,
      generateStableNanoid,
    ]
  );

  // 触发属性变化事件
  const notifyPropertyChange = useCallback(
    (entityId: string) => {
      const properties = getEntityCompleteProperties(entityId);
      if (properties) {
        propertyChangeListeners.forEach((listener) => {
          try {
            listener(entityId, properties);
          } catch (error) {
            console.error('Error in property change listener:', error);
          }
        });
      }
    },
    [getEntityCompleteProperties, propertyChangeListeners]
  );

  // 用于跟踪需要通知的实体变化
  const [pendingNotifications, setPendingNotifications] = useState<Set<string>>(new Set());

  // 使用useEffect处理属性变化通知，避免在更新函数中直接调用setState
  useEffect(() => {
    if (pendingNotifications.size > 0) {
      pendingNotifications.forEach((entityId) => {
        notifyPropertyChange(entityId);
      });
      setPendingNotifications(new Set());
    }
  }, [pendingNotifications, notifyPropertyChange]);

  // 添加到待通知列表
  const schedulePropertyChangeNotification = useCallback((entityId: string) => {
    setPendingNotifications((prev) => new Set([...prev, entityId]));
  }, []);

  // 注册属性变化监听器
  const onEntityPropertiesChange = useCallback(
    (callback: (entityId: string, properties: EntityCompleteProperties) => void) => {
      setPropertyChangeListeners((prev) => [...prev, callback]);

      // 返回取消监听的函数
      return () => {
        setPropertyChangeListeners((prev) => prev.filter((listener) => listener !== callback));
      };
    },
    []
  );

  const updateEntity = useCallback(
    (entityId: string, updates: Partial<Entity>) => {
      setEntities((prev) =>
        prev.map((entity) => {
          if (entity.id === entityId) {
            const updatedEntity = { ...entity, ...updates };
            // 安排属性变化通知
            schedulePropertyChangeNotification(entityId);
            return updatedEntity;
          }
          return entity;
        })
      );
    },
    [schedulePropertyChangeNotification]
  );

  const addModuleToEntity = useCallback(
    (entityId: string, moduleId: string) => {
      setEntities((prev) =>
        prev.map((entity) => {
          if (entity.id !== entityId) return entity;

          // 检查是否已绑定
          if (entity.bundles.includes(moduleId)) return entity;

          const updatedEntity = {
            ...entity,
            bundles: [...entity.bundles, moduleId],
          };

          // 安排属性变化通知
          schedulePropertyChangeNotification(entityId);

          return updatedEntity;
        })
      );
    },
    [schedulePropertyChangeNotification]
  );

  const removeModuleFromEntity = useCallback(
    (entityId: string, moduleId: string) => {
      setEntities((prev) =>
        prev.map((entity) => {
          if (entity.id !== entityId) return entity;

          const updatedEntity = {
            ...entity,
            bundles: entity.bundles.filter((id) => id !== moduleId),
          };

          // 安排属性变化通知
          schedulePropertyChangeNotification(entityId);

          return updatedEntity;
        })
      );
    },
    [schedulePropertyChangeNotification]
  );

  // 组件挂载时加载实体数据
  React.useEffect(() => {
    refreshEntities();
  }, [refreshEntities]);

  const value: EntityStoreContextType = {
    entities,
    getEntity,
    getEntityOwnAttributes,
    getEntityModuleAttributes,
    getEntityCompleteProperties,
    refreshEntities,
    updateEntity,
    addModuleToEntity,
    removeModuleFromEntity,
    onEntityPropertiesChange,
    loading,
  };

  return <EntityStoreContext.Provider value={value}>{children}</EntityStoreContext.Provider>;
};

export const useEntityStore = (): EntityStoreContextType => {
  const context = useContext(EntityStoreContext);
  if (context === undefined) {
    throw new Error('useEntityStore must be used within an EntityStoreProvider');
  }
  return context;
};
