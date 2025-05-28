import React, { useMemo, useState } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import {
  ConfigType,
  PropertyValueType,
  IconAddChildren,
  UIActions,
  UICollapseTrigger,
  UICollapsible,
  UIContainer,
  UIExpandDetail,
  UILabel,
  UIProperties,
  UIPropertyLeft,
  UIPropertyMain,
  UIPropertyRight,
  UIRequired,
  UIType,
  UIName,
  UIRow,
  usePropertiesEdit,
} from '@flowgram.ai/form-materials';
import { Button, Checkbox, IconButton, Input } from '@douyinfe/semi-ui';
import {
  IconExpand,
  IconShrink,
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconMinus,
} from '@douyinfe/semi-icons';

import { useEnumStore } from '../entity-property-type-selector/enum-store';
import { DataRestrictionModal } from '../entity-property-type-selector/data-restriction-modal';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import {
  CustomUIContainer,
  CustomUIRow,
  CustomUIName,
  CustomUIType,
  CustomUIRequired,
  CustomUIActions,
} from './styles';

export interface EntityPropertiesEditorProps {
  value?: IJsonSchema;
  onChange?: (value: IJsonSchema) => void;
  config?: ConfigType;
}

export const EntityPropertiesEditor: React.FC<EntityPropertiesEditorProps> = (props) => {
  const { value = { type: 'object' }, config = {}, onChange: onChangeProps } = props;
  const [dataRestrictionVisible, setDataRestrictionVisible] = useState(false);
  const [currentEditingProperty, setCurrentEditingProperty] = useState<PropertyValueType | null>(
    null
  );

  // 使用全局枚举状态
  const { getEnumValues } = useEnumStore();

  // 自定义onChange，清理内部字段但保留enumClassId
  const handleChange = (updatedSchema: IJsonSchema) => {
    if (!updatedSchema.properties) {
      onChangeProps?.(updatedSchema);
      return;
    }

    // 遍历所有属性，清理内部字段，保留enumClassId
    const processedProperties: Record<string, any> = {};

    Object.entries(updatedSchema.properties).forEach(([key, property]) => {
      // 清理内部字段，只保留标准JSON Schema字段和enumClassId
      const { key: _, extra: __, isPropertyRequired: ___, ...cleanProperty } = property as any;

      processedProperties[key] = cleanProperty;
    });

    const finalSchema = {
      ...updatedSchema,
      properties: processedProperties,
    };

    onChangeProps?.(finalSchema);
  };

  const { propertyList, onAddProperty, onRemoveProperty, onEditProperty } = usePropertiesEdit(
    value,
    handleChange
  );

  const handleDataRestrictionClick = (property: PropertyValueType) => {
    setCurrentEditingProperty(property);
    setDataRestrictionVisible(true);
  };

  const handleDataRestrictionConfirm = (result?: { enumClassId?: string }) => {
    if (!currentEditingProperty || !onEditProperty) return;

    const updatedProperty = { ...currentEditingProperty };
    if (result?.enumClassId) {
      // 只保存枚举类ID，不保存enum值
      (updatedProperty as any).enumClassId = result.enumClassId;
    } else {
      // 清除枚举限制
      delete (updatedProperty as any).enumClassId;
      delete updatedProperty.enum;
    }

    onEditProperty(currentEditingProperty.key!, updatedProperty);
    setDataRestrictionVisible(false);
    setCurrentEditingProperty(null);
  };

  const handleDataRestrictionCancel = () => {
    setDataRestrictionVisible(false);
    setCurrentEditingProperty(null);
  };

  return (
    <>
      <CustomUIContainer>
        <UIProperties>
          {propertyList.map((_property) => (
            <PropertyEdit
              key={_property.key}
              value={_property}
              config={config}
              onChange={(_v) => {
                onEditProperty(_property.key!, _v);
              }}
              onRemove={() => {
                onRemoveProperty(_property.key!);
              }}
              onDataRestrictionClick={() => handleDataRestrictionClick(_property)}
            />
          ))}
        </UIProperties>
        <Button size="small" style={{ marginTop: 10 }} icon={<IconPlus />} onClick={onAddProperty}>
          {config?.addButtonText ?? 'Add'}
        </Button>
      </CustomUIContainer>

      <DataRestrictionModal
        visible={dataRestrictionVisible}
        onCancel={handleDataRestrictionCancel}
        onConfirm={handleDataRestrictionConfirm}
        currentEnumClassId={(currentEditingProperty as any)?.enumClassId}
        propertyInfo={{
          name: currentEditingProperty?.name,
          type: currentEditingProperty?.type,
          key: currentEditingProperty?.key?.toString(),
        }}
      />
    </>
  );
};

