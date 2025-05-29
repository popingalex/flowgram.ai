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
import { Button, Checkbox, IconButton, Input, Card, Typography, Divider } from '@douyinfe/semi-ui';
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
import { ModuleSelectorModal } from '../module-selector';
import { useEntityStore } from '../entity-store';
import { useModuleStore } from '../entity-property-type-selector/module-store';

const { Title } = Typography;

export interface EntityPropertiesEditorProps {
  value?: IJsonSchema;
  onChange?: (value: IJsonSchema) => void;
  config?: ConfigType;
  hideModuleButton?: boolean; // 隐藏模块按钮（用于模块编辑时）
  hideModuleGrouping?: boolean; // 隐藏模块分组（用于模块编辑时）
  disabled?: boolean; // 禁用编辑
}

export const EntityPropertiesEditor: React.FC<EntityPropertiesEditorProps> = (props) => {
  const {
    value,
    onChange: onChangeProps,
    config,
    hideModuleButton,
    hideModuleGrouping,
    disabled,
  } = props;
  const [dataRestrictionVisible, setDataRestrictionVisible] = useState(false);
  const [currentEditingProperty, setCurrentEditingProperty] = useState<PropertyValueType | null>(
    null
  );
  const [moduleSelectorVisible, setModuleSelectorVisible] = useState(false);

  // 使用全局枚举状态和模块状态
  const { getEnumValues } = useEnumStore();
  const { getModulesByIds } = useModuleStore();
  const entityStore = useEntityStore();

  // 外部枚举关联映射 - 独立于属性数据
  const [enumAssociations, setEnumAssociations] = useState<Map<string, string>>(new Map());

  // 当前绑定的模块ID列表（从value中获取或默认为空）
  const [currentBundleIds, setCurrentBundleIds] = useState<string[]>([]);

  // 简化的onChange，不清理内部字段，保持usePropertiesEdit的完整性
  const handleChange = (updatedSchema: IJsonSchema) => {
    onChangeProps?.(updatedSchema);
  };

  const handleModuleSelectionConfirm = (selectedModuleIds: string[]) => {
    setCurrentBundleIds(selectedModuleIds);

    // 获取选中的模块
    const selectedModules = getModulesByIds(selectedModuleIds);

    // 将模块属性合并到当前schema中
    const currentProperties = value?.properties || {};
    const updatedProperties = { ...currentProperties };

    // 移除之前的模块属性（以模块ID开头的属性）
    Object.keys(updatedProperties).forEach((key) => {
      if (key.includes('/')) {
        delete updatedProperties[key];
      }
    });

    // 添加新选中模块的属性
    selectedModules.forEach((module) => {
      module.attributes.forEach((attr) => {
        const propertyKey = attr.id; // 直接使用属性ID，不拼接模块ID
        updatedProperties[propertyKey] = {
          type:
            attr.type === 'n'
              ? 'number'
              : attr.type === 's'
              ? 'string'
              : attr.type?.includes('[')
              ? 'array'
              : 'string',
          title: attr.name || attr.id,
          description: attr.description,
        };
      });
    });

    // 更新schema
    const updatedSchema: IJsonSchema = {
      ...value,
      type: 'object',
      properties: updatedProperties,
    };

    handleChange(updatedSchema);
    setModuleSelectorVisible(false);
  };

  const { propertyList, onAddProperty, onRemoveProperty, onEditProperty } = usePropertiesEdit(
    value,
    handleChange
  );

  // 分组属性：自身属性和模块属性
  const ownProperties = propertyList.filter((prop) => !prop.name?.includes('/'));
  const moduleProperties = propertyList.filter((prop) => prop.name?.includes('/'));

  // 按模块分组
  const moduleGroups = useMemo(() => {
    const groups: Record<string, PropertyValueType[]> = {};
    moduleProperties.forEach((prop) => {
      if (prop.name?.includes('/')) {
        const moduleId = prop.name.split('/')[0];
        if (!groups[moduleId]) {
          groups[moduleId] = [];
        }
        groups[moduleId].push(prop);
      }
    });
    return groups;
  }, [moduleProperties]);

  const handleDataRestrictionClick = (property: PropertyValueType) => {
    setCurrentEditingProperty(property);
    setDataRestrictionVisible(true);
  };

  const handleDataRestrictionConfirm = (result?: { enumClassId?: string }) => {
    if (!currentEditingProperty?.name) return;

    // 在外部关联映射中管理枚举关系
    setEnumAssociations((prev) => {
      const newMap = new Map(prev);
      if (result?.enumClassId) {
        newMap.set(currentEditingProperty.name!, result.enumClassId);
      } else {
        newMap.delete(currentEditingProperty.name!);
      }
      return newMap;
    });

    setDataRestrictionVisible(false);
    setCurrentEditingProperty(null);
  };

  const handleDataRestrictionCancel = () => {
    setDataRestrictionVisible(false);
    setCurrentEditingProperty(null);
  };

  // 获取属性的枚举类ID（从外部关联中）
  const getPropertyEnumClassId = (propertyName?: string) =>
    propertyName ? enumAssociations.get(propertyName) : undefined;

  // 检查是否为模块属性
  const isModuleProperty = (propertyName?: string) => propertyName?.includes('/') || false;

  return (
    <div className="entity-properties-editor" style={{ width: '100%', maxWidth: '800px' }}>
      <div
        style={{
          marginBottom: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>属性管理</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!hideModuleButton && (
            <Button
              theme="borderless"
              type="primary"
              size="small"
              onClick={() => setModuleSelectorVisible(true)}
            >
              关联模块
            </Button>
          )}
          <Button
            theme="borderless"
            type="primary"
            size="small"
            onClick={onAddProperty}
            disabled={disabled}
          >
            添加属性
          </Button>
        </div>
      </div>

      {/* 模块选择器 */}
      <ModuleSelectorModal
        visible={moduleSelectorVisible}
        selectedModuleIds={currentBundleIds}
        onConfirm={handleModuleSelectionConfirm}
        onCancel={() => setModuleSelectorVisible(false)}
      />

      <CustomUIContainer>
        {/* 自身属性 */}
        {ownProperties.length > 0 && (
          <UIProperties>
            {ownProperties.map((_property) => (
              <PropertyEdit
                key={_property.key}
                value={_property}
                config={config}
                enumClassId={getPropertyEnumClassId(_property.name)}
                isModuleProperty={false}
                onChange={(_v) => {
                  onEditProperty(_property.key!, _v);
                }}
                onRemove={() => {
                  onRemoveProperty(_property.key!);
                }}
                onDataRestrictionClick={() => handleDataRestrictionClick(_property)}
                disabled={disabled}
              />
            ))}
          </UIProperties>
        )}

        {/* 模块属性分组 */}
        {!hideModuleGrouping &&
          Object.keys(moduleGroups).map((moduleId) => {
            const moduleProps = moduleGroups[moduleId];
            const module = getModulesByIds([moduleId])[0];

            return (
              <Card
                key={moduleId}
                style={{
                  marginTop: ownProperties.length > 0 ? '16px' : '0',
                  marginBottom: '8px',
                  backgroundColor: 'var(--semi-color-fill-0)',
                  border: '1px solid var(--semi-color-border)',
                }}
                bodyStyle={{ padding: '12px' }}
              >
                <Title
                  heading={6}
                  style={{ margin: '0 0 8px 0', color: 'var(--semi-color-text-1)' }}
                >
                  {moduleId} ({module?.name || moduleId}):
                </Title>
                <UIProperties>
                  {moduleProps.map((_property) => (
                    <PropertyEdit
                      key={_property.key}
                      value={_property}
                      config={config}
                      enumClassId={getPropertyEnumClassId(_property.name)}
                      isModuleProperty={true}
                      onChange={(_v) => {
                        onEditProperty(_property.key!, _v);
                      }}
                      onRemove={() => {
                        onRemoveProperty(_property.key!);
                      }}
                      onDataRestrictionClick={() => handleDataRestrictionClick(_property)}
                      disabled={disabled}
                    />
                  ))}
                </UIProperties>
              </Card>
            );
          })}
      </CustomUIContainer>

      <DataRestrictionModal
        visible={dataRestrictionVisible}
        onCancel={handleDataRestrictionCancel}
        onConfirm={handleDataRestrictionConfirm}
        currentEnumClassId={getPropertyEnumClassId(currentEditingProperty?.name)}
        propertyInfo={{
          name: currentEditingProperty?.name,
          type: currentEditingProperty?.type,
          key: currentEditingProperty?.key?.toString(),
        }}
      />
    </div>
  );
};

function PropertyEdit(props: {
  value?: PropertyValueType;
  config?: ConfigType;
  enumClassId?: string; // 外部传入的枚举类ID
  isModuleProperty?: boolean; // 是否为模块属性
  onChange?: (value: PropertyValueType) => void;
  onRemove?: () => void;
  onDataRestrictionClick?: () => void;
  $isLast?: boolean;
  $showLine?: boolean;
  disabled?: boolean;
}) {
  const {
    value,
    config,
    enumClassId,
    isModuleProperty = false,
    onChange: onChangeProps,
    onRemove,
    onDataRestrictionClick,
    $isLast,
    $showLine,
    disabled,
  } = props;

  const [expand, setExpand] = useState(false);
  const [collapse, setCollapse] = useState(false);

  // 使用全局枚举状态
  const { getEnumValues } = useEnumStore();

  const { name, type, items, description, isPropertyRequired } = value || {};

  // 获取枚举值 - 从外部关联获取，不从属性本身
  const currentEnumValues = enumClassId ? getEnumValues(enumClassId) : value?.enum;

  const typeSelectorValue = useMemo(
    () => ({
      type,
      items,
      enum: currentEnumValues,
    }),
    [type, items, currentEnumValues]
  );

  // 恢复原始的usePropertiesEdit逻辑
  const { propertyList, isDrilldownObject, onAddProperty, onRemoveProperty, onEditProperty } =
    usePropertiesEdit(value, onChangeProps);

  const onChange = (key: string, _value: any) => {
    onChangeProps?.({
      ...(value || {}),
      [key]: _value,
    });
  };

  const showCollapse = isDrilldownObject && propertyList.length > 0;

  // 显示的属性名（统一显示ID，保持一致性）
  const getDisplayName = () => {
    // 如果是模块属性，去掉模块前缀，只显示属性ID
    if (isModuleProperty && name?.includes('/')) {
      const parts = name.split('/');
      return parts[parts.length - 1]; // 取最后一部分，不管有多少个斜杠
    }

    // 统一显示属性ID（name字段实际上是属性的key/id）
    return name;
  };

  const displayName = getDisplayName();

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
                value={displayName}
                disabled={isModuleProperty || disabled}
                onChange={(value) => {
                  if (!isModuleProperty) {
                    onChange('name', value);
                  }
                }}
                style={{
                  backgroundColor: isModuleProperty ? 'var(--semi-color-fill-1)' : undefined,
                }}
              />
            </CustomUIName>
            <CustomUIType>
              <EntityPropertyTypeSelector
                value={typeSelectorValue}
                disabled={isModuleProperty || disabled} // 模块属性禁用类型编辑
                onChange={(_value) => {
                  if (!isModuleProperty) {
                    onChangeProps?.({
                      ...(value || {}),
                      ..._value,
                    });
                  }
                }}
                onDataRestrictionClick={isModuleProperty ? undefined : onDataRestrictionClick}
              />
            </CustomUIType>
            <CustomUIRequired>
              <Checkbox
                checked={isPropertyRequired}
                disabled={isModuleProperty || disabled}
                onChange={(e) => {
                  if (!isModuleProperty) {
                    onChange('isPropertyRequired', e.target.checked);
                  }
                }}
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
                disabled={isModuleProperty || disabled} // 模块属性不能删除
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
                disabled={isModuleProperty || disabled}
                onChange={(value) => {
                  if (!isModuleProperty) {
                    onChange('description', value);
                  }
                }}
                placeholder={config?.descPlaceholder ?? 'Help LLM to understand the property'}
                style={{
                  backgroundColor: isModuleProperty ? 'var(--semi-color-fill-1)' : undefined,
                }}
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
                  enumClassId={undefined} // 嵌套属性暂不支持枚举
                  isModuleProperty={isModuleProperty}
                  onChange={(_v) => {
                    onEditProperty(_property.key!, _v);
                  }}
                  onRemove={() => {
                    onRemoveProperty(_property.key!);
                  }}
                  onDataRestrictionClick={() => props.onDataRestrictionClick?.()}
                  $isLast={index === propertyList.length - 1}
                  $showLine={true}
                  disabled={disabled}
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
