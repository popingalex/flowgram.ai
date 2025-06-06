import React, { useContext, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';

import { useModuleStore } from '../../stores/module.store';
import { useEntityListActions } from '../../stores';
import { useIsSidebar } from '../../hooks';
import { SidebarContext } from '../../context';
import { ModuleSelectorModal } from '../../components/ext/module-selector';
import {
  NodeDisplay as NodeModuleDisplay,
  SidebarTree as ModulePropertyTreeTable,
} from '../../components/ext/module-property-tables';
import type {
  NodeModuleData,
  ModuleTreeData,
  ModulePropertyData,
} from '../../components/ext/module-property-tables';
import { useEntityStore } from '../../components/ext/entity-store';

interface FormModuleOutputsProps {
  isSidebar?: boolean;
}

export function FormModuleOutputs({ isSidebar: propIsSidebar }: FormModuleOutputsProps = {}) {
  const hookIsSidebar = useIsSidebar();
  const isSidebar = propIsSidebar !== undefined ? propIsSidebar : hookIsSidebar;
  const { selectedEntityId } = useContext(SidebarContext);
  const { getEntityCompleteProperties, updateEntity } = useEntityStore();
  const { getEntityByStableId } = useEntityListActions();
  const { getModulesByIds } = useModuleStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>();

  // 获取实体数据
  const currentEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;
  const entityProperties = currentEntity ? getEntityCompleteProperties(currentEntity.id) : null;

  const handleConfigureModules = () => {
    setFocusModuleId(undefined); // 一般打开，不聚焦
    setIsModalVisible(true);
  };

  const handleNavigateToModule = (moduleId: string) => {
    setFocusModuleId(moduleId); // 带滚动打开，设置聚焦ID
    setIsModalVisible(true);
  };

  const handleModalConfirm = (selectedIds: string[]) => {
    if (currentEntity) {
      updateEntity(currentEntity.id, { ...currentEntity, bundles: selectedIds });
    }
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  // 准备节点模块数据
  const nodeModuleData: NodeModuleData[] = useMemo(() => {
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

  // 准备边栏树形模块数据
  const treeModuleData: ModuleTreeData[] = useMemo(() => {
    if (!currentEntity?.bundles) return [];

    const moduleIds = currentEntity.bundles.filter((id) => typeof id === 'string') as string[];
    const modules = getModulesByIds(moduleIds);

    console.log('🔍 FormModuleOutputs - 模块数据:', {
      moduleIds,
      modules: modules.map((m) => ({
        id: m.id,
        name: m.name,
        attributeCount: m.attributes?.length,
        attributes: m.attributes?.map((attr) => ({
          id: attr.id,
          name: attr.name,
          type: attr.type,
        })),
      })),
    });

    return modules.map((module) => ({
      key: `module-${module.id}`,
      id: module.id,
      name: module.name,
      attributeCount: module.attributes?.length || 0,
      children:
        module.attributes?.map((attr) => ({
          key: `${module.id}-${attr.id}`,
          id: attr.id,
          name: attr.name,
          type: attr.type,
          description: attr.description,
        })) || [],
    }));
  }, [currentEntity, getModulesByIds]);

  if (!currentEntity) {
    return null;
  }

  // 边栏模式：使用树形表格
  if (isSidebar) {
    return (
      <>
        {treeModuleData.length > 0 ? (
          <ModulePropertyTreeTable
            modules={treeModuleData}
            onNavigateToModule={handleNavigateToModule}
            onConfigureModules={handleConfigureModules}
          />
        ) : null}

        {isModalVisible && currentEntity && (
          <ModuleSelectorModal
            visible={isModalVisible}
            onConfirm={handleModalConfirm}
            onCancel={handleModalCancel}
            selectedModuleIds={
              currentEntity.bundles.filter((id) => typeof id === 'string') as string[]
            }
            focusModuleId={focusModuleId}
          />
        )}
      </>
    );
  }

  // 节点模式：使用简单模块显示
  return nodeModuleData.length > 0 ? <NodeModuleDisplay modules={nodeModuleData} /> : null;
}
