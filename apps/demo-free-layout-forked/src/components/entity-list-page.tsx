import React, { useState, useMemo, useCallback } from 'react';

import { nanoid } from 'nanoid';
import {
  Table,
  Button,
  Space,
  Input,
  Popconfirm,
  Modal,
  Form,
  Typography,
  Tag,
  Tooltip,
  Notification,
  Badge,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconLink,
  IconUnlink,
  IconSave,
  IconRefresh,
  IconArrowRight,
  IconUndo,
  IconBranch,
} from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector, DataRestrictionButton } from './ext/type-selector-ext';
import { SearchFilterBar } from './ext/search-filter-bar';
import { ModuleSelectorTableModal } from './bt/module-selector-table';
import { useEntityList, useEntityListActions } from '../stores/entity-list';
import { useModuleStore, useGraphList } from '../stores';

const { Text } = Typography;

interface EntityListPageProps {
  onViewWorkflow?: (entityId: string) => void;
}

// 通用字段输入组件 - 简化版本，只显示错误状态
const FieldInput = React.memo(
  ({
    value,
    onChange,
    placeholder,
    readonly = false,
    isIdField = false, // ID字段使用等宽字体
    required = false, // 是否必填
    isDuplicate = false, // 是否重复
    errorMessage = '', // 校验错误信息
  }: {
    value: string;
    onChange: (newValue: string) => void;
    placeholder: string;
    readonly?: boolean;
    isIdField?: boolean;
    required?: boolean;
    isDuplicate?: boolean;
    errorMessage?: string;
  }) => {
    if (readonly) {
      const displayValue = isIdField && value ? value.split('/').pop() : value;
      return (
        <Text
          style={{
            fontFamily: isIdField
              ? 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
              : undefined,
            fontSize: isIdField ? '12px' : '13px',
          }}
        >
          {displayValue}
        </Text>
      );
    }

    // 检查是否为空（用于必填校验）
    const isEmpty = !value || value.trim() === '';
    const hasError = (required && isEmpty) || isDuplicate || !!errorMessage;

    return (
      <Input
        value={value}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        size="small"
        placeholder={placeholder}
        validateStatus={hasError ? 'error' : 'default'}
        style={{
          fontFamily: isIdField
            ? 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
            : undefined,
          fontSize: isIdField ? '12px' : '13px',
        }}
      />
    );
  }
);
FieldInput.displayName = 'FieldInput';

