import React from 'react';

import { Table, Tooltip, Tag, Button } from '@douyinfe/semi-ui';
import { IconSetting } from '@douyinfe/semi-icons';

export interface ModuleAttributeData {
  id: string;
  name: string;
  type: string;
  key: string; // 用于Table的rowKey
  isAttribute?: boolean; // 标记是否为属性行
  parentKey?: string; // 父模块的key
}

export interface EntityModuleData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  attributes: ModuleAttributeData[];
  children?: ModuleAttributeData[]; // 树形结构的子节点
  isAttribute?: boolean; // 标记是否为属性行，模块行为false
}

interface EntityModuleTableProps {
  modules: EntityModuleData[];
  mode?: 'node' | 'sidebar';
  showAsTree?: boolean; // 是否显示为树形表格
  onDataRestrictionClick?: (attribute: ModuleAttributeData) => void; // 数据限制点击回调
}

export const EntityModuleTable: React.FC<EntityModuleTableProps> = ({
  modules,
  mode = 'node',
  showAsTree = false,
  onDataRestrictionClick,
}) => {
  // 树形表格的列配置
  const treeColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (text: string, record: EntityModuleData | ModuleAttributeData) => (
        <Tooltip content={text}>
          <span
            style={{
              fontWeight: record.isAttribute ? 'normal' : 'bold',
              color: record.isAttribute ? 'var(--semi-color-text-1)' : 'var(--semi-color-primary)',
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: EntityModuleData | ModuleAttributeData) => (
        <Tooltip content={text}>
          <span
            style={{
              fontWeight: record.isAttribute ? 'normal' : 'bold',
              color: record.isAttribute ? 'var(--semi-color-text-1)' : 'var(--semi-color-primary)',
            }}
          >
            {text}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text: string, record: EntityModuleData | ModuleAttributeData) => {
        if (record.isAttribute) {
          return <Tag size="small">{text}</Tag>;
        } else {
          return (
            <Tag color="blue" size="small">
              {(record as EntityModuleData).attributeCount} 属性
            </Tag>
          );
        }
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 60,
      render: (text: string, record: EntityModuleData | ModuleAttributeData) => {
        if (record.isAttribute && onDataRestrictionClick) {
          return (
            <Button
              size="small"
              theme="borderless"
              icon={<IconSetting />}
              onClick={() => onDataRestrictionClick(record as ModuleAttributeData)}
              style={{ padding: '4px' }}
            />
          );
        }
        return null;
      },
    },
  ];

  // 简单表格的列配置（原有的）
  const simpleColumns = [
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

  // 为树形表格准备数据
  const treeDataSource = showAsTree
    ? modules.map((module) => ({
        ...module,
        children: module.attributes.map((attr) => ({
          ...attr,
          isAttribute: true,
          parentKey: module.key,
        })),
      }))
    : modules;

  const columns = showAsTree ? treeColumns : simpleColumns;

  return (
    <div>
      {mode === 'sidebar' && !showAsTree && (
        <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>关联模块</div>
      )}
      <Table
        columns={columns}
        dataSource={treeDataSource}
        pagination={false}
        size="small"
        rowKey="key"
        showHeader={showAsTree}
        expandedRowRender={showAsTree ? undefined : undefined}
        defaultExpandAllRows={showAsTree}
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
