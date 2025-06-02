import React, { useMemo } from 'react';

import { Table, Tag, Tooltip } from '@douyinfe/semi-ui';

import { EntityPropertyTypeSelector } from '../entity-property-type-selector';

// 节点展示的属性数据类型
export interface NodePropertyRowData {
  key: string; // nanoid作为唯一标识
  id: string; // 英文标识符
  name: string; // 中文名称
  type: string; // 属性类型
  category: 'entity' | 'module' | 'custom'; // 属性分类
  moduleId?: string; // 模块ID（如果是模块属性）
  moduleName?: string; // 模块名称（如果是模块属性）
  attributeCount?: number; // 模块包含的属性数量
}

interface NodePropertyTableProps {
  // 属性数据
  properties: NodePropertyRowData[];
  // 模块数据
  modules: Array<{
    id: string;
    name: string;
    attributeCount: number;
  }>;
}

export const NodePropertyTable: React.FC<NodePropertyTableProps> = ({ properties, modules }) => {
  // 表格列定义 - 只显示id、name、type三列
  const columns = useMemo(
    () => [
      {
        title: '',
        dataIndex: 'id',
        key: 'id',
        width: 120,
        ellipsis: true,
        render: (text: string) => text,
      },
      {
        title: '',
        dataIndex: 'name',
        key: 'name',
        width: 150,
        ellipsis: true,
        render: (text: string) => text,
      },
      {
        title: '',
        dataIndex: 'type',
        key: 'type',
        render: (text: string, record: NodePropertyRowData) => {
          // 如果是模块，显示包含属性的数量
          if (record.category === 'module' && record.attributeCount !== undefined) {
            return (
              <Tooltip content={`${record.moduleName}模块包含 ${record.attributeCount} 个属性`}>
                <Tag color="blue">{record.attributeCount}</Tag>
              </Tooltip>
            );
          }
          // 否则显示类型选择器（只读 - 不响应点击事件）
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <EntityPropertyTypeSelector value={{ type: text }} disabled />
            </div>
          );
        },
      },
    ],
    []
  );

  // 准备表格数据：实体属性 + 模块摘要
  const tableData = useMemo(() => {
    const result: NodePropertyRowData[] = [];

    // 添加实体属性和自定义属性
    properties.forEach((prop) => {
      if (prop.category === 'entity' || prop.category === 'custom') {
        result.push(prop);
      }
    });

    // 添加模块摘要
    modules.forEach((module) => {
      result.push({
        key: `module-${module.id}`,
        id: module.id,
        name: module.name,
        type: 'module',
        category: 'module',
        moduleId: module.id,
        moduleName: module.name,
        attributeCount: module.attributeCount,
      });
    });

    return result;
  }, [properties, modules]);

  return (
    <div style={{ padding: '4px' }}>
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
        rowKey="key"
        showHeader={false}
        onRow={(record: NodePropertyRowData | undefined) => {
          // 为模块行添加背景色
          if (record?.category === 'module') {
            return {
              style: {
                backgroundColor: 'var(--semi-color-fill-0)',
              },
            };
          }
          return {};
        }}
      />
    </div>
  );
};

export default NodePropertyTable;
