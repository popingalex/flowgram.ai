import React, { useState } from 'react';

import { Table, Button, Space, Typography, Tooltip } from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconChevronDown, IconChevronRight } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../type-selector-ext';
import { PropertyData } from '../../../utils/property-data-manager';

export interface PropertyTableProps {
  title?: string;
  properties: PropertyData[];
  mode: 'node' | 'sidebar';
  editable?: boolean;
  selectable?: boolean;
  onEdit?: (property: PropertyData) => void;
  onDelete?: (property: PropertyData) => void;
  onSelect?: (properties: PropertyData[]) => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  title,
  properties,
  mode,
  editable = false,
  selectable = false,
  onEdit,
  onDelete,
  onSelect,
}) => {
  const { Text } = Typography;
  const [isExpanded, setIsExpanded] = useState(true);

  // 根据模式定义列
  const getColumns = () => {
    const baseColumns: any[] = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: mode === 'node' ? 100 : 120,
        ellipsis: true,
        render: (text: string, record: PropertyData) => (
          <Tooltip content={text}>
            <span style={{ fontSize: mode === 'node' ? '12px' : '14px' }}>{text}</span>
          </Tooltip>
        ),
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        width: mode === 'node' ? 120 : 150,
        ellipsis: true,
        render: (text: string, record: PropertyData) => (
          <Tooltip content={text}>
            <span>{text}</span>
          </Tooltip>
        ),
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: mode === 'node' ? 80 : 100,
        render: (text: string, record: PropertyData) => {
          if (mode === 'node') {
            // 节点模式：显示类型图标（只读）
            return <EntityPropertyTypeSelector value={{ type: text }} disabled={true} />;
          } else {
            // 侧边栏模式：显示文字
            return (
              <Text type="tertiary" size="small">
                {text}
              </Text>
            );
          }
        },
      },
    ];

    // 侧边栏模式显示更多信息
    if (mode === 'sidebar') {
      baseColumns.push({
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        width: 200,
        render: (text: string) => (
          <Text type="secondary" size="small">
            {text || '-'}
          </Text>
        ),
      });
    }

    // 添加操作列
    if (editable && (onEdit || onDelete)) {
      baseColumns.push({
        title: '操作',
        dataIndex: 'actions',
        key: 'actions',
        width: mode === 'node' ? 80 : 100,
        render: (_: any, record: PropertyData) => (
          <Space>
            {onEdit && !record.readonly && (
              <Button
                theme="borderless"
                type="primary"
                icon={<IconEdit />}
                size="small"
                onClick={() => onEdit(record)}
              />
            )}
            {onDelete && !record.readonly && (
              <Button
                theme="borderless"
                type="danger"
                icon={<IconDelete />}
                size="small"
                onClick={() => onDelete(record)}
              />
            )}
          </Space>
        ),
      });
    }

    return baseColumns;
  };

  if (properties.length === 0) {
    return null;
  }

  return (
    <div className={`property-table property-table--${mode}`}>
      {title && (
        <div
          className="property-table-title"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
          <Text strong>{title}</Text>
          <Text type="tertiary" size="small">
            ({properties.length})
          </Text>
        </div>
      )}
      {isExpanded && (
        <Table
          dataSource={properties}
          columns={getColumns()}
          rowKey="key"
          size={mode === 'node' ? 'small' : 'default'}
          pagination={false}
          rowSelection={
            selectable
              ? {
                  onChange: (selectedRowKeys, selectedRows) => {
                    onSelect?.(selectedRows || []);
                  },
                }
              : undefined
          }
          style={{
            fontSize: mode === 'node' ? '12px' : '14px',
          }}
        />
      )}
    </div>
  );
};
