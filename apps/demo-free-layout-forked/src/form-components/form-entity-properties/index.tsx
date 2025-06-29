import React from 'react';

import { Tooltip } from '@douyinfe/semi-ui';
import { IconInfoCircle } from '@douyinfe/semi-icons';

import { useNodeRenderContext } from '../../hooks';
import { UniversalTable } from '../../components/ext/universal-table';

export const FormEntityProperties: React.FC = () => {
  const { node } = useNodeRenderContext();

  // 从node的扩展信息中获取entity
  const entity = node?.getExtInfo()?.entity;

  if (!entity?.attributes || entity.attributes.length === 0) {
    return null;
  }

  // 使用UniversalTable的列配置
  const columns = [
    {
      key: 'id',
      title: '属性ID',
      dataIndex: 'id',
      width: 200,
      render: (text: string, record: any) => (
        <Tooltip content={record.name || text}>
          <span style={{ fontSize: '12px' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      key: 'type',
      title: '类型',
      dataIndex: 'type',
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
        属性
      </div>
      <UniversalTable
        dataSource={entity.attributes}
        columns={columns}
        rowKey="id"
        size="small"
        showPagination={false}
        emptyText="暂无属性"
      />
    </div>
  );
};
