import React, { useState } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import {
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Tooltip,
  Tag,
  Modal,
  TextArea,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconChevronUp,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconArticle,
  IconSetting,
} from '@douyinfe/semi-icons';

import { DataRestrictionModal } from '../entity-property-type-selector/data-restriction-modal';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useCurrentEntityActions, useCurrentEntityStore } from '../../../stores';
import type { Attribute } from '../../../services/types'; // 从services导入Attribute类型

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

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(attributeId, 'id', newValue)}
        size="small"
        disabled={readonlyProp || isModuleProperty}
        placeholder="属性ID"
        style={{
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '12px',
        }}
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

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(attributeId, 'name', newValue)}
        size="small"
        disabled={readonlyProp || isModuleProperty}
        placeholder="属性名称"
        style={{
          fontSize: '13px',
        }}
      />
    );
  }
);
AttributeNameInput.displayName = 'AttributeNameInput';

export const EditableEntityAttributeTable: React.FC<EditableEntityAttributeTableProps> = React.memo(
  ({ readonly = false }) => {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [descriptionEditModal, setDescriptionEditModal] = useState<{
      visible: boolean;
      attributeId: string;
      attributeName: string;
      description: string;
    }>({
      visible: false,
      attributeId: '',
      attributeName: '',
      description: '',
    });

    // 使用原有store，直接修改属性
    const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

    // 🎯 细粒度订阅：只订阅属性数组，而不是整个 editingEntity
    const attributes = useCurrentEntityStore(
      useShallow((state) => state.editingEntity?.attributes || [])
    );

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
        updateAttributeProperty(id, field, value);
      },
      [updateAttributeProperty]
    );

    const handleDelete = (id: string) => {
      removeAttribute(id);
    };

    const handleAdd = () => {
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
      setDescriptionEditModal({
        visible: true,
        attributeId: property._indexId,
        attributeName: property.name || property.id || '未命名属性',
        description: property.description || '',
      });
    }, []);

    const handleDescriptionSave = React.useCallback(() => {
      stableFieldChange(
        descriptionEditModal.attributeId,
        'description',
        descriptionEditModal.description
      );
      setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
    }, [stableFieldChange, descriptionEditModal.attributeId, descriptionEditModal.description]);

    const handleDescriptionCancel = React.useCallback(() => {
      setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
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

    // 🎯 使用useMemo缓存columns，避免每次渲染都重新创建
    const columns = React.useMemo(
      () => [
        {
          title: 'ID',
          key: 'id',
          width: 120,
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
          width: 200, // 固定宽度，不允许撑开
          render: (_: any, record: Attribute) => (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <AttributeNameInput
                attributeId={record._indexId}
                onFieldChange={stableFieldChange}
                readonly={readonly}
              />
              {/* 模块标签 */}
              {record.isModuleProperty && (
                <Tag
                  size="small"
                  color="green"
                  style={{
                    fontSize: '11px',
                    height: '18px',
                    lineHeight: '16px',
                    padding: '1px 6px',
                  }}
                >
                  模块
                </Tag>
              )}
            </div>
          ),
        },
        {
          title: () => (
            <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAdd}>
              添加属性
            </Button>
          ),
          key: 'controls',
          width: 150,
          render: (_: any, record: Attribute) => (
            <Space>
              {/* 1. 属性类型修改（包含内置的数据限制功能） */}
              <EntityPropertyTypeSelector
                value={(() => {
                  // 使用TypedParser解析类型
                  const typedInfo = TypedParser.fromString(record.type);

                  // 转换为JSON Schema格式
                  if (typedInfo.dimensions.length > 0) {
                    // 数组类型
                    const itemType = (() => {
                      if (typedInfo.attributes.length > 0) {
                        // 对象数组
                        return 'object';
                      }
                      switch (typedInfo.primitive) {
                        case Primitive.STRING:
                          return 'string';
                        case Primitive.NUMBER:
                          return 'number';
                        case Primitive.BOOLEAN:
                          return 'boolean';
                        case Primitive.UNKNOWN:
                          return 'unknown';
                        default:
                          return 'unknown';
                      }
                    })();

                    return {
                      type: 'array',
                      items: { type: itemType },
                      ...(record.enumClassId && { enumClassId: record.enumClassId }),
                    };
                  } else if (typedInfo.attributes.length > 0) {
                    // 复合对象类型

                    return {
                      type: 'object',
                      ...(record.enumClassId && { enumClassId: record.enumClassId }),
                    };
                  } else {
                    // 原始类型
                    const primitiveType = (() => {
                      switch (typedInfo.primitive) {
                        case Primitive.STRING:
                          return 'string';
                        case Primitive.NUMBER:
                          return 'number';
                        case Primitive.BOOLEAN:
                          return 'boolean';
                        case Primitive.UNKNOWN:
                          return 'unknown';
                        default:
                          return 'unknown';
                      }
                    })();

                    return {
                      type: primitiveType,
                      ...(record.enumClassId && { enumClassId: record.enumClassId }),
                    };
                  }
                })()}
                onChange={(typeInfo: any) => handleTypeChange(record._indexId, typeInfo)}
                disabled={readonly || record.isModuleProperty}
                onDataRestrictionClick={() => {
                  // TODO: 实现数据限制弹窗逻辑
                  console.log('打开数据限制弹窗:', record);
                }}
              />

              {/* 2. 描述修改按钮 */}
              <Tooltip content={record.description || '点击编辑描述'}>
                <Button
                  theme="borderless"
                  size="small"
                  icon={<IconArticle />}
                  onClick={() => handleDescriptionEdit(record)}
                  disabled={readonly || record.isModuleProperty}
                  type={record.description ? 'primary' : 'tertiary'}
                />
              </Tooltip>

              {/* 3. 删除按钮 */}
              {!readonly && !record.isModuleProperty && (
                <Popconfirm
                  title="确定删除此属性吗？"
                  content="删除后无法恢复"
                  onConfirm={() => handleDelete(record._indexId)}
                >
                  <Tooltip content="删除属性">
                    <Button
                      type="danger"
                      icon={<IconDelete />}
                      size="small"
                      disabled={readonly || record.isModuleProperty}
                    />
                  </Tooltip>
                </Popconfirm>
              )}
            </Space>
          ),
        },
      ],
      [readonly, stableFieldChange, handleTypeChange, handleDescriptionEdit, handleDelete]
    );

    // 🎯 使用useCallback缓存expandedRowRender - 用于复合类型子属性
    const expandedRowRender = React.useCallback(
      (record: any) => {
        if (!record || !record._indexId) return null;

        // 解析类型，检查是否为复合类型
        const typedInfo = TypedParser.fromString(record.type);

        if (typedInfo.attributes.length > 0) {
          // 显示复合类型的子属性
          return (
            <div
              style={{
                padding: '12px 16px',
                backgroundColor: 'var(--semi-color-fill-0)',
                borderTop: '1px solid var(--semi-color-border)',
              }}
            >
              <div style={{ marginBottom: 8, fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
                复合类型子属性：
              </div>
              {typedInfo.attributes.map((attr, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                    fontSize: '12px',
                  }}
                >
                  <span style={{ minWidth: 80, fontFamily: 'monospace' }}>{attr.id}:</span>
                  <span style={{ color: 'var(--semi-color-text-1)' }}>
                    {TypedParser.toString(attr.type)}
                  </span>
                </div>
              ))}
            </div>
          );
        }

        return null; // 非复合类型不显示展开内容
      },
      [stableFieldChange, readonly]
    );

    return (
      <div style={{ width: '100%' }}>
        <Table
          columns={columns}
          dataSource={attributes}
          rowKey="_indexId"
          pagination={false}
          size="small"
          expandedRowRender={expandedRowRender}
          expandedRowKeys={Array.from(expandedRows)}
          hideExpandedColumn={false}
          indentSize={0}
          // 🎯 控制哪些行可以展开：只有复合类型才可以展开
          rowExpandable={(record) => {
            if (!record) return false;
            const typedInfo = TypedParser.fromString(record.type);
            return typedInfo.attributes.length > 0; // 只有有子属性的复合类型才可以展开
          }}
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
          style={{
            borderRadius: '6px',
            border: '1px solid var(--semi-color-border)',
            overflow: 'hidden',
            width: '100%',
            tableLayout: 'fixed', // 强制使用固定表格布局
          }}
        />

        {/* 描述编辑弹窗 */}
        <Modal
          title={`编辑属性描述 - ${descriptionEditModal.attributeName}`}
          visible={descriptionEditModal.visible}
          onOk={handleDescriptionSave}
          onCancel={handleDescriptionCancel}
          okText="保存"
          cancelText="取消"
          width={500}
        >
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>属性描述:</label>
            <TextArea
              value={descriptionEditModal.description}
              onChange={(value) =>
                setDescriptionEditModal((prev) => ({ ...prev, description: value }))
              }
              placeholder="请输入属性描述..."
              rows={4}
              maxLength={500}
              showClear
            />
          </div>
        </Modal>
      </div>
    );
  }
);

EditableEntityAttributeTable.displayName = 'EditableEntityAttributeTable';

export default EditableEntityAttributeTable;
