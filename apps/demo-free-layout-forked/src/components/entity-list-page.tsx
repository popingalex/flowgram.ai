import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

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

import { IndexedInput, createIndexedValidator } from './indexed-input';
import { UniversalInput, createUniversalValidator } from './ext/universal-input';
import { EntityPropertyTypeSelector, DataRestrictionButton } from './ext/type-selector-ext';
import { FieldInput } from './ext/common-inputs';
import { ModuleSelectorTableModal } from './bt/module-selector-table';
import { useEntityList, useEntityListActions } from '../stores/entity-list';
import { useModuleStore, useGraphList } from '../stores';

const { Text } = Typography;

interface EntityListPageProps {
  onViewWorkflow?: (entityId: string) => void;
}

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
    resetEntityChanges,
  } = useEntityListActions();
  const { modules } = useModuleStore();
  const { graphs } = useGraphList();

  const [searchText, setSearchText] = useState('');
  const [showModuleLinkModal, setShowModuleLinkModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // 🔧 优化调试：减少日志频率，只在实体数量变化时输出
  const prevEntitiesLengthRef = useRef(entities.length);
  if (entities.length !== prevEntitiesLengthRef.current) {
    console.log(
      '🔄 EntityListPage实体数量变化:',
      prevEntitiesLengthRef.current,
      '->',
      entities.length
    );
    prevEntitiesLengthRef.current = entities.length;
  }

  // 初始化加载
  React.useEffect(() => {
    loadEntities();
  }, [loadEntities]);

  // 🔧 优化表格数据计算 - 减少复杂度和重新计算频率
  const tableData = useMemo(() => {
    // 🔧 减少日志频率，只在实体数量变化时输出
    console.log('🔄 重新计算表格数据，实体:', entities);

    const data: any[] = entities.map((entity) => {
      const entityRow: any = {
        key: entity._indexId,
        type: 'entity',
        entity: entity,
        children: [],
      };

      // 🔧 简化属性排序 - 只按状态分组，减少复杂排序
      const attributes = entity.attributes || [];
      const newAttributes = attributes.filter((attr) => attr._status === 'new');
      const otherAttributes = attributes.filter((attr) => attr._status !== 'new');

      [...newAttributes, ...otherAttributes].forEach((attr: any) => {
        entityRow.children.push({
          key: attr._indexId,
          type: 'attribute',
          entity: entity,
          attribute: attr,
          readonly: false,
        });
      });

      // 🔧 简化模块处理 - 减少查找操作
      const bundles = entity.bundles || [];
      bundles.forEach((bundleId: string) => {
        const module = modules.find((m) => m.id === bundleId);
        if (module) {
          const moduleRow: any = {
            key: `${entity._indexId}-${module._indexId}`, // 🔧 确保key的唯一性
            type: 'module',
            entity: entity,
            module: module,
            children: [],
          };

          // 🔧 简化模块属性处理
          (module.attributes || []).forEach((attr: any) => {
            moduleRow.children.push({
              key: `${entity._indexId}-${module._indexId}-${attr._indexId}`, // 🔧 确保key的唯一性
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

      return entityRow;
    });

    return data;
  }, [entities, modules]);

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

  // 🎯 字段变更处理 - 直接更新实体，简化逻辑
  const handleEntityFieldChange = useCallback(
    (entityIndexId: string, field: string, value: any) => {
      console.log('🔍 更新实体字段:', entityIndexId, field, value);
      console.trace('🔍 更新事件堆栈跟踪:');
      updateEntityField(entityIndexId, field, value);
    },
    [updateEntityField]
  );

  const handleAttributeFieldChange = useCallback(
    (entityIndexId: string, attributeId: string, field: string, value: any) => {
      console.log('🔍 更新属性字段:', entityIndexId, attributeId, field, value);
      updateEntityAttribute(entityIndexId, attributeId, field, value);
    },
    [updateEntityAttribute]
  );

  const handleTypeChange = (entityIndexId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(entityIndexId, attributeId, 'type', typeInfo.type);
  };

  // 🎯 检查实体是否有修改 - 直接检查实体状态
  const isEntityDirty = useCallback((entity: any) => {
    const status = entity._status;
    // console.log('🔍 检查实体状态:', entity._indexId, '状态:', status);
    return status === 'dirty' || status === 'new';
  }, []);

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

  // 表格列定义 - 使用useMemo避免重复创建onChange回调
  const columns = useMemo(
    () => [
      // 第一列：展开按钮（合并表头包含搜索框）
      {
        key: 'expand',
        width: 20,
        title: '',
        render: (_: any, record: any, index: number, { expandIcon }: any) => expandIcon,
      },
      // 第二列：链接按钮&行为树跳转按钮
      {
        key: 'navigation',
        width: 60,
        title: '',
        render: (_: any, record: any) => {
          if (record.type === 'entity') {
            const entity = record.entity;
            return entity ? (
              <Space spacing={4}>
                <Tooltip content="编辑工作流">
                  <Badge
                    count={(() => {
                      if (!entity?._indexId) return undefined;

                      // 🔑 修复：统一使用_indexId进行关联
                      // 直接使用_indexId匹配，现在实体和行为树共用同一个nanoid
                      let graph = graphs.find((g) => g._indexId === entity._indexId);
                      if (entity.id == 'scene') {
                        console.log('🔍 [DEBUG] scene entity: ', entity);
                        console.log('🔍 [DEBUG] scene entity._indexId: ', entity._indexId);
                        console.log(
                          '🔍 [DEBUG] all graphs _indexIds: ',
                          graphs.map((g) => ({ id: g.id, _indexId: g._indexId }))
                        );
                        console.log('🔍 [DEBUG] found graph by _indexId: ', graph);
                        console.log('🔍 [DEBUG] graph?.nodes?.length: ', graph?.nodes?.length);
                      }

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
      // 第三列：标签
      {
        key: 'type',
        width: 60,
        title: '',
        render: (_: any, record: any) => {
          if (record.type === 'entity') {
            const isNew = record.entity?._status === 'new';
            return (
              <Tag
                color="blue"
                style={
                  isNew
                    ? {
                        boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                        animation: 'pulse 2s infinite',
                      }
                    : {}
                }
              >
                实体
              </Tag>
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
          if (record.type === 'module') return <Tag color="orange">模块</Tag>;
          if (record.type === 'module-attribute') return <Tag color="grey">属性</Tag>;
          return <Tag>{record.type}</Tag>;
        },
      },
      // 第四列：ID 120px
      {
        title: 'ID',
        key: 'id',
        width: 160,
        render: (_: any, record: any) => {
          if (record.type === 'entity') {
            const errorMessage = getFieldValidationError(
              record.entity._indexId,
              'id',
              record.entity.id
            );
            return (
              <UniversalInput
                key={record.entity._indexId}
                storeName="entity"
                path={[record.entity._indexId]}
                field="id"
                placeholder="实体ID（必填）"
                required={true}
                useStore={useEntityList}
                useStoreActions={useEntityListActions}
                validationFn={createUniversalValidator('id', {
                  entityType: '实体',
                  scope: 'global',
                })}
                style={{
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                }}
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
              <UniversalInput
                key={record.attribute._indexId}
                storeName="entity"
                path={[record.entity._indexId, record.attribute._indexId]}
                field="id"
                placeholder="属性ID（必填）"
                required={true}
                useStore={useEntityList}
                useStoreActions={useEntityListActions}
                validationFn={createUniversalValidator('id', {
                  entityType: '属性',
                  scope: 'parent',
                })}
                style={{
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                }}
              />
            );
          } else if (record.type === 'module-attribute') {
            return (
              <FieldInput
                value={record.attribute.id}
                onChange={() => {}} // 只读，不处理变更
                placeholder="属性ID"
                isIdField={true}
                readonly={true}
                inputKey={`mod-attr-id-${record.attribute._indexId}`} // 🔧 使用稳定的inputKey
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
      // 第五列：Name 160px
      {
        title: '名称',
        key: 'name',
        width: 200,
        render: (_: any, record: any) => {
          if (record.type === 'entity') {
            return (
              <UniversalInput
                key={record.entity._indexId}
                storeName="entity"
                path={[record.entity._indexId]}
                field="name"
                placeholder="实体名称"
                required={true}
                useStore={useEntityList}
                useStoreActions={useEntityListActions}
                validationFn={createUniversalValidator('required')}
              />
            );
          } else if (record.type === 'attribute') {
            return (
              <UniversalInput
                key={record.attribute._indexId}
                storeName="entity"
                path={[record.entity._indexId, record.attribute._indexId]}
                field="name"
                placeholder="属性名称（可选）"
                required={false} // 🔧 属性名称不是必填项
                readonly={record.readonly}
                useStore={useEntityList}
                useStoreActions={useEntityListActions}
                // 🔧 属性名称不需要验证，移除validationFn
              />
            );
          } else if (record.type === 'module-attribute') {
            return (
              <FieldInput
                value={record.attribute.name}
                onChange={() => {}} // 只读，不处理变更
                placeholder="属性名称"
                readonly={record.readonly}
                inputKey={`mod-attr-name-${record.attribute._indexId}`} // 🔧 使用稳定的inputKey
              />
            );
          } else if (record.type === 'module') {
            return <Text style={{ fontSize: '13px' }}>{record.module?.name}</Text>;
          }
          return null;
        },
      },
      // 第六列：控件集合 80px
      {
        title: () => (
          <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAddEntity}>
            添加实体
          </Button>
        ),
        key: 'actions',
        width: 100,
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
                            resetEntityChanges(entity._indexId);
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
    ],
    [handleEntityFieldChange, handleAttributeFieldChange, handleTypeChange, getFieldValidationError]
  );

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
      moduleIds: [], // 关联的模块_indexId数组
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
      {/* 搜索和操作栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <Input
          placeholder="搜索实体、属性..."
          value={searchText}
          onChange={setSearchText}
          style={{ width: '200px' }}
          size="small"
        />
        <Button
          icon={<IconRefresh />}
          onClick={async () => {
            console.log('🔄 刷新数据');
            await loadEntities();
            console.log('🔄 数据已刷新');
          }}
          loading={loading}
          size="small"
        >
          刷新
        </Button>
      </div>

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
        scroll={{ y: 'calc(100vh - 200px)' }}
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
            padding-right: 12px;
            padding-left: 12px;
          }

                    /* 合并表头样式优化 */
          .entity-list-table .semi-table-thead > tr > th[colspan="3"] {
            text-align: left;
            padding: 12px 16px;
            position: relative;
          }

          /* 确保搜索框和按钮的布局在合并单元格中正确显示 */
          .entity-list-table .semi-table-thead > tr > th[colspan="3"] > div {
            min-width: 320px;
            max-width: 100%;
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
