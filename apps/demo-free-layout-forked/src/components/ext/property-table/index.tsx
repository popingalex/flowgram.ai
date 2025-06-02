// 导出新的组件
export { NodePropertyTable, type NodePropertyRowData } from './node-property-table';
export { DrawerPropertyTable, type DrawerPropertyRowData } from './drawer-property-table';
export { PropertyTableAdapter } from './property-table-adapter';

// 保持向后兼容 - 导出原有的PropertyTable组件
import React, { useMemo, useState } from 'react';

import { Table, Input, Typography, Modal, Button, Tooltip, Space } from '@douyinfe/semi-ui';
import { IconDelete, IconSetting, IconEdit } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../entity-property-type-selector';

const { Text } = Typography;

// 属性数据类型
export interface PropertyRowData {
  key: string; // nanoid作为唯一标识
  id: string; // 英文标识符
  name: string; // 中文名称
  type: string; // 属性类型
  description?: string; // 描述
  category: 'entity' | 'module' | 'custom'; // 属性分类
  moduleId?: string; // 模块ID（如果是模块属性）
  moduleName?: string; // 模块名称（如果是模块属性）
  isReadOnly?: boolean; // 是否只读
  children?: PropertyRowData[]; // 子项（用于树形结构）
}

// 实体Meta信息类型
export interface EntityMeta {
  id: string;
  name: string;
  description?: string;
  bundles?: string[];
  attributeCount?: number;
}

interface PropertyTableProps {
  // 实体Meta信息
  entityMeta?: EntityMeta;
  // 属性数据
  properties: PropertyRowData[];
  // 是否为编辑模式（抽屉面板）
  isEditMode?: boolean;
  // 是否紧凑模式（节点显示）
  compact?: boolean;
  // 编辑回调
  onPropertyChange?: (key: string, field: string, value: any) => void;
  // 删除回调
  onPropertyRemove?: (key: string) => void;
  // 添加回调
  onPropertyAdd?: () => void;
}

