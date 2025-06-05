import React from 'react';

import { Table, Tooltip, Tag } from '@douyinfe/semi-ui';

export interface ModuleAttributeData {
  id: string;
  name: string;
  type: string;
}

export interface EntityModuleData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  attributes: ModuleAttributeData[];
}

interface EntityModuleTableProps {
  modules: EntityModuleData[];
  mode?: 'node' | 'sidebar';
}

export const EntityModuleTable: React.FC<EntityModuleTableProps> = ({ modules, mode = 'node' }) => {
  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      render: (text: string, record: EntityModuleData) => (
        <Tooltip content={record.name}>{text}</Tooltip>
      ),
    },
    {
      title: '',
      dataIndex: 'attributeCount',
      key: 'attributeCount',
      width: 80,
      align: 'right' as const,
      render: (count: number, record: EntityModuleData) => {
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
                    <div>{attr.id}</div>
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
            <Tag color="blue" style={{ cursor: 'help' }}>
              {count}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <div>
      {mode === 'sidebar' && (
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>关联模块</div>
      )}
      <Table
        columns={columns}
        dataSource={modules}
        pagination={false}
        size="small"
        rowKey="key"
        showHeader={false}
        onRow={() => ({
          style: {
            backgroundColor:
              mode === 'sidebar' ? 'var(--semi-color-fill-1)' : 'var(--semi-color-fill-0)',
          },
        })}
      />
    </div>
  );
};
