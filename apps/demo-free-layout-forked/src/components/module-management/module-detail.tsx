import React, { useCallback, useMemo, ReactNode } from 'react';

import { nanoid } from 'nanoid';
import { Typography, Input, Form } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { createColumn } from '../ext/universal-table/column-configs';
import { UniversalTable } from '../ext/universal-table';
import { EntityPropertyTypeSelector } from '../ext/type-selector-ext';
import { useCurrentModule, useCurrentModuleActions, useEntityList } from '../../stores';
import type { ModuleAttribute } from '../../services/types';

// const { Title } = Typography; // 未使用

interface ModuleDetailProps {
  selectedModule: any;
  isDirty: boolean; // 保留接口兼容性，但内部使用CurrentModuleStore的状态
  isSaving: boolean; // 保留接口兼容性，但内部使用CurrentModuleStore的状态
  canSave: boolean;
  onSave: () => void;
  onUndo: () => void;
  onDelete: () => void;
  actionButtons?: ReactNode;
  statusInfo?: ReactNode;
}

export const ModuleDetail: React.FC<ModuleDetailProps> = ({
  selectedModule,
  canSave,
  onSave,
  onUndo,
  onDelete,
  actionButtons,
  statusInfo,
}) => {
  // 🔑 使用CurrentModuleStore的数据和状态
  const { editingModule } = useCurrentModule();
  const { updateProperty, updateAttributeProperty, addAttribute, removeAttribute } =
    useCurrentModuleActions();

  // 🔑 获取实体列表
  const { entities } = useEntityList();

  // 🔑 搜索状态
  const [searchText, setSearchText] = React.useState('');

  // 🔑 使用CurrentModuleStore的editingModule作为数据源
  const currentModule = editingModule || selectedModule;

  // 🔑 计算关联的实体列表
  const relatedEntities = useMemo(() => {
    if (!currentModule?.id || !entities) return [];

    return entities.filter((entity) => entity.bundles?.includes(currentModule.id));
  }, [currentModule?.id, entities]);

  // 🔑 过滤后的属性列表
  const filteredAttributes = useMemo(() => {
    if (!currentModule?.attributes) {
      console.log('🔍 过滤调试: 没有属性数据');
      return [];
    }

    if (!searchText.trim()) {
      console.log('🔍 过滤调试: 无搜索文本，返回全部属性', currentModule.attributes.length);
      return currentModule.attributes;
    }

    const searchLower = searchText.toLowerCase();
    const filtered = currentModule.attributes.filter(
      (attr: any) =>
        attr.displayId?.toLowerCase().includes(searchLower) ||
        attr.name?.toLowerCase().includes(searchLower)
    );

    console.log('🔍 过滤调试:', {
      搜索文本: searchText,
      原始数量: currentModule.attributes.length,
      过滤后数量: filtered.length,
      原始数据: currentModule.attributes,
      过滤结果: filtered,
    });

    return filtered;
  }, [currentModule?.attributes, searchText]);

  // 🔑 字段更新 - 直接使用CurrentModuleStore的updateProperty
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      console.log('🔍 更新模块字段:', field, value);
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

  // 🔑 专门处理displayId的更新
  const handleDisplayIdChange = useCallback(
    (attributeIndexId: string, displayId: string) => {
      // 更新displayId
      updateAttributeProperty(attributeIndexId, 'displayId', displayId);

      // 同时更新完整的id（模块ID + / + displayId）
      if (currentModule?.id) {
        const fullId = displayId ? `${currentModule.id}/${displayId}` : displayId;
        updateAttributeProperty(attributeIndexId, 'id', fullId);
      }
    },
    [updateAttributeProperty, currentModule?.id]
  );

  // 🔑 添加属性
  const handleAddAttribute = useCallback(() => {
    const newAttribute: Omit<ModuleAttribute, '_indexId'> = {
      id: '', // 空ID，用户需要填写
      name: '', // 空名称，用户需要填写
      type: 'string',
      desc: '',
      displayId: '', // 无前缀ID
      _status: 'new',
    };
    addAttribute({ ...newAttribute, _indexId: nanoid() });
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

  return (
    <div style={{ height: '100%', padding: '24px', overflow: 'auto' }}>
      {/* 基本信息 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label text="模块" required width={80} align="right" />
          <Input
            value={currentModule.id || ''}
            onChange={(value) => handleFieldChange('id', value)}
            placeholder="模块ID（必填）"
            validateStatus={!currentModule.id?.trim() ? 'error' : undefined}
            style={{
              flex: 1,
              marginLeft: '12px',
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '12px',
            }}
            data-testid="module-id-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label text="名称" width={80} align="right" />
          <Input
            value={currentModule.name || ''}
            onChange={(value) => handleFieldChange('name', value)}
            placeholder="模块名称"
            style={{ flex: 1, marginLeft: '12px' }}
            data-testid="module-name-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label text="描述" width={80} align="right" />
          <Input
            value={currentModule.desc || ''}
            onChange={(value) => handleFieldChange('desc', value)}
            placeholder="模块描述"
            style={{ flex: 1, marginLeft: '12px' }}
            data-testid="module-description-input"
          />
        </div>

        {/* 关联实体 */}
        {relatedEntities.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Form.Label text="关联实体" width={80} align="right" />
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {relatedEntities.map((entity) => (
                  <Typography.Text
                    key={entity._indexId}
                    link={{
                      href: `/entities/${entity.id}/`,
                    }}
                    style={{
                      fontSize: '12px',
                      padding: '2px 6px',
                      backgroundColor: 'var(--semi-color-fill-1)',
                      borderRadius: '4px',
                      border: '1px solid var(--semi-color-border)',
                    }}
                    data-testid={`related-entity-${entity.id}`}
                  >
                    {entity.id} {entity.name && `(${entity.name})`}
                  </Typography.Text>
                ))}
              </div>
              <Typography.Text
                type="secondary"
                size="small"
                style={{ display: 'block', marginTop: '4px' }}
              >
                共 {relatedEntities.length} 个实体使用此模块，点击可跳转
              </Typography.Text>
            </div>
          </div>
        )}
      </div>

      {/* 模块属性 */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        <Form.Label text="模块属性" width={80} align="right" />
        <div style={{ flex: 1, marginLeft: '12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 搜索框 */}
            <Input
              prefix={<IconSearch />}
              placeholder="搜索属性ID或名称..."
              value={searchText}
              onChange={setSearchText}
              size="small"
              showClear
              style={{ width: '100%' }}
            />

            {/* 属性表格 */}
            <UniversalTable
              dataSource={filteredAttributes}
              searchText=""
              columns={[
                createColumn('id', 'ID', 'displayId', {
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
                // 处理不同字段的编辑
                if (field === 'displayId') {
                  handleDisplayIdChange(key, value);
                } else {
                  handleAttributeFieldChange(key, field, value);
                }
              }}
              onDelete={(key) => {
                handleDeleteAttribute(key);
              }}
              onAdd={() => {
                handleAddAttribute();
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
