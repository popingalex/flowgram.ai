import React, { useState, useMemo, useRef } from 'react';

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

import {
  useModuleStore,
  Module,
  ModuleAttribute,
} from '../entity-property-type-selector/module-store';
import { EntityPropertiesEditor } from '../entity-properties-editor';

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
  itemRef?: (el: HTMLDivElement | null) => void;
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

  React.useEffect(() => {
    if (visible) {
      setTempSelectedIds(selectedModuleIds);
    }
  }, [visible, selectedModuleIds]);

  // 当focusModuleId变化时，滚动到对应的模块
  React.useEffect(() => {
    if (visible && focusModuleId && moduleItemRefs.current[focusModuleId]) {
      // 延迟执行滚动，确保DOM已渲染
      setTimeout(() => {
        const targetElement = moduleItemRefs.current[focusModuleId];
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });

          // 高亮效果
          targetElement.style.transition = 'box-shadow 0.3s ease-in-out';
          targetElement.style.boxShadow = '0 0 10px var(--semi-color-primary)';

          // 3秒后移除高亮
          setTimeout(() => {
            targetElement.style.boxShadow = '';
          }, 3000);
        }
      }, 100);
    }
  }, [visible, focusModuleId]);

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
      <div style={{ height: '480px', overflow: 'auto', padding: '0 8px' }}>
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
                onToggle={handleModuleToggle}
                onModuleChange={handleModuleChange}
                onDelete={handleDeleteModule}
                itemRef={(el) => {
                  moduleItemRefs.current[module.id] = el;
                }}
              />
            )}
          />
        )}
      </div>
    </Modal>
  );
};
