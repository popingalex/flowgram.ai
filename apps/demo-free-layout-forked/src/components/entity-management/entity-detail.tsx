import React, { useCallback, useMemo, useRef, ReactNode } from 'react';

import { nanoid } from 'nanoid';
import { Typography, Input, Button, Badge, Form, Tag } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { createColumn } from '../ext/universal-table/column-configs';
import { UniversalTable } from '../ext/universal-table';
import { EntityPropertyTypeSelector } from '../ext/type-selector-ext';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useModuleStore } from '../../stores';

const { Title } = Typography;

interface EntityDetailProps {
  selectedEntity: any;
  isDirty: boolean; // 保留接口兼容性，但内部使用CurrentEntityStore的状态
  isSaving: boolean; // 保留接口兼容性，但内部使用CurrentEntityStore的状态
  canSave: boolean;
  onSave: () => void;
  onUndo: () => void;
  onDelete: () => void;
  // 新增参数
  actionButtons?: ReactNode;
  statusInfo?: ReactNode;
}

export const EntityDetail: React.FC<EntityDetailProps> = ({
  selectedEntity,
  canSave,
  onSave,
  onUndo,
  onDelete,
  actionButtons,
  statusInfo,
}) => {
  // 🔑 使用CurrentEntityStore的数据和状态
  const { editingEntity, isDirty, isSaving } = useCurrentEntity();
  const { updateProperty } = useCurrentEntityActions();

  // 🔑 获取模块数据用于显示关联模块信息
  const { modules } = useModuleStore();

  // 🔑 搜索状态 - 必须在早期返回之前声明所有 Hooks
  const [attributeSearchText, setAttributeSearchText] = React.useState('');
  const [moduleSearchText, setModuleSearchText] = React.useState('');

  // 🔑 选中的模块keys
  const [selectedModuleKeys, setSelectedModuleKeys] = React.useState<string[]>([]);

  // 🔑 属性操作回调函数 - 必须在早期返回之前声明
  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

  // 🔑 直接使用CurrentEntityStore的editingEntity作为唯一数据源
  const currentEntity = editingEntity;

  // 🔑 构建模块树形数据
  const moduleTreeData = useMemo(() => {
    if (!modules) return [];

    return modules.map((module: any) => {
      const children =
        module.attributes?.map((attr: any) => ({
          key: attr._indexId,
          id: attr.displayId,
          name: attr.name,
          type: attr.type,
          description: attr.description,
          isAttribute: true,
          _indexId: attr._indexId,
          displayId: attr.displayId,
          moduleId: module.id,
        })) || [];

      return {
        key: module._indexId,
        id: module.id,
        name: module.name,
        attributeCount: module.attributes?.length || 0,
        children,
        isAttribute: false,
        _indexId: module._indexId,
      };
    });
  }, [modules]);

  // 🔑 更新选中状态
  React.useEffect(() => {
    if (currentEntity?.bundles) {
      const keys = (currentEntity.bundles || []).map((bundleId: string) => {
        const module = moduleTreeData.find((item) => item.id === bundleId);
        return module?._indexId || bundleId;
      });
      setSelectedModuleKeys(keys);
    }
  }, [currentEntity?.bundles, moduleTreeData]);

  // 🔑 模块关联变更处理
  const handleModuleAssociationChange = useCallback(
    (moduleId: string, checked: boolean) => {
      if (!currentEntity) return;

      const currentBundles = currentEntity.bundles || [];
      let newBundles: string[];

      if (checked) {
        // 添加模块关联
        newBundles = [...currentBundles, moduleId];
      } else {
        // 移除模块关联
        newBundles = currentBundles.filter((bundleId: string) => bundleId !== moduleId);
      }

      console.log('🔧 模块关联变更:', {
        moduleId,
        checked,
        oldBundles: currentBundles,
        newBundles,
      });

      updateProperty('bundles', newBundles);
    },
    [currentEntity, updateProperty]
  );

  // 🔑 字段更新 - 直接使用CurrentEntityStore的updateProperty
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      console.log('🔍 更新实体字段:', field, value);
      updateProperty(field, value);
    },
    [updateProperty]
  );

  // 🔑 属性字段更新
  const handleAttributeFieldChange = useCallback(
    (attributeIndexId: string, field: string, value: any) => {
      console.log('🔍 更新属性字段:', { attributeIndexId, field, value });
      updateAttributeProperty(attributeIndexId, field, value);
    },
    [updateAttributeProperty]
  );

  // 🔑 添加属性
  const handleAddAttribute = useCallback(() => {
    const newAttribute = {
      _indexId: nanoid(),
      id: '', // 空ID，用户需要填写
      name: '', // 空名称，用户需要填写
      type: 'string',
      description: '',
      _status: 'new',
    };
    addAttribute(newAttribute);
    console.log('🔍 添加新属性');
  }, [addAttribute]);

  // 🔑 删除属性
  const handleDeleteAttribute = useCallback(
    (attributeIndexId: string) => {
      removeAttribute(attributeIndexId);
      console.log('🔍 删除属性:', attributeIndexId);
    },
    [removeAttribute]
  );

  // 🔑 类型变更
  const handleTypeChange = useCallback(
    (attributeIndexId: string, typeInfo: any) => {
      console.log('🔍 类型变更:', { attributeIndexId, typeInfo });
      updateAttributeProperty(attributeIndexId, 'type', typeInfo.type);
      if (typeInfo.enumClassId) {
        updateAttributeProperty(attributeIndexId, 'enumClassId', typeInfo.enumClassId);
      } else {
        updateAttributeProperty(attributeIndexId, 'enumClassId', undefined);
      }
    },
    [updateAttributeProperty]
  );

  // 如果没有正在编辑的实体，显示空状态
  if (!currentEntity) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--semi-color-text-2)',
        }}
      >
        请选择一个实体进行编辑
      </div>
    );
  }
  console.log(' 实体详情更新', currentEntity);
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 实体配置表单 */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="实体" required width={80} align="right" />
            <Input
              value={currentEntity.id || ''}
              onChange={(value) => handleFieldChange('id', value)}
              placeholder="实体ID（必填）"
              validateStatus={!currentEntity.id?.trim() ? 'error' : undefined}
              style={{
                flex: 1,
                marginLeft: '12px',
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '12px',
              }}
              data-testid="entity-id-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="名称" width={80} align="right" />
            <Input
              value={currentEntity.name || ''}
              onChange={(value) => handleFieldChange('name', value)}
              placeholder="实体名称"
              style={{ flex: 1, marginLeft: '12px' }}
              data-testid="entity-name-input"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="描述" width={80} align="right" />
            <Input
              value={(currentEntity as any).description || currentEntity.desc || ''}
              onChange={(value) => handleFieldChange('description', value)}
              placeholder="实体描述"
              style={{ flex: 1, marginLeft: '12px' }}
              data-testid="entity-description-input"
            />
          </div>
        </div>
      </div>

      {/* 属性表格区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {/* 实体属性表格 */}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          <Form.Label text="实体属性" width={80} align="right" />
          <div style={{ flex: 1, marginLeft: '12px' }}>
            {/* 搜索框 */}
            <div style={{ marginBottom: '12px' }}>
              <Input
                prefix={<IconSearch />}
                placeholder="搜索属性ID、名称或类型..."
                value={attributeSearchText}
                onChange={setAttributeSearchText}
                showClear
                style={{ width: '100%' }}
              />
            </div>

            <UniversalTable
              dataSource={currentEntity?.attributes || []}
              searchText={attributeSearchText}
              columns={[
                createColumn('id', 'ID', 'id', {
                  width: 150,
                  searchable: true,
                  editable: true,
                }),
                createColumn('name', '名称', 'name', {
                  width: 200,
                  searchable: true,
                  editable: true,
                }),
                createColumn('type', '', 'type', {
                  width: 40,
                  searchable: true,
                  render: (value: any, record: any) => (
                    <EntityPropertyTypeSelector
                      value={{
                        type: record.type,
                        ...(record.enumClassId && { enumClassId: record.enumClassId }),
                      }}
                      onChange={(typeInfo: any) => {
                        handleTypeChange(record._indexId, typeInfo);
                      }}
                    />
                  ),
                }),
              ]}
              rowKey="_indexId"
              editable={true}
              deletable={true}
              addable={true}
              size="small"
              emptyText="暂无属性"
              onEdit={(key, field, value) => {
                console.log('编辑:', { key, field, value });
                handleAttributeFieldChange(key, field, value);
              }}
              onDelete={(key) => {
                console.log('删除:', key);
                handleDeleteAttribute(key);
              }}
              onAdd={handleAddAttribute}
            />
          </div>
        </div>

        {/* 模块关联表格 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '16px' }}>
          <Form.Label text="关联模块" width={80} align="right" />
          <div style={{ flex: 1, marginLeft: '12px' }}>
            {/* 搜索框 */}
            <div style={{ marginBottom: '12px' }}>
              <Input
                prefix={<IconSearch />}
                placeholder="搜索模块ID、名称或属性..."
                value={moduleSearchText}
                onChange={setModuleSearchText}
                showClear
                style={{ width: '100%' }}
              />
            </div>

            <UniversalTable
              dataSource={moduleTreeData}
              searchText={moduleSearchText}
              columns={[
                createColumn('id', 'ID', 'id', {
                  width: 150,
                  searchable: true,
                  render: (value: any, record: any) => {
                    const displayValue = record.displayId || record.id;
                    const isGroupHeader = record.children && record.children.length > 0;

                    if (isGroupHeader) {
                      return (
                        <Typography.Text
                          link={{ href: `/modules/${record.id}` }}
                          style={{
                            fontFamily:
                              'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--semi-color-primary)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {displayValue}
                        </Typography.Text>
                      );
                    } else {
                      return (
                        <Typography.Text
                          style={{
                            fontFamily:
                              'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                            fontSize: '12px',
                          }}
                        >
                          {displayValue}
                        </Typography.Text>
                      );
                    }
                  },
                }),
                createColumn('name', '名称', 'name', {
                  width: 200,
                  searchable: true,
                  render: (value: any, record: any) => {
                    const isGroupHeader = record.children && record.children.length > 0;

                    if (isGroupHeader) {
                      return (
                        <Typography.Text
                          link={{ href: `/modules/${record.id}` }}
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--semi-color-primary)',
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {record.name}
                        </Typography.Text>
                      );
                    } else {
                      return (
                        <Typography.Text style={{ fontSize: '13px' }}>
                          {record.name}
                        </Typography.Text>
                      );
                    }
                  },
                }),
                createColumn('typeOrCount', '', 'type', {
                  searchable: true,
                  render: (value: any, record: any) => {
                    const isGroupHeader = record.children && record.children.length > 0;

                    if (isGroupHeader) {
                      // 模块行：显示属性统计
                      return (
                        <Tag size="small" color="cyan">
                          {record.attributeCount || 0}
                        </Tag>
                      );
                    } else {
                      // 模块属性行：显示类型
                      return (
                        <EntityPropertyTypeSelector
                          value={{
                            type: record.type,
                            ...(record.enumClassId && { enumClassId: record.enumClassId }),
                          }}
                          onChange={() => {}} // 只读
                          disabled={true}
                        />
                      );
                    }
                  },
                }),
              ]}
              rowKey="_indexId"
              editable={false}
              showSelection={true}
              selectedKeys={selectedModuleKeys}
              onSelectionChange={(keys) => {
                const moduleIds = keys.map((key) => {
                  const module = moduleTreeData.find((item) => item._indexId === key);
                  return module?.id || key;
                });
                updateProperty('bundles', moduleIds);
              }}
              expandable={true}
              childrenColumnName="children"
              defaultExpandAllRows={false}
              expandRowByClick={true}
              size="small"
              showPagination={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
