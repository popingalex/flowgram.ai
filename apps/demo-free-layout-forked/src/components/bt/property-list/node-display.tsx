import React from 'react';

import { Table, Tooltip, Tag } from '@douyinfe/semi-ui';

import { ModuleAttribute } from '../../../services/types';

export interface NodeModuleData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  attributes: ModuleAttribute[];
}

interface NodeModuleDisplayProps {
  modules: NodeModuleData[];
}

export const NodeModuleDisplay: React.FC<NodeModuleDisplayProps> = ({ modules }) => {
  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      render: (text: string, record: NodeModuleData) => (
        <Tooltip content={record.name}>
          <span style={{ fontSize: '12px' }}>{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '',
      dataIndex: 'attributeCount',
      key: 'attributeCount',
      width: 80,
      align: 'right' as const,
      render: (count: number, record: NodeModuleData) => {
        // 创建属性列表的tooltip内容
        const tooltipContent = (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {record.name}模块属性 ({count}个)
            </div>
            {record.attributes.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>ID</div>
                <div style={{ fontWeight: 'bold' }}>名称</div>
                <div style={{ fontWeight: 'bold' }}>类型</div>
                {record.attributes.map((attr, index) => (
                  <React.Fragment key={index}>
                    <div>{attr.displayId || attr.id}</div>
                    <div>{attr.name}</div>
                    <div>{attr.type}</div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999' }}>无属性信息</div>
            )}
          </div>
        );

        return (
          <Tooltip content={tooltipContent} style={{ width: '300px' }}>
            <Tag color="blue" style={{ cursor: 'help', fontSize: '11px' }}>
              {count}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={modules}
      pagination={false}
      size="small"
      rowKey="key"
      showHeader={false}
      onRow={() => ({
        style: {
          backgroundColor: 'transparent',
        },
      })}
    />
  );
};
