import React, { useState } from 'react';

import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useIsSidebar } from '../../hooks';
import { UniversalPropertyTable } from '../../components/bt/universal-property-table';
import { ModuleSelectorTableModal } from '../../components/bt/module-selector-table';

interface FormModuleOutputsProps {
  isSidebar?: boolean;
}

export function FormModuleOutputs({ isSidebar: propIsSidebar }: FormModuleOutputsProps = {}) {
  const hookIsSidebar = useIsSidebar();
  const isSidebar = propIsSidebar !== undefined ? propIsSidebar : hookIsSidebar;
  const { editingEntity } = useCurrentEntity();
  const { updateEntity } = useCurrentEntityActions();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>();
  const [isExpanded, setIsExpanded] = useState(true);

  // 获取实体数据
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

  // 不再需要准备模块数据，PropertyPanel内部会处理

  if (!currentEntity) {
    return null;
  }

  return (
    <>
      <UniversalPropertyTable
        mode={isSidebar ? 'sidebar' : 'node'}
        editable={isSidebar}
        showEntityProperties={false}
        showModuleProperties={true}
        moduleTitle="实体模块"
      />

      {isModalVisible && currentEntity && (
        <ModuleSelectorTableModal
          visible={isModalVisible}
          onConfirm={handleModalConfirm}
          onCancel={handleModalCancel}
          selectedModuleIds={currentEntity.bundles}
          entityId={currentEntity.id}
        />
      )}
    </>
  );
}
