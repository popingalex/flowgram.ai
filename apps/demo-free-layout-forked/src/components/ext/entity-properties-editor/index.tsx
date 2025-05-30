import React, { useMemo, useState, useEffect } from 'react';

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
import {
  Button,
  Checkbox,
  IconButton,
  Input,
  Card,
  Typography,
  Divider,
  Space,
  Tag,
  Descriptions,
  Collapsible,
} from '@douyinfe/semi-ui';
import {
  IconExpand,
  IconShrink,
  IconPlus,
  IconChevronDown,
  IconChevronRight,
  IconMinus,
  IconSetting,
  IconInfoCircle,
} from '@douyinfe/semi-icons';

import { useModuleStore } from '../entity-property-type-selector/module-store';
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
import { useEntityStore, Attribute } from '../entity-property-type-selector/entity-store';

const { Title, Text } = Typography;

export interface EntityPropertiesEditorProps {
  value?: IJsonSchema;
  onChange?: (value: IJsonSchema) => void;
  config?: ConfigType;
  hideModuleButton?: boolean; // 隐藏模块按钮（用于模块编辑时）
  hideModuleGrouping?: boolean; // 隐藏模块分组（用于模块编辑时）
  disabled?: boolean; // 禁用编辑
  currentEntityId?: string; // 当前实体ID
}

// 将后台实体属性转换为PropertyValueType格式
const convertAttributeToPropertyValue = (
  attr: Attribute,
  index: number,
  isModuleProperty = false,
  moduleId?: string
): PropertyValueType => {
  const displayName = isModuleProperty && moduleId ? `${moduleId}/${attr.id}` : attr.id;

  return {
    key: index,
    name: displayName,
    title: attr.name || attr.id,
    description: attr.description,
    type:
      attr.type === 'n'
        ? 'number'
        : attr.type === 's'
        ? 'string'
        : attr.type?.includes('[')
        ? 'array'
        : 'string',
    isPropertyRequired: false, // 实体属性默认不是必需的
  };
};

