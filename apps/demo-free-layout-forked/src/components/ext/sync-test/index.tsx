import React from 'react';

import { Button, Space, Typography } from '@douyinfe/semi-ui';

import { useCurrentEntity, useCurrentEntityActions } from '../../../stores';

const { Text } = Typography;

/**
 * 同步测试组件
 * 用于验证实体数据同步功能
 */
export const SyncTest: React.FC = () => {
  const { editingEntity } = useCurrentEntity();
  const { updateProperty } = useCurrentEntityActions();

  if (!editingEntity) {
    return <Text>请先选择一个实体</Text>;
  }

  const handleTestUpdate = () => {
    // 测试更新实体基本信息
    const newName = `测试实体 ${Date.now()}`;
    console.log('🧪 测试更新实体名称:', { entityId: editingEntity.id, newName });
    updateProperty('name', newName);
  };

  return (
    <div style={{ padding: 16, border: '1px solid #e9ecef', borderRadius: 6 }}>
      <div style={{ marginBottom: 12 }}>
        <Text strong>实体数据同步测试</Text>
      </div>

      <div style={{ marginBottom: 8 }}>
        <Text>当前实体: {editingEntity.name || editingEntity.id}</Text>
      </div>

      <Space>
        <Button size="small" onClick={handleTestUpdate}>
          测试更新实体名称
        </Button>
      </Space>
    </div>
  );
};

