import React from 'react';

import { Table, Tag, Button, Tooltip } from '@douyinfe/semi-ui';
import { IconSetting, IconMinus } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';

export interface PropertyData {
  key: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
}

interface UnifiedPropertyDisplayProps {
  properties: PropertyData[];
  mode: 'node' | 'sidebar';
  editable?: boolean;
  onEdit?: (property: PropertyData) => void;
  onDelete?: (property: PropertyData) => void;
  onDataRestriction?: (property: PropertyData) => void;
}

export const UnifiedPropertyDisplay: React.FC<UnifiedPropertyDisplayProps> = ({
  properties,
  mode,
  editable = false,
  onEdit,
  onDelete,
  onDataRestriction,
}) => {
  // 节点模式：只显示ID和类型图标
  const nodeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      render: (text: string, record: PropertyData) => (
        <Tooltip content={record.name}>
          <span style={{ fontSize: '12px' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'right' as const,
      render: (text: string) => (
        <div onClick={(e) => e.stopPropagation()}>
          <EntityPropertyTypeSelector value={{ type: text }} disabled />
        </div>
      ),
    },
  ];

  // 边栏模式：4列完整显示
  const sidebarColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip content={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string) => (
        <Tooltip content={text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <EntityPropertyTypeSelector value={{ type }} disabled />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 80,
      render: (text: string, record: PropertyData) => (
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {onDataRestriction && (
            <Button
              size="small"
              theme="borderless"
              icon={<IconSetting />}
              onClick={() => onDataRestriction(record)}
              style={{ padding: '4px' }}
            />
          )}
          {editable && onDelete && (
            <Button
              size="small"
              theme="borderless"
              icon={<IconMinus />}
              onClick={() => onDelete(record)}
              style={{ padding: '4px' }}
            />
          )}
        </div>
      ),
    },
  ];

  const columns = mode === 'node' ? nodeColumns : sidebarColumns;

  return (
    <Table
      columns={columns}
      dataSource={properties}
      pagination={false}
      size="small"
      rowKey="key"
      showHeader={mode === 'sidebar'}
      onRow={(record) => ({
        style: {
          backgroundColor: mode === 'sidebar' ? 'var(--semi-color-fill-1)' : 'transparent',
        },
      })}
    />
  );
};
