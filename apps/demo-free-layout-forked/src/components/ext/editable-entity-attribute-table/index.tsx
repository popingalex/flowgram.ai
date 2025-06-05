import React, { useState } from 'react';

import { nanoid } from 'nanoid';
import { Table, Button, Input, Space, Popconfirm, Tooltip } from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
} from '@douyinfe/semi-icons';

import { DataRestrictionModal } from '../entity-property-type-selector/data-restriction-modal';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import { useCurrentEntityActions } from '../../../stores';

export interface EditableEntityAttribute {
  _indexId: string; // nanoid索引
  id: string;
  name: string;
  type: string;
  description?: string;
  enumClassId?: string;
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
}

interface EditableEntityAttributeTableProps {
  attributes: EditableEntityAttribute[];
  onChange: (attributes: EditableEntityAttribute[]) => void;
  readonly?: boolean;
}

export const EditableEntityAttributeTable: React.FC<EditableEntityAttributeTableProps> = ({
  attributes,
  onChange,
  readonly = false,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleFieldChange = (id: string, field: string, value: any) => {
    // 使用精确更新函数，避免重建整个数组
    updateAttributeProperty(id, field, value);
  };

  const handleDelete = (id: string) => {
    console.log('Deleting attribute with _indexId:', id);
    // 使用精确删除函数
    removeAttribute(id);
  };

  const handleAdd = () => {
    const newAttribute: EditableEntityAttribute = {
      _indexId: nanoid(),
      id: '',
      name: '新属性',
      type: 'string',
      description: '',
      isEntityProperty: true,
    };
    // 使用精确添加函数
    addAttribute(newAttribute);
  };

  // 描述编辑功能
  const handleDescriptionEdit = (property: EditableEntityAttribute) => {
    toggleExpand(property._indexId);
  };

  const columns = [
    {
      title: 'ID',
      key: 'id',
      width: 150,
      render: (_: any, record: EditableEntityAttribute) => (
        <Input
          value={record.id}
          onChange={(value) => handleFieldChange(record._indexId, 'id', value)}
          size="small"
          disabled={readonly || record.isModuleProperty}
          placeholder="属性ID"
        />
      ),
    },
    {
      title: '名称',
      key: 'name',
      width: 150,
      render: (_: any, record: EditableEntityAttribute) => (
        <Input
          value={record.name}
          onChange={(value) => handleFieldChange(record._indexId, 'name', value)}
          size="small"
          disabled={readonly || record.isModuleProperty}
          placeholder="属性名称"
        />
      ),
    },
    {
      title: '控件',
      key: 'controls',
      render: (_: any, record: EditableEntityAttribute) => (
        <Space>
          {/* 类型选择器 */}
          <EntityPropertyTypeSelector
            value={{
              type: record.type,
              ...(record.enumClassId && { enumClassId: record.enumClassId }),
            }}
            onChange={(typeInfo: any) => {
              console.log('Type changed:', typeInfo);
              handleFieldChange(record._indexId, 'type', typeInfo.type);
              if (typeInfo.enumClassId) {
                handleFieldChange(record._indexId, 'enumClassId', typeInfo.enumClassId);
              } else {
                // 清除enumClassId如果类型不需要
                handleFieldChange(record._indexId, 'enumClassId', undefined);
              }
            }}
            disabled={readonly || record.isModuleProperty}
          />

          {/* 描述编辑按钮 */}
          <Tooltip content="编辑描述">
            <Button
              theme="borderless"
              size="small"
              icon={<IconEdit />}
              onClick={() => handleDescriptionEdit(record)}
              disabled={readonly || record.isModuleProperty}
            />
          </Tooltip>

          {/* 删除按钮 */}
          {!readonly && !record.isModuleProperty && (
            <Popconfirm
              title="确定删除这个属性吗？"
              onConfirm={() => {
                console.log('Delete confirmed for:', record._indexId);
                handleDelete(record._indexId);
              }}
            >
              <Button theme="borderless" size="small" type="danger" icon={<IconDelete />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (record: any) => {
    if (!record || !record._indexId) return null;
    return (
      <div style={{ padding: '8px 16px', backgroundColor: '#fafafa' }}>
        <Input
          value={record.description || ''}
          onChange={(value) => handleFieldChange(record._indexId, 'description', value)}
          placeholder="属性描述"
          disabled={readonly || record.isModuleProperty}
        />
      </div>
    );
  };

  return (
    <div>
      {!readonly && (
        <div style={{ marginBottom: 16 }}>
          <Button icon={<IconPlus />} onClick={handleAdd}>
            添加属性
          </Button>
        </div>
      )}

      <Table
        columns={columns}
        dataSource={attributes}
        rowKey="_indexId"
        pagination={false}
        size="small"
        expandedRowRender={expandedRowRender}
        expandedRowKeys={Array.from(expandedRows)}
        hideExpandedColumn={false}
        onExpand={(expanded, record) => {
          if (expanded && record && (record as any)._indexId) {
            setExpandedRows((prev) => new Set([...prev, (record as any)._indexId]));
          } else if (!expanded && record && (record as any)._indexId) {
            setExpandedRows((prev) => {
              const newSet = new Set(prev);
              newSet.delete((record as any)._indexId);
              return newSet;
            });
          }
        }}
      />
    </div>
  );
};
