import React, { useState } from 'react';

import { Typography } from '@douyinfe/semi-ui';

import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useIsSidebar } from '../../hooks';

const { Text } = Typography;

interface FormModuleOutputsProps {
  isSidebar?: boolean;
}

export function FormModuleOutputs({ isSidebar: propIsSidebar }: FormModuleOutputsProps = {}) {
  const hookIsSidebar = useIsSidebar();
  const isSidebar = propIsSidebar !== undefined ? propIsSidebar : hookIsSidebar;
  const { editingEntity } = useCurrentEntity();

  // 获取实体数据
  const currentEntity = editingEntity;

  if (!currentEntity) {
    return null;
  }

  // 简化显示：只显示模块关联信息，不提供复杂的编辑功能
  const associatedModules = currentEntity.bundles || [];

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Text strong>关联模块</Text>
        <Text type="secondary">({associatedModules.length}个)</Text>
      </div>

      {associatedModules.length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {associatedModules.map((moduleId) => (
            <div
              key={moduleId}
              style={{
                padding: '2px 8px',
                backgroundColor: 'var(--semi-color-fill-1)',
                borderRadius: '4px',
                fontSize: '12px',
              }}
            >
              {moduleId}
            </div>
          ))}
        </div>
      ) : (
        <Text type="tertiary" style={{ fontSize: '12px' }}>
          暂无关联模块
        </Text>
      )}
    </div>
  );
}
