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

import { EntityPropertiesEditor } from '../entity-properties-editor';
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
  onModuleChange: (moduleId: string, updatedModule: Module) => void;
  onDelete: (moduleId: string, e: React.MouseEvent) => void;
  itemRef: (el: HTMLDivElement | null) => void;
}

const ModuleItem: React.FC<ModuleItemProps> = ({
  module,
  isSelected,
  onToggle,
  onModuleChange,
  onDelete,
  itemRef,
}) => {
  const [attributesCollapsed, setAttributesCollapsed] = useState(true); // 默认收起
  const [hasChanges, setHasChanges] = useState(false); // 跟踪是否有修改
  const [originalModule, setOriginalModule] = useState<Module>(module); // 保存原始数据

  // 当模块数据变化时，检查是否有修改
  React.useEffect(() => {
    const hasModuleChanges = JSON.stringify(module) !== JSON.stringify(originalModule);
    setHasChanges(hasModuleChanges);
  }, [module, originalModule]);

  // 保存修改
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOriginalModule(module); // 更新原始数据
    setHasChanges(false);
    // 这里可以添加实际的保存逻辑，比如调用API
  };

  // 撤销修改
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    onModuleChange(module.id, originalModule); // 恢复到原始数据
    setHasChanges(false);
  };

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

  const handleModuleChange = (updatedSchema: IJsonSchema) => {
    if (!updatedSchema.properties) return;

    // 将JSONSchema转换回Module格式
    const properties = updatedSchema.properties;
    const newAttributes: ModuleAttribute[] = Object.entries(properties).map(([id, property]) => {
      const prop = property as IJsonSchema;
      return {
        id,
        name: prop.title || id,
        type: prop.type === 'number' ? 'n' : prop.type === 'array' ? 's[]' : 's',
        description: prop.description,
      };
    });

    const updatedModule: Module = {
      ...module,
      attributes: newAttributes,
    };

    onModuleChange(module.id, updatedModule);
  };

  const jsonSchemaValue = moduleToJsonSchema(module);

  return (
    <div
      ref={itemRef}
      style={{
        marginBottom: '8px',
      }}
    >
      <List.Item
        style={{
          padding: '16px',
          border: isSelected
            ? '2px solid var(--semi-color-primary)'
            : '1px solid var(--semi-color-border)',
          borderRadius: '6px',
          cursor: 'pointer',
          backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : 'white',
        }}
        onClick={() => onToggle(module.id)}
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
                    style={{
                      fontSize: '12px',
                      color: 'var(--semi-color-text-2)',
                      minWidth: '30px',
                    }}
                  >
                    名称:
                  </span>
                  <Input
                    size="small"
                    value={module.name}
                    onChange={(value) => {
                      onModuleChange(module.id, { ...module, name: value });
                    }}
                    style={{
                      width: '120px',
                      backgroundColor: 'var(--semi-color-fill-1)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--semi-color-text-2)',
                      minWidth: '20px',
                    }}
                  >
                    ID:
                  </span>
                  <Input
                    size="small"
                    value={module.id}
                    onChange={(value) => {
                      onModuleChange(module.id, { ...module, id: value });
                    }}
                    style={{
                      width: '120px',
                      backgroundColor: 'var(--semi-color-fill-1)',
                    }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
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
              </div>
            </div>

            {/* 属性部分 - 可折叠 */}
            <div style={{ marginTop: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  padding: '4px 0',
                  borderTop: '1px solid var(--semi-color-border)',
                  paddingTop: '8px',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setAttributesCollapsed(!attributesCollapsed);
                }}
              >
                {attributesCollapsed ? (
                  <IconChevronRight size="small" />
                ) : (
                  <IconChevronDown size="small" />
                )}
                <Text style={{ fontSize: '12px', color: 'var(--semi-color-text-1)' }}>
                  属性 ({module.attributes.length})
                </Text>
              </div>

              {/* 属性编辑器 - 可折叠 */}
              {!attributesCollapsed && (
                <div style={{ marginTop: '8px' }}>
                  <EntityPropertiesEditor
                    value={jsonSchemaValue}
                    onChange={handleModuleChange}
                    config={{
                      placeholder: '输入模块属性名',
                      addButtonText: '添加属性',
                    }}
                    hideModuleButton={true}
                    hideModuleGrouping={true}
                    disabled={false}
                    compact={true}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </List.Item>
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

  const handleModuleToggle = (moduleId: string) => {
    setTempSelectedIds((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const handleDeleteModule = (moduleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteModule(moduleId);
    setTempSelectedIds((prev) => prev.filter((id) => id !== moduleId));
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
      <EditableModuleTreeTable />
    </Modal>
  );
};
