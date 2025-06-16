import React, { useState, useCallback, useMemo } from 'react';

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
  Checkbox,
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
  IconLink,
  IconSave,
  IconUndo,
  IconMinus,
} from '@douyinfe/semi-icons';

import { ModuleSelectorModal } from '../module-selector-bt';
import { DataRestrictionModal } from '../../ext/type-selector-ext/data-restriction-modal';
import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useModuleStore } from '../../../stores/module.store';
import { useCurrentEntityActions, useCurrentEntityStore } from '../../../stores';
import type { Attribute, ModuleAttribute } from '../../../services/types';

// 统一的属性数据接口
export interface UnifiedPropertyData {
  key: string;
  _indexId: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
  displayId?: string;
  isSelected?: boolean;
}

// 模块数据接口
export interface UnifiedModuleData {
  key: string;
  _indexId: string;
  id: string;
  name: string;
  attributeCount: number;
  attributes: UnifiedPropertyData[];
  isSelected?: boolean;
}

export type UnifiedDisplayMode = 'node' | 'sidebar' | 'modal';
export type UnifiedDataType = 'entity' | 'module' | 'mixed';

interface UnifiedPropertyTableProps {
  // 显示模式
  mode: UnifiedDisplayMode;
  // 数据类型
  dataType: UnifiedDataType;
  // 是否只读
  readonly?: boolean;
  // 是否可编辑
  editable?: boolean;
  // 标题
  title?: string;
  // 是否显示标题
  showTitle?: boolean;
  // 自定义数据（如果不使用store）
  customData?: {
    properties?: UnifiedPropertyData[];
    modules?: UnifiedModuleData[];
  };
  // 事件回调
  onPropertyChange?: (propertyId: string, field: string, value: any) => void;
  onPropertyAdd?: (property: UnifiedPropertyData) => void;
  onPropertyDelete?: (propertyId: string) => void;
  onModuleChange?: (moduleId: string, field: string, value: any) => void;
  onModuleAdd?: (module: UnifiedModuleData) => void;
  onModuleDelete?: (moduleId: string) => void;
}

// 属性ID输入组件
const PropertyIdInput = React.memo(
  ({
    propertyId,
    dataType,
    onFieldChange,
    readonly: readonlyProp,
  }: {
    propertyId: string;
    dataType: UnifiedDataType;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => {
    const value = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === propertyId);
        return attr?.id || '';
      })
    );
    const isModuleProperty = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === propertyId);
        return attr?.isModuleProperty || false;
      })
    );

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(propertyId, 'id', newValue)}
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
PropertyIdInput.displayName = 'PropertyIdInput';

// 属性名称输入组件
const PropertyNameInput = React.memo(
  ({
    propertyId,
    dataType,
    onFieldChange,
    readonly: readonlyProp,
  }: {
    propertyId: string;
    dataType: UnifiedDataType;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => {
    const value = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === propertyId);
        return attr?.name || '';
      })
    );
    const isModuleProperty = useCurrentEntityStore(
      useShallow((state) => {
        const attr = state.editingEntity?.attributes?.find((a) => a._indexId === propertyId);
        return attr?.isModuleProperty || false;
      })
    );

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(propertyId, 'name', newValue)}
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
PropertyNameInput.displayName = 'PropertyNameInput';

