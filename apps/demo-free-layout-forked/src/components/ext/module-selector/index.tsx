import React, { useState, useMemo, useRef } from 'react';

import {
  Modal,
  Input,
  Button,
  Space,
  Typography,
  Empty,
  List,
  Checkbox,
  Tag,
  Tooltip,
  IconButton,
  Popconfirm,
  Form,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconDelete,
  IconSave,
  IconClose,
} from '@douyinfe/semi-icons';

import { useModuleStore, Module } from '../entity-property-type-selector/module-store';
import { EntityPropertiesEditor } from '../entity-properties-editor';

const { Text } = Typography;

interface ModuleSelectorModalProps {
  visible: boolean;
  selectedModuleIds: string[];
  onConfirm: (selectedModuleIds: string[]) => void;
  onCancel: () => void;
}

interface ModuleItemProps {
  module: Module;
  isSelected: boolean;
  isEditing: boolean;
  onToggle: (moduleId: string) => void;
  onEdit: (moduleId: string, e: React.MouseEvent) => void;
  onSave: (moduleId: string, e: React.MouseEvent) => void;
  onCancelEdit: (moduleId: string, e: React.MouseEvent) => void;
  onDelete: (moduleId: string, e: React.MouseEvent) => void;
  onModuleChange: (moduleId: string, updatedModule: Module) => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  isSelected,
  isEditing,
  onToggle,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onModuleChange,
}) => {
  // 将模块转换为JSONSchema格式
  const moduleToJsonSchema = (module: Module) => {
    const properties: Record<string, any> = {};

    module.attributes.forEach((attr) => {
      // 使用属性的原始ID，但如果包含模块前缀则去掉
      const parts = attr.id.split('/');
      const propertyKey = parts[parts.length - 1]; // 取最后一部分

      properties[propertyKey] = {
        type:
          attr.type === 'n'
            ? 'number'
            : attr.type === 's'
            ? 'string'
            : attr.type?.includes('[')
            ? 'array'
            : 'string',
        title: propertyKey, // 直接使用处理后的propertyKey作为显示名称
        description: attr.description,
      };
    });

    return {
      type: 'object',
      properties,
    };
  };

  const handleModuleChange = (updatedSchema: any) => {
    // 将JSONSchema格式转换回模块属性格式并更新
    const properties = updatedSchema.properties || {};

    // 直接保持原有属性，只更新内容，不重构ID
    const attributes = module.attributes.map((originalAttr) => {
      // 处理被污染的ID，取最后一部分作为属性名
      const parts = originalAttr.id.split('/');
      const propertyKey = parts[parts.length - 1]; // 取最后一部分
      const propertyData = properties[propertyKey];

      if (propertyData) {
        // 更新现有属性的内容，保持原有ID
        return {
          ...originalAttr,
          name: propertyData.title || propertyKey,
          type:
            propertyData.type === 'number'
              ? 'n'
              : propertyData.type === 'string'
              ? 's'
              : propertyData.type === 'array'
              ? '[s]'
              : 's',
          description: propertyData.description,
        };
      }
      return originalAttr; // 保持未修改的属性
    });

    // 添加新属性（如果有的话）
    const existingKeys = module.attributes.map((attr) => {
      const parts = attr.id.split('/');
      return parts[parts.length - 1]; // 取最后一部分
    });

    Object.keys(properties).forEach((key) => {
      if (!existingKeys.includes(key)) {
        // 新属性直接使用key作为ID，不添加任何前缀
        attributes.push({
          id: key,
          name: properties[key].title || key,
          type:
            properties[key].type === 'number'
              ? 'n'
              : properties[key].type === 'string'
              ? 's'
              : properties[key].type === 'array'
              ? '[s]'
              : 's',
          description: properties[key].description,
        });
      }
    });

    // 更新模块数据
    const updatedModule: Module = {
      ...module,
      attributes,
    };

    onModuleChange(module.id, updatedModule);
  };

  const jsonSchemaValue = moduleToJsonSchema(module);

  return (
    <List.Item
      style={{
        padding: '16px',
        border: isSelected
          ? '2px solid var(--semi-color-primary)'
          : isEditing
          ? '2px solid var(--semi-color-primary)'
          : '1px solid var(--semi-color-border)',
        borderRadius: '6px',
        marginBottom: '8px',
        cursor: isEditing ? 'default' : 'pointer',
        backgroundColor: isSelected
          ? 'var(--semi-color-primary-light-default)'
          : isEditing
          ? 'var(--semi-color-primary-light-default)'
          : 'white',
      }}
      onClick={isEditing ? undefined : () => onToggle(module.id)}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
        <Checkbox
          checked={isSelected}
          style={{ marginRight: '12px', marginTop: '2px' }}
          onChange={(e) => {
            e.stopPropagation(); // 阻止事件冒泡
            onToggle(module.id);
          }}
        />
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{ fontSize: '12px', color: 'var(--semi-color-text-2)', minWidth: '30px' }}
                >
                  名称:
                </span>
                <Input
                  size="small"
                  value={module.name}
                  disabled={!isEditing}
                  onChange={(value) => {
                    if (isEditing) {
                      onModuleChange(module.id, { ...module, name: value });
                    }
                  }}
                  style={{
                    width: '120px',
                    backgroundColor: !isEditing ? 'var(--semi-color-fill-1)' : undefined,
                  }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{ fontSize: '12px', color: 'var(--semi-color-text-2)', minWidth: '20px' }}
                >
                  ID:
                </span>
                <Input
                  size="small"
                  value={module.id}
                  disabled={!isEditing}
                  onChange={(value) => {
                    if (isEditing) {
                      onModuleChange(module.id, { ...module, id: value });
                    }
                  }}
                  style={{
                    width: '120px',
                    backgroundColor: !isEditing ? 'var(--semi-color-fill-1)' : undefined,
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {isEditing ? (
                <>
                  <IconButton
                    size="small"
                    type="primary"
                    icon={<IconSave />}
                    onClick={(e) => onSave(module.id, e)}
                  />
                  <IconButton
                    size="small"
                    type="tertiary"
                    icon={<IconClose />}
                    onClick={(e) => onCancelEdit(module.id, e)}
                  />
                </>
              ) : (
                <>
                  <Tooltip content="编辑模块">
                    <IconButton
                      size="small"
                      type="tertiary"
                      theme="borderless"
                      icon={<IconEdit />}
                      onClick={(e) => onEdit(module.id, e)}
                    />
                  </Tooltip>
                  <Popconfirm
                    title="确定删除此模块吗？"
                    content="删除后无法恢复"
                    onConfirm={(e) => onDelete(module.id, e!)}
                  >
                    <IconButton
                      size="small"
                      type="danger"
                      theme="borderless"
                      icon={<IconDelete />}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Popconfirm>
                </>
              )}
            </div>
          </div>

          {/* 始终显示EntityPropertiesEditor */}
          <EntityPropertiesEditor
            value={jsonSchemaValue}
            onChange={handleModuleChange}
            config={{
              placeholder: '输入模块属性名',
              addButtonText: '添加属性',
            }}
            hideModuleButton={true}
            hideModuleGrouping={true}
            disabled={!isEditing}
          />
        </div>
      </div>
    </List.Item>
  );
};

export const ModuleSelectorModal: React.FC<ModuleSelectorModalProps> = ({
  visible,
  selectedModuleIds,
  onConfirm,
  onCancel,
}) => {
  const { modules, loading, updateModule, deleteModule, addModule } = useModuleStore();
  const [searchText, setSearchText] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedModuleIds);
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedModuleIds);
    }
  }, [visible, selectedModuleIds]);

  // 过滤模块
  const filteredModules = useMemo(() => {
    if (!searchText) return modules;
    return modules.filter(
      (module) =>
        module.name.toLowerCase().includes(searchText.toLowerCase()) ||
        module.description?.toLowerCase().includes(searchText.toLowerCase()) ||
        module.id.toLowerCase().includes(searchText.toLowerCase()) ||
        module.attributes.some((attr) =>
          attr.name?.toLowerCase().includes(searchText.toLowerCase())
        )
    );
  }, [searchText, modules]);

  const handleModuleToggle = (moduleId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleEditModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModuleId(moduleId);
  };

  const handleSaveModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModuleId(null);
  };

  const handleCancelEdit = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingModuleId(null);
  };

  const handleDeleteModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteModule(moduleId);
    setTempSelectedIds((prev) => prev.filter((id) => id !== moduleId));
  };

  const handleModuleChange = (moduleId: string, updatedModule: Module) => {
    updateModule(updatedModule);
  };

  const handleCreateNew = () => {
    const newModule: Module = {
      id: `module-${Date.now()}`,
      name: '新模块',
      description: '请编辑描述',
      attributes: [],
    };

    addModule(newModule);
    setEditingModuleId(newModule.id);
  };

  const handleConfirm = () => {
    onConfirm(tempSelectedIds);
  };

  const handleCancel = () => {
    setSearchText('');
    setTempSelectedIds(selectedModuleIds);
    setEditingModuleId(null);
    onCancel();
  };

  return (
    <Modal
      title="选择并配置模块"
      visible={visible}
      onCancel={handleCancel}
      width={700}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleConfirm}>
            确定
          </Button>
        </Space>
      }
    >
      {/* 搜索栏和新建按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            prefix={<IconSearch />}
            placeholder="搜索模块..."
            value={searchText}
            onChange={setSearchText}
            style={{ width: 350 }}
          />
          <Button type="primary" icon={<IconPlus />} onClick={handleCreateNew}>
            新建模块
          </Button>
        </Space>
      </div>

      {/* 当前选择提示 */}
      {tempSelectedIds.length > 0 && (
        <div
          style={{
            padding: '4px 12px',
            marginBottom: 16,
            backgroundColor: 'var(--semi-color-primary-light-default)',
            borderRadius: 6,
            border: '1px solid var(--semi-color-primary-light-hover)',
          }}
        >
          <Text type="secondary">
            已选择 {tempSelectedIds.length} 个模块:{' '}
            {tempSelectedIds.map((id) => (
              <Tag key={id} color="blue" style={{ marginRight: '4px' }}>
                {modules.find((m) => m.id === id)?.name || id}
              </Tag>
            ))}
          </Text>
        </div>
      )}

      {/* 模块列表 */}
      <div style={{ height: '400px', overflow: 'auto', padding: '0 8px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>加载中...</div>
        ) : filteredModules.length === 0 ? (
          <Empty title="暂无匹配的模块" description="尝试调整搜索条件" style={{ marginTop: 100 }} />
        ) : (
          <List
            dataSource={filteredModules}
            split={false}
            renderItem={(module) => (
              <ModuleItem
                key={module.id}
                module={module}
                isSelected={tempSelectedIds.includes(module.id)}
                isEditing={editingModuleId === module.id}
                onToggle={handleModuleToggle}
                onEdit={handleEditModule}
                onSave={handleSaveModule}
                onCancelEdit={handleCancelEdit}
                onDelete={handleDeleteModule}
                onModuleChange={handleModuleChange}
              />
            )}
          />
        )}
      </div>
    </Modal>
  );
};
