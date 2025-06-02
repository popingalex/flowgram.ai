import React, { useMemo, useState, useEffect, useContext } from 'react';

import { nanoid } from 'nanoid';
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
import { useEntityStore, Attribute } from '../entity-store';
import { useModuleStore } from '../entity-property-type-selector/module-store';
import { useEnumStore } from '../entity-property-type-selector/enum-store';
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

// 生成nanoid的函数
const generateId = () => nanoid();

// 扩展的属性接口，包含索引ID和分类信息
interface ExtendedProperty {
  _id: string; // 索引ID - React key专用，永远不变（nanoid生成）
  propertyName: string; // 属性键名
  type: string;
  title?: string; // 语义化ID - 用户可编辑
  description?: string;
  isPropertyRequired?: boolean;
  isUserAdded?: boolean; // 是否为用户添加的属性
  isModuleProperty?: boolean; // 是否为模块属性
  moduleId?: string; // 所属模块ID（如果是模块属性）
}

interface EntityPropertiesEditorProps {
  value?: PropertyValueType;
  onChange?: (value: PropertyValueType) => void;
  config?: ConfigType;
  hideModuleButton?: boolean;
  hideModuleGrouping?: boolean;
  disabled?: boolean;
  onNavigateToModule?: (moduleId: string) => void;
  currentEntityId?: string;
  compact?: boolean;
}

