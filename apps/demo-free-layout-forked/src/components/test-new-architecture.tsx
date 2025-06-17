import React from 'react';

import { Card, Button, Space, Typography, Input, Tag, Divider } from '@douyinfe/semi-ui';
import { IconSave, IconUndo } from '@douyinfe/semi-icons';

import {
  useEntityList,
  useEntityListActions,
  useCurrentEntity,
  useCurrentEntityActions,
  EntityEditProvider,
} from '../stores';

const { Title, Text } = Typography;

// 实体选择器组件
const EntitySelector: React.FC = () => {
  const { entities, loading } = useEntityList();
  const { selectedEntityId } = useCurrentEntity();
  const { selectEntity } = useCurrentEntityActions();
  const { getEntity } = useEntityListActions();

  return (
    <Card title="实体选择器" style={{ marginBottom: 16 }}>
      <Space>
        {entities.map((entity) => (
          <Button
            key={entity._indexId || entity.id} // 🎯 使用稳定的_indexId作为key
            type={selectedEntityId === entity._indexId ? 'primary' : 'tertiary'}
            onClick={() => selectEntity(entity)}
            loading={loading}
          >
            {entity.name}
          </Button>
        ))}
      </Space>
    </Card>
  );
};

// 实体编辑器组件（需要在EntityEditProvider内部使用）
const EntityEditor: React.FC = () => {
  const { originalEntity, editingEntity, isDirty, isSaving, error } = useCurrentEntity();
  const { updateProperty, resetChanges, saveChanges } = useCurrentEntityActions();

  return (
    <Card
      title="实体编辑器"
      style={{ marginBottom: 16 }}
      extra={
        <Space>
          <Button
            icon={<IconSave />}
            onClick={saveChanges}
            disabled={!isDirty}
            loading={isSaving}
            type="primary"
            size="small"
          >
            保存
          </Button>
          <Button icon={<IconUndo />} onClick={resetChanges} disabled={!isDirty} size="small">
            重置
          </Button>
        </Space>
      }
    >
      {error && (
        <Tag color="red" style={{ marginBottom: 16 }}>
          错误: {error}
        </Tag>
      )}

      {editingEntity ? (
        <Space vertical style={{ width: '100%' }}>
          <div>
            <Typography.Text strong>实体ID:</Typography.Text>
            <Input
              value={editingEntity.id || ''}
              onChange={(value) => updateProperty('id', value)}
              placeholder="实体ID"
              style={{ marginLeft: 8, width: 200 }}
            />
          </div>

          <div>
            <Typography.Text strong>实体名称:</Typography.Text>
            <Input
              value={editingEntity.name || ''}
              onChange={(value) => updateProperty('name', value)}
              placeholder="实体名称"
              style={{ marginLeft: 8, width: 200 }}
            />
          </div>

          <div>
            <Typography.Text strong>状态:</Typography.Text>
            <Space style={{ marginLeft: 8 }}>
              <Tag color={isDirty ? 'orange' : 'green'}>{isDirty ? '已修改' : '未修改'}</Tag>
              <Tag color={isSaving ? 'blue' : 'grey'}>{isSaving ? '保存中' : '空闲'}</Tag>
            </Space>
          </div>

          <Divider />

          <div>
            <Typography.Text strong>原始数据:</Typography.Text>
            <pre style={{ fontSize: 12, background: '#f6f6f6', padding: 8, borderRadius: 4 }}>
              {JSON.stringify(originalEntity, null, 2)}
            </pre>
          </div>

          <div>
            <Typography.Text strong>编辑数据:</Typography.Text>
            <pre style={{ fontSize: 12, background: '#f6f6f6', padding: 8, borderRadius: 4 }}>
              {JSON.stringify(editingEntity, null, 2)}
            </pre>
          </div>
        </Space>
      ) : (
        <Typography.Text type="secondary">请先选择一个实体</Typography.Text>
      )}
    </Card>
  );
};

// 主测试组件
export const TestNewArchitecture: React.FC = () => {
  const { selectedEntityId } = useCurrentEntity();
  const { getEntityByStableId } = useEntityListActions();
  const selectedEntity = selectedEntityId ? getEntityByStableId(selectedEntityId) : null;

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title heading={2}>新架构测试页面</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        测试 Zustand 实体管理和编辑功能
      </Typography.Text>

      <EntitySelector />

      {selectedEntity ? (
        <EntityEditProvider entity={selectedEntity}>
          <EntityEditor />
        </EntityEditProvider>
      ) : (
        <Card>
          <Typography.Text type="secondary">请先选择一个实体进行编辑</Typography.Text>
        </Card>
      )}
    </div>
  );
};