export const EntityPropertiesEditor: React.FC<EntityPropertiesEditorProps> = (props) => {
  const {
    value,
    onChange: onChangeProps,
    config,
    hideModuleButton,
    hideModuleGrouping,
    disabled,
    currentEntityId,
  } = props;
  const [dataRestrictionVisible, setDataRestrictionVisible] = useState(false);
  const [currentEditingProperty, setCurrentEditingProperty] = useState<PropertyValueType | null>(
    null
  );
  const [moduleSelectorVisible, setModuleSelectorVisible] = useState(false);

  // 使用全局枚举状态和模块状态
  const { getEnumValues } = useEnumStore();
  const { getModulesByIds } = useModuleStore();
  const { getEntity } = useEntityStore();

  // 获取当前实体数据
  const currentEntity = currentEntityId ? getEntity(currentEntityId) : null;

  // 外部枚举关联映射 - 独立于属性数据
  const [enumAssociations, setEnumAssociations] = useState<Map<string, string>>(new Map());

  // 当前绑定的模块ID列表
  const [currentBundleIds, setCurrentBundleIds] = useState<string[]>([]);

  // 模块折叠状态 - 默认收起
  const [moduleCollapseStates, setModuleCollapseStates] = useState<Record<string, boolean>>({});

  // 将实体属性转换为PropertyValueType格式用于显示
  const entityDisplayProperties = useMemo(() => {
    if (!currentEntity) return [];

    const properties: PropertyValueType[] = [];
    let index = 0;

    // 添加实体直接属性
    currentEntity.attributes.forEach((attr) => {
      properties.push(convertAttributeToPropertyValue(attr, index++, false));
    });

    // 添加模块属性
    if (currentEntity.bundles) {
      const modules = getModulesByIds(currentEntity.bundles);
      modules.forEach((module) => {
        module.attributes.forEach((attr) => {
          properties.push(convertAttributeToPropertyValue(attr, index++, true, module.id));
        });
      });
    }

    return properties;
  }, [currentEntity, getModulesByIds]);

  // 初始化时从实体数据加载属性到schema中，避免在render中调用setState
  useEffect(() => {
    if (currentEntity && onChangeProps) {
      // 将实体的所有属性（直接属性 + 模块属性）同步到schema中
      const entityProperties: Record<string, any> = {};

      // 添加实体直接属性
      currentEntity.attributes.forEach((attr) => {
        entityProperties[attr.id] = {
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

      // 添加模块属性（同级，不带模块前缀）
      if (currentEntity.bundles) {
        const modules = getModulesByIds(currentEntity.bundles);
        modules.forEach((module) => {
          module.attributes.forEach((attr) => {
            // 属性在工作流中都是同级的，不带模块前缀
            entityProperties[attr.id] = {
              type:
                attr.type === 'n'
                  ? 'number'
                  : attr.type === 's'
                  ? 'string'
                  : attr.type?.includes('[')
                  ? 'array'
                  : 'string',
              title: attr.name || attr.id,
              description: attr.description || `来自模块: ${module.name || module.id}`,
            };
          });
        });
      }

      // 保留用户自定义的输出属性
      const currentProperties = value?.properties || {};
      const userProperties: Record<string, any> = {};

      // 只保留不与实体属性冲突的用户自定义属性
      Object.keys(currentProperties).forEach((key) => {
        if (!entityProperties[key]) {
          userProperties[key] = currentProperties[key];
        }
      });

      // 合并实体属性和用户自定义属性
      const mergedProperties = {
        ...entityProperties,
        ...userProperties,
      };

      const updatedSchema: IJsonSchema = {
        ...value,
        type: 'object',
        properties: mergedProperties,
      };

      // 使用requestAnimationFrame避免在render中直接调用setState
      requestAnimationFrame(() => {
        onChangeProps(updatedSchema);
      });
    }
  }, [currentEntity?.id, currentEntity?.bundles, getModulesByIds, onChangeProps]);

  // 初始化模块绑定
  useEffect(() => {
    if (currentEntity?.bundles && currentEntity.bundles.length > 0) {
      setCurrentBundleIds(currentEntity.bundles);
    }
  }, [currentEntity?.bundles]);

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

    onChangeProps?.(updatedSchema);
    setModuleSelectorVisible(false);
  };

  const { propertyList, onAddProperty, onRemoveProperty, onEditProperty } = usePropertiesEdit(
    value,
    onChangeProps
  );

  // 获取实体所有属性的ID集合（用于判断哪些是实体属性）
  const entityPropertyIds = useMemo(() => {
    if (!currentEntity) return new Set<string>();

    const ids = new Set<string>();

    // 添加直接属性ID
    currentEntity.attributes.forEach((attr) => {
      ids.add(attr.id);
    });

    // 添加模块属性ID
    if (currentEntity.bundles) {
      const modules = getModulesByIds(currentEntity.bundles);
      modules.forEach((module) => {
        module.attributes.forEach((attr) => {
          ids.add(attr.id);
        });
      });
    }

    return ids;
  }, [currentEntity, getModulesByIds]);

  // 分组属性：实体直接属性、模块属性、用户自定义属性
  const entityDirectProperties = propertyList.filter((prop) => {
    if (!currentEntity || !prop.name) return false;
    // 是实体直接属性
    return currentEntity.attributes.some((attr) => attr.id === prop.name);
  });

  const entityModuleProperties = propertyList.filter((prop) => {
    if (!currentEntity || !prop.name) return false;
    // 是模块属性（不是直接属性，但在实体属性ID集合中）
    const isDirectProperty = currentEntity.attributes.some((attr) => attr.id === prop.name);
    return !isDirectProperty && entityPropertyIds.has(prop.name);
  });

  const userCustomProperties = propertyList.filter((prop) => {
    if (!prop.name) return false;
    // 不是实体属性的就是用户自定义属性
    return !entityPropertyIds.has(prop.name);
  });

  // 按模块分组模块属性（用于显示）
  const moduleGroups = useMemo(() => {
    if (!currentEntity) return {};

    const groups: Record<string, PropertyValueType[]> = {};

    if (currentEntity.bundles) {
      const modules = getModulesByIds(currentEntity.bundles);
      modules.forEach((module) => {
        const moduleProps = entityModuleProperties.filter((prop) =>
          module.attributes.some((attr) => attr.id === prop.name)
        );
        if (moduleProps.length > 0) {
          groups[module.id] = moduleProps;
        }
      });
    }

    return groups;
  }, [currentEntity, getModulesByIds, entityModuleProperties]);

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

  // 切换模块折叠状态
  const toggleModuleCollapse = (moduleId: string) => {
    setModuleCollapseStates((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: '100%' }}>
      {/* 属性配置区域 */}
      <Card style={{ marginBottom: '16px' }} bodyStyle={{ padding: '16px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <Title heading={5} style={{ margin: 0 }}>
            属性
          </Title>
          <Space>
            {!hideModuleButton && (
              <Button
                theme="solid"
                type="primary"
                size="small"
                icon={<IconSetting />}
                onClick={() => setModuleSelectorVisible(true)}
                disabled={disabled}
              >
                关联模块
              </Button>
            )}
            <Button
              theme="solid"
              type="secondary"
              size="small"
              icon={<IconPlus />}
              onClick={onAddProperty}
              disabled={disabled}
            >
              添加属性
            </Button>
          </Space>
        </div>

        {/* 实体直接属性 - 从store加载，只读显示 */}
        {entityDirectProperties.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text
              strong
              style={{
                fontSize: '14px',
                color: 'var(--semi-color-text-1)',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              实体属性
            </Text>
            <CustomUIContainer>
              <UIProperties>
                {entityDirectProperties.map((_property) => (
                  <PropertyEdit
                    key={_property.key}
                    value={_property}
                    config={config}
                    enumClassId={getPropertyEnumClassId(_property.name)}
                    isModuleProperty={false}
                    isReadOnly={true} // 实体属性只读
                    onChange={() => {}} // 实体属性不可编辑
                    onRemove={() => {}} // 实体属性不可删除
                    onDataRestrictionClick={() => {}} // 实体属性不可配置数据限制
                    disabled={true}
                  />
                ))}
              </UIProperties>
            </CustomUIContainer>
          </div>
        )}

        {/* 模块 - 支持折叠，默认收起 */}
        {entityModuleProperties.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Text
              strong
              style={{
                fontSize: '14px',
                color: 'var(--semi-color-text-1)',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              模块
            </Text>
            {/* 按模块分组显示，支持折叠 */}
            {Object.entries(moduleGroups).map(([moduleId, moduleProps]) => {
              const module = getModulesByIds([moduleId])[0];
              const isCollapsed = moduleCollapseStates[moduleId] !== false; // 默认收起

              return (
                <div
                  key={moduleId}
                  style={{
                    marginBottom: '8px',
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: '6px',
                  }}
                >
                  {/* 模块标题栏 - 可点击折叠 */}
                  <div
                    style={{
                      padding: '8px 12px',
                      backgroundColor: 'var(--semi-color-fill-0)',
                      borderRadius: '6px 6px 0 0',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                    onClick={() => toggleModuleCollapse(moduleId)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCollapsed ? (
                        <IconChevronRight size="small" />
                      ) : (
                        <IconChevronDown size="small" />
                      )}
                      <Text strong style={{ fontSize: '13px', color: 'var(--semi-color-primary)' }}>
                        {module?.name || moduleId} ({moduleId})
                      </Text>
                      <Tag size="small" color="blue">
                        {moduleProps.length} 属性
                      </Tag>
                    </div>
                  </div>

                  {/* 模块属性内容 - 可折叠 */}
                  {!isCollapsed && (
                    <div style={{ padding: '8px' }}>
                      <CustomUIContainer>
                        <UIProperties>
                          {moduleProps.map((_property) => (
                            <PropertyEdit
                              key={_property.key}
                              value={_property}
                              config={config}
                              enumClassId={getPropertyEnumClassId(_property.name)}
                              isModuleProperty={true}
                              isReadOnly={true} // 模块属性只读
                              onChange={() => {}} // 模块属性不可编辑
                              onRemove={() => {}} // 模块属性不可删除
                              onDataRestrictionClick={() => {}} // 模块属性不可配置数据限制
                              disabled={true}
                            />
                          ))}
                        </UIProperties>
                      </CustomUIContainer>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 自定义输出属性 - 可编辑 */}
        {userCustomProperties.length > 0 && (
          <div>
            <Text
              strong
              style={{
                fontSize: '14px',
                color: 'var(--semi-color-text-1)',
                marginBottom: '8px',
                display: 'block',
              }}
            >
              自定义属性
            </Text>
            <CustomUIContainer>
              <UIProperties>
                {userCustomProperties.map((_property) => (
                  <PropertyEdit
                    key={_property.key}
                    value={_property}
                    config={config}
                    enumClassId={getPropertyEnumClassId(_property.name)}
                    isModuleProperty={false}
                    isReadOnly={false} // 自定义属性可编辑
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
            </CustomUIContainer>
          </div>
        )}
      </Card>

      {/* 模块选择器 */}
      <ModuleSelectorModal
        visible={moduleSelectorVisible}
        selectedModuleIds={currentBundleIds}
        onConfirm={handleModuleSelectionConfirm}
        onCancel={() => setModuleSelectorVisible(false)}
      />

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
  isReadOnly?: boolean; // 是否只读
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
    isReadOnly = false,
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
    if (!isReadOnly) {
      onChangeProps?.({
        ...(value || {}),
        [key]: _value,
      });
    }
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
                disabled={isModuleProperty || disabled || isReadOnly}
                onChange={(value) => {
                  if (!isModuleProperty && !isReadOnly) {
                    onChange('name', value);
                  }
                }}
                style={{
                  backgroundColor:
                    isModuleProperty || isReadOnly ? 'var(--semi-color-fill-1)' : undefined,
                }}
              />
            </CustomUIName>
            <CustomUIType>
              <EntityPropertyTypeSelector
                value={typeSelectorValue}
                disabled={isModuleProperty || disabled || isReadOnly} // 模块属性和只读属性禁用类型编辑
                onChange={(_value) => {
                  if (!isModuleProperty && !isReadOnly) {
                    onChangeProps?.({
                      ...(value || {}),
                      ..._value,
                    });
                  }
                }}
                onDataRestrictionClick={
                  isModuleProperty || isReadOnly ? undefined : onDataRestrictionClick
                }
              />
            </CustomUIType>
            <CustomUIRequired>
              <Checkbox
                checked={isPropertyRequired}
                disabled={isModuleProperty || disabled || isReadOnly}
                onChange={(e) => {
                  if (!isModuleProperty && !isReadOnly) {
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
              {isDrilldownObject && !isReadOnly && (
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
              {!isReadOnly && (
                <IconButton
                  size="small"
                  theme="borderless"
                  icon={<IconMinus size="small" />}
                  disabled={isModuleProperty || disabled} // 模块属性不能删除
                  onClick={onRemove}
                />
              )}
            </CustomUIActions>
          </CustomUIRow>
          {expand && (
            <UIExpandDetail>
              <UILabel>{config?.descTitle ?? 'Description'}</UILabel>
              <Input
                size="small"
                value={description}
                disabled={isModuleProperty || disabled || isReadOnly}
                onChange={(value) => {
                  if (!isModuleProperty && !isReadOnly) {
                    onChange('description', value);
                  }
                }}
                placeholder={config?.descPlaceholder ?? 'Help LLM to understand the property'}
                style={{
                  backgroundColor:
                    isModuleProperty || isReadOnly ? 'var(--semi-color-fill-1)' : undefined,
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
                  isReadOnly={isReadOnly}
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