export const EntityPropertiesEditor: React.FC<EntityPropertiesEditorProps> = ({
  value,
  onChange,
  config,
  hideModuleButton = false,
  hideModuleGrouping = false,
  disabled = false,
  onNavigateToModule,
  currentEntityId,
  compact = false,
}) => {
  const [dataRestrictionVisible, setDataRestrictionVisible] = useState(false);
  const [currentEditingProperty, setCurrentEditingProperty] = useState<ExtendedProperty | null>(
    null
  );
  const [moduleSelectorVisible, setModuleSelectorVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>(undefined);

  const { getEnumValues } = useEnumStore();
  const { getModulesByIds } = useModuleStore();
  const { getEntity, getEntityOwnAttributes, getEntityModuleAttributes } = useEntityStore();

  const currentEntity = currentEntityId ? getEntity(currentEntityId) : null;
  const [enumAssociations, setEnumAssociations] = useState<Map<string, string>>(new Map());
  const [currentBundleIds, setCurrentBundleIds] = useState<string[]>([]);
  const [moduleCollapseStates, setModuleCollapseStates] = useState<Record<string, boolean>>({});

  // 初始化时立即为所有属性生成nanoid索引
  useEffect(() => {
    if (!value?.properties) return;

    const properties = value.properties;
    let needsUpdate = false;
    const updatedProperties: Record<string, any> = {};

    Object.entries(properties).forEach(([propertyName, property]) => {
      if (!(property as any)._id) {
        needsUpdate = true;
        updatedProperties[propertyName] = {
          ...property,
          _id: nanoid(),
        };
        console.log(`为属性 ${propertyName} 生成nanoid:`, updatedProperties[propertyName]._id);
      } else {
        updatedProperties[propertyName] = property;
      }
    });

    if (needsUpdate) {
      console.log('检测到缺少_id的属性，立即更新JSONSchema');
      const updatedSchema = {
        ...value,
        type: 'object',
        properties: updatedProperties,
      };
      console.log('更新后的Schema:', updatedSchema);
      onChange?.(updatedSchema);
    }
  }, [value, onChange]); // 每次value变化时都检查

  // 从JSONSchema构建扩展属性列表
  const buildExtendedProperties = useMemo((): ExtendedProperty[] => {
    const properties = value?.properties || {};
    const extendedProps: ExtendedProperty[] = [];
    const entityBundles = currentEntity?.bundles || [];

    Object.entries(properties).forEach(([key, property]) => {
      // 检查是否为nanoid索引格式（从EntityStore传来的editableProperties）
      const isNanoidFormat = key.length > 10 && key.includes('-'); // 简单的nanoid检测

      let _id: string;
      let propertyName: string; // 英文标识符
      let title: string; // 中文名称

      if (isNanoidFormat) {
        // nanoid索引格式：key是nanoid，从property中获取真实的id和name
        _id = key;
        propertyName = (property as any).id || key; // 使用property.id作为英文标识符
        title = (property as any).name || (property as any).title || propertyName; // 使用property.name作为中文名称
      } else {
        // 属性名索引格式：key是属性名，_id从property._id获取或生成
        _id = (property as any)._id || nanoid();
        propertyName = key; // key本身就是英文标识符
        title = (property as any).name || (property as any).title || key; // 获取中文名称
      }

      let isModuleProperty = false;
      let moduleId: string | undefined;
      let isUserAdded = false;

      // 检查是否为模块属性（通过property.id或propertyName）
      if (propertyName.includes('/')) {
        isModuleProperty = true;
        const parts = propertyName.split('/');
        moduleId = parts[0];
      } else if (currentEntity) {
        const entityOwnAttributes = getEntityOwnAttributes(currentEntity);
        const isEntityAttribute = entityOwnAttributes.some((attr) => attr.id === propertyName);
        isUserAdded = !isEntityAttribute;
      } else {
        isUserAdded = true;
      }

      extendedProps.push({
        _id,
        propertyName, // 英文标识符
        type: property.type || 'string',
        title, // 中文名称
        description: property.description,
        isPropertyRequired: false,
        isUserAdded,
        isModuleProperty,
        moduleId,
      });
    });

    return extendedProps;
  }, [value?.properties, currentEntity, getEntityOwnAttributes]);

  // 更新JSONSchema，确保每个属性都有_id字段
  const updateJSONSchema = (extendedProps: ExtendedProperty[]): IJsonSchema => {
    const properties: Record<string, any> = {};

    // 检查原始value是否为nanoid索引格式
    const originalProperties = value?.properties || {};
    const isOriginalNanoidFormat = Object.keys(originalProperties).some(
      (key) => key.length > 10 && key.includes('-')
    );

    extendedProps.forEach((prop) => {
      const propertyValue = {
        type: prop.type,
        title: prop.title,
        description: prop.description,
        id: prop.propertyName, // 保存真实的属性ID
        _id: prop._id, // 确保_id字段被保存
        // 保存属性分类信息
        isEntityProperty: !prop.isUserAdded && !prop.isModuleProperty, // 实体直接属性
        isModuleProperty: prop.isModuleProperty, // 模块属性
        isUserAdded: prop.isUserAdded, // 用户自定义属性
        moduleId: prop.moduleId, // 模块ID
        name: prop.title, // 保存中文名称用于显示
      };

      if (isOriginalNanoidFormat) {
        // 如果原始格式是nanoid索引，保持nanoid索引格式
        properties[prop._id] = propertyValue;
      } else {
        // 如果原始格式是属性名索引，保持属性名索引格式
        properties[prop.propertyName] = propertyValue;
      }
    });

    return {
      ...value,
      type: 'object',
      properties,
    };
  };

  // 分组属性
  const {
    entityDirectProperties,
    completeModuleGroups,
    partialModuleGroups,
    userCustomProperties,
  } = useMemo(() => {
    const entityDirectProps: ExtendedProperty[] = [];
    const completeModuleGroupsMap: Record<string, ExtendedProperty[]> = {};
    const partialModuleGroupsMap: Record<string, ExtendedProperty[]> = {};
    const userCustomProps: ExtendedProperty[] = [];

    const entityBundles = currentEntity?.bundles || [];

    buildExtendedProperties.forEach((prop) => {
      if (prop.isModuleProperty && prop.moduleId) {
        if (entityBundles.includes(prop.moduleId)) {
          if (!completeModuleGroupsMap[prop.moduleId]) {
            completeModuleGroupsMap[prop.moduleId] = [];
          }
          completeModuleGroupsMap[prop.moduleId].push(prop);
        } else {
          if (!partialModuleGroupsMap[prop.moduleId]) {
            partialModuleGroupsMap[prop.moduleId] = [];
          }
          partialModuleGroupsMap[prop.moduleId].push(prop);
        }
      } else if (prop.isUserAdded) {
        userCustomProps.push(prop);
      } else {
        entityDirectProps.push(prop);
      }
    });

    return {
      entityDirectProperties: entityDirectProps,
      completeModuleGroups: completeModuleGroupsMap,
      partialModuleGroups: partialModuleGroupsMap,
      userCustomProperties: userCustomProps,
    };
  }, [buildExtendedProperties, currentEntity?.bundles]);

  // 监听实体变化
  useEffect(() => {
    console.log('EntityPropertiesEditor - Entity changed:', currentEntity?.id);

    if (currentEntity) {
      console.log('EntityObject:', currentEntity);
    }

    console.log(
      'Extended Properties:',
      buildExtendedProperties.map((prop) => ({
        propertyName: prop.propertyName,
        _id: prop._id,
        title: prop.title,
        isUserAdded: prop.isUserAdded,
        isModuleProperty: prop.isModuleProperty,
      }))
    );

    // 验证映射表设计
    console.log('映射表验证:', {
      映射表大小: enumAssociations.size,
      属性总数: buildExtendedProperties.length,
      映射表内容: Array.from(enumAssociations.entries()),
      稳定性: '✅ 使用nanoid索引，与属性内容完全独立',
    });

    if (currentEntity?.bundles && currentEntity.bundles.length > 0) {
      setCurrentBundleIds(currentEntity.bundles);
    }
  }, [currentEntity?.id, currentEntity?.bundles, value, buildExtendedProperties, enumAssociations]);

  const handleModuleSelectionConfirm = (selectedModuleIds: string[]) => {
    setCurrentBundleIds(selectedModuleIds);

    // 获取选中的模块
    const selectedModules = getModulesByIds(selectedModuleIds);

    // 获取当前的扩展属性列表
    const currentExtendedProps = [...buildExtendedProperties];

    // 只移除完整关联的模块属性，保留部分关联的模块属性和其他属性
    const nonCompleteModuleProps = currentExtendedProps.filter((prop) => {
      if (!prop.isModuleProperty) return true; // 保留非模块属性
      if (!prop.moduleId) return true; // 保留没有模块ID的属性

      // 检查是否为完整关联的模块属性
      const entityBundles = currentEntity?.bundles || [];
      return !entityBundles.includes(prop.moduleId); // 保留部分关联的模块属性
    });

    // 添加新选中模块的属性（完整关联）
    selectedModules.forEach((module) => {
      module.attributes.forEach((attr) => {
        nonCompleteModuleProps.push({
          _id: nanoid(), // 使用nanoid作为索引
          propertyName: `${module.id}/${attr.id}`,
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
          isPropertyRequired: false,
          isUserAdded: false,
          isModuleProperty: true,
          moduleId: module.id,
        });
      });
    });

    // 转换回JSONSchema并更新
    const updatedSchema = updateJSONSchema(nonCompleteModuleProps);
    onChange?.(updatedSchema);
    setModuleSelectorVisible(false);
    setFocusModuleId(undefined);
  };

  // 添加属性功能
  const handleAddProperty = () => {
    if (!currentEntity) {
      console.warn('没有选中的实体，无法添加属性');
      return;
    }

    // 创建新的扩展属性
    const timestamp = Date.now();
    const newProperty: ExtendedProperty = {
      _id: nanoid(), // 使用nanoid作为索引
      propertyName: `new_property_${timestamp}`,
      type: 'string',
      title: '新属性',
      description: '',
      isPropertyRequired: false,
      isUserAdded: true,
      isModuleProperty: false,
    };

    // 添加到当前属性列表
    const updatedProps = [...buildExtendedProperties, newProperty];

    // 转换回JSONSchema并更新
    const updatedSchema = updateJSONSchema(updatedProps);
    onChange?.(updatedSchema);

    console.log('Added new property:', newProperty);
  };

  // 删除属性功能
  const handleRemoveProperty = (propertyId: string) => {
    const updatedProps = buildExtendedProperties.filter((prop) => prop._id !== propertyId);
    const updatedSchema = updateJSONSchema(updatedProps);
    onChange?.(updatedSchema);

    console.log('Removed property:', propertyId);
  };

  // 编辑属性功能 - 使用稳定的ID标识属性
  const handleEditProperty = (propertyId: string, updatedFields: Partial<ExtendedProperty>) => {
    // 更新扩展属性列表
    const updatedProps = buildExtendedProperties.map((prop) =>
      prop._id === propertyId ? { ...prop, ...updatedFields } : prop
    );

    // 转换回JSONSchema并更新
    const updatedSchema = updateJSONSchema(updatedProps);
    onChange?.(updatedSchema);

    console.log('Updated property:', propertyId, updatedFields);
  };

  // 切换模块折叠状态
  const toggleModuleCollapse = (moduleId: string) => {
    setModuleCollapseStates((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  const handleDataRestrictionClick = (property: ExtendedProperty) => {
    setCurrentEditingProperty(property);
    setDataRestrictionVisible(true);
  };

  const handleDataRestrictionConfirm = (result?: { enumClassId?: string }) => {
    if (!currentEditingProperty?.propertyName) return;

    // 在外部关联映射中管理枚举关系
    setEnumAssociations((prev) => {
      const newMap = new Map(prev);
      if (result?.enumClassId) {
        newMap.set(currentEditingProperty.propertyName, result.enumClassId);
      } else {
        newMap.delete(currentEditingProperty.propertyName);
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
      {/* 实体Meta属性展示区域 */}
      {currentEntity && (
        <Card
          style={{ marginBottom: compact ? '8px' : '16px' }}
          bodyStyle={{ padding: compact ? '8px' : '16px' }}
        >
          <Title heading={5} style={{ margin: '0 0 12px 0' }}>
            实体信息
          </Title>
          <div
            style={{
              padding: '12px',
              backgroundColor: 'var(--semi-color-fill-0)',
              borderRadius: '6px',
              fontSize: '13px',
              fontFamily: 'monospace',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <Text strong>ID:</Text> <Text>{currentEntity.id}</Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>名称:</Text> <Text>{currentEntity.name}</Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>关联模块:</Text>
              <Text>
                {currentEntity.bundles?.length > 0 ? currentEntity.bundles.join(', ') : '无'}
              </Text>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <Text strong>自有属性数量:</Text> <Text>{currentEntity.attributes?.length || 0}</Text>
            </div>
            {currentEntity.description && (
              <div>
                <Text strong>描述:</Text> <Text>{currentEntity.description}</Text>
              </div>
            )}
          </div>
        </Card>
      )}

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

        {/* 实体直接属性 */}
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

            {/* 属性列表表头 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: 'var(--semi-color-fill-0)',
                borderRadius: '4px',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--semi-color-text-2)',
              }}
            >
              <div style={{ flex: '0 0 120px', marginRight: '8px' }}>ID</div>
              <div style={{ flex: '1', marginRight: '8px' }}>名称</div>
              <div style={{ flex: '0 0 120px', marginRight: '8px' }}>类型</div>
              <div style={{ flex: '0 0 80px' }}>操作</div>
            </div>

            <CustomUIContainer>
              <UIProperties>
                {entityDirectProperties.map((property) => (
                  <PropertyEdit
                    key={property._id} // 使用nanoid作为React key
                    property={property}
                    config={config}
                    enumClassId={getPropertyEnumClassId(property.propertyName)}
                    isReadOnly={false}
                    onChange={(updatedFields) => handleEditProperty(property._id, updatedFields)}
                    onRemove={() => handleRemoveProperty(property._id)}
                    onDataRestrictionClick={() => handleDataRestrictionClick(property)}
                    disabled={disabled}
                    value={value}
                  />
                ))}
              </UIProperties>
            </CustomUIContainer>
          </div>
        )}

        {/* 模块属性 - 支持折叠，默认收起 */}
        {Object.keys(completeModuleGroups).length > 0 && !hideModuleGrouping && (
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
              完整关联的模块
            </Text>
            {Object.entries(completeModuleGroups).map(([moduleId, moduleProps]) => {
              const module = getModulesByIds([moduleId])[0];
              const isCollapsed = moduleCollapseStates[moduleId] !== false;

              return (
                <div
                  key={moduleId}
                  style={{
                    marginBottom: '8px',
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: '6px',
                  }}
                >
                  {/* 模块标题栏 */}
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

                    {onNavigateToModule && (
                      <Tooltip content="在模块管理中查看">
                        <IconButton
                          size="small"
                          theme="borderless"
                          icon={<IconExternalOpen />}
                          onClick={(e) => {
                            e.stopPropagation();
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

                  {/* 模块属性内容 */}
                  {!isCollapsed && (
                    <div style={{ padding: '8px' }}>
                      <CustomUIContainer>
                        <UIProperties>
                          {moduleProps.map((property) => (
                            <PropertyEdit
                              key={property._id} // 使用nanoid作为React key
                              property={property}
                              config={config}
                              enumClassId={getPropertyEnumClassId(property.propertyName)}
                              isReadOnly={true} // 模块属性只读
                              onChange={(updatedFields) =>
                                handleEditProperty(property._id, updatedFields)
                              }
                              onRemove={() => handleRemoveProperty(property._id)}
                              onDataRestrictionClick={() => {}}
                              disabled={true}
                              value={value}
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

        {/* 部分关联的模块属性 - 支持折叠，默认收起 */}
        {Object.keys(partialModuleGroups).length > 0 && !hideModuleGrouping && (
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
              部分关联的模块
            </Text>
            {Object.entries(partialModuleGroups).map(([moduleId, moduleProps]) => {
              const module = getModulesByIds([moduleId])[0];
              const isCollapsed = moduleCollapseStates[moduleId] !== false;

              return (
                <div
                  key={moduleId}
                  style={{
                    marginBottom: '8px',
                    border: '1px solid var(--semi-color-border)',
                    borderRadius: '6px',
                  }}
                >
                  {/* 模块标题栏 */}
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
                      <Text strong style={{ fontSize: '13px', color: 'var(--semi-color-warning)' }}>
                        {module?.name || moduleId} ({moduleId})
                      </Text>
                      <Tag size="small" color="orange">
                        {moduleProps.length} 属性 (部分)
                      </Tag>
                    </div>

                    {onNavigateToModule && (
                      <Tooltip content="在模块管理中查看">
                        <IconButton
                          size="small"
                          theme="borderless"
                          icon={<IconExternalOpen />}
                          onClick={(e) => {
                            e.stopPropagation();
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

                  {/* 模块属性内容 */}
                  {!isCollapsed && (
                    <div style={{ padding: '8px' }}>
                      <CustomUIContainer>
                        <UIProperties>
                          {moduleProps.map((property) => (
                            <PropertyEdit
                              key={property._id} // 使用nanoid作为React key
                              property={property}
                              config={config}
                              enumClassId={getPropertyEnumClassId(property.propertyName)}
                              isReadOnly={false} // 部分关联的模块属性可以删除
                              onChange={(updatedFields) =>
                                handleEditProperty(property._id, updatedFields)
                              }
                              onRemove={() => handleRemoveProperty(property._id)}
                              onDataRestrictionClick={() => handleDataRestrictionClick(property)}
                              disabled={disabled}
                              value={value}
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

        {/* 如果hideModuleGrouping为true，则将部分关联模块属性混合显示 */}
        {Object.keys(partialModuleGroups).length > 0 && hideModuleGrouping && (
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
              部分关联模块属性
            </Text>
            <CustomUIContainer>
              <UIProperties>
                {Object.values(partialModuleGroups)
                  .flat()
                  .map((property) => (
                    <PropertyEdit
                      key={property._id} // 使用nanoid作为React key
                      property={property}
                      config={config}
                      enumClassId={getPropertyEnumClassId(property.propertyName)}
                      isReadOnly={false}
                      onChange={(updatedFields) => handleEditProperty(property._id, updatedFields)}
                      onRemove={() => handleRemoveProperty(property._id)}
                      onDataRestrictionClick={() => handleDataRestrictionClick(property)}
                      disabled={disabled}
                      value={value}
                    />
                  ))}
              </UIProperties>
            </CustomUIContainer>
          </div>
        )}

        {/* 自定义属性 */}
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
                {userCustomProperties.map((property) => (
                  <PropertyEdit
                    key={property._id} // 使用nanoid作为React key
                    property={property}
                    config={config}
                    enumClassId={getPropertyEnumClassId(property.propertyName)}
                    isReadOnly={false}
                    onChange={(updatedFields) => handleEditProperty(property._id, updatedFields)}
                    onRemove={() => handleRemoveProperty(property._id)}
                    onDataRestrictionClick={() => handleDataRestrictionClick(property)}
                    disabled={disabled}
                    value={value}
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
          setFocusModuleId(undefined);
        }}
        focusModuleId={focusModuleId}
      />

      <DataRestrictionModal
        visible={dataRestrictionVisible}
        onCancel={handleDataRestrictionCancel}
        onConfirm={handleDataRestrictionConfirm}
        currentEnumClassId={getPropertyEnumClassId(currentEditingProperty?.propertyName)}
        propertyInfo={{
          name: currentEditingProperty?.propertyName,
          type: currentEditingProperty?.type,
          key: currentEditingProperty?._id,
        }}
      />
    </div>
  );
};

function PropertyEdit(props: {
  property: ExtendedProperty;
  config?: ConfigType;
  enumClassId?: string;
  isReadOnly?: boolean;
  onChange?: (updatedFields: Partial<ExtendedProperty>) => void;
  onRemove?: () => void;
  onDataRestrictionClick?: () => void;
  $isLast?: boolean;
  $showLine?: boolean;
  disabled?: boolean;
  value?: PropertyValueType;
}) {
  const {
    property,
    config,
    enumClassId,
    isReadOnly = false,
    onChange,
    onRemove,
    onDataRestrictionClick,
    $isLast,
    $showLine,
    disabled,
    value,
  } = props;

  const [expand, setExpand] = useState(false);

  // 使用全局枚举状态
  const { getEnumValues } = useEnumStore();

  // 获取枚举值
  const currentEnumValues = enumClassId ? getEnumValues(enumClassId) : undefined;

  const typeSelectorValue = useMemo(
    () => ({
      type: property.type,
      enum: currentEnumValues,
    }),
    [property.type, currentEnumValues]
  );

  // 获取属性ID（英文标识符）
  const getPropertyId = () => {
    if (property.isModuleProperty && property.propertyName?.includes('/')) {
      const parts = property.propertyName.split('/');
      return parts[parts.length - 1]; // 返回最后一部分作为属性ID
    }
    return property.propertyName;
  };

  // 获取属性名称（中文显示名）
  const getPropertyName = () => property.title || property.propertyName;

  const propertyId = getPropertyId();
  const propertyName = getPropertyName();

  return (
    <>
      <UIPropertyLeft $isLast={$isLast} $showLine={$showLine} />
      <UIPropertyRight>
        <UIPropertyMain $expand={expand}>
          <CustomUIRow>
            {/* ID列 - 英文标识符 */}
            <div style={{ flex: '0 0 120px', marginRight: '8px' }}>
              <Text
                type="tertiary"
                size="small"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={propertyId}
              >
                {propertyId}
              </Text>
            </div>

            {/* Name列 - 中文名称，可编辑 */}
            <CustomUIName style={{ flex: '1', marginRight: '8px' }}>
              <Input
                placeholder={config?.placeholder ?? '属性名称'}
                size="small"
                value={propertyName}
                disabled={property.isModuleProperty || disabled || isReadOnly}
                onChange={(value) => {
                  if (!property.isModuleProperty && !isReadOnly) {
                    onChange?.({ title: value });
                  }
                }}
                style={{
                  backgroundColor:
                    property.isModuleProperty || isReadOnly
                      ? 'var(--semi-color-fill-1)'
                      : undefined,
                }}
              />
            </CustomUIName>

            {/* Type列 - 类型选择器 */}
            <CustomUIType style={{ flex: '0 0 120px', marginRight: '8px' }}>
              <EntityPropertyTypeSelector
                value={typeSelectorValue}
                disabled={property.isModuleProperty || disabled || isReadOnly}
                onChange={(_value) => {
                  if (!property.isModuleProperty && !isReadOnly) {
                    onChange?.({ type: _value.type });
                  }
                }}
                onDataRestrictionClick={
                  property.isModuleProperty || isReadOnly ? undefined : onDataRestrictionClick
                }
              />
            </CustomUIType>

            {/* 操作列 */}
            <CustomUIActions style={{ flex: '0 0 80px' }}>
              <IconButton
                size="small"
                theme="borderless"
                icon={expand ? <IconShrink size="small" /> : <IconExpand size="small" />}
                onClick={() => setExpand(!expand)}
              />
              {!isReadOnly && (
                <IconButton
                  size="small"
                  theme="borderless"
                  icon={<IconMinus size="small" />}
                  disabled={property.isModuleProperty || disabled}
                  onClick={onRemove}
                />
              )}
            </CustomUIActions>
          </CustomUIRow>

          {/* 展开区域 - 描述编辑 */}
          {expand && (
            <UIExpandDetail>
              <UILabel>{config?.descTitle ?? '描述'}</UILabel>
              <Input
                size="small"
                value={property.description}
                disabled={property.isModuleProperty || disabled || isReadOnly}
                onChange={(value) => {
                  if (!property.isModuleProperty && !isReadOnly) {
                    onChange?.({ description: value });
                  }
                }}
                placeholder={config?.descPlaceholder ?? '帮助LLM理解此属性的用途'}
                style={{
                  backgroundColor:
                    property.isModuleProperty || isReadOnly
                      ? 'var(--semi-color-fill-1)'
                      : undefined,
                }}
              />
            </UIExpandDetail>
          )}
        </UIPropertyMain>
      </UIPropertyRight>
    </>
  );
}

// 保持向后兼容
export { EntityPropertiesEditor as JsonSchemaEditor };
