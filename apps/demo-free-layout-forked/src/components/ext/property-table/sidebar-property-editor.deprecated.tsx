import React from 'react';

import { Table, Button } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconEdit } from '@douyinfe/semi-icons';

interface PropertyItem {
  id: string;
  name?: string;
  type: string;
  description?: string;
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
}

interface SidebarPropertyEditorProps {
  title: string;
  properties: PropertyItem[];
  onAdd?: () => void;
  onEdit?: (property: PropertyItem) => void;
  onDelete?: (property: PropertyItem) => void;
  showControls?: boolean;
}

export const SidebarPropertyEditor: React.FC<SidebarPropertyEditorProps> = ({
  title,
  properties,
  onAdd,
  onEdit,
  onDelete,
  showControls = true,
}) => {
  if (!properties || properties.length === 0) {
    return (
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          <span>{title}</span>
          {showControls && onAdd && (
            <Button icon={<IconPlus />} size="small" onClick={onAdd}>
              添加
            </Button>
          )}
        </div>
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
            color: '#999',
            fontSize: '12px',
          }}
        >
          暂无属性
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: '属性ID',
      dataIndex: 'id',
      key: 'id',
      width: '40%',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: '30%',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: '20%',
      render: (type: string) => (
        <span
          style={{
            padding: '2px 8px',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            fontSize: '12px',
          }}
        >
          {type}
        </span>
      ),
    },
  ];

  if (showControls) {
    columns.push({
      title: '操作',
      key: 'actions',
      width: '10%',
      render: (_: any, record: PropertyItem) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          {onEdit && (
            <Button
              icon={<IconEdit />}
              size="small"
              type="tertiary"
              onClick={() => onEdit(record)}
            />
          )}
          {onDelete && !record.isModuleProperty && (
            <Button
              icon={<IconDelete />}
              size="small"
              type="danger"
              onClick={() => onDelete(record)}
            />
          )}
        </div>
      ),
    } as any);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <span>{title}</span>
        {showControls && onAdd && (
          <Button icon={<IconPlus />} size="small" onClick={onAdd}>
            添加
          </Button>
        )}
      </div>
      <Table
        columns={columns}
        dataSource={properties}
        pagination={false}
        size="small"
        rowKey="id"
        style={{ fontSize: '12px' }}
      />
    </div>
  );
};
