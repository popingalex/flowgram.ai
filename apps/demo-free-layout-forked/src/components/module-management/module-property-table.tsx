import React, { useState, useCallback, useMemo } from 'react';

import { nanoid } from 'nanoid';
import {
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Tooltip,
  Modal,
  TextArea,
  Typography,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconEdit, IconArticle, IconSearch } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../ext/type-selector-ext';
import { useCurrentModule, useCurrentModuleActions } from '../../stores';
import type { ModuleAttribute } from '../../services/types';

const { Text } = Typography;

// 描述编辑弹窗状态
interface DescriptionEditModal {
  visible: boolean;
  attributeId: string;
  attributeName: string;
  description: string;
}

export const ModulePropertyTable: React.FC = () => {
  const { editingModule } = useCurrentModule();
  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentModuleActions();

  // 搜索状态
  const [searchText, setSearchText] = useState('');

  // 描述编辑弹窗状态
  const [descriptionEditModal, setDescriptionEditModal] = useState<DescriptionEditModal>({
    visible: false,
    attributeId: '',
    attributeName: '',
    description: '',
  });

  // 过滤后的属性列表
  const filteredAttributes = useMemo(() => {
    if (!editingModule?.attributes) return [];

    if (!searchText.trim()) return editingModule.attributes;

    const searchLower = searchText.toLowerCase();
    return editingModule.attributes.filter(
      (attr: any) =>
        attr.id?.toLowerCase().includes(searchLower) ||
        attr.displayId?.toLowerCase().includes(searchLower) ||
        attr.name?.toLowerCase().includes(searchLower) ||
        attr.type?.toLowerCase().includes(searchLower) ||
        attr.description?.toLowerCase().includes(searchLower)
    );
  }, [editingModule?.attributes, searchText]);

  // 字段更新回调
  const handleFieldChange = useCallback(
    (attributeIndexId: string, field: string, value: any) => {
      updateAttributeProperty(attributeIndexId, field, value);
    },
    [updateAttributeProperty]
  );

  // 专门处理displayId的更新
  const handleDisplayIdChange = useCallback(
    (attributeIndexId: string, displayId: string) => {
      // 更新displayId
      updateAttributeProperty(attributeIndexId, 'displayId', displayId);

      // 同时更新完整的id（模块ID + / + displayId）
      if (editingModule?.id) {
        const fullId = displayId ? `${editingModule.id}/${displayId}` : displayId;
        updateAttributeProperty(attributeIndexId, 'id', fullId);
      }
    },
    [updateAttributeProperty, editingModule?.id]
  );

  // 添加属性
  const handleAddAttribute = useCallback(() => {
    const newAttribute: Omit<ModuleAttribute, '_indexId'> = {
      id: editingModule?.id ? `${editingModule.id}/` : '', // 预设模块前缀
      name: '新属性',
      type: 'string',
      description: '',
      displayId: '', // 无前缀ID
      _status: 'new',
    };
    addAttribute({ ...newAttribute, _indexId: nanoid() });
  }, [addAttribute, editingModule?.id]);

  // 删除属性
  const handleDeleteAttribute = useCallback(
    (attributeIndexId: string) => {
      removeAttribute(attributeIndexId);
    },
    [removeAttribute]
  );

  // 编辑描述
  const handleDescriptionEdit = useCallback((attribute: any) => {
    setDescriptionEditModal({
      visible: true,
      attributeId: attribute._indexId,
      attributeName: attribute.name || attribute.id || '未命名属性',
      description: attribute.description || '',
    });
  }, []);

  // 保存描述
  const handleDescriptionSave = useCallback(() => {
    handleFieldChange(
      descriptionEditModal.attributeId,
      'description',
      descriptionEditModal.description
    );
    setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
  }, [handleFieldChange, descriptionEditModal.attributeId, descriptionEditModal.description]);

  // 取消描述编辑
  const handleDescriptionCancel = useCallback(() => {
    setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
  }, []);

  // 类型变更
  const handleTypeChange = useCallback(
    (attributeIndexId: string, typeInfo: any) => {
      console.log('Type changed:', typeInfo);
      handleFieldChange(attributeIndexId, 'type', typeInfo.type);
      if (typeInfo.enumClassId) {
        handleFieldChange(attributeIndexId, 'enumClassId', typeInfo.enumClassId);
      } else {
        handleFieldChange(attributeIndexId, 'enumClassId', undefined);
      }
    },
    [handleFieldChange]
  );

  // 表格列定义
  const columns = useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        width: 150,
        render: (_: any, record: any) => (
          <Input
            value={record.displayId || record.id?.split('/').pop() || ''}
            onChange={(value) => handleDisplayIdChange(record._indexId, value)}
            size="small"
            placeholder="属性ID"
            style={{
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '12px',
            }}
          />
        ),
      },
      {
        title: '名称',
        key: 'name',
        width: 200,
        render: (_: any, record: any) => (
          <Input
            value={record.name || ''}
            onChange={(value) => handleFieldChange(record._indexId, 'name', value)}
            size="small"
            placeholder="属性名称"
            style={{ fontSize: '13px' }}
          />
        ),
      },
      {
        title: '类型',
        key: 'type',
        width: 150,
        render: (_: any, record: any) => (
          <EntityPropertyTypeSelector
            value={{
              type: record.type,
              ...(record.enumClassId && { enumClassId: record.enumClassId }),
            }}
            onChange={(typeInfo: any) => handleTypeChange(record._indexId, typeInfo)}
          />
        ),
      },
      {
        title: () => (
          <Button
            size="small"
            icon={<IconPlus />}
            type="primary"
            onClick={(e) => {
              e.stopPropagation();
              handleAddAttribute();
            }}
          >
            添加属性
          </Button>
        ),
        key: 'operations',
        width: 120,
        render: (_: any, record: any) => (
          <Space>
            <Tooltip content={record.description || '点击编辑描述'}>
              <Button
                theme="borderless"
                size="small"
                icon={<IconArticle />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDescriptionEdit(record);
                }}
                type={record.description ? 'primary' : 'tertiary'}
              />
            </Tooltip>

            <Popconfirm
              title="确定删除此属性吗？"
              content="删除后无法恢复"
              onConfirm={(e) => {
                e?.stopPropagation?.();
                handleDeleteAttribute(record._indexId);
              }}
            >
              <Tooltip content="删除属性">
                <Button
                  type="danger"
                  icon={<IconDelete />}
                  size="small"
                  onClick={(e) => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [
      handleFieldChange,
      handleTypeChange,
      handleDescriptionEdit,
      handleAddAttribute,
      handleDeleteAttribute,
      handleDisplayIdChange,
    ]
  );

  if (!editingModule) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Text type="tertiary">请选择模块</Text>
      </div>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {/* 搜索框 */}
      <div style={{ marginBottom: '16px' }}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索属性ID、名称、类型或描述..."
          value={searchText}
          onChange={setSearchText}
          size="small"
          showClear
          style={{ width: '100%' }}
        />
      </div>

      {/* 属性表格 */}
      <Table
        columns={columns}
        dataSource={filteredAttributes}
        rowKey="_indexId"
        pagination={false}
        size="small"
        style={{
          borderRadius: '6px',
          border: '1px solid var(--semi-color-border)',
          overflow: 'hidden',
          width: '100%',
        }}
        empty={
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <Text type="tertiary">
              {searchText ? '没有找到匹配的属性' : '暂无属性，点击"添加属性"开始'}
            </Text>
          </div>
        }
      />

      {/* 描述编辑弹窗 */}
      <Modal
        title={`编辑属性描述 - ${descriptionEditModal.attributeName}`}
        visible={descriptionEditModal.visible}
        onOk={handleDescriptionSave}
        onCancel={handleDescriptionCancel}
        okText="保存"
        cancelText="取消"
        width={500}
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>属性描述:</label>
          <TextArea
            value={descriptionEditModal.description}
            onChange={(value) =>
              setDescriptionEditModal((prev) => ({ ...prev, description: value }))
            }
            placeholder="请输入属性描述..."
            rows={4}
            maxLength={500}
            showClear
          />
        </div>
      </Modal>
    </div>
  );
};
