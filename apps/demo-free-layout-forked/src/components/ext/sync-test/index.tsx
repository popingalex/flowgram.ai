import React from 'react';

import { Button, Space, Typography } from '@douyinfe/semi-ui';

import { useCurrentEntity, useCurrentEntityActions } from '../../../stores';

const { Text } = Typography;

/**
 * 同步测试组件
 * 用于验证工作流同步控制功能
 */
export const SyncTest: React.FC = () => {
  const { editingEntity, enableWorkflowSync } = useCurrentEntity();
  const { updateAttributeProperty, setWorkflowSyncEnabled } = useCurrentEntityActions();

  if (!editingEntity) {
    return <Text>请先选择一个实体</Text>;
  }

  const testAttribute = editingEntity.attributes?.[0];

  const handleTestUpdate = () => {
    if (testAttribute) {
      const newName = `测试属性 ${Date.now()}`;
      console.log('🧪 测试更新属性:', { attributeId: testAttribute._indexId, newName });
      updateAttributeProperty(testAttribute._indexId, 'name', newName);
    }
  };

  return (
    <div style={{ padding: 16, border: '1px solid #e9ecef', borderRadius: 6 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>工作流同步测试</Text>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text>同步状态: {enableWorkflowSync ? '✅ 启用' : '🚫 禁用'}</Text>
      </div>

      {testAttribute && (
        <div style={{ marginBottom: 8 }}>
          <Text>测试属性: {testAttribute.name}</Text>
        </div>
      )}

      <Space>
        <Button size="small" onClick={handleTestUpdate}>
          测试更新属性
        </Button>
        <Button
          size="small"
          type={enableWorkflowSync ? 'danger' : 'primary'}
          onClick={() => setWorkflowSyncEnabled(!enableWorkflowSync)}
        >
          {enableWorkflowSync ? '禁用同步' : '启用同步'}
        </Button>
      </Space>
    </div>
  );
};
