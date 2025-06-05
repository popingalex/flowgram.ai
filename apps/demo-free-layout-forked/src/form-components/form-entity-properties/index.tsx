import React from 'react';

import { Table } from '@douyinfe/semi-ui';
import { Tooltip } from '@douyinfe/semi-ui';
import { IconInfoCircle } from '@douyinfe/semi-icons';

import { useNodeRenderContext } from '../../hooks';

export const FormEntityProperties: React.FC = () => {
  const { node } = useNodeRenderContext();

  if (!node?.entity?.attributes || node.entity.attributes.length === 0) {
    return null;
  }

  const columns = [
    {
      title: '属性ID',
      dataIndex: 'id',
      key: 'id',
      render: (text: string, record: any) => (
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
        实体属性
      </div>
      <Table
        columns={columns}
        dataSource={node.entity.attributes}
        pagination={false}
        size="small"
        rowKey="id"
        style={{ fontSize: '12px' }}
      />
    </div>
  );
};
