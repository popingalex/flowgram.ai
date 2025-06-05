import React from 'react';

import { Select, Button, Space, Typography, Form } from '@douyinfe/semi-ui';
import { IconSave, IconUndo } from '@douyinfe/semi-icons';

import { useEntityStore } from '../entity-store';

const { Text } = Typography;

interface EntityManagementBarProps {
  selectedEntityId: string | null;
  onEntityChange: (entityId: string | null) => void;
  isEntityDirty: boolean;
  isSaving: boolean;
  onSave: () => void;
  onReset: () => void;
}

export const EntityManagementBar: React.FC<EntityManagementBarProps> = ({
  selectedEntityId,
  onEntityChange,
  isEntityDirty,
  isSaving,
  onSave,
  onReset,
}) => {
  const { entities, loading } = useEntityStore();

  const handleChange = (
    value: string | number | string[] | Record<string, unknown> | undefined
  ) => {
    if (typeof value === 'string' || value === null || value === undefined) {
      onEntityChange(value as string | null);
    }
  };

  return (
    <Space align="center">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Form.Label>当前实体:</Form.Label>
        <Select
          placeholder="选择实体"
          style={{ width: 200 }}
          value={selectedEntityId || undefined}
          onChange={handleChange}
          loading={loading}
          showClear
        >
          {entities.map((entity) => (
            <Select.Option key={entity.id} value={entity.id}>
              {entity.name} ({entity.id})
            </Select.Option>
          ))}
        </Select>
      </div>

      <Button
        icon={<IconSave />}
        onClick={onSave}
        disabled={!isEntityDirty}
        loading={isSaving}
        type="primary"
        size="small"
      >
        保存
      </Button>

      <Button icon={<IconUndo />} onClick={onReset} disabled={!isEntityDirty} size="small">
        撤销
      </Button>
    </Space>
  );
};