function PropertyEdit(props: {
  value?: PropertyValueType;
  config?: ConfigType;
  onChange?: (value: PropertyValueType) => void;
  onRemove?: () => void;
  onDataRestrictionClick?: () => void;
  $isLast?: boolean;
  $showLine?: boolean;
}) {
  const {
    value,
    config,
    onChange: onChangeProps,
    onRemove,
    onDataRestrictionClick,
    $isLast,
    $showLine,
  } = props;

  const [expand, setExpand] = useState(false);
  const [collapse, setCollapse] = useState(false);

  // 使用全局枚举状态
  const { getEnumValues } = useEnumStore();

  const { name, type, items, description, isPropertyRequired } = value || {};

  // 获取实时的枚举值
  const enumClassId = (value as any)?.enumClassId;
  const currentEnumValues = enumClassId ? getEnumValues(enumClassId) : value?.enum;

  const typeSelectorValue = useMemo(
    () => ({
      type,
      items,
      enum: currentEnumValues,
    }),
    [type, items, currentEnumValues]
  );

  const { propertyList, isDrilldownObject, onAddProperty, onRemoveProperty, onEditProperty } =
    usePropertiesEdit(value, onChangeProps);

  const onChange = (key: string, _value: any) => {
    onChangeProps?.({
      ...(value || {}),
      [key]: _value,
    });
  };

  const showCollapse = isDrilldownObject && propertyList.length > 0;

  return (
    <>
      <UIPropertyLeft $isLast={$isLast} $showLine={$showLine}>
        {showCollapse && (
          <UICollapseTrigger onClick={() => setCollapse((_collapse) => !_collapse)}>
            {collapse ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
          </UICollapseTrigger>
        )}
      </UIPropertyLeft>
      <UIPropertyRight>
        <UIPropertyMain $expand={expand}>
          <CustomUIRow>
            <CustomUIName>
              <Input
                placeholder={config?.placeholder ?? 'Input Variable Name'}
                size="small"
                value={name}
                onChange={(value) => onChange('name', value)}
              />
            </CustomUIName>
            <CustomUIType>
              <EntityPropertyTypeSelector
                value={typeSelectorValue}
                onChange={(_value) => {
                  onChangeProps?.({
                    ...(value || {}),
                    ..._value,
                  });
                }}
                onDataRestrictionClick={onDataRestrictionClick}
              />
            </CustomUIType>
            <CustomUIRequired>
              <Checkbox
                checked={isPropertyRequired}
                onChange={(e) => onChange('isPropertyRequired', e.target.checked)}
              />
            </CustomUIRequired>
            <CustomUIActions>
              <IconButton
                size="small"
                theme="borderless"
                icon={expand ? <IconShrink size="small" /> : <IconExpand size="small" />}
                onClick={() => setExpand((_expand) => !_expand)}
              />
              {isDrilldownObject && (
                <IconButton
                  size="small"
                  theme="borderless"
                  icon={<IconAddChildren />}
                  onClick={() => {
                    onAddProperty();
                    setCollapse(true);
                  }}
                />
              )}
              <IconButton
                size="small"
                theme="borderless"
                icon={<IconMinus size="small" />}
                onClick={onRemove}
              />
            </CustomUIActions>
          </CustomUIRow>
          {expand && (
            <UIExpandDetail>
              <UILabel>{config?.descTitle ?? 'Description'}</UILabel>
              <Input
                size="small"
                value={description}
                onChange={(value) => onChange('description', value)}
                placeholder={config?.descPlaceholder ?? 'Help LLM to understand the property'}
              />
            </UIExpandDetail>
          )}
        </UIPropertyMain>
        {showCollapse && (
          <UICollapsible $collapse={collapse}>
            <UIProperties $shrink={true}>
              {propertyList.map((_property, index) => (
                <PropertyEdit
                  key={_property.key}
                  value={_property}
                  config={config}
                  onChange={(_v) => {
                    onEditProperty(_property.key!, _v);
                  }}
                  onRemove={() => {
                    onRemoveProperty(_property.key!);
                  }}
                  onDataRestrictionClick={() => props.onDataRestrictionClick?.()}
                  $isLast={index === propertyList.length - 1}
                  $showLine={true}
                />
              ))}
            </UIProperties>
          </UICollapsible>
        )}
      </UIPropertyRight>
    </>
  );
}

// 保持向后兼容
export { EntityPropertiesEditor as JsonSchemaEditor };
