import React, { useMemo, useState, useEffect, useContext } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import {
  ConfigType,
  PropertyValueType,
  usePropertiesEdit,
  UIProperties,
  UIPropertyLeft,
  UIPropertyRight,
  UIPropertyMain,
  UIExpandDetail,
  UILabel,
  UICollapsible,
  UICollapseTrigger,
} from '@flowgram.ai/form-materials';
import {
  Card,
  Typography,
  Button,
  Space,
  Input,
  Checkbox,
  Tag,
  IconButton,
  Tooltip,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconSetting,
  IconChevronDown,
  IconChevronRight,
  IconMinus,
  IconExpand,
  IconShrink,
  IconExternalOpen,
} from '@douyinfe/semi-icons';

import { ModuleSelectorModal } from '../module-selector';
import { useModuleStore } from '../entity-property-type-selector/module-store';
import { useEnumStore } from '../entity-property-type-selector/enum-store';
import { useEntityStore, Attribute } from '../entity-property-type-selector/entity-store';
import { DataRestrictionModal } from '../entity-property-type-selector/data-restriction-modal';
import {
  CustomUIContainer,
  CustomUIRow,
  CustomUIName,
  CustomUIType,
  CustomUIRequired,
  CustomUIActions,
} from './styles';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';

const { Title, Text } = Typography;

// 属性值类型定义（添加这个接口定义）
interface Property {
  key: string;
  schema: any;
  required: boolean;
}

interface EntityPropertiesEditorProps {
  value?: PropertyValueType;
  onChange?: (value: PropertyValueType) => void;
  config?: ConfigType;
  hideModuleButton?: boolean;
  hideModuleGrouping?: boolean;
  disabled?: boolean;
  onNavigateToModule?: (moduleId: string) => void; // 新增：导航到模块管理页面的回调
  currentEntityId?: string; // 当前选中的实体ID
  compact?: boolean; // 新增：紧凑模式，减少padding
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

export const EntityPropertiesEditor: React.FC<EntityPropertiesEditorProps> = ({
  value,
  onChange,
  config,
  hideModuleButton = false,
  hideModuleGrouping = false,
  disabled = false,
  onNavigateToModule, // 新增参数
  currentEntityId, // 新增参数
  compact = false,
}) => {
  const [dataRestrictionVisible, setDataRestrictionVisible] = useState(false);
  const [currentEditingProperty, setCurrentEditingProperty] = useState<PropertyValueType | null>(
    null
  );
  const [moduleSelectorVisible, setModuleSelectorVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>(undefined);

  // 添加自定义属性状态
  const [customProperties, setCustomProperties] = useState<Property[]>([]);

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

  // 分组属性：参考FormOutputs的正确实现
  const { entityDirectProperties, moduleGroups, userCustomProperties } = useMemo(() => {
    const properties = value?.properties || {};

    const entityDirectProps: PropertyValueType[] = [];
    const moduleGroupsMap: Record<string, PropertyValueType[]> = {};
    const userCustomProps: PropertyValueType[] = [];

    // 遍历所有属性进行分类
    Object.entries(properties).forEach(([name, property], index) => {
      if (!currentEntity) {
        // 如果没有实体，全部归为用户自定义属性
        userCustomProps.push({
          key: index,
          name,
          title: property.title || name,
          description: property.description,
          type: property.type,
          isPropertyRequired: false,
        });
        return;
      }

      // 检查是否为实体直接属性
      const isDirectProperty = currentEntity.attributes.some((attr) => attr.id === name);
      if (isDirectProperty) {
        const attr = currentEntity.attributes.find((attr) => attr.id === name);
        entityDirectProps.push({
          key: index,
          name,
          title: attr?.name || name,
          description: attr?.description || property.description,
          type: property.type,
          isPropertyRequired: false,
        });
        return;
      }

      // 检查是否为模块属性
      let isModuleProperty = false;
      if (currentEntity.bundles) {
        const modules = getModulesByIds(currentEntity.bundles);
        for (const module of modules) {
          const moduleAttr = module.attributes.find((attr) => attr.id === name);
          if (moduleAttr) {
            if (!moduleGroupsMap[module.id]) {
              moduleGroupsMap[module.id] = [];
            }
            moduleGroupsMap[module.id].push({
              key: index,
              name,
              title: moduleAttr.name || name,
              description: moduleAttr.description || property.description,
              type: property.type,
              isPropertyRequired: false,
            });
            isModuleProperty = true;
            break;
          }
        }
      }

      // 如果不是实体属性也不是模块属性，归为用户自定义属性
      if (!isModuleProperty) {
        userCustomProps.push({
          key: index,
          name,
          title: property.title || name,
          description: property.description,
          type: property.type,
          isPropertyRequired: false,
        });
      }
    });

    return {
      entityDirectProperties: entityDirectProps,
      moduleGroups: moduleGroupsMap,
      userCustomProperties: userCustomProps,
    };
  }, [value?.properties, currentEntity, getModulesByIds]);

  // 初始化时从实体数据加载属性到schema中，避免在render中调用setState
  useEffect(() => {
    if (currentEntity && onChange) {
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
        onChange(updatedSchema);
      });
    }
  }, [currentEntity?.id, currentEntity?.bundles, getModulesByIds, onChange]);

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

