import React, { useContext } from 'react';

import { Table, Tooltip } from '@douyinfe/semi-ui';

import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import { SidebarContext } from '../../../context';

export interface EntityAttributeData {
  key: string;
  id: string;
  name: string;
  type: string;
  description?: string;
}

interface EntityAttributeTableProps {
  attributes: EntityAttributeData[];
  onRowClick?: (record: EntityAttributeData) => void;
}

export const EntityAttributeTable: React.FC<EntityAttributeTableProps> = ({
  attributes,
  onRowClick,
}) => {
  const { setNodeRender } = useContext(SidebarContext);

  const handleRowClick = (record: EntityAttributeData) => {
    console.log('🔍 EntityAttributeTable - 点击属性行:', record);
    console.log('🔍 EntityAttributeTable - 点击属性行:', record);
    if (onRowClick) {
      onRowClick(record);
    } else {
      // 默认行为：触发侧边栏显示属性编辑
      console.log('🔍 EntityAttributeTable - 触发侧边栏');
      console.log('🔍 EntityAttributeTable - 触发侧边栏');
      setNodeRender({
        type: 'property-edit',
        data: record,
      } as any);
    }
  };

  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      ellipsis: true,
      render: (text: string, record: EntityAttributeData) => (
        <Tooltip content={record.name}>{text}</Tooltip>
      ),
    },
    {
      title: '',
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

  return (
    <Table
      columns={columns}
      dataSource={attributes}
      pagination={false}
      size="small"
      rowKey="key"
      showHeader={false}
      onRow={(record) => ({
        onClick: (e) => {
          e.stopPropagation(); // 阻止事件冒泡到节点
          record && handleRowClick(record);
        },
        style: { cursor: 'pointer' },
      })}
    />
  );
};