export const EntityListPage: React.FC<EntityListPageProps> = ({ onViewWorkflow }) => {
  const { entities, loading } = useEntityList();
  const {
    addEntity,
    updateEntity,
    updateEntityField,
    updateEntityAttribute,
    addAttributeToEntity,
    removeAttributeFromEntity,
    deleteEntity,
    saveEntity,
    loadEntities,
  } = useEntityListActions();
  const { modules } = useModuleStore();
  const { graphs } = useGraphList();

  const [searchText, setSearchText] = useState('');
  const [showModuleLinkModal, setShowModuleLinkModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // 🐛 调试：监控组件重新渲染
  console.log(
    '🔄 EntityListPage重新渲染，实体数量:',
    entities.length,
    '第一个实体状态:',
    entities[0]?._status
  );

  // 初始化加载
  React.useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // 🎯 本地编辑状态 - 避免每次输入都更新全局store
  const [localEdits, setLocalEdits] = useState<Map<string, any>>(new Map());

  // 🎯 获取合并后的实体数据（原始数据 + 本地编辑）
  const getMergedEntity = useCallback(
    (entity: any) => {
      const localEdit = localEdits.get(entity._indexId);
      if (!localEdit) return entity;

      const mergedEntity = { ...entity, ...localEdit };

      // 合并属性编辑
      if (localEdit.attributes) {
        mergedEntity.attributes = (entity.attributes || []).map((attr: any) => {
          const attrEdit = localEdit.attributes[attr._indexId];
          return attrEdit ? { ...attr, ...attrEdit } : attr;
        });
      }

      return mergedEntity;
    },
    [localEdits]
  );

  // 转换为表格数据 - 带排序逻辑，使用合并后的数据
  const tableData = useMemo(() => {
    console.log(
      '🔄 重新计算表格数据，实体数量:',
      entities.length,
      '本地编辑数量:',
      localEdits.size
    );
    const data: any[] = [];

    entities.forEach((originalEntity) => {
      // 🎯 使用合并后的实体数据（原始数据 + 本地编辑）
      const entity = getMergedEntity(originalEntity);

      const entityRow: any = {
        key: entity._indexId,
        type: 'entity',
        entity: entity, // 🎯 使用合并后的实体数据
        children: [] as any[],
      };

      // 实体属性 - 排序：新增的在前，然后按ID排序
      const sortedAttributes = [...(entity.attributes || [])].sort((a, b) => {
        // 新增状态的属性排在前面
        if (a._status === 'new' && b._status !== 'new') return -1;
        if (a._status !== 'new' && b._status === 'new') return 1;
        // 同样状态的按ID排序
        return (a.id || '').localeCompare(b.id || '');
      });

      sortedAttributes.forEach((attr: any) => {
        entityRow.children.push({
          key: attr._indexId,
          type: 'attribute',
          entity: entity,
          attribute: attr,
          readonly: false,
        });
      });

      // 关联模块 - 按模块名排序
      const sortedBundles = [...(entity.bundles || [])].sort((a, b) => {
        const moduleA = modules.find((m) => m._indexId === a);
        const moduleB = modules.find((m) => m._indexId === b);
        return (moduleA?.name || '').localeCompare(moduleB?.name || '');
      });

      sortedBundles.forEach((bundleId: string) => {
        const module = modules.find((m) => m._indexId === bundleId);
        if (module) {
          const moduleRow: any = {
            key: module._indexId,
            type: 'module',
            entity: entity,
            module: module,
            children: [] as any[],
          };

          // 模块属性 - 按ID排序
          const sortedModuleAttributes = [...(module.attributes || [])].sort((a, b) =>
            (a.id || '').localeCompare(b.id || '')
          );

          sortedModuleAttributes.forEach((attr: any) => {
            moduleRow.children.push({
              key: attr._indexId,
              type: 'module-attribute',
              entity: entity,
              module: module,
              attribute: attr,
              readonly: true,
            });
          });

          entityRow.children.push(moduleRow);
        }
      });

      data.push(entityRow);
    });

    return data;
  }, [entities, modules, localEdits, getMergedEntity]); // 🎯 添加localEdits依赖

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!searchText) return tableData;

    return tableData.filter((item) => {
      // 直接使用存储的实体数据
      const entity = item.entity;
      if (!entity) return false;

      const entityMatch =
        (entity.id || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (entity.name || '').toLowerCase().includes(searchText.toLowerCase());

      const childrenMatch = item.children?.some((child: any) => {
        if (child.type === 'attribute') {
          const attribute = child.attribute;
          return (
            attribute &&
            ((attribute.id || '').toLowerCase().includes(searchText.toLowerCase()) ||
              (attribute.name || '').toLowerCase().includes(searchText.toLowerCase()))
          );
        }
        if (child.type === 'module') {
          const module = child.module;
          return (
            module &&
            ((module.id || '').toLowerCase().includes(searchText.toLowerCase()) ||
              (module.name || '').toLowerCase().includes(searchText.toLowerCase()))
          );
        }
        return false;
      });

      return entityMatch || childrenMatch;
    });
  }, [tableData, searchText]); // 🎯 简化依赖，tableData已经包含了必要的依赖

  // 🎯 字段变更处理 - 使用本地状态，避免频繁更新store
  const handleEntityFieldChange = useCallback(
    (entityIndexId: string, field: string, value: any) => {
      console.log('🔍 更新实体字段（本地）:', entityIndexId, field, value);
      setLocalEdits((prev) => {
        const newEdits = new Map(prev);
        const currentEdit = newEdits.get(entityIndexId) || {};
        newEdits.set(entityIndexId, { ...currentEdit, [field]: value });
        return newEdits;
      });
    },
    []
  );

  const handleAttributeFieldChange = useCallback(
    (entityIndexId: string, attributeId: string, field: string, value: any) => {
      console.log('🔍 更新属性字段（本地）:', entityIndexId, attributeId, field, value);
      setLocalEdits((prev) => {
        const newEdits = new Map(prev);
        const currentEdit = newEdits.get(entityIndexId) || {};
        const attributes = currentEdit.attributes || {};
        newEdits.set(entityIndexId, {
          ...currentEdit,
          attributes: {
            ...attributes,
            [attributeId]: { ...attributes[attributeId], [field]: value },
          },
        });
        return newEdits;
      });
    },
    []
  );

  // 🎯 应用本地编辑到store（保存时调用）
  const applyLocalEdits = useCallback(
    async (entityIndexId: string) => {
      const localEdit = localEdits.get(entityIndexId);
      if (!localEdit) return;

      const originalEntity = entities.find((e) => e._indexId === entityIndexId);
      if (!originalEntity) return;

      try {
        console.log('🔍 应用本地编辑到store:', entityIndexId, localEdit);

        // 应用实体字段编辑
        if (localEdit.id !== undefined || localEdit.name !== undefined) {
          Object.keys(localEdit).forEach((field) => {
            if (field !== 'attributes' && localEdit[field] !== undefined) {
              updateEntityField(entityIndexId, field, localEdit[field]);
            }
          });
        }

        // 应用属性编辑
        if (localEdit.attributes) {
          Object.keys(localEdit.attributes).forEach((attrId) => {
            const attrEdit = localEdit.attributes[attrId];
            Object.keys(attrEdit).forEach((field) => {
              updateEntityAttribute(entityIndexId, attrId, field, attrEdit[field]);
            });
          });
        }

        // 清除本地编辑状态
        setLocalEdits((prev) => {
          const newEdits = new Map(prev);
          newEdits.delete(entityIndexId);
          return newEdits;
        });
      } catch (error) {
        console.error('❌ 应用本地编辑失败:', error);
      }
    },
    [localEdits, entities, updateEntityField, updateEntityAttribute]
  );

  const handleTypeChange = (entityIndexId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(entityIndexId, attributeId, 'type', typeInfo.type);
  };

  // 🎯 检查实体是否有修改 - 包括本地编辑状态
  const isEntityDirty = useCallback(
    (entity: any) => {
      const status = entity._status;
      const hasLocalEdits = localEdits.has(entity._indexId);
      // console.log('🔍 检查实体状态:', entity._indexId, '状态:', status, '本地编辑:', hasLocalEdits);
      return status === 'dirty' || status === 'new' || hasLocalEdits;
    },
    [localEdits]
  );

  // 检查实体是否可以保存（必填项都已填写且无重复）
  const canSaveEntity = (entity: any): boolean => {
    // 检查实体ID
    if (!entity.id || entity.id.trim() === '') {
      return false;
    }

    // 检查实体ID是否与其他实体重复
    const otherEntities = entities.filter((e) => e._indexId !== entity._indexId);
    if (otherEntities.some((e) => e.id === entity.id)) {
      return false;
    }

    // 检查所有属性的ID
    if (entity.attributes && entity.attributes.length > 0) {
      const attributeIds = new Set();
      for (const attr of entity.attributes) {
        // 检查属性ID是否为空
        if (!attr.id || attr.id.trim() === '') {
          return false;
        }
        // 检查属性ID是否重复
        if (attributeIds.has(attr.id)) {
          return false;
        }
        attributeIds.add(attr.id);
      }
    }

    return true;
  };

  // 检查字段校验错误信息
  const getFieldValidationError = useCallback(
    (
      entityIndexId: string,
      field: 'id' | 'attribute-id',
      value: string,
      attributeIndexId?: string
    ): string => {
      if (!value || value.trim() === '') {
        return field === 'id' ? '实体ID不能为空' : '属性ID不能为空';
      }

      if (field === 'id') {
        // 检查实体ID重复
        const isDuplicate = entities.some((e) => e._indexId !== entityIndexId && e.id === value);
        if (isDuplicate) {
          return `实体ID "${value}" 已存在`;
        }
      } else if (field === 'attribute-id' && attributeIndexId) {
        // 检查属性ID重复（在同一实体内）
        const entity = entities.find((e) => e._indexId === entityIndexId);
        if (entity) {
          const isDuplicate = entity.attributes?.some(
            (attr) => attr._indexId !== attributeIndexId && attr.id === value
          );
          if (isDuplicate) {
            return `属性ID "${value}" 在此实体中已存在`;
          }
        }
      }

      return '';
    },
    [entities]
  );

  // 检查字段是否重复（保持向后兼容）
  const checkFieldDuplication = useCallback(
    (
      entityIndexId: string,
      field: 'id' | 'attribute-id',
      value: string,
      attributeIndexId?: string
    ): boolean => !!getFieldValidationError(entityIndexId, field, value, attributeIndexId),
    [getFieldValidationError]
  );

  // 获取保存错误提示
  const getSaveErrorMessage = (entity: any): string => {
    // 检查实体ID
    const entityIdError = getFieldValidationError(entity._indexId, 'id', entity.id);
    if (entityIdError) {
      return entityIdError;
    }

    // 检查所有属性ID
    if (entity.attributes && entity.attributes.length > 0) {
      for (const attr of entity.attributes) {
        const attrIdError = getFieldValidationError(
          entity._indexId,
          'attribute-id',
          attr.id,
          attr._indexId
        );
        if (attrIdError) {
          return attrIdError;
        }
      }
    }

    return '保存实体修改';
  };

  // 表格列定义
  const columns = [
    // 第一列：展开按钮
    {
      key: 'expand',
      title: '',
      width: 40,
      render: (_: any, record: any, index: number, { expandIcon }: any) => expandIcon,
    },
    // 第二列：操作按钮
    {
      key: 'navigation',
      title: '',
      width: 80,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          const entity = record.entity;
          return entity ? (
            <Space spacing={4}>
              <Tooltip content="编辑工作流">
                <Badge
                  count={(() => {
                    const graph = graphs.find(
                      (g) => g.id.toLowerCase() === entity.id.toLowerCase()
                    );
                    const nodeCount = graph?.nodes?.length || 0;
                    return nodeCount > 0 ? nodeCount : undefined;
                  })()}
                  overflowCount={99}
                  type="primary"
                  theme="inverted"
                  data-badge-type="primary"
                >
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      // 在新窗口打开工作流编辑页面，使用hash格式确保兼容性
                      window.open(`/#entity-workflow/${entity.id}`, '_blank');
                    }}
                    icon={<IconBranch />}
                  />
                </Badge>
              </Tooltip>
              <Tooltip content="关联模块">
                <Badge
                  count={entity.bundles?.length > 0 ? entity.bundles.length : undefined}
                  overflowCount={99}
                  type="success"
                  theme="inverted"
                  data-badge-type="success"
                >
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLinkModule(entity);
                    }}
                    icon={<IconLink />}
                  />
                </Badge>
              </Tooltip>
            </Space>
          ) : null;
        }
        return null;
      },
    },
    // 第三列：类型标签
    {
      key: 'type',
      title: '类型',
      width: 60,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          const isNew = record.entity?._status === 'new';
          const attributeCount = record.entity?.attributes?.length || 0;

          return (
            <Badge
              count={attributeCount > 0 ? attributeCount : undefined}
              overflowCount={99}
              type="primary"
              theme="inverted"
              data-badge-type="primary"
            >
              <Tag
                color="blue"
                style={
                  isNew
                    ? {
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                        animation: 'pulse 2s infinite',
                        cursor: 'pointer',
                      }
                    : { cursor: 'pointer' }
                }
                onClick={(e) => {
                  e.stopPropagation();
                  if (e.ctrlKey || e.metaKey) {
                    // Ctrl/Cmd + 点击在新窗口打开
                    window.open(`/entities/${record.entity?.id || 'new'}`, '_blank');
                  } else {
                    // 普通点击在当前窗口导航
                    window.location.href = `/entities/${record.entity?.id || 'new'}`;
                  }
                }}
              >
                实体
              </Tag>
            </Badge>
          );
        }
        if (record.type === 'attribute') {
          const isNew = record.attribute?._status === 'new';
          return (
            <Tag
              color="green"
              style={
                isNew
                  ? {
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                      animation: 'pulse 2s infinite',
                    }
                  : {}
              }
            >
              属性
            </Tag>
          );
        }
        if (record.type === 'module') {
          return (
            <Tag
              color="orange"
              style={{ cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation();
                if (e.ctrlKey || e.metaKey) {
                  // Ctrl/Cmd + 点击在新窗口打开
                  window.open(`/modules/${record.module?.id}`, '_blank');
                } else {
                  // 普通点击在当前窗口导航
                  window.location.href = `/modules/${record.module?.id}`;
                }
              }}
            >
              模块
            </Tag>
          );
        }
        if (record.type === 'module-attribute') {
          return <Tag color="grey">属性</Tag>;
        }
        return <Tag>{record.type}</Tag>;
      },
    },
    // 第四列：ID
    {
      title: 'ID',
      key: 'id',
      width: 200,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          const errorMessage = getFieldValidationError(
            record.entity._indexId,
            'id',
            record.entity.id
          );
          return (
            <FieldInput
              key={`entity-id-${record.entity._indexId}`}
              value={record.entity.id}
              onChange={(newValue) =>
                handleEntityFieldChange(record.entity._indexId, 'id', newValue)
              }
              placeholder="实体ID（必填）"
              isIdField={true}
              required={true}
              errorMessage={errorMessage}
            />
          );
        } else if (record.type === 'attribute') {
          const errorMessage = getFieldValidationError(
            record.entity._indexId,
            'attribute-id',
            record.attribute.id,
            record.attribute._indexId
          );
          return (
            <FieldInput
              key={`attr-id-${record.attribute._indexId}`}
              value={record.attribute.id}
              onChange={(newValue) =>
                handleAttributeFieldChange(
                  record.entity._indexId,
                  record.attribute._indexId,
                  'id',
                  newValue
                )
              }
              placeholder="属性ID（必填）"
              isIdField={true}
              required={true}
              errorMessage={errorMessage}
            />
          );
        } else if (record.type === 'module-attribute') {
          return (
            <FieldInput
              key={`mod-attr-id-${record.attribute._indexId}`}
              value={record.attribute.id}
              onChange={() => {}} // 只读，不处理变更
              placeholder="属性ID"
              isIdField={true}
              readonly={true}
            />
          );
        } else if (record.type === 'module') {
          return (
            <Text
              style={{
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '12px',
              }}
            >
              {record.module?.id}
            </Text>
          );
        }
        return null;
      },
    },
    // 第五列：名称
    {
      title: '名称',
      key: 'name',
      width: 240,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          return (
            <FieldInput
              key={`entity-name-${record.entity._indexId}`}
              value={record.entity.name}
              onChange={(newValue) =>
                handleEntityFieldChange(record.entity._indexId, 'name', newValue)
              }
              placeholder="实体名称"
            />
          );
        } else if (record.type === 'attribute') {
          return (
            <FieldInput
              key={`attr-name-${record.attribute._indexId}`}
              value={record.attribute.name}
              onChange={(newValue) =>
                handleAttributeFieldChange(
                  record.entity._indexId,
                  record.attribute._indexId,
                  'name',
                  newValue
                )
              }
              placeholder="属性名称"
              readonly={record.readonly}
            />
          );
        } else if (record.type === 'module-attribute') {
          return (
            <FieldInput
              key={`mod-attr-name-${record.attribute._indexId}`}
              value={record.attribute.name}
              onChange={() => {}} // 只读，不处理变更
              placeholder="属性名称"
              readonly={record.readonly}
            />
          );
        } else if (record.type === 'module') {
          return <Text style={{ fontSize: '13px' }}>{record.module?.name}</Text>;
        }
        return null;
      },
    },
    // 第六列：操作按钮
    {
      title: () => (
        <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAddEntity}>
          添加实体
        </Button>
      ),
      key: 'actions',
      // width: 180,
      render: (_: any, record: any) => (
        <div
          style={{
            display: 'flex',
            gap: '2px',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 类型选择器和数据限制按钮 - 只在属性行显示 */}
          {(record.type === 'attribute' || record.type === 'module-attribute') &&
            record.attribute &&
            (() => {
              if (record.type === 'attribute') {
                const displayAttribute = record.attribute;
                return (
                  <>
                    <Tooltip content="选择属性类型">
                      <EntityPropertyTypeSelector
                        value={{ type: displayAttribute.type, enum: displayAttribute.enum }}
                        onChange={(typeInfo) =>
                          handleTypeChange(
                            record.entity._indexId,
                            record.attribute._indexId,
                            typeInfo
                          )
                        }
                        disabled={record.readonly}
                      />
                    </Tooltip>
                    <DataRestrictionButton
                      value={{ type: displayAttribute.type, enum: displayAttribute.enum }}
                      onClick={() => {
                        // TODO: 打开数据限制编辑弹窗
                        console.log('编辑数据限制:', displayAttribute);
                      }}
                      disabled={record.readonly}
                    />
                  </>
                );
              } else {
                return (
                  <>
                    <Tooltip content="属性类型（只读）">
                      <EntityPropertyTypeSelector
                        value={{ type: record.attribute.type, enum: record.attribute.enum }}
                        onChange={(typeInfo) =>
                          handleTypeChange(
                            record.entity._indexId,
                            record.attribute._indexId,
                            typeInfo
                          )
                        }
                        disabled={record.readonly}
                      />
                    </Tooltip>
                    <DataRestrictionButton
                      value={{ type: record.attribute.type, enum: record.attribute.enum }}
                      onClick={() => {
                        // 模块属性不允许编辑数据限制
                        console.log('模块属性不允许编辑数据限制');
                      }}
                      disabled={true}
                    />
                  </>
                );
              }
            })()}

          {/* 实体操作按钮 */}
          {record.type === 'entity' &&
            record.entity &&
            (() => {
              const entity = record.entity; // 直接使用实体数据
              const entityIsDirty = isEntityDirty(entity);
              const canSave = canSaveEntity(entity);

              return (
                <>
                  <Tooltip content={getSaveErrorMessage(entity)}>
                    <Popconfirm
                      title="确定保存实体修改吗？"
                      content="保存后将更新到后台数据"
                      onConfirm={async (e) => {
                        e?.stopPropagation?.();
                        try {
                          // 先应用本地编辑到store
                          await applyLocalEdits(entity._indexId);
                          // 然后保存实体
                          await saveEntity(entity);
                          console.log('✅ 实体保存成功');
                          Notification.success({
                            title: '保存成功',
                            content: `实体 "${entity.name || entity.id}" 已保存`,
                            duration: 3,
                          });
                        } catch (error) {
                          console.error('❌ 实体保存失败:', error);
                          Notification.error({
                            title: '保存失败',
                            content: `实体 "${entity.name || entity.id}" 保存失败`,
                            duration: 5,
                          });
                        }
                      }}
                    >
                      <Button
                        size="small"
                        type="primary"
                        onClick={(e) => e.stopPropagation()}
                        icon={<IconSave />}
                        disabled={!entityIsDirty || !canSave}
                        loading={entity._editStatus === 'saving'}
                      />
                    </Popconfirm>
                  </Tooltip>
                  {entity._status !== 'new' ? (
                    <Tooltip content="撤销修改">
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 实现撤销修改
                          console.log('撤销修改:', entity._indexId);
                        }}
                        icon={<IconUndo />}
                        disabled={!entityIsDirty}
                      />
                    </Tooltip>
                  ) : (
                    <Button size="small" disabled style={{ opacity: 0.3 }} />
                  )}
                  <Tooltip content="添加属性">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAttribute(record.entity._indexId);
                      }}
                      icon={<IconPlus />}
                    />
                  </Tooltip>
                  <Tooltip content="删除实体">
                    <Popconfirm
                      title={
                        entity._status === 'new'
                          ? '确定删除这个新增实体吗？'
                          : '确定删除这个实体吗？删除后将从后台数据中移除。'
                      }
                      onConfirm={async (e) => {
                        e?.stopPropagation?.();
                        await handleDeleteEntity(entity);
                      }}
                    >
                      <Button
                        size="small"
                        type="danger"
                        icon={<IconDelete />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Tooltip>
                </>
              );
            })()}

          {/* 属性删除按钮 */}
          {record.type === 'attribute' && record.entity && record.attribute && (
            <>
              <Button size="small" disabled style={{ opacity: 0.3 }} />
              <Tooltip content="删除属性">
                <Popconfirm
                  title="确定删除这个属性吗？"
                  onConfirm={async (e) => {
                    e?.stopPropagation?.();
                    await handleDeleteAttribute(record.entity, record.attribute);
                  }}
                >
                  <Button
                    size="small"
                    type="danger"
                    icon={<IconDelete />}
                    onClick={(e) => e.stopPropagation()}
                  />
                </Popconfirm>
              </Tooltip>
            </>
          )}

          {/* 模块解绑按钮 */}
          {record.type === 'module' && record.entity && record.module && (
            <Tooltip content="解绑模块">
              <Popconfirm
                title="确定移除这个模块吗？"
                onConfirm={async (e) => {
                  e?.stopPropagation?.();
                  await handleUnlinkModule(record.entity, record.module);
                }}
              >
                <Button
                  size="small"
                  type="danger"
                  icon={<IconDelete />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // 事件处理
  const handleDeleteEntity = async (entity: any) => {
    try {
      console.log('🗑️ 开始删除实体:', entity.id);
      await deleteEntity(entity._indexId);
      console.log('✅ 实体删除成功:', entity.id);
      Notification.success({
        title: '删除成功',
        content: `实体 "${entity.name || entity.id}" 已删除`,
        duration: 3,
      });
    } catch (error) {
      console.error('❌ 实体删除失败:', error);
      Notification.error({
        title: '删除失败',
        content: `实体 "${entity.name || entity.id}" 删除失败`,
        duration: 5,
      });
    }
  };

  const handleDeleteAttribute = async (entity: any, attribute: any) => {
    try {
      console.log('🗑️ 删除属性:', attribute.id, '从实体:', entity.id);

      // 如果属性是新增状态，直接从本地删除
      if (attribute._status === 'new') {
        console.log('🗑️ 删除新增属性（仅本地）:', attribute.id);
        removeAttributeFromEntity(entity._indexId, attribute._indexId);
        return;
      }

      // 先删除属性，然后保存整个实体到后台
      removeAttributeFromEntity(entity._indexId, attribute._indexId);

      // 保存更新后的实体
      const updatedEntity = {
        ...entity,
        attributes: (entity.attributes || []).filter(
          (attr: any) => attr._indexId !== attribute._indexId
        ),
      };
      await saveEntity(updatedEntity);
      console.log('✅ 属性删除并保存成功');
      Notification.success({
        title: '删除成功',
        content: `属性 "${attribute.name || attribute.id}" 已删除`,
        duration: 3,
      });
    } catch (error) {
      console.error('❌ 属性删除失败:', error);
      Notification.error({
        title: '删除失败',
        content: `属性 "${attribute.name || attribute.id}" 删除失败`,
        duration: 5,
      });
      // TODO: 可以考虑在这里恢复状态或者重新加载数据
    }
  };

  const handleUnlinkModule = async (entity: any, module: any) => {
    try {
      console.log('🔗 解绑模块:', module.id, '从实体:', entity.id);

      // 更新本地状态（移除模块）
      const updatedEntity = { ...entity };
      updatedEntity.bundles = updatedEntity.bundles?.filter(
        (bundleId: string) => bundleId !== module._indexId
      );
      updateEntity(entity._indexId, updatedEntity);

      // 如果实体不是新增状态，保存到后台
      if (entity._status !== 'new') {
        const currentEntity = entities.find((e) => e._indexId === entity._indexId);
        if (currentEntity) {
          await saveEntity(currentEntity);
          console.log('✅ 模块解绑并保存成功');
          Notification.success({
            title: '解绑成功',
            content: `模块 "${module.name || module.id}" 已从实体解绑`,
            duration: 3,
          });
        }
      } else {
        console.log('✅ 新增实体模块解绑（仅本地）');
      }
    } catch (error) {
      console.error('❌ 模块解绑失败:', error);
      Notification.error({
        title: '解绑失败',
        content: `模块 "${module.name || module.id}" 解绑失败`,
        duration: 5,
      });
      // TODO: 可以考虑在这里恢复状态
    }
  };

  const handleLinkModule = (entity: any) => {
    setSelectedEntity(entity);
    setShowModuleLinkModal(true);
  };

  const handleAddEntity = () => {
    const newEntity = {
      _indexId: nanoid(), // 使用nanoid作为稳定的React key
      id: '', // 业务ID由用户填写（必填）
      name: '', // 名称可以为空
      attributes: [],
      bundles: [],
      deprecated: false,
      _status: 'new' as const, // 标记为新增状态
    };

    addEntity(newEntity);
    console.log('✅ 添加新实体:', newEntity._indexId);
  };

  const handleAddAttribute = (entityIndexId: string) => {
    addAttributeToEntity(entityIndexId);
    console.log('✅ 为实体添加属性:', entityIndexId);
  };

  const handleSaveModuleLink = async (selectedModuleIds: string[]) => {
    if (selectedEntity) {
      try {
        console.log('🔗 关联模块到实体:', selectedEntity.id, '模块:', selectedModuleIds);

        // 更新本地状态
        const updatedEntity = { ...selectedEntity };
        updatedEntity.bundles = selectedModuleIds;
        updateEntity(selectedEntity._indexId, updatedEntity);

        // 如果实体不是新增状态，保存到后台
        if (selectedEntity._status !== 'new') {
          const currentEntity = entities.find((e) => e._indexId === selectedEntity._indexId);
          if (currentEntity) {
            await saveEntity(currentEntity);
            console.log('✅ 模块关联并保存成功');
            Notification.success({
              title: '关联成功',
              content: `已成功关联 ${selectedModuleIds.length} 个模块到实体`,
              duration: 3,
            });
          }
        } else {
          console.log('✅ 新增实体模块关联（仅本地）');
        }
      } catch (error) {
        console.error('❌ 模块关联失败:', error);
        Notification.error({
          title: '关联失败',
          content: '模块关联失败，请重试',
          duration: 5,
        });
        // TODO: 可以考虑在这里恢复状态
      }
    }
    setShowModuleLinkModal(false);
    setSelectedEntity(null);
  };

  return (
    <div style={{ padding: '24px', minWidth: '720px', maxWidth: '960px' }}>
      <SearchFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        onRefresh={async () => {
          console.log('🔄 刷新数据');
          await loadEntities();
          console.log('🔄 数据已刷新');
        }}
        loading={loading}
        placeholder="搜索实体、属性..."
      />
      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={false}
        childrenRecordName="children"
        expandIcon={false}
        expandRowByClick={true}
        hideExpandedColumn={true}
        indentSize={0}
        size="small"
        style={{ tableLayout: 'fixed' }}
        className="entity-list-table"
        scroll={{ y: 'calc(100vh - 186px)' }}
        rowKey="key"
        onRow={useCallback((record: any, index?: number) => {
          // 为新增状态的行添加className，避免每次渲染创建新对象
          if (record.type === 'entity' && record.entity?._status === 'new') {
            return { className: 'entity-row-new' };
          }
          if (
            (record.type === 'attribute' || record.type === 'module-attribute') &&
            record.attribute?._status === 'new'
          ) {
            return { className: 'attribute-row-new' };
          }
          return {};
        }, [])}
      />

      <style>
        {`
          .entity-list-table .semi-table-tbody > .semi-table-row > .semi-table-row-cell {
            padding-right: 8px;
            padding-left: 8px;
          }

          /* 新增实体行的左边框 */
          .entity-list-table .entity-row-new {
            border-left: 4px solid var(--semi-color-primary) !important;
          }

          /* 新增属性行的左边框 */
          .entity-list-table .attribute-row-new {
            border-left: 4px solid var(--semi-color-primary) !important;
          }

          /* 新增元素的泛光动画 */
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }

          /* Badge深色边框样式 - 通用样式 */
          .entity-list-table .semi-badge .semi-badge-count,
          .entity-list-table .semi-badge-count {
            border: 1px solid var(--semi-color-text-1) !important;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15) !important;
            min-width: 16px !important;
            height: 16px !important;
            font-size: 10px !important;
            line-height: 14px !important;
            padding: 0 4px !important;
            transform: scale(0.8) !important;
            transform-origin: center !important;
          }

          /* 调整Badge位置，避免完全覆盖按钮图标 */
          .entity-list-table .semi-badge {
            position: relative !important;
          }

          .entity-list-table .semi-badge .semi-badge-count {
            top: -8px !important;
            right: -8px !important;
          }

          /* primary类型Badge的边框颜色 */
          .entity-list-table .semi-badge-primary .semi-badge-count,
          .entity-list-table [data-badge-type="primary"] .semi-badge-count {
            border-color: var(--semi-color-primary) !important;
            box-shadow: 0 0 0 1px var(--semi-color-primary) !important;
          }

          /* success类型Badge的边框颜色 */
          .entity-list-table .semi-badge-success .semi-badge-count,
          .entity-list-table [data-badge-type="success"] .semi-badge-count {
            border-color: var(--semi-color-success) !important;
            box-shadow: 0 0 0 1px var(--semi-color-success) !important;
          }
        `}
      </style>

      {/* 模块关联弹窗 */}
      {showModuleLinkModal && selectedEntity && (
        <ModuleSelectorTableModal
          visible={showModuleLinkModal}
          selectedModuleIds={selectedEntity.bundles || []}
          onCancel={() => {
            setShowModuleLinkModal(false);
            setSelectedEntity(null);
          }}
          onConfirm={handleSaveModuleLink}
          entityId={selectedEntity._indexId}
        />
      )}
    </div>
  );
};