    onChange?.(updatedSchema);
    setModuleSelectorVisible(false);
    setFocusModuleId(undefined); // 清除焦点模块ID
  };

  // 移除 usePropertiesEdit，自己实现属性管理
  // const { propertyList, onAddProperty, onRemoveProperty, onEditProperty } = usePropertiesEdit(
  //   value || { type: 'object', properties: {} }, // 确保始终传递正确的对象schema结构
  //   onChangeProps
  // );

  // 自定义的添加属性功能
  const handleAddProperty = () => {
    // 生成新属性的key
    const newPropertyKey = `custom_property_${Date.now()}`;

    // 创建新属性
    const newProperty: Property = {
      key: newPropertyKey,
      schema: {
        type: 'string',
        title: '新属性',
        description: '',
      },
      required: false,
    };

    // 添加到自定义属性列表
    const updatedCustomProperties = [...customProperties, newProperty];
    setCustomProperties(updatedCustomProperties);

    // 更新value中的properties
    const currentProperties = value?.properties || {};
    const updatedProperties = {
      ...currentProperties,
      [newPropertyKey]: newProperty.schema,
    };

    // 通知父组件更新
    if (onChange) {
      onChange({
        ...value,
        type: 'object',
        properties: updatedProperties,
      });
    }

    console.log('Added new property:', newPropertyKey, newProperty);
  };

  // 删除属性功能
  const handleRemoveProperty = (propertyKey: string) => {
    // 从自定义属性列表中移除
    const updatedCustomProperties = customProperties.filter((prop) => prop.key !== propertyKey);
    setCustomProperties(updatedCustomProperties);

    // 从value的properties中移除
    const currentProperties = value?.properties || {};
    const updatedProperties = { ...currentProperties };
    delete updatedProperties[propertyKey];

    // 通知父组件更新
    if (onChange) {
      onChange({
        ...value,
        type: 'object',
        properties: updatedProperties,
      });
    }

    console.log('Removed property:', propertyKey);
  };

  // 编辑属性功能
  const handleEditProperty = (propertyKey: string, updatedProperty: PropertyValueType) => {
    // 更新自定义属性列表
    const updatedCustomProperties = customProperties.map((prop) =>
      prop.key === propertyKey ? { ...prop, schema: updatedProperty } : prop
    );
    setCustomProperties(updatedCustomProperties);

    // 更新value中的properties
    const currentProperties = value?.properties || {};
    const updatedProperties = {
      ...currentProperties,
      [propertyKey]: updatedProperty,
    };

    // 通知父组件更新
    if (onChange) {
      onChange({
        ...value,
        type: 'object',
        properties: updatedProperties,
      });
    }

    console.log('Updated property:', propertyKey, updatedProperty);
  };

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

  // 检查是否为模块属性
  const isModuleProperty = (propertyName?: string) => propertyName?.includes('/') || false;

  // 切换模块折叠状态
  const toggleModuleCollapse = (moduleId: string) => {
    setModuleCollapseStates((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

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

  return (
    <div style={{ padding: compact ? '12px' : '24px', maxWidth: '100%' }}>
      {/* 属性配置区域 */}
      <Card
        style={{ marginBottom: compact ? '8px' : '16px' }}
        bodyStyle={{ padding: compact ? '8px' : '16px' }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: compact ? '8px' : '16px',
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
              onClick={handleAddProperty}
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
                    isReadOnly={false} // 修改：实体属性改为可编辑
                    onChange={(_v) => {
                      handleEditProperty(_property.key!.toString(), _v);
                    }}
                    onRemove={() => {
                      handleRemoveProperty(_property.key!.toString());
                    }}
                    onDataRestrictionClick={() => handleDataRestrictionClick(_property)}
                    disabled={disabled}
                  />
                ))}
              </UIProperties>
            </CustomUIContainer>
          </div>
        )}

        {/* 模块 - 支持折叠，默认收起 */}
        {Object.keys(moduleGroups).length > 0 && !hideModuleGrouping && (
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        flex: 1,
                      }}
                      onClick={() => toggleModuleCollapse(moduleId)}
                    >
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

                    {/* 跳转到模块管理的按钮 */}
                    {onNavigateToModule && (
                      <Tooltip content="在模块管理中查看">
                        <IconButton
                          size="small"
                          theme="borderless"
                          icon={<IconExternalOpen />}
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止触发折叠
                            setFocusModuleId(moduleId);
                            setModuleSelectorVisible(true);
                          }}
                          style={{
                            color: 'var(--semi-color-text-2)',
                            marginLeft: '8px',
                          }}
                        />
                      </Tooltip>
                    )}
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
                              onChange={(_v) => {
                                handleEditProperty(_property.key!.toString(), _v);
                              }}
                              onRemove={() => {
                                handleRemoveProperty(_property.key!.toString());
                              }}
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

        {/* 如果hideModuleGrouping为true，则将模块属性与实体属性混合显示 */}
        {Object.keys(moduleGroups).length > 0 && hideModuleGrouping && (
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
              模块属性
            </Text>
            <CustomUIContainer>
              <UIProperties>
                {Object.values(moduleGroups)
                  .flat()
                  .map((_property) => (
                    <PropertyEdit
                      key={_property.key}
                      value={_property}
                      config={config}
                      enumClassId={getPropertyEnumClassId(_property.name)}
                      isModuleProperty={true}
                      isReadOnly={true} // 模块属性只读
                      onChange={(_v) => {
                        handleEditProperty(_property.key!.toString(), _v);
                      }}
                      onRemove={() => {
                        handleRemoveProperty(_property.key!.toString());
                      }}
                      onDataRestrictionClick={() => {}} // 模块属性不可配置数据限制
                      disabled={true}
                    />
                  ))}
              </UIProperties>
            </CustomUIContainer>
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
                      handleEditProperty(_property.key!.toString(), _v);
                    }}
                    onRemove={() => {
                      handleRemoveProperty(_property.key!.toString());
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
        onCancel={() => {
          setModuleSelectorVisible(false);
          setFocusModuleId(undefined); // 清除焦点模块ID
        }}
        focusModuleId={focusModuleId}
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
                  icon={<IconPlus />}
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
