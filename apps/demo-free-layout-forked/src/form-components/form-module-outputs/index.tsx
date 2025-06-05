import React, { useContext, useMemo } from 'react';

import { nanoid } from 'nanoid';

import { useEntityListActions } from '../../stores';
import { SidebarContext } from '../../context';
import {
  EntityModuleTable,
  EntityModuleData,
} from '../../components/ext/property-table/entity-module-table';
import {
  EntityAttributeTable,
  EntityAttributeData,
} from '../../components/ext/property-table/entity-attribute-table';
import { useEntityStore } from '../../components/ext/entity-store';
import { useModuleStore } from '../../components/ext/entity-property-type-selector/module-store';

interface FormModuleOutputsProps {
  isSidebar?: boolean;
}

export function FormModuleOutputs({ isSidebar }: FormModuleOutputsProps = {}) {
  const { selectedEntityId } = useContext(SidebarContext);
  const { getEntityCompleteProperties } = useEntityStore();
  const { getEntityByStableId } = useEntityListActions();
  const { getModulesByIds } = useModuleStore();

  // 获取实体数据
  const currentEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;
  const entityProperties = currentEntity ? getEntityCompleteProperties(currentEntity.id) : null;

  // 准备实体属性数据
  const entityAttributes: EntityAttributeData[] = useMemo(() => {
    if (!entityProperties?.allProperties?.properties) return [];

    const properties = entityProperties.allProperties.properties;
    const result: EntityAttributeData[] = [];

    Object.entries(properties).forEach(([key, property]) => {
      const prop = property as any;

      // 只包含实体自身属性和自定义属性
      if (prop.isEntityProperty || (!prop.isModuleProperty && !prop.isEntityProperty)) {
        result.push({
          key: prop._indexId || key,
          id: prop.id || key,
          name: prop.name || prop.title || prop.id || key,
          type: prop.type || 'string',
          description: prop.description,
        });
      }
    });

    return result;
  }, [entityProperties]);

  // 准备模块数据
  const moduleData: EntityModuleData[] = useMemo(() => {
    if (!currentEntity?.bundles) return [];

    const moduleIds = currentEntity.bundles.filter((id) => typeof id === 'string') as string[];
    const modules = getModulesByIds(moduleIds);

    return modules.map((module) => ({
      key: `module-${module.id}`,
      id: module.id,
      name: module.name,
      attributeCount: module.attributes?.length || 0,
      attributes:
        module.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          type: attr.type,
        })) || [],
    }));
  }, [currentEntity, getModulesByIds]);

  if (!currentEntity) {
    return null;
  }

  return (
    <div>
      {moduleData.length > 0 && (
        <EntityModuleTable modules={moduleData} mode={isSidebar ? 'sidebar' : 'node'} />
      )}
    </div>
  );
}