export const PropertyTable: React.FC<PropertyTableProps> = ({
  properties,
  isEditMode = false,
  compact = false,
  onPropertyChange,
  onPropertyRemove,
  onPropertyAdd,
}) => {
  const [editingDescription, setEditingDescription] = useState<{
    key: string;
    value: string;
  } | null>(null);

  // 处理描述编辑
  const handleDescriptionEdit = (key: string, currentDescription: string) => {
    setEditingDescription({ key, value: currentDescription || '' });
  };

  const handleDescriptionSave = () => {
    if (editingDescription) {
      onPropertyChange?.(editingDescription.key, 'description', editingDescription.value);
      setEditingDescription(null);
    }
  };

  const handleDescriptionCancel = () => {
    setEditingDescription(null);
  };

  // 表格列定义
  const columns = useMemo(() => {
    if (compact) {
      // 节点模式：只显示id、name、type三列
      return [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 120,
          ellipsis: true,
          render: (text: string, record: PropertyRowData) => text,
        },
        {
          title: '名称',
          dataIndex: 'name',
          key: 'name',
          width: 150,
          ellipsis: true,
          render: (text: string, record: PropertyRowData) => text,
        },
        {
          title: '类型',
          dataIndex: 'type',
          key: 'type',
          render: (text: string, record: PropertyRowData) => {
            // 如果是分组标题行，不显示类型
            if (record.category === 'module' && record.isReadOnly && !text) {
              return null;
            }
            return (
              <div onClick={(e) => e.stopPropagation()}>
                <EntityPropertyTypeSelector value={{ type: text }} />
              </div>
            );
          },
        },
      ];
    } else {
      // 抽屉模式：id、name、操作按钮组、删除按钮四列
      return [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          width: 120,
          ellipsis: true,
          render: (text: string, record: PropertyRowData) => {
            // 如果是分组标题行，只显示文本
            if (record.category === 'module' && record.isReadOnly && !record.type) {
              return <strong>{text}</strong>;
            }

            if (record.isReadOnly) {
              return text;
            }

            return (
              <Input
                value={text}
                onChange={(value) => onPropertyChange?.(record.key, 'id', value)}
                placeholder="英文标识符"
              />
            );
          },
        },
        {
          title: '名称',
          dataIndex: 'name',
          key: 'name',
          width: 150,
          ellipsis: true,
          render: (text: string, record: PropertyRowData) => {
            // 如果是分组标题行，只显示文本
            if (record.category === 'module' && record.isReadOnly && !record.type) {
              return text;
            }

            if (record.isReadOnly) {
              return text;
            }

            return (
              <Input
                value={text}
                onChange={(value) => onPropertyChange?.(record.key, 'name', value)}
                placeholder="中文名称"
              />
            );
          },
        },
        {
          title: '属性配置',
          dataIndex: 'config',
          key: 'config',
          render: (value: any, record: PropertyRowData) => {
            // 如果是分组标题行，不显示配置
            if (record.category === 'module' && record.isReadOnly && !record.type) {
              return null;
            }

            if (record.isReadOnly) {
              return (
                <div onClick={(e) => e.stopPropagation()}>
                  <EntityPropertyTypeSelector value={{ type: record.type }} />
                </div>
              );
            }

            return (
              <Space>
                <Tooltip content="类型">
                  <EntityPropertyTypeSelector
                    value={{ type: record.type }}
                    onChange={(value) => onPropertyChange?.(record.key, 'type', value.type)}
                  />
                </Tooltip>
                <Tooltip content="数据限制">
                  <Button
                    theme="borderless"
                    icon={<IconSetting />}
                    onClick={() => {
                      // TODO: 打开数据限制配置弹窗
                      console.log('配置数据限制:', record.key);
                    }}
                  />
                </Tooltip>
                <Tooltip content="描述">
                  <Button
                    theme="borderless"
                    icon={<IconEdit />}
                    onClick={() => handleDescriptionEdit(record.key, record.description || '')}
                  />
                </Tooltip>
              </Space>
            );
          },
        },
        {
          title: '操作',
          dataIndex: 'action',
          key: 'action',
          render: (value: any, record: PropertyRowData) => {
            // 如果是分组标题行或只读行，不显示操作
            if (
              (record.category === 'module' && record.isReadOnly && !record.type) ||
              record.isReadOnly
            ) {
              return null;
            }

            return (
              <Tooltip content="删除属性">
                <Button
                  theme="borderless"
                  type="danger"
                  icon={<IconDelete />}
                  onClick={() => onPropertyRemove?.(record.key)}
                />
              </Tooltip>
            );
          },
        },
      ];
    }
  }, [compact, isEditMode, onPropertyChange, onPropertyRemove]);

  // 准备表格数据：使用普通表格，模块属性作为分组标题行
  const tableData = useMemo(() => {
    const result: PropertyRowData[] = [];
    const modulePropsMap: Record<string, PropertyRowData[]> = {};

    // 分类属性
    const entityProps: PropertyRowData[] = [];
    const customProps: PropertyRowData[] = [];

    properties.forEach((prop) => {
      if (prop.category === 'entity') {
        entityProps.push(prop);
      } else if (prop.category === 'custom') {
        customProps.push(prop);
      } else if (prop.category === 'module' && prop.moduleId) {
        if (!modulePropsMap[prop.moduleId]) {
          modulePropsMap[prop.moduleId] = [];
        }
        modulePropsMap[prop.moduleId].push(prop);
      }
    });

    // 添加实体属性（直接作为普通行）
    result.push(...entityProps);

    // 添加自定义属性（直接作为普通行）
    result.push(...customProps);

    // 添加模块属性（分组标题行 + 属性行）
    Object.entries(modulePropsMap).forEach(([moduleId, moduleProps]) => {
      if (moduleProps.length > 0) {
        const moduleName = moduleProps[0]?.moduleName || moduleId;

        // 添加分组标题行
        result.push({
          key: `module-group-${moduleId}`,
          id: `模块: ${moduleName}`,
          name: `${moduleProps.length} 个属性`,
          type: '',
          category: 'module',
          isReadOnly: true,
          // 不使用children，避免树形表格的缩进
        });

        // 添加模块属性行
        result.push(...moduleProps);
      }
    });

    return result;
  }, [properties]);

  return (
    <div style={{ padding: compact ? '4px' : '8px' }}>
      {/* 表格标题和操作按钮 */}
      {isEditMode && (
        <div
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '16px', fontWeight: 'bold' }}>属性配置</div>
          {onPropertyAdd && (
            <div
              style={{
                backgroundColor: '#1890ff',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
              }}
              onClick={onPropertyAdd}
            >
              添加属性
            </div>
          )}
        </div>
      )}

      <Table columns={columns} dataSource={tableData} pagination={false} rowKey="key" />

      {/* 描述编辑Modal */}
      <Modal
        title="编辑描述"
        visible={editingDescription !== null}
        onOk={handleDescriptionSave}
        onCancel={handleDescriptionCancel}
        okText="保存"
        cancelText="取消"
        width={400}
      >
        <Input
          value={editingDescription?.value || ''}
          onChange={(value) => setEditingDescription((prev) => (prev ? { ...prev, value } : null))}
          placeholder="请输入属性描述"
          autoFocus
        />
      </Modal>
    </div>
  );
};

export default PropertyTable;
