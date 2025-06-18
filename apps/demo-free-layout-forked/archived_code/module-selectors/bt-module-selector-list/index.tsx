import React, { useState, useMemo, useRef, useEffect } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
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
  IconChevronRight,
  IconChevronDown,
} from '@douyinfe/semi-icons';

// import { EntityPropertiesEditor } from '../entity-properties-editor';
import { useModuleStore, Module, ModuleAttribute } from '../../../stores/module.store';
import { EditableModuleTreeTable } from './EditableModuleTreeTable';

const { Text } = Typography;

interface ModuleSelectorModalProps {
  visible: boolean;
  selectedModuleIds: string[];
  onConfirm: (selectedModuleIds: string[]) => void;
  onCancel: () => void;
  focusModuleId?: string;
}

interface ModuleItemProps {
  module: Module;
  isSelected: boolean;
  onToggle: (moduleId: string) => void;
  onDelete: (moduleId: string, e: React.MouseEvent) => void;
  onChange: (moduleId: string, updatedModule: Module) => void;
  forwardRef?: React.RefObject<HTMLDivElement>;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  isSelected,
  onToggle,
  onDelete,
  onChange,
  forwardRef,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingModule, setEditingModule] = useState<Module>(module);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setEditingModule(module);
    setHasChanges(false);
  }, [module]);

  const handleToggle = () => {
    onToggle(module.id);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleSave = () => {
    onChange(module.id, editingModule);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleCancel = () => {
    setEditingModule(module);
    setIsEditing(false);
    setHasChanges(false);
  };

  const handleFieldChange = (field: keyof Module, value: any) => {
    setEditingModule((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={forwardRef}
      style={{
        marginBottom: '8px',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '6px',
        backgroundColor: isSelected
          ? 'var(--semi-color-primary-light-default)'
          : 'var(--semi-color-bg-2)',
        transition: 'all 0.2s',
      }}
    >
      {/* 模块标题行 */}
      <div
        style={{
          padding: '12px 16px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
        onClick={handleToggle}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <Checkbox checked={isSelected} onChange={handleToggle} />

          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
              <Input
                value={editingModule.name}
                onChange={(value) => handleFieldChange('name', value)}
                placeholder="模块名称"
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
              <Input
                value={editingModule.description || ''}
                onChange={(value) => handleFieldChange('description', value)}
                placeholder="模块描述"
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ) : (
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text strong>{module.name}</Text>
                {/* 移除模块标签，简化显示 */}
                <Text
                  type="tertiary"
                  style={{
                    fontSize: '12px',
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  }}
                >
                  {module.id}
                </Text>
              </div>
              {module.description && (
                <Text type="secondary" size="small">
                  {module.description}
                </Text>
              )}
            </div>
          )}

          <Space>
            <Text type="tertiary" size="small">
              {module.attributes.length} 个属性
            </Text>
            <IconButton
              size="small"
              type="tertiary"
              theme="borderless"
              icon={isExpanded ? <IconChevronDown /> : <IconChevronRight />}
              onClick={handleExpandToggle}
            />
          </Space>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {isEditing ? (
            <>
              {hasChanges && (
                <>
                  <Tooltip content="保存修改">
                    <IconButton
                      size="small"
                      type="primary"
                      icon={<IconSave />}
                      onClick={handleSave}
                    />
                  </Tooltip>
                  <Tooltip content="撤销修改">
                    <IconButton
                      size="small"
                      type="tertiary"
                      icon={<IconClose />}
                      onClick={handleCancel}
                    />
                  </Tooltip>
                </>
              )}
            </>
          ) : (
            <>
              <Tooltip content="编辑模块">
                <IconButton
                  size="small"
                  type="tertiary"
                  theme="borderless"
                  icon={<IconEdit />}
                  onClick={handleEdit}
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

      {/* 属性部分 - 可折叠 */}
      {isExpanded && (
        <div
          style={{
            borderTop: '1px solid var(--semi-color-border)',
            padding: '12px 16px',
            backgroundColor: 'var(--semi-color-bg-1)',
          }}
        >
          <Text strong size="small" style={{ marginBottom: '8px', display: 'block' }}>
            模块属性 ({module.attributes.length})
          </Text>
          {module.attributes.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {module.attributes.map((attr, index) => (
                <div
                  key={attr.id || index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '4px 8px',
                    backgroundColor: 'var(--semi-color-bg-0)',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <span>
                    <Text strong>{attr.name || attr.id}</Text>
                    <Text type="tertiary" style={{ marginLeft: '8px' }}>
                      {attr.id}
                    </Text>
                  </span>
                  <Tag size="small" color="cyan">
                    {attr.type}
                  </Tag>
                </div>
              ))}
            </div>
          ) : (
            <Text type="tertiary" size="small">
              暂无属性
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export const ModuleSelectorModal: React.FC<ModuleSelectorModalProps> = ({
  visible,
  selectedModuleIds,
  onConfirm,
  onCancel,
  focusModuleId,
}) => {
  const { modules, loading, updateModule, deleteModule, addModule } = useModuleStore();
  const [searchText, setSearchText] = useState('');
  const [tempSelectedIds, setTempSelectedIds] = useState<string[]>(selectedModuleIds);

  // 模块项的引用
  const moduleItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (visible) {
      console.log('🔍 ModuleSelectorModal: 初始化选中状态:', { selectedModuleIds });
      setTempSelectedIds(selectedModuleIds);
    }
  }, [visible, selectedModuleIds]);

  const filteredModules = useMemo(
    () =>
      modules.filter((module) => {
        const searchTermLower = searchText.toLowerCase();
        const nameMatch = module.name.toLowerCase().includes(searchTermLower);
        const idMatch = module.id.toLowerCase().includes(searchTermLower);
        const descriptionMatch =
          module.description?.toLowerCase().includes(searchTermLower) || false;
        return nameMatch || idMatch || descriptionMatch;
      }),
    [modules, searchText]
  );

  useEffect(() => {
    if (visible && focusModuleId && moduleItemRefs.current[focusModuleId]) {
      setTimeout(() => {
        moduleItemRefs.current[focusModuleId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 100); // Small delay to ensure modal is rendered and list is filtered
    }
  }, [visible, focusModuleId, filteredModules]);

  // 🎯 使用nanoid进行模块选择切换
  const handleModuleToggle = (moduleId: string) => {
    // 找到模块的nanoid
    const module = modules.find((m) => m.id === moduleId);
    const moduleNanoid = module?._indexId || moduleId;

    console.log('🔄 ModuleSelectorModal: 切换模块选择:', {
      moduleId,
      moduleNanoid,
      currentSelected: tempSelectedIds,
    });

    setTempSelectedIds((prev) =>
      prev.includes(moduleNanoid)
        ? prev.filter((id) => id !== moduleNanoid)
        : [...prev, moduleNanoid]
    );
  };

  // 🎯 删除模块时也要从选中列表移除nanoid
  const handleDeleteModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const module = modules.find((m) => m.id === moduleId);
    const moduleNanoid = module?._indexId || moduleId;

    console.log('🗑️ ModuleSelectorModal: 删除模块:', { moduleId, moduleNanoid });

    deleteModule(moduleId);
    setTempSelectedIds((prev) => prev.filter((id) => id !== moduleNanoid));
  };

  const handleModuleChange = (moduleId: string, updatedModule: Module) => {
    updateModule(moduleId, updatedModule);
  };

  const handleCreateNew = () => {
    const newModule: Omit<Module, 'deprecated'> = {
      id: `module-${Date.now()}`,
      name: '新模块',
      description: '请编辑描述',
      attributes: [],
    };

    addModule(newModule);
  };

  const handleConfirm = () => {
    console.log('✅ ModuleSelectorModal: 确认选择:', { tempSelectedIds });
    onConfirm(tempSelectedIds);
  };

  const handleCancel = () => {
    setSearchText('');
    setTempSelectedIds(selectedModuleIds);
    onCancel();
  };

  return (
    <Modal
      title="模块配置"
      visible={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      width={800}
      height={600}
      bodyStyle={{ overflow: 'auto' }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            prefix={<IconSearch />}
            placeholder="搜索模块..."
            value={searchText}
            onChange={setSearchText}
            style={{ width: '300px' }}
          />
          <Button type="primary" icon={<IconPlus />} onClick={handleCreateNew}>
            新建模块
          </Button>
        </Space>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Text type="secondary">已选择 {tempSelectedIds.length} 个模块</Text>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Text>加载中...</Text>
        </div>
      ) : filteredModules.length === 0 ? (
        <Empty
          title="没有找到模块"
          description="尝试调整搜索条件或创建新模块"
          style={{ padding: '40px' }}
        />
      ) : (
        <div style={{ maxHeight: '400px', overflow: 'auto' }}>
          {filteredModules.map((module) => {
            // 🎯 使用nanoid判断选中状态
            const moduleNanoid = module._indexId || module.id;
            const isSelected = tempSelectedIds.includes(moduleNanoid);

            return (
              <ModuleItem
                key={module.id}
                module={module}
                isSelected={isSelected}
                onToggle={handleModuleToggle}
                onDelete={handleDeleteModule}
                onChange={handleModuleChange}
                forwardRef={
                  focusModuleId === module.id
                    ? { current: moduleItemRefs.current[module.id] }
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </Modal>
  );
};
