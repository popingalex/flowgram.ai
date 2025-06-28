import React, { useState, useCallback, useRef, useEffect } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import { Table, Button, Input, Space, Popconfirm, Typography, Tooltip } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconArticle } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { useCurrentEntityStore } from '../../../stores/current-entity';
import { useCurrentEntityActions } from '../../../stores/current-entity';
import { Attribute } from '../../../services/types';

const { Text } = Typography;

// 🎯 稳定输入组件 - 避免光标移动问题
const StableInput = React.memo(
  ({
    value,
    onChange,
    placeholder,
    readOnly = false,
    style,
    indexId,
    field,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    style?: React.CSSProperties;
    indexId: string;
    field: string;
  }) => {
    const [localValue, setLocalValue] = useState(value || '');
    const [isEditing, setIsEditing] = useState(false);
    const inputRef = useRef<any>(null);
    const lastExternalValueRef = useRef(value);

    // 只在初始化时设置值，之后完全独立
    useEffect(() => {
      setLocalValue(value || '');
      lastExternalValueRef.current = value;
    }, []); // 空依赖数组，只在初始化时执行

    const handleChange = useCallback((newValue: string) => {
      setLocalValue(newValue);
      setIsEditing(true);
    }, []);

    const handleBlur = useCallback(() => {
      setIsEditing(false);
      // 失焦时触发更新
      onChange(localValue);
      lastExternalValueRef.current = localValue;
    }, [localValue, onChange]);

    const handleFocus = useCallback(() => {
      setIsEditing(true);
    }, []);

    return (
      <Input
        ref={inputRef}
        value={localValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        placeholder={placeholder}
        readOnly={readOnly}
        style={style}
        size="small"
      />
    );
  }
);
StableInput.displayName = 'StableInput';

// 实体属性输入组件
const AttributeIdInput = React.memo(
  ({
    record,
    onFieldChange,
    readonly,
  }: {
    record: Attribute;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => (
    <StableInput
      value={record.id}
      onChange={(newValue) => onFieldChange(record._indexId, 'id', newValue)}
      placeholder="属性ID"
      readOnly={readonly}
      style={{
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '12px',
      }}
      indexId={record._indexId}
      field="entity-id"
    />
  )
);
AttributeIdInput.displayName = 'AttributeIdInput';

const AttributeNameInput = React.memo(
  ({
    record,
    onFieldChange,
    readonly,
  }: {
    record: Attribute;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => (
    <StableInput
      value={record.name}
      onChange={(newValue) => onFieldChange(record._indexId, 'name', newValue)}
      placeholder="属性名称"
      readOnly={readonly}
      style={{
        fontSize: '13px',
      }}
      indexId={record._indexId}
      field="entity-name"
    />
  )
);
AttributeNameInput.displayName = 'AttributeNameInput';

export interface UniversalPropertyTableProps {
  mode?: 'node' | 'sidebar';
  editable?: boolean;
  readonly?: boolean;
  showEntityProperties?: boolean;
}

export const UniversalPropertyTable: React.FC<UniversalPropertyTableProps> = ({
  mode = 'sidebar',
  editable,
  readonly = false,
  showEntityProperties = true,
}) => {
  const isReadonly = readonly || mode === 'node';
  const isEditable = editable !== undefined ? editable : !isReadonly;

  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

  const attributes = useCurrentEntityStore(
    useShallow((state) => state.editingEntity?.attributes || [])
  );

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
      name: '',
      type: 'string',
      desc: '',
      isEntityProperty: true,
      _status: 'new',
    };
    addAttribute(newAttribute);
  };

  const handleTypeChange = React.useCallback(
    (recordIndexId: string, typeInfo: any) => {
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
        width: 100,
        render: (_: any, record: Attribute) => (
          <AttributeIdInput
            record={record}
            onFieldChange={stableFieldChange}
            readonly={isReadonly}
          />
        ),
      },
      {
        title: '名称',
        key: 'name',
        width: 150,
        render: (_: any, record: Attribute) => (
          <AttributeNameInput
            record={record}
            onFieldChange={stableFieldChange}
            readonly={isReadonly}
          />
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
        render: (_: any, record: Attribute) => (
          <Space>
            <EntityPropertyTypeSelector
              value={{ type: record.type }}
              onChange={(typeInfo: any) => handleTypeChange(record._indexId, typeInfo)}
              disabled={isReadonly || record.isModuleProperty}
            />

            {isEditable && !record.isModuleProperty && (
              <Popconfirm
                title="确定删除此属性吗？"
                content="删除后无法恢复"
                onConfirm={() => handleDelete(record._indexId)}
              >
                <Button type="danger" icon={<IconDelete />} size="small" disabled={isReadonly} />
              </Popconfirm>
            )}
          </Space>
        ),
      },
    ],
    [isReadonly, isEditable, stableFieldChange, handleTypeChange, handleDelete]
  );

  return (
    <div style={{ width: '100%' }}>
      {showEntityProperties && (
        <Table
          columns={columns}
          dataSource={attributes}
          rowKey="_indexId"
          pagination={false}
          size="small"
          style={{
            overflow: 'hidden',
            tableLayout: 'fixed',
          }}
        />
      )}
    </div>
  );
};
