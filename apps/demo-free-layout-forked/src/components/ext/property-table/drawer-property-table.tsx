import React, { useMemo } from 'react';

import { Table, Button, Space, Tooltip, Input, Tag, Typography } from '@douyinfe/semi-ui';
import { IconArticle, IconDelete, IconSetting } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../entity-property-type-selector';

// 抽屉展示的属性数据类型
export interface DrawerPropertyRowData {
  key: string; // nanoid作为唯一标识
  id: string; // 原始英文标识符（保留完整路径）
  displayId?: string; // 显示用的ID（模块属性去掉前缀后的ID）
  name: string; // 中文名称
  type: string; // 属性类型
  description?: string; // 描述
  category: 'entity' | 'module' | 'custom'; // 属性分类
  moduleId?: string; // 模块ID（如果是模块属性）
  isReadOnly?: boolean; // 是否只读
  children?: DrawerPropertyRowData[]; // 子属性（用于分组显示）
}

interface DrawerPropertyTableProps {
  // 属性数据
  properties: DrawerPropertyRowData[];
  // 属性变化回调
  onPropertyChange?: (key: string, field: string, value: any) => void;
  // 删除属性回调
  onPropertyDelete?: (key: string) => void;
  // 数据限制编辑回调
  onDataRestrictionEdit?: (key: string) => void;
  // 描述编辑回调
  onDescriptionEdit?: (key: string) => void;
  // 模块编辑回调
  onModuleEdit?: (moduleId: string) => void;
}

export const DrawerPropertyTable: React.FC<DrawerPropertyTableProps> = ({
  properties,
  onPropertyChange,
  onPropertyDelete,
  onDataRestrictionEdit,
  onDescriptionEdit,
  onModuleEdit,
}) => {
  // 表格列定义 - 展开列、ID、名称、操作按钮组四列
  const columns = useMemo(
    () => [
      {
        title: '',
        dataIndex: 'expand',
        key: 'expand',
        width: 30,
        render: () => null, // 展开按钮由Table自动处理
      },
      {
        title: '',
        dataIndex: 'id',
        key: 'id',
        width: 180,
        ellipsis: true,
        render: (text: string, record: DrawerPropertyRowData) => {
          // 如果是分组标题行，显示文本
          if (record.children && record.children.length > 0) {
            return <Typography.Text strong>{text}</Typography.Text>;
          }

          // 对于模块属性，优先使用displayId（去掉前缀的ID）
          const displayValue = record.displayId || text;

          return (
            <Input
              value={displayValue}
              onChange={(value) => {
                // 如果是模块属性，需要重新组装完整的ID
                if (record.category === 'module' && record.moduleId && record.displayId) {
                  const fullId = `${record.moduleId}/${value}`;
                  onPropertyChange?.(record.key, 'id', fullId);
                } else {
                  // 非模块属性直接使用value
                  onPropertyChange?.(record.key, 'id', value);
                }
              }}
              placeholder="属性ID"
              size="small"
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
              }}
            />
          );
        },
      },
      {
        title: '',
        dataIndex: 'name',
        key: 'name',
        width: 180,
        ellipsis: true,
        render: (text: string, record: DrawerPropertyRowData) => {
          // 如果是分组标题行，显示文本
          if (record.children && record.children.length > 0) {
            return <Typography.Text strong>{text || record.name}</Typography.Text>;
          }

          // 直接使用text，就像左侧面板一样简单
          return (
            <Input
              value={text}
              onChange={(value) => onPropertyChange?.(record.key, 'name', value)}
              placeholder="中文名称"
              size="small"
            />
          );
        },
      },
      {
        title: '',
        dataIndex: 'actions',
        key: 'actions',
        render: (value: any, record: DrawerPropertyRowData) => {
          // 如果是分组标题行，显示属性数量Tag和编辑按钮
          if (record.children && record.children.length > 0) {
            return (
              <Space>
                <Tag color="blue">{record.type} 个属性</Tag>
                {/* 模块编辑按钮 */}
                <Tooltip content="编辑模块">
                  <Button
                    size="small"
                    icon={<IconSetting />}
                    onClick={() => onModuleEdit?.(record.id)}
                  />
                </Tooltip>
              </Space>
            );
          }

          return (
            <Space>
              {/* 类型选择器（包含数据限制功能） */}
              <div style={{ width: 52 }}>
                <EntityPropertyTypeSelector
                  value={{ type: record.type }}
                  onChange={(value) => onPropertyChange?.(record.key, 'type', value.type)}
                  onDataRestrictionClick={() => onDataRestrictionEdit?.(record.key)}
                  disabled={record.isReadOnly}
                />
              </div>

              {/* 描述编辑按钮 */}
              <Tooltip content={record.description || '点击编辑描述'}>
                <Button
                  size="small"
                  icon={<IconArticle />}
                  onClick={() => onDescriptionEdit?.(record.key)}
                />
              </Tooltip>

              {/* 删除按钮 - 只对实体直接属性有效 */}
              {record.category === 'entity' && (
                <Tooltip content="删除属性">
                  <Button
                    size="small"
                    type="danger"
                    icon={<IconDelete />}
                    onClick={() => onPropertyDelete?.(record.key)}
                  />
                </Tooltip>
              )}
            </Space>
          );
        },
      },
    ],
    [onPropertyChange, onPropertyDelete, onDataRestrictionEdit, onDescriptionEdit, onModuleEdit]
  );

  return (
    <div style={{ padding: '4px' }}>
      <Table
        columns={columns}
        dataSource={properties}
        pagination={false}
        size="small"
        rowKey="key"
        showHeader={false}
        childrenRecordName="children"
        defaultExpandAllRows={false}
        indentSize={0}
      />
    </div>
  );
};

export default DrawerPropertyTable;
