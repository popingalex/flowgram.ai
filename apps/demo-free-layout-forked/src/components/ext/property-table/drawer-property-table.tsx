import React from 'react';

import { Table } from '@douyinfe/semi-ui';
import { IconInfoCircle } from '@douyinfe/semi-icons';

interface PropertyItem {
  id: string;
  name?: string;
  type: string;
  description?: string;
}

interface DrawerPropertyTableProps {
  title: string;
  properties: PropertyItem[];
}

export const DrawerPropertyTable: React.FC<DrawerPropertyTableProps> = ({ title, properties }) => {
  if (!properties || properties.length === 0) {
    return null;
  }

  const columns = [
    {
      title: '属性ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
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
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];

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
