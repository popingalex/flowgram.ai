import React from 'react';

import { Table } from '@douyinfe/semi-ui';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconInfoCircle } from '@douyinfe/semi-icons';

interface PropertyItem {
  id: string;
  name?: string;
  type: string;
  description?: string;
}

interface NodePropertyTableProps {
  title: string;
  properties: PropertyItem[];
  showDescription?: boolean;
}

export const NodePropertyTable: React.FC<NodePropertyTableProps> = ({
  title,
  properties,
  showDescription = false,
}) => {
  if (!properties || properties.length === 0) {
    return null;
  }

  const columns = [
    {
      title: '属性ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: PropertyItem) => (
        <Tooltip content={record.name || text}>
          <span>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      align: 'right' as const,
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

  if (showDescription) {
    columns.splice(1, 0, {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    } as any);
  }

  return (
    <div style={{ marginBottom: 16 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 8,
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <IconInfoCircle style={{ marginRight: 4 }} />
        {title}
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
