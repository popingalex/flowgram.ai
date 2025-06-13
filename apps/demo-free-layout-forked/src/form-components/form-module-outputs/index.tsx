import React, { useMemo, useState } from 'react';

import { nanoid } from 'nanoid';

import { useModuleStore } from '../../stores/module.store';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useIsSidebar } from '../../hooks';
import { ModuleSelectorModal } from '../../components/ext/module-selector';
import {
  NodeDisplay as NodeModuleDisplay,
  SidebarTree as ModulePropertyTreeTable,
} from '../../components/ext/module-property-tables';
import type { NodeModuleData } from '../../components/ext/module-property-tables';

interface FormModuleOutputsProps {
  isSidebar?: boolean;
}

export function FormModuleOutputs({ isSidebar: propIsSidebar }: FormModuleOutputsProps = {}) {
  const hookIsSidebar = useIsSidebar();
  const isSidebar = propIsSidebar !== undefined ? propIsSidebar : hookIsSidebar;
  const { editingEntity } = useCurrentEntity();
  const { updateEntity } = useCurrentEntityActions();
  const { getModulesByIds } = useModuleStore();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>();

  // 获取实体数据
  console.log('module component editingEntity: ', editingEntity);
  const currentEntity = editingEntity;

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
      updateEntity({ bundles: selectedIds });
    }
    setIsModalVisible(false);
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
  };

  // 准备节点模块数据 - 使用nanoid匹配
  const nodeModuleData: NodeModuleData[] = useMemo(() => {
    console.log('currentEntity: ', currentEntity);
    if (!currentEntity?.bundles) return [];

    const { modules } = useModuleStore.getState();

    // 通过nanoid或ID匹配模块
    const matchedModules = modules.filter((module) => {
      const isMatched =
        currentEntity.bundles.includes(module._indexId || '') ||
        currentEntity.bundles.includes(module.id);
      return isMatched;
    });

    console.log('match modules: ', matchedModules);

    return matchedModules.map((module) => ({
      key: `module-${module._indexId || module.id}`, // 使用nanoid作为key
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
  }, [currentEntity]);

  if (!currentEntity) {
    return null;
  }

  // 边栏模式：使用树形表格
  if (isSidebar) {
    return (
      <>
        <ModulePropertyTreeTable showTitle={true} title="模块属性" />

        {isModalVisible && currentEntity && (
          <ModuleSelectorModal
            visible={isModalVisible}
            onConfirm={handleModalConfirm}
            onCancel={handleModalCancel}
            selectedModuleIds={currentEntity.bundles} // 直接传递bundles，包含nanoid
            focusModuleId={focusModuleId}
          />
        )}
      </>
    );
  }

  // 节点模式：使用简单模块显示
  return nodeModuleData.length > 0 ? <NodeModuleDisplay modules={nodeModuleData} /> : null;
}
