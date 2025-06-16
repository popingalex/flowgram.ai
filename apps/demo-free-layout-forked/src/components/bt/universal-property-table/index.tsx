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
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconArticle,
  IconChevronDown,
  IconChevronRight,
} from '@douyinfe/semi-icons';

import {
  SidebarTree as ModulePropertyTreeTable,
  NodeDisplay as NodeModuleDisplay,
  NodeModuleData,
} from '../property-tree-bt';
import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useModuleStore } from '../../../stores/module.store';
import { useCurrentEntityActions, useCurrentEntityStore } from '../../../stores';
import type { Attribute } from '../../../services/types';

const { Text } = Typography;

export interface UniversalPropertyTableProps {
  // 显示模式
  mode?: 'node' | 'sidebar';
  // 功能控制
  editable?: boolean;
  readonly?: boolean; // 兼容原有接口
  // 显示配置
  showEntityProperties?: boolean;
  showModuleProperties?: boolean;
  // 标题配置
  entityTitle?: string;
  moduleTitle?: string;
}

// 独立的属性字段组件
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

    if (readonlyProp) {
      return (
        <Text
          style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '12px',
            color: 'var(--semi-color-text-1)',
          }}
        >
          {value || '未设置'}
        </Text>
      );
    }

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(attributeId, 'id', newValue)}
        size="small"
        readOnly={isModuleProperty}
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

    if (readonlyProp) {
      return (
        <Text
          style={{
            fontSize: '13px',
            color: 'var(--semi-color-text-1)',
          }}
        >
          {value || '未设置'}
        </Text>
      );
    }

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(attributeId, 'name', newValue)}
        size="small"
        readOnly={isModuleProperty}
        placeholder="属性名称"
        style={{
          fontSize: '13px',
        }}
      />
    );
  }
);
AttributeNameInput.displayName = 'AttributeNameInput';

export const UniversalPropertyTable: React.FC<UniversalPropertyTableProps> = ({
  mode = 'sidebar',
  editable,
  readonly = false,
  showEntityProperties = true,
  showModuleProperties = false,
  entityTitle = '实体属性',
  moduleTitle = '实体模块',
}) => {
  // 兼容处理：如果传了readonly，则以readonly为准；否则根据mode判断
  const isReadonly = readonly || mode === 'node';
  const isEditable = editable !== undefined ? editable : !isReadonly;

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

  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

  const attributes = useCurrentEntityStore(
    useShallow((state) => state.editingEntity?.attributes || [])
  );

  const editingEntity = useCurrentEntityStore(useShallow((state) => state.editingEntity));

  // 准备节点模块数据
  const nodeModuleData: NodeModuleData[] = React.useMemo(() => {
    if (!editingEntity?.bundles || !showModuleProperties) return [];

    const { modules } = useModuleStore.getState();

    const matchedModules = modules.filter((module) => {
      const isMatched =
        editingEntity.bundles.includes(module._indexId || '') ||
        editingEntity.bundles.includes(module.id);
      return isMatched;
    });

    return matchedModules.map((module) => ({
      key: `module-${module._indexId || module.id}`,
      id: module.id,
      name: module.name,
      attributeCount: module.attributes?.length || 0,
      attributes:
        module.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          type: attr.type,
        })) || [],
    }));
  }, [editingEntity, showModuleProperties]);

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
        stableFieldChange(recordIndexId, 'enumClassId', undefined);
      }
    },
    [stableFieldChange]
  );

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
            readonly={isReadonly}
          />
        ),
      },
      {
        title: '名称',
        key: 'name',
        width: 200,
        render: (_: any, record: Attribute) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AttributeNameInput
              attributeId={record._indexId}
              onFieldChange={stableFieldChange}
              readonly={isReadonly}
            />
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
        title: () =>
          isEditable ? (
            <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAdd}>
              添加属性
            </Button>
          ) : (
            ''
          ),
        key: 'controls',
        width: 150,
        render: (_: any, record: Attribute) => (
          <Space>
            <EntityPropertyTypeSelector
              value={(() => {
                const typedInfo = TypedParser.fromString(record.type);
                if (typedInfo.dimensions.length > 0) {
                  const itemType = (() => {
                    if (typedInfo.attributes.length > 0) {
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
                  return {
                    type: 'object',
                    ...(record.enumClassId && { enumClassId: record.enumClassId }),
                  };
                } else {
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
              disabled={isReadonly || record.isModuleProperty}
              onDataRestrictionClick={() => {
                console.log('打开数据限制弹窗:', record);
              }}
            />

            {isEditable && (
              <>
                <Tooltip content={record.description || '点击编辑描述'}>
                  <Button
                    theme="borderless"
                    size="small"
                    icon={<IconArticle />}
                    onClick={() => handleDescriptionEdit(record)}
                    disabled={isReadonly || record.isModuleProperty}
                    type={record.description ? 'primary' : 'tertiary'}
                  />
                </Tooltip>

                {!record.isModuleProperty && (
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
                        disabled={isReadonly || record.isModuleProperty}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
              </>
            )}
          </Space>
        ),
      },
    ],
    [
      isReadonly,
      isEditable,
      stableFieldChange,
      handleTypeChange,
      handleDescriptionEdit,
      handleDelete,
    ]
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [moduleExpanded, setModuleExpanded] = useState(true);

  const expandedRowRender = React.useCallback((record: any) => {
    if (!record || !record._indexId) return null;

    const typedInfo = TypedParser.fromString(record.type);

    if (typedInfo.attributes.length > 0) {
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

    return null;
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {/* 实体属性部分 */}
      {showEntityProperties && (
        <>
          {/* 组件标题 */}
          <div
            className="property-table-title"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '0px',
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
            <Typography.Text strong>{entityTitle}</Typography.Text>
            <Typography.Text type="tertiary" size="small">
              ({attributes.length})
            </Typography.Text>
          </div>

          {isExpanded && (
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
              rowExpandable={(record) => {
                if (!record) return false;
                const typedInfo = TypedParser.fromString(record.type);
                return typedInfo.attributes.length > 0;
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
                tableLayout: 'fixed',
              }}
            />
          )}
        </>
      )}

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

      {/* 模块属性部分 */}
      {showModuleProperties && (
        <div style={{ marginTop: showEntityProperties ? 16 : 0 }}>
          <div
            className="property-table-title"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '0px',
            }}
            onClick={() => setModuleExpanded(!moduleExpanded)}
          >
            {moduleExpanded ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
            <Typography.Text strong>{moduleTitle}</Typography.Text>
          </div>

          {moduleExpanded && (
            <div style={{ marginTop: 8 }}>
              {mode === 'sidebar' ? (
                <ModulePropertyTreeTable />
              ) : (
                <NodeModuleDisplay modules={nodeModuleData} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
