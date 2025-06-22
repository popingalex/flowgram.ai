import React, { useCallback, useState } from 'react';

import { nanoid } from 'nanoid';
import { Input, Button, Select, Space } from '@douyinfe/semi-ui';
import { IconUndo, IconSend } from '@douyinfe/semi-icons';

interface ApiUrlToolbarProps {
  currentEditingApi: any;
  hasUnsavedChanges: boolean;
  onFieldChange?: (field: string, value: any) => void;
  hideActionButtons?: boolean;
}

export const ApiUrlToolbar: React.FC<ApiUrlToolbarProps> = ({
  currentEditingApi,
  hasUnsavedChanges,
  onFieldChange,
  hideActionButtons = false,
}) => {
  // 🔑 为组件生成稳定的key
  const [componentKeys] = useState(() => ({
    method: nanoid(),
    url: nanoid(),
  }));

  // 更新API字段
  const handleUpdateApiField = useCallback(
    (field: string, value: any) => {
      if (onFieldChange) {
        onFieldChange(field, value);
      }
    },
    [onFieldChange]
  );

  // 保存更改
  const handleSave = useCallback(() => {
    console.log('保存API更改');
  }, []);

  // 撤销更改
  const handleRevert = useCallback(() => {
    console.log('撤销API更改');
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        width: '100%',
      }}
    >
      <Select
        key={componentKeys.method}
        value={currentEditingApi.method || 'POST'}
        style={{ width: 80 }}
        onChange={(value) => handleUpdateApiField('method', value)}
      >
        <Select.Option value="GET">GET</Select.Option>
        <Select.Option value="POST">POST</Select.Option>
        <Select.Option value="PUT">PUT</Select.Option>
        <Select.Option value="DELETE">DELETE</Select.Option>
      </Select>

      <Input
        key={componentKeys.url}
        value={currentEditingApi.url || ''}
        onChange={(value) => handleUpdateApiField('url', value)}
        style={{ flex: 1 }}
        placeholder="请输入完整的API URL，如：http://10.3.9.138:16000/api/path"
      />

      {!hideActionButtons && (
        <Space>
          <Button
            type="primary"
            theme="solid"
            icon={<IconSend />}
            onClick={() => console.log('发送')}
          >
            发送
          </Button>
          <Button icon={<IconUndo />} onClick={handleRevert} disabled={!hasUnsavedChanges}>
            撤销
          </Button>
          <Button type="primary" onClick={handleSave} disabled={!hasUnsavedChanges}>
            保存
          </Button>
        </Space>
      )}
    </div>
  );
};
