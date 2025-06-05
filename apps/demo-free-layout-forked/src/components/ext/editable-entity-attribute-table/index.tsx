import React, { useState } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { Table, Button, Input, Space, Popconfirm, Tooltip } from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
} from '@douyinfe/semi-icons';

import type { Attribute } from '../entity-store'; // 直接使用Store中的类型
import { DataRestrictionModal } from '../entity-property-type-selector/data-restriction-modal';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import {
  useCurrentEntityActions,
  useCurrentEntityStore,
} from '../../../stores/current-entity-fixed';

interface EditableEntityAttributeTableProps {
  readonly?: boolean;
}

// 🎯 独立的属性字段组件 - 每个只订阅自己的数据，使用memo避免重新渲染
const AttributeIdInput = React.memo(
  ({
    attributeId,
    onFieldChange,
    readonly: readonlyProp,
  }: {
    attributeId: string;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => {
    const value = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === attributeId);
        return attr?.id || '';
      })
    );
    const isModuleProperty = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === attributeId);
        return attr?.isModuleProperty || false;
      })
    );

    console.log('🔍 AttributeIdInput 渲染:', attributeId, value);

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(attributeId, 'id', newValue)}
        size="small"
        disabled={readonlyProp || isModuleProperty}
        placeholder="属性ID"
      />
    );
  }
);
AttributeIdInput.displayName = 'AttributeIdInput';

const AttributeNameInput = React.memo(
  ({
    attributeId,
    onFieldChange,
    readonly: readonlyProp,
  }: {
    attributeId: string;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => {
    const value = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === attributeId);
        return attr?.name || '';
      })
    );
    const isModuleProperty = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === attributeId);
        return attr?.isModuleProperty || false;
      })
    );

    console.log('🔍 AttributeNameInput 渲染:', attributeId, value);

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(attributeId, 'name', newValue)}
        size="small"
        disabled={readonlyProp || isModuleProperty}
        placeholder="属性名称"
      />
    );
  }
);
AttributeNameInput.displayName = 'AttributeNameInput';

export const EditableEntityAttributeTable: React.FC<EditableEntityAttributeTableProps> = React.memo(
  ({ readonly = false }) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // 使用原有store，直接修改属性
    const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

    // 🎯 细粒度订阅：只订阅属性数组，而不是整个 editingEntity
    const attributes = useCurrentEntityStore(
      useShallow((state) => state.editingEntity?.attributes || [])
    );

    // 🔍 调试：监控组件渲染
    console.log('🔍 EditableEntityAttributeTable 渲染:', {
      attributesCount: attributes.length,
      attributesRef: attributes,
      attributeIds: attributes.map((attr: any) => ({
        _indexId: attr._indexId,
        id: attr.id,
        name: attr.name,
      })),
    });

    const toggleExpand = (id: string) => {
      const newExpanded = new Set(expandedRows);
      if (newExpanded.has(id)) {
        newExpanded.delete(id);
      } else {
        newExpanded.add(id);
      }
      setExpandedRows(newExpanded);
    };

    // 🎯 稳定的事件处理函数引用
    const stableFieldChange = React.useCallback(
      (id: string, field: string, value: any) => {
        console.log('🔍 直接修改属性字段:', { id, field, value });
        updateAttributeProperty(id, field, value);
      },
      [updateAttributeProperty]
    );

    const handleDelete = (id: string) => {
      console.log('🔍 删除属性:', id);
      removeAttribute(id);
    };

    const handleAdd = () => {
      console.log('🔍 添加属性');
      const newAttribute: Attribute = {
        _indexId: nanoid(),
        id: '',
        name: '新属性',
        type: 'string',
        description: '',
        isEntityProperty: true,
      };
      addAttribute(newAttribute);
    };

    // 🎯 稳定的事件处理函数
    const handleDescriptionEdit = React.useCallback((property: Attribute) => {
      toggleExpand(property._indexId);
    }, []);

    const handleTypeChange = React.useCallback(
      (recordIndexId: string, typeInfo: any) => {
        console.log('Type changed:', typeInfo);
        stableFieldChange(recordIndexId, 'type', typeInfo.type);
        if (typeInfo.enumClassId) {
          stableFieldChange(recordIndexId, 'enumClassId', typeInfo.enumClassId);
        } else {
          // 清除enumClassId如果类型不需要
          stableFieldChange(recordIndexId, 'enumClassId', undefined);
        }
      },
      [stableFieldChange]
    );

    const handleDeleteConfirm = React.useCallback(
      (recordIndexId: string) => {
        console.log('Delete confirmed for:', recordIndexId);
        handleDelete(recordIndexId);
      },
      [handleDelete]
    );

    // 🎯 使用useMemo缓存columns，避免每次渲染都重新创建
    const columns = React.useMemo(
      () => [
        {
          title: 'ID',
          key: 'id',
          width: 150,
          render: (_: any, record: Attribute) => (
            <AttributeIdInput
              attributeId={record._indexId}
              onFieldChange={stableFieldChange}
              readonly={readonly}
            />
          ),
        },
        {
          title: '名称',
          key: 'name',
          width: 150,
          render: (_: any, record: Attribute) => (
            <AttributeNameInput
              attributeId={record._indexId}
              onFieldChange={stableFieldChange}
              readonly={readonly}
            />
          ),
        },
        {
          title: '控件',
          key: 'controls',
          render: (_: any, record: Attribute) => (
            <Space>
              {/* 类型选择器 */}
              <EntityPropertyTypeSelector
                value={{
                  type: record.type,
                  ...(record.enumClassId && { enumClassId: record.enumClassId }),
                }}
                onChange={(typeInfo: any) => handleTypeChange(record._indexId, typeInfo)}
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
                  onConfirm={() => handleDeleteConfirm(record._indexId)}
                >
                  <Button theme="borderless" size="small" type="danger" icon={<IconDelete />} />
                </Popconfirm>
              )}
            </Space>
          ),
        },
      ],
      [stableFieldChange, readonly, handleTypeChange, handleDescriptionEdit, handleDeleteConfirm]
    );

    // 🎯 使用useCallback缓存expandedRowRender
    const expandedRowRender = React.useCallback(
      (record: any) => {
        if (!record || !record._indexId) return null;
        return (
          <div style={{ padding: '8px 16px', backgroundColor: '#fafafa' }}>
            <Input
              value={record.description || ''}
              onChange={(value) => stableFieldChange(record._indexId, 'description', value)}
              placeholder="属性描述"
              disabled={readonly || record.isModuleProperty}
            />
          </div>
        );
      },
      [stableFieldChange, readonly]
    );

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
  }
);

EditableEntityAttributeTable.displayName = 'EditableEntityAttributeTable';
