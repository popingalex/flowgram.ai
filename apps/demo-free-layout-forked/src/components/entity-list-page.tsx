import React, { useState, useMemo } from 'react';

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

import { useModuleStore } from '../stores/module.store';
import { useCurrentEntityStore } from '../stores/current-entity.store';
import { EntityPropertyTypeSelector } from './ext/type-selector-ext';
import { ModuleSelectorTableModal } from './bt/module-selector-table';
import { useEntityList, useEntityListActions } from '../stores';

const { Text } = Typography;

interface EntityListPageProps {
  onViewWorkflow?: (entityId: string) => void;
}

// 实体ID输入组件
const EntityIdInput = React.memo(
  ({
    entity,
    onFieldChange,
  }: {
    entity: any;
    onFieldChange: (entityId: string, field: string, value: any) => void;
  }) => (
    <Input
      value={entity.id}
      onChange={(newValue) => onFieldChange(entity._indexId, 'id', newValue)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      size="small"
      placeholder="实体ID"
      style={{
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '12px',
      }}
    />
  )
);
EntityIdInput.displayName = 'EntityIdInput';

// 实体名称输入组件
const EntityNameInput = React.memo(
  ({
    entity,
    onFieldChange,
  }: {
    entity: any;
    onFieldChange: (entityId: string, field: string, value: any) => void;
  }) => (
    <Input
      value={entity.name}
      onChange={(newValue) => onFieldChange(entity._indexId, 'name', newValue)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      size="small"
      placeholder="实体名称"
      style={{ fontSize: '13px' }}
    />
  )
);
EntityNameInput.displayName = 'EntityNameInput';

// 属性ID输入组件
const AttributeIdInput = React.memo(
  ({
    attribute,
    entityId,
    onFieldChange,
    readonly = false,
  }: {
    attribute: any;
    entityId: string;
    onFieldChange: (entityId: string, attributeId: string, field: string, value: any) => void;
    readonly?: boolean;
  }) => {
    if (readonly) {
      const displayValue =
        attribute.displayId || attribute.id?.split('/').pop() || attribute.id || '';

      return (
        <Text
          style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '12px',
          }}
        >
          {displayValue}
        </Text>
      );
    }

    return (
      <Input
        value={attribute.id}
        onChange={(newValue) => onFieldChange(entityId, attribute._indexId, 'id', newValue)}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        size="small"
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

// 属性名称输入组件
const AttributeNameInput = React.memo(
  ({
    attribute,
    entityId,
    onFieldChange,
    readonly = false,
  }: {
    attribute: any;
    entityId: string;
    onFieldChange: (entityId: string, attributeId: string, field: string, value: any) => void;
    readonly?: boolean;
  }) => {
    if (readonly) {
      return <Text style={{ fontSize: '13px' }}>{attribute.name}</Text>;
    }

    return (
      <Input
        value={attribute.name}
        onChange={(newValue) => onFieldChange(entityId, attribute._indexId, 'name', newValue)}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        size="small"
        placeholder="属性名称"
        style={{ fontSize: '13px' }}
      />
    );
  }
);
AttributeNameInput.displayName = 'AttributeNameInput';

export const EntityListPage: React.FC<EntityListPageProps> = ({ onViewWorkflow }) => {
  const { entities, loading } = useEntityList();
  const { addEntity, updateEntity, deleteEntity } = useEntityListActions();
  const { modules } = useModuleStore();

  // 实体编辑状态管理
  const {
    selectedEntityId,
    editingEntity,
    isDirty,
    isSaving,
    selectEntity,
    saveChanges,
    resetChanges,
  } = useCurrentEntityStore();

  const [searchText, setSearchText] = useState('');
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showModuleLinkModal, setShowModuleLinkModal] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  // 🎯 获取实际显示的实体数据：优先使用编辑中的数据
  const getDisplayEntity = (entity: any) => {
    if (entity._indexId === selectedEntityId && editingEntity) {
      return editingEntity;
    }
    return entity;
  };

  // 转换为表格数据 - 只依赖实体结构，不依赖编辑内容
  const tableData = useMemo(() => {
    const data: any[] = [];

    entities.forEach((entity) => {
      const entityRow = {
        key: entity._indexId,
        type: 'entity',
        entity: entity, // 直接保存实体对象
        children: [],
      };

      // 实体属性
      entity.attributes?.forEach((attr: any) => {
        entityRow.children.push({
          key: attr._indexId,
          type: 'attribute',
          entity: entity,
          attribute: attr, // 直接保存属性对象
          readonly: false,
        });
      });

      // 关联模块
      entity.bundles?.forEach((bundleId: string) => {
        const module = modules.find((m) => m.id === bundleId || m._indexId === bundleId);
        if (module) {
          const moduleRow = {
            key: module._indexId,
            type: 'module',
            entity: entity,
            module: module, // 直接保存模块对象
            children: [],
          };

          // 模块属性
          module.attributes?.forEach((attr: any) => {
            moduleRow.children.push({
              key: attr._indexId,
              type: 'module-attribute',
              entity: entity,
              module: module,
              attribute: attr, // 直接保存属性对象
              readonly: true,
            });
          });

          entityRow.children.push(moduleRow);
        }
      });

      data.push(entityRow);
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
  }, [tableData, searchText, entities, modules]);

  // 字段变更处理
  const handleEntityFieldChange = (entityId: string, field: string, value: any) => {
    const entity = entities.find((e) => e._indexId === entityId);
    if (entity) {
      // 先选中实体（如果还没选中）
      if (selectedEntityId !== entityId) {
        selectEntity(entity);
      }
      // 通过CurrentEntityStore更新，dirty状态会自动计算
      const { updateProperty } = useCurrentEntityStore.getState();
      updateProperty(field, value);
    }
  };

  const handleAttributeFieldChange = (
    entityId: string,
    attributeId: string,
    field: string,
    value: any
  ) => {
    const entity = entities.find((e) => e._indexId === entityId);
    if (entity) {
      // 先选中实体（如果还没选中）
      if (selectedEntityId !== entityId) {
        selectEntity(entity);
      }

      // 通过CurrentEntityStore更新属性，dirty状态会自动计算
      const { updateAttributeProperty } = useCurrentEntityStore.getState();
      updateAttributeProperty(attributeId, field, value);
    }
  };

  const handleTypeChange = (entityId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(entityId, attributeId, 'type', typeInfo.type);
  };

  // 检查实体是否有修改
  const isEntityDirty = (entityId?: string) => entityId && selectedEntityId === entityId && isDirty;

  // 表格列定义
  const columns = [
    {
      key: 'navigation',
      width: 60,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          const entity = record.entity;
          return entity ? (
            <Space spacing={8}>
              <Tooltip content="编辑工作流">
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    // 在新窗口打开工作流编辑页面，使用hash格式确保兼容性
                    window.open(`/#entity-workflow/${entity.id}`, '_blank');
                  }}
                  icon={<IconBranch />}
                />
              </Tooltip>
              <Tooltip content="关联模块">
                <Button
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLinkModule(entity);
                  }}
                  icon={<IconLink />}
                />
              </Tooltip>
            </Space>
          ) : null;
        }
        return null;
      },
    },
    {
      key: 'type',
      width: 40,
      render: (_: any, record: any) => {
        if (record.type === 'entity') return <Tag color="blue">实体</Tag>;
        if (record.type === 'attribute') return <Tag color="green">属性</Tag>;
        if (record.type === 'module') return <Tag color="orange">模块</Tag>;
        if (record.type === 'module-attribute') return <Tag color="grey">模块属性</Tag>;
        return <Tag>{record.type}</Tag>;
      },
    },
    {
      title: 'ID',
      key: 'id',
      width: 120,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          const displayEntity = getDisplayEntity(record.entity);
          return <EntityIdInput entity={displayEntity} onFieldChange={handleEntityFieldChange} />;
        } else if (record.type === 'attribute') {
          const displayEntity = getDisplayEntity(record.entity);
          const displayAttribute =
            displayEntity.attributes?.find((a: any) => a._indexId === record.attribute._indexId) ||
            record.attribute;
          return (
            <AttributeIdInput
              attribute={displayAttribute}
              entityId={record.entity?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
              readonly={false}
            />
          );
        } else if (record.type === 'module-attribute') {
          return (
            <AttributeIdInput
              attribute={record.attribute}
              entityId={record.entity?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
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
    {
      title: '名称',
      key: 'name',
      width: 160,
      render: (_: any, record: any) => {
        if (record.type === 'entity') {
          const displayEntity = getDisplayEntity(record.entity);
          return <EntityNameInput entity={displayEntity} onFieldChange={handleEntityFieldChange} />;
        } else if (record.type === 'attribute') {
          const displayEntity = getDisplayEntity(record.entity);
          const displayAttribute =
            displayEntity.attributes?.find((a: any) => a._indexId === record.attribute._indexId) ||
            record.attribute;
          return (
            <AttributeNameInput
              attribute={displayAttribute}
              entityId={record.entity?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
              readonly={record.readonly}
            />
          );
        } else if (record.type === 'module-attribute') {
          return (
            <AttributeNameInput
              attribute={record.attribute}
              entityId={record.entity?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
              readonly={record.readonly}
            />
          );
        } else if (record.type === 'module') {
          return <Text style={{ fontSize: '13px' }}>{record.module?.name}</Text>;
        }
        return null;
      },
    },
    {
      title: () => (
        <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAddEntity}>
          添加实体
        </Button>
      ),
      key: 'actions',
      width: 200,
      render: (_: any, record: any) => (
        <div
          style={{
            display: 'flex',
            gap: '4px',
            justifyContent: 'flex-start',
            minWidth: '180px',
            flexWrap: 'wrap',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 类型选择器 - 只在属性行显示 */}
          {(record.type === 'attribute' || record.type === 'module-attribute') &&
            record.attribute &&
            (() => {
              if (record.type === 'attribute') {
                const displayEntity = getDisplayEntity(record.entity);
                const displayAttribute =
                  displayEntity.attributes?.find(
                    (a: any) => a._indexId === record.attribute._indexId
                  ) || record.attribute;
                return (
                  <Tooltip content="选择属性类型">
                    <EntityPropertyTypeSelector
                      value={{ type: displayAttribute.type }}
                      onChange={(typeInfo) =>
                        handleTypeChange(
                          record.entity?._indexId || '',
                          record.attribute._indexId,
                          typeInfo
                        )
                      }
                      disabled={record.readonly}
                    />
                  </Tooltip>
                );
              } else {
                return (
                  <Tooltip content="属性类型（只读）">
                    <EntityPropertyTypeSelector
                      value={{ type: record.attribute.type }}
                      onChange={(typeInfo) =>
                        handleTypeChange(
                          record.entity?._indexId || '',
                          record.attribute._indexId,
                          typeInfo
                        )
                      }
                      disabled={record.readonly}
                    />
                  </Tooltip>
                );
              }
            })()}

          {/* 实体操作按钮 */}
          {record.type === 'entity' &&
            record.entity &&
            (() => {
              const entity = record.entity;
              const entityIsDirty = isEntityDirty(entity._indexId);

              return (
                <>
                  <Tooltip content="保存实体修改">
                    <Button
                      size="small"
                      type="primary"
                      onClick={async (e) => {
                        e.stopPropagation();
                        selectEntity(entity);
                        await saveChanges();
                      }}
                      icon={<IconSave />}
                      disabled={!entityIsDirty}
                      loading={isSaving && selectedEntityId === entity._indexId}
                    />
                  </Tooltip>
                  <Tooltip content="撤销修改">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        resetChanges();
                      }}
                      icon={<IconUndo />}
                      disabled={!entityIsDirty}
                    />
                  </Tooltip>
                  <Tooltip content="添加属性">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAttribute(entity._indexId);
                      }}
                      icon={<IconPlus />}
                    />
                  </Tooltip>
                  <Tooltip content="删除实体">
                    <Popconfirm
                      title="确定删除这个实体吗？"
                      onConfirm={(e) => {
                        e?.stopPropagation?.();
                        handleDeleteEntity(entity);
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
            <Tooltip content="删除属性">
              <Popconfirm
                title="确定删除这个属性吗？"
                onConfirm={(e) => {
                  e?.stopPropagation?.();
                  handleDeleteAttribute(record.entity, record.attribute);
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

          {/* 模块解绑按钮 */}
          {record.type === 'module' && record.entity && record.module && (
            <Tooltip content="解绑模块">
              <Popconfirm
                title="确定移除这个模块吗？"
                onConfirm={(e) => {
                  e?.stopPropagation?.();
                  handleUnlinkModule(record.entity, record.module);
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
  const handleViewWorkflow = (entity: any) => {
    if (onViewWorkflow) {
      onViewWorkflow(entity.id);
    }
  };

  const handleSaveEntityChanges = (entity: any) => {
    // 实际上数据已经实时保存到store了，这里可以显示保存成功提示
    console.log('保存实体:', entity);
    // TODO: 可以调用后台API保存
  };

  const handleResetEntityChanges = (entity: any) => {
    // 重新加载实体数据，撤销本地修改
    console.log('撤销实体修改:', entity);
    // TODO: 重新从后台加载数据
  };

  const handleDeleteEntity = (entity: any) => {
    deleteEntity(entity._indexId);
  };

  const handleDeleteAttribute = (entity: any, attribute: any) => {
    const updatedEntity = { ...entity };
    updatedEntity.attributes = updatedEntity.attributes?.filter(
      (attr: any) => attr._indexId !== attribute._indexId
    );
    updateEntity(entity._indexId, updatedEntity);
  };

  const handleUnlinkModule = (entity: any, module: any) => {
    const updatedEntity = { ...entity };
    updatedEntity.bundles = updatedEntity.bundles?.filter(
      (bundleId: string) => bundleId !== module.id
    );
    updateEntity(entity._indexId, updatedEntity);
  };

  const handleLinkModule = (entity: any) => {
    setSelectedEntity(entity);
    setShowModuleLinkModal(true);
  };

  const handleAddEntity = () => {
    setShowEntityModal(true);
  };

  const handleAddAttribute = (entityId: string) => {
    const entity = entities.find((e) => e._indexId === entityId);
    if (entity) {
      const updatedEntity = { ...entity };
      if (!updatedEntity.attributes) {
        updatedEntity.attributes = [];
      }
      updatedEntity.attributes.push({
        _indexId: `attr_${Date.now()}`,
        id: `new_attr_${Date.now()}`,
        name: '新属性',
        type: 'string',
      });
      updateEntity(entityId, updatedEntity);
    }
  };

  const handleSaveEntity = (values: any) => {
    const newEntity = {
      _indexId: `entity_${Date.now()}`,
      id: values.id,
      name: values.name,
      attributes: [],
      bundles: [],
      deprecated: false,
    };
    addEntity(newEntity);
    setShowEntityModal(false);
  };

  const handleSaveModuleLink = (selectedModuleIds: string[]) => {
    if (selectedEntity) {
      const updatedEntity = { ...selectedEntity };
      updatedEntity.bundles = selectedModuleIds;
      updateEntity(selectedEntity._indexId, updatedEntity);
    }
    setShowModuleLinkModal(false);
    setSelectedEntity(null);
  };

  console.log('filteredData', filteredData);

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <Input
          placeholder="搜索实体、属性..."
          value={searchText}
          onChange={setSearchText}
          style={{ width: 300 }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
        <Table
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          pagination={false}
          childrenRecordName="children"
          defaultExpandAllRows={false}
          hideExpandedColumn={false}
          expandRowByClick={true}
          indentSize={0}
          size="small"
          scroll={{ y: 'calc(100vh - 200px)' }}
          onRow={(record, index) => {
            // 实体行背景色
            if (record.type === 'entity') {
              return {
                style: {
                  backgroundColor: 'var(--semi-color-fill-0)',
                  borderBottom: '2px solid var(--semi-color-border)',
                },
              };
            }
            // 属性和模块属性行
            if (record.type === 'attribute' || record.type === 'module-attribute') {
              return {
                style: {
                  backgroundColor: 'var(--semi-color-bg-0)',
                },
              };
            }
            // 模块行
            if (record.type === 'module') {
              return {
                style: {
                  backgroundColor: 'var(--semi-color-warning-light-default)',
                },
              };
            }
            return {};
          }}
        />
      </div>

      {/* 添加实体弹窗 */}
      <Modal
        title="添加实体"
        visible={showEntityModal}
        onCancel={() => setShowEntityModal(false)}
        footer={null}
      >
        <Form onSubmit={handleSaveEntity}>
          <Form.Input
            field="id"
            label="实体ID"
            placeholder="实体ID"
            rules={[{ required: true, message: '请输入实体ID' }]}
          />
          <Form.Input
            field="name"
            label="实体名称"
            placeholder="实体名称"
            rules={[{ required: true, message: '请输入实体名称' }]}
          />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowEntityModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

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
          entityId={selectedEntity.id}
        />
      )}
    </div>
  );
};