export const UnifiedPropertyTable: React.FC<UnifiedPropertyTableProps> = ({
  mode,
  dataType,
  readonly = false,
  editable = true,
  title,
  showTitle = true,
  customData,
  onPropertyChange,
  onPropertyAdd,
  onPropertyDelete,
  onModuleChange,
  onModuleAdd,
  onModuleDelete,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [descriptionEditModal, setDescriptionEditModal] = useState<{
    visible: boolean;
    propertyId: string;
    propertyName: string;
    description: string;
  }>({
    visible: false,
    propertyId: '',
    propertyName: '',
    description: '',
  });

  // Store actions
  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();
  const { modules, updateModule, addModule, removeModule } = useModuleStore();

  // 获取数据
  const entityAttributes = useCurrentEntityStore(
    useShallow((state) => state.editingEntity?.attributes || [])
  );

  // 转换数据格式
  const unifiedData = useMemo(() => {
    if (customData) {
      return {
        properties: customData.properties || [],
        modules: customData.modules || [],
      };
    }

    // 从store获取数据并转换格式
    const properties: UnifiedPropertyData[] = entityAttributes.map((attr) => ({
      key: attr._indexId,
      _indexId: attr._indexId,
      id: attr.id,
      name: attr.name,
      type: attr.type,
      description: attr.description,
      required: attr.required,
      isEntityProperty: attr.isEntityProperty,
      isModuleProperty: attr.isModuleProperty,
      moduleId: attr.moduleId,
      displayId: attr.displayId,
    }));

    const moduleData: UnifiedModuleData[] = modules.map((module) => ({
      key: module._indexId,
      _indexId: module._indexId,
      id: module.id,
      name: module.name,
      attributeCount: module.attributes?.length || 0,
      attributes: (module.attributes || []).map((attr) => ({
        key: attr._indexId,
        _indexId: attr._indexId,
        id: attr.id,
        name: attr.name,
        type: attr.type,
        description: attr.description,
        moduleId: module.id,
        displayId: attr.displayId,
        isModuleProperty: true,
      })),
    }));

    return { properties, modules: moduleData };
  }, [entityAttributes, modules, customData]);

  // 事件处理
  const handleFieldChange = useCallback(
    (id: string, field: string, value: any) => {
      if (onPropertyChange) {
        onPropertyChange(id, field, value);
      } else {
        updateAttributeProperty(id, field, value);
      }
    },
    [onPropertyChange, updateAttributeProperty]
  );

  const handleAdd = useCallback(() => {
    if (dataType === 'entity' || dataType === 'mixed') {
      const newProperty: Attribute = {
        _indexId: nanoid(),
        id: '',
        name: '新属性',
        type: 'string',
        description: '',
        isEntityProperty: true,
      };

      if (onPropertyAdd) {
        onPropertyAdd(newProperty);
      } else {
        addAttribute(newProperty);
      }
    }
  }, [dataType, onPropertyAdd, addAttribute]);

  const handleDelete = useCallback(
    (id: string) => {
      if (onPropertyDelete) {
        onPropertyDelete(id);
      } else {
        removeAttribute(id);
      }
    },
    [onPropertyDelete, removeAttribute]
  );

  // 根据模式和数据类型生成列配置
  const getColumns = () => {
    if (mode === 'node') {
      // 节点模式：简化显示
      return [
        {
          title: 'ID',
          dataIndex: 'id',
          key: 'id',
          ellipsis: true,
          render: (text: string, record: UnifiedPropertyData) => (
            <Tooltip content={record.name}>
              <span style={{ fontSize: '12px' }}>{text}</span>
            </Tooltip>
          ),
        },
        {
          title: '类型',
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
    }

    // 边栏和弹窗模式：完整显示
    const baseColumns = [
      {
        title: 'ID',
        dataIndex: 'id',
        key: 'id',
        width: 120,
        ellipsis: true,
        render: (text: string, record: UnifiedPropertyData) => {
          if (readonly || !editable) {
            return (
              <Tooltip content={text}>
                <span>{text}</span>
              </Tooltip>
            );
          }
          return (
            <PropertyIdInput
              propertyId={record._indexId}
              dataType={dataType}
              onFieldChange={handleFieldChange}
              readonly={readonly}
            />
          );
        },
      },
      {
        title: '名称',
        dataIndex: 'name',
        key: 'name',
        ellipsis: true,
        render: (text: string, record: UnifiedPropertyData) => {
          if (readonly || !editable) {
            return (
              <Tooltip content={text}>
                <span>{text}</span>
              </Tooltip>
            );
          }
          return (
            <PropertyNameInput
              propertyId={record._indexId}
              dataType={dataType}
              onFieldChange={handleFieldChange}
              readonly={readonly}
            />
          );
        },
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (type: string, record: UnifiedPropertyData) => (
          <EntityPropertyTypeSelector
            value={{ type }}
            disabled={readonly || !editable}
            onChange={(typeInfo) => handleFieldChange(record._indexId, 'type', typeInfo.type)}
          />
        ),
      },
    ];

    // 添加操作列
    if (editable && !readonly) {
      baseColumns.push({
        title: '操作',
        key: 'actions',
        width: 100,
        render: (text: string, record: UnifiedPropertyData) => (
          <Space size="small">
            <Button
              size="small"
              theme="borderless"
              icon={<IconArticle />}
              onClick={() => {
                setDescriptionEditModal({
                  visible: true,
                  propertyId: record._indexId,
                  propertyName: record.name || record.id || '未命名属性',
                  description: record.description || '',
                });
              }}
            />
            <Button
              size="small"
              theme="borderless"
              icon={<IconSetting />}
              onClick={() => {
                // 打开数据限制弹窗
              }}
            />
            <Popconfirm title="确定删除此属性吗？" onConfirm={() => handleDelete(record._indexId)}>
              <Button size="small" theme="borderless" icon={<IconDelete />} type="danger" />
            </Popconfirm>
          </Space>
        ),
      });
    }

    return baseColumns;
  };

  const columns = getColumns();

  // 渲染表格
  const renderTable = () => {
    let dataSource: UnifiedPropertyData[] = [];

    if (dataType === 'entity') {
      dataSource = unifiedData.properties.filter((p) => p.isEntityProperty);
    } else if (dataType === 'module') {
      dataSource = unifiedData.properties.filter((p) => p.isModuleProperty);
    } else {
      dataSource = unifiedData.properties;
    }

    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        size="small"
        rowKey="_indexId"
        showHeader={mode !== 'node'}
        onRow={(record) => ({
          style: {
            backgroundColor: mode === 'sidebar' ? 'var(--semi-color-fill-1)' : 'transparent',
          },
        })}
      />
    );
  };

  return (
    <div>
      {showTitle && title && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
          }}
        >
          <Typography.Title heading={6}>{title}</Typography.Title>
          {editable && !readonly && (
            <Button size="small" icon={<IconPlus />} onClick={handleAdd}>
              添加属性
            </Button>
          )}
        </div>
      )}

      {renderTable()}

      {/* 描述编辑弹窗 */}
      <Modal
        title={`编辑属性描述 - ${descriptionEditModal.propertyName}`}
        visible={descriptionEditModal.visible}
        onOk={() => {
          handleFieldChange(
            descriptionEditModal.propertyId,
            'description',
            descriptionEditModal.description
          );
          setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
        }}
        onCancel={() => setDescriptionEditModal((prev) => ({ ...prev, visible: false }))}
        width={500}
      >
        <TextArea
          value={descriptionEditModal.description}
          onChange={(value) => setDescriptionEditModal((prev) => ({ ...prev, description: value }))}
          placeholder="请输入属性描述..."
          rows={4}
        />
      </Modal>
    </div>
  );
};

export default UnifiedPropertyTable;
export { UnifiedPropertyData, UnifiedModuleData };
