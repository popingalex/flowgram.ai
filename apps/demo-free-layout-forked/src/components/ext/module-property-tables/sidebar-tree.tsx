import React, { useState, useCallback, useMemo } from 'react';

import { useShallow } from 'zustand/react/shallow';
import { nanoid } from 'nanoid';
import {
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Tooltip,
  Tag,
  Modal,
  TextArea,
  Checkbox,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconArticle,
  IconSetting,
  IconLink,
} from '@douyinfe/semi-icons';

import { ModuleSelectorModal } from '../module-selector';
import { useEntityStore } from '../entity-store';
import { EntityPropertyTypeSelector } from '../entity-property-type-selector';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useModuleStore, Module } from '../../../stores/module.store';
import { useCurrentEntity, useCurrentEntityActions } from '../../../stores';

export interface ModulePropertyData {
  key: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  isAttribute?: boolean;
  parentKey?: string;
  _indexId: string;
  isSelected?: boolean;
  moduleId?: string; // 所属模块ID
  displayId?: string; // 去掉模块前缀的属性ID，用于显示
}

export interface ModuleTreeData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  children?: ModulePropertyData[];
  isAttribute?: boolean;
  _indexId: string;
  isSelected?: boolean;
}

interface ModulePropertyTreeTableProps {
  readonly?: boolean;
  showTitle?: boolean;
  title?: string;
}

// 🎯 模块ID输入组件 - 使用nanoid避免组件刷新
const ModuleIdInput = React.memo(
  ({
    moduleNanoid,
    onModuleChange,
  }: {
    moduleNanoid: string;
    onModuleChange: (moduleNanoid: string, field: string, value: any) => void;
  }) => {
    const { getEditingModule } = useModuleStore();
    const module = getEditingModule(moduleNanoid);

    return (
      <Input
        value={module?.id || ''}
        onChange={(newValue) => onModuleChange(moduleNanoid, 'id', newValue)}
        size="small"
        placeholder="模块ID"
        style={{
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '12px',
          width: '100px',
        }}
      />
    );
  }
);
ModuleIdInput.displayName = 'ModuleIdInput';

// 🎯 模块名称输入组件 - 使用nanoid避免组件刷新
const ModuleNameInput = React.memo(
  ({
    moduleNanoid,
    onModuleChange,
  }: {
    moduleNanoid: string;
    onModuleChange: (moduleNanoid: string, field: string, value: any) => void;
  }) => {
    const { getEditingModule } = useModuleStore();
    const module = getEditingModule(moduleNanoid);

    return (
      <Input
        value={module?.name || ''}
        onChange={(newValue) => onModuleChange(moduleNanoid, 'name', newValue)}
        size="small"
        placeholder="模块名称"
        style={{
          fontSize: '13px',
          width: '120px',
        }}
      />
    );
  }
);
ModuleNameInput.displayName = 'ModuleNameInput';

// 🎯 模块属性ID输入组件 - 使用nanoid避免组件刷新
const ModuleAttributeIdInput = React.memo(
  ({
    moduleNanoid,
    attributeNanoid,
    onAttributeChange,
  }: {
    moduleNanoid: string;
    attributeNanoid: string;
    onAttributeChange: (
      moduleNanoid: string,
      attributeNanoid: string,
      field: string,
      value: any
    ) => void;
  }) => {
    const { getEditingModule } = useModuleStore();
    const module = getEditingModule(moduleNanoid);
    const attribute = module?.attributes?.find((a) => a._indexId === attributeNanoid);

    return (
      <Input
        value={attribute?.displayId || attribute?.id.split('/').pop() || ''}
        onChange={(newValue) => {
          // 更新displayId和完整的id
          onAttributeChange(moduleNanoid, attributeNanoid, 'displayId', newValue);
          // 同时更新完整的id（模块ID + / + 属性ID）
          const fullId = module?.id ? `${module.id}/${newValue}` : newValue;
          onAttributeChange(moduleNanoid, attributeNanoid, 'id', fullId);
        }}
        size="small"
        placeholder="属性ID"
        style={{
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '12px',
          width: '100px',
        }}
      />
    );
  }
);
ModuleAttributeIdInput.displayName = 'ModuleAttributeIdInput';

// 🎯 模块属性名称输入组件 - 使用nanoid避免组件刷新
const ModuleAttributeNameInput = React.memo(
  ({
    moduleNanoid,
    attributeNanoid,
    onAttributeChange,
  }: {
    moduleNanoid: string;
    attributeNanoid: string;
    onAttributeChange: (
      moduleNanoid: string,
      attributeNanoid: string,
      field: string,
      value: any
    ) => void;
  }) => {
    const { getEditingModule } = useModuleStore();
    const module = getEditingModule(moduleNanoid);
    const attribute = module?.attributes?.find((a) => a._indexId === attributeNanoid);

    return (
      <Input
        value={attribute?.name || ''}
        onChange={(newValue) => onAttributeChange(moduleNanoid, attributeNanoid, 'name', newValue)}
        size="small"
        placeholder="属性名称"
        style={{
          fontSize: '13px',
          width: '120px',
        }}
      />
    );
  }
);
ModuleAttributeNameInput.displayName = 'ModuleAttributeNameInput';

// 🎯 边栏模块属性表 - 只显示已关联的模块，不支持编辑
const SidebarModulePropertyTable: React.FC<ModulePropertyTreeTableProps> = ({
  showTitle = false, // 默认不显示标题，避免重复
  title = '模块属性',
}) => {
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>();

  // Store hooks
  const { modules } = useModuleStore();
  const { editingEntity } = useCurrentEntity();

  // 🎯 只显示已关联的模块数据 - 通过nanoid匹配
  const linkedModuleTreeData = useMemo(() => {
    const entityBundles = editingEntity?.bundles || [];
    console.log('🔗 边栏模块匹配:', { entityBundles, modulesCount: modules.length });

    return modules
      .filter((module) => {
        // 优先使用nanoid匹配，其次使用ID匹配（兼容旧数据）
        const isLinked =
          entityBundles.includes(module._indexId || '') || entityBundles.includes(module.id);
        console.log('🔗 模块匹配检查:', {
          moduleId: module.id,
          moduleNanoid: module._indexId,
          isLinked,
          entityBundles,
        });
        return isLinked;
      })
      .map((module) => {
        const moduleKey = `module_${module._indexId || module.id}`;

        const children: ModulePropertyData[] = module.attributes.map((attr) => ({
          key: `${moduleKey}_${attr._indexId || attr.id}`,
          id: `${module.id}/${attr.id}`, // 保持完整的属性ID格式
          name: attr.name || attr.id,
          type: attr.type,
          description: attr.description,
          isAttribute: true,
          parentKey: moduleKey,
          _indexId: attr._indexId || nanoid(),
          isSelected: true, // 已关联的都是选中状态
          moduleId: module.id,
          displayId: attr.displayId || attr.id, // 使用displayId或原始id
        }));

        return {
          key: moduleKey,
          id: module.id,
          name: module.name,
          attributeCount: module.attributes.length,
          children,
          isAttribute: false,
          _indexId: module._indexId || nanoid(),
          isSelected: true,
        };
      });
  }, [modules, editingEntity?.bundles]);

  // 🎯 边栏表格列配置 - 不包含行选择
  const sidebarColumns = useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        width: 120,
        ellipsis: true,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
          // 对于属性行，使用displayId；对于模块行，直接显示id
          const displayId = record.isAttribute
            ? (record as ModulePropertyData).displayId || record.id
            : record.id;

          return (
            <span
              style={{
                fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                fontSize: '12px',
              }}
            >
              {displayId}
            </span>
          );
        },
      },
      {
        title: '名称',
        key: 'name',
        width: 200,
        ellipsis: true,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '13px' }}>{record.name}</span>
          </div>
        ),
      },
      {
        title: () => (
          <Button
            size="small"
            icon={<IconSetting />}
            type="primary"
            onClick={() => {
              setFocusModuleId(undefined);
              setConfigModalVisible(true);
            }}
          >
            配置模块
          </Button>
        ),
        key: 'controls',
        width: 150,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
          if (record.isAttribute) {
            // 属性行：显示类型选择器（只读）
            const propertyData = record as ModulePropertyData;
            const typedInfo = TypedParser.fromString(propertyData.type);

            // 转换为JSON Schema格式
            let value;
            if (typedInfo.dimensions.length > 0) {
              const itemType =
                typedInfo.attributes.length > 0
                  ? 'object'
                  : typedInfo.primitive === Primitive.STRING
                  ? 'string'
                  : typedInfo.primitive === Primitive.NUMBER
                  ? 'number'
                  : typedInfo.primitive === Primitive.BOOLEAN
                  ? 'boolean'
                  : 'unknown';
              value = { type: 'array', items: { type: itemType } };
            } else if (typedInfo.attributes.length > 0) {
              value = { type: 'object' };
            } else {
              const primitiveType =
                typedInfo.primitive === Primitive.STRING
                  ? 'string'
                  : typedInfo.primitive === Primitive.NUMBER
                  ? 'number'
                  : typedInfo.primitive === Primitive.BOOLEAN
                  ? 'boolean'
                  : 'unknown';
              value = { type: primitiveType };
            }

            return <EntityPropertyTypeSelector value={value} disabled />;
          } else {
            // 模块行：显示属性数量和跳转按钮
            const moduleData = record as ModuleTreeData;
            return (
              <Space>
                <Tag size="small" color="cyan">
                  {moduleData.attributeCount}个属性
                </Tag>
                <Tooltip content="查看模块详情">
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={<IconLink />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusModuleId(moduleData.id);
                      setConfigModalVisible(true);
                    }}
                  />
                </Tooltip>
              </Space>
            );
          }
        },
      },
    ],
    []
  );

  // 🎯 边栏表格数据源
  const sidebarDataSource = useMemo(
    () =>
      linkedModuleTreeData.map((module) => ({
        ...module,
        children: module.children?.map((attr) => ({
          ...attr,
          isAttribute: true,
          parentKey: module.key,
        })),
      })),
    [linkedModuleTreeData]
  );

  // 如果没有关联的模块，不显示任何内容
  if (linkedModuleTreeData.length === 0) {
    return null;
  }

  return (
    <div style={{ width: '100%' }}>
      <Table
        columns={sidebarColumns}
        dataSource={sidebarDataSource}
        rowKey="key"
        pagination={false}
        size="small"
        hideExpandedColumn={false}
        onRow={(record) => {
          if (record && !record.isAttribute) {
            return {
              style: {
                backgroundColor: 'var(--semi-color-fill-0)', // 改为中性色，不使用绿色
                fontWeight: 600,
              },
            };
          }
          return {};
        }}
        style={{
          borderRadius: '6px',
          border: '1px solid var(--semi-color-border)',
          overflow: 'hidden',
          width: '100%',
          tableLayout: 'fixed',
        }}
      />

      {/* 模块配置弹窗 - 保持原有功能 */}
      <ModuleConfigModal
        visible={configModalVisible}
        onClose={() => {
          setConfigModalVisible(false);
          setFocusModuleId(undefined); // 清除聚焦状态，但展开状态会保持
        }}
        focusModuleId={focusModuleId}
      />
    </div>
  );
};

// 🎯 模块配置弹窗 - 支持模块选择和属性编辑，使用nanoid关联
const ModuleConfigModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  focusModuleId?: string; // 需要聚焦的模块ID
}> = ({ visible, onClose, focusModuleId }) => {
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Store hooks - 使用新的编辑方法
  const {
    modules,
    startEditModule,
    updateEditingModule,
    saveModule,
    cancelEditModule,
    isModuleDirty,
    getEditingModule,
    addAttributeToEditingModule,
    updateAttributeInEditingModule,
    removeAttributeFromEditingModule,
    createModule,
    deleteModule,
    saveAllDirtyModules,
    getDirtyModuleIds,
  } = useModuleStore();
  const { editingEntity } = useCurrentEntity();
  const { updateEntity } = useCurrentEntityActions();

  // 🎯 同步选中状态 - 使用nanoid确保状态稳定
  React.useEffect(() => {
    if (visible) {
      const entityBundles = editingEntity?.bundles || [];
      console.log('🔍 同步选中状态:', { entityBundles, modulesCount: modules.length });

      // 使用nanoid作为选中状态的key，确保修改模块ID时选中状态不丢失
      const selectedNanoids = modules
        .filter((module) => {
          // 优先使用nanoid匹配，其次使用ID匹配（兼容旧数据）
          const isSelected =
            entityBundles.includes(module._indexId || '') || entityBundles.includes(module.id);
          console.log('🔍 模块匹配检查:', {
            moduleId: module.id,
            moduleNanoid: module._indexId,
            isSelected,
            entityBundles,
          });
          return isSelected;
        })
        .map((module) => module._indexId || module.id); // 优先使用nanoid

      console.log('🔍 计算出的选中模块nanoids:', selectedNanoids);
      setSelectedModules(selectedNanoids);

      // 🎯 为所有模块开始编辑会话
      modules.forEach((module) => {
        if (module.id) {
          startEditModule(module.id);
        }
      });
    }
  }, [visible, editingEntity?.bundles, modules, startEditModule]);

  // 🎯 初始化展开状态 - 根据进入方式决定展开策略
  React.useEffect(() => {
    if (visible && !isInitialized) {
      if (focusModuleId) {
        // 通过"查看模块"进入：只展开指定模块，其他收缩
        const targetModule = modules.find((m) => m.id === focusModuleId);
        if (targetModule && targetModule._indexId) {
          setExpandedRowKeys([targetModule._indexId]);
        } else {
          setExpandedRowKeys([]);
        }
      } else {
        // 通过"配置模块"进入：默认全部收缩
        setExpandedRowKeys([]);
      }
      setIsInitialized(true);
    } else if (!visible) {
      // 弹窗关闭时重置初始化状态
      setIsInitialized(false);
    }
  }, [visible, isInitialized, focusModuleId, modules]);

  // 🎯 模块字段修改处理 - 使用编辑模式
  const handleModuleChange = useCallback(
    (moduleNanoid: string, field: string, value: any) => {
      console.log('🔧 修改模块字段:', { moduleNanoid, field, value });
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        console.log('🔧 找到模块，执行更新:', { moduleId: module.id, field, value });
        updateEditingModule(module.id, { [field]: value });
      } else {
        console.error('🔧 未找到模块:', {
          moduleNanoid,
          availableModules: modules.map((m) => ({ id: m.id, _indexId: m._indexId })),
        });
      }
    },
    [modules, updateEditingModule]
  );

  // 🎯 模块属性字段修改处理 - 使用编辑模式
  const handleAttributeChange = useCallback(
    (moduleNanoid: string, attributeNanoid: string, field: string, value: any) => {
      console.log('🔧 修改模块属性字段:', { moduleNanoid, attributeNanoid, field, value });
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        console.log('🔧 更新模块属性:', { moduleId: module.id, attributeNanoid, field, value });
        updateAttributeInEditingModule(module.id, attributeNanoid, { [field]: value });
      } else {
        console.error('🔧 未找到模块:', { moduleNanoid });
      }
    },
    [modules, updateAttributeInEditingModule]
  );

  // 🎯 添加模块属性 - 使用编辑模式
  const handleAddAttribute = useCallback(
    (moduleNanoid: string) => {
      console.log('➕ 添加模块属性:', moduleNanoid);
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        const newAttribute = {
          id: `attr_${Date.now()}`,
          name: '新属性',
          type: 's',
          description: '',
        };
        console.log('➕ 执行添加属性:', { moduleId: module.id, newAttribute });
        addAttributeToEditingModule(module.id, newAttribute);
      } else {
        console.error('➕ 未找到模块:', { moduleNanoid });
      }
    },
    [modules, addAttributeToEditingModule]
  );

  // 🎯 删除模块属性 - 使用编辑模式
  const handleRemoveAttribute = useCallback(
    (moduleNanoid: string, attributeNanoid: string) => {
      console.log('🗑️ 删除模块属性开始:', { moduleNanoid, attributeNanoid });
      const module = modules.find((m) => m._indexId === moduleNanoid);

      if (module) {
        console.log('🗑️ 找到模块，删除属性:', { moduleId: module.id, attributeNanoid });
        removeAttributeFromEditingModule(module.id, attributeNanoid);
        console.log('🗑️ 删除命令已发送');
      } else {
        console.log('🗑️ 未找到模块:', {
          moduleNanoid,
          modules: modules.length,
          moduleIds: modules.map((m) => ({ id: m.id, _indexId: m._indexId })),
        });
      }
    },
    [modules, removeAttributeFromEditingModule]
  );

  // 🎯 添加模块处理
  const handleAddModule = useCallback(async () => {
    const newModule = {
      id: `module-${Date.now()}`,
      name: '新模块',
      description: '请编辑描述',
      attributes: [],
    };
    console.log('➕ 添加新模块:', newModule);
    try {
      await createModule(newModule);
    } catch (error) {
      console.error('➕ 创建模块失败:', error);
    }
  }, [createModule]);

  // 🎯 删除模块处理 - 使用nanoid查找模块
  const handleDeleteModule = useCallback(
    async (moduleNanoid: string) => {
      console.log('🗑️ 删除模块开始:', { moduleNanoid });
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        console.log('🗑️ 找到模块，执行删除:', { moduleId: module.id });
        try {
          await deleteModule(module.id);
          // 从选中列表中移除（使用nanoid）
          setSelectedModules((prev) => prev.filter((id) => id !== moduleNanoid));
          console.log('🗑️ 模块删除完成');
        } catch (error) {
          console.error('🗑️ 删除模块失败:', error);
        }
      } else {
        console.error('🗑️ 未找到要删除的模块:', {
          moduleNanoid,
          availableModules: modules.map((m) => ({ id: m.id, _indexId: m._indexId })),
        });
      }
    },
    [modules, deleteModule]
  );

  // 🎯 构建模块表格数据，包含选择状态，使用nanoid作为key
  const modalTableData = useMemo(
    () =>
      modules.map((module) => {
        const moduleNanoid = module._indexId || `module_${module.id}`;
        const isSelected = selectedModules.includes(moduleNanoid);
        const moduleKey = moduleNanoid;
        const isDirty = isModuleDirty(module.id);

        const children: ModulePropertyData[] = module.attributes.map((attr) => {
          // 确保每个属性都有nanoid，避免重新生成
          const attrNanoid = attr._indexId || nanoid();
          return {
            key: attrNanoid, // 直接使用nanoid作为key
            id: `${module.id}/${attr.id}`, // 保持完整的属性ID格式
            name: attr.name || attr.id,
            type: attr.type,
            description: attr.description,
            isAttribute: true,
            parentKey: moduleKey,
            _indexId: attrNanoid,
            isSelected,
            moduleId: module.id,
            displayId: attr.displayId || attr.id, // 使用displayId或原始id
          };
        });

        return {
          key: moduleKey, // 使用nanoid避免组件刷新
          id: module.id,
          name: module.name,
          attributeCount: module.attributes.length,
          children,
          isAttribute: false,
          _indexId: moduleKey, // 保持一致
          isSelected,
        };
      }),
    [modules, selectedModules]
  );

  // 🎯 完全自定义渲染的列配置
  const modalColumns = useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        width: 120,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
          if (record.isAttribute) {
            // 属性行：可编辑的属性ID输入框
            const propertyData = record as ModulePropertyData;
            const module = modules.find((m) => m.id === propertyData.moduleId);

            return (
              <ModuleAttributeIdInput
                moduleNanoid={module?._indexId || ''}
                attributeNanoid={propertyData._indexId}
                onAttributeChange={handleAttributeChange}
              />
            );
          } else {
            // 模块行：可编辑的模块ID输入框
            return (
              <ModuleIdInput moduleNanoid={record._indexId} onModuleChange={handleModuleChange} />
            );
          }
        },
      },
      {
        title: '名称',
        key: 'name',
        width: 200,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
          if (record.isAttribute) {
            // 属性行：可编辑的属性名称输入框
            const propertyData = record as ModulePropertyData;
            const module = modules.find((m) => m.id === propertyData.moduleId);

            return (
              <ModuleAttributeNameInput
                moduleNanoid={module?._indexId || ''}
                attributeNanoid={propertyData._indexId}
                onAttributeChange={handleAttributeChange}
              />
            );
          } else {
            // 模块行：可编辑的模块名称输入框
            return (
              <ModuleNameInput moduleNanoid={record._indexId} onModuleChange={handleModuleChange} />
            );
          }
        },
      },
      {
        title: () => (
          <Button type="primary" icon={<IconPlus />} onClick={handleAddModule}>
            添加模块
          </Button>
        ),
        key: 'controls',
        width: 200,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
          if (record.isAttribute) {
            // 属性行：类型选择器 + 删除按钮
            const propertyData = record as ModulePropertyData;
            const typedInfo = TypedParser.fromString(propertyData.type);
            const module = modules.find((m) => m.id === propertyData.moduleId);

            // 转换为JSON Schema格式
            let value;
            if (typedInfo.dimensions.length > 0) {
              const itemType =
                typedInfo.attributes.length > 0
                  ? 'object'
                  : typedInfo.primitive === Primitive.STRING
                  ? 'string'
                  : typedInfo.primitive === Primitive.NUMBER
                  ? 'number'
                  : typedInfo.primitive === Primitive.BOOLEAN
                  ? 'boolean'
                  : 'unknown';
              value = { type: 'array', items: { type: itemType } };
            } else if (typedInfo.attributes.length > 0) {
              value = { type: 'object' };
            } else {
              const primitiveType =
                typedInfo.primitive === Primitive.STRING
                  ? 'string'
                  : typedInfo.primitive === Primitive.NUMBER
                  ? 'number'
                  : typedInfo.primitive === Primitive.BOOLEAN
                  ? 'boolean'
                  : 'unknown';
              value = { type: primitiveType };
            }

            return (
              <Space>
                <EntityPropertyTypeSelector
                  value={value}
                  onChange={(typeInfo) => {
                    console.log('修改模块属性类型:', { record, typeInfo });
                    if (module) {
                      handleAttributeChange(
                        module._indexId!,
                        propertyData._indexId,
                        'type',
                        typeInfo.type
                      );
                    }
                  }}
                />
                <Popconfirm
                  title="确定删除此属性吗？"
                  content="删除后无法恢复"
                  onConfirm={() => {
                    if (module) {
                      handleRemoveAttribute(module._indexId!, propertyData._indexId);
                    }
                  }}
                >
                  <Tooltip content="删除属性">
                    <Button type="danger" icon={<IconDelete />} size="small" />
                  </Tooltip>
                </Popconfirm>
              </Space>
            );
          } else {
            // 模块行：属性数量标签 + 添加属性按钮 + 删除模块按钮
            const moduleData = record as ModuleTreeData;
            return (
              <Space>
                <Tag size="small" color="blue">
                  {moduleData.attributeCount}个属性
                </Tag>
                <Tooltip content="添加属性">
                  <Button
                    size="small"
                    icon={<IconPlus />}
                    type="primary"
                    onClick={() => handleAddAttribute(moduleData._indexId)}
                  />
                </Tooltip>
                <Popconfirm
                  title="确定删除此模块吗？"
                  content="删除后无法恢复"
                  onConfirm={() => handleDeleteModule(moduleData._indexId)}
                >
                  <Tooltip content="删除模块">
                    <Button type="danger" icon={<IconDelete />} size="small" />
                  </Tooltip>
                </Popconfirm>
              </Space>
            );
          }
        },
      },
    ],
    [
      modules,
      handleModuleChange,
      handleAttributeChange,
      handleAddAttribute,
      handleRemoveAttribute,
      handleDeleteModule,
      handleAddModule,
    ]
  );

  // 🎯 行选择配置
  const rowSelection = useMemo(
    () => ({
      selectedRowKeys: selectedModules,
      onChange: (selectedRowKeys: (string | number)[] | undefined) => {
        const keys = selectedRowKeys ? selectedRowKeys.map((key) => String(key)) : [];
        setSelectedModules(keys);
      },
      getCheckboxProps: (record: ModuleTreeData | ModulePropertyData) => ({
        disabled: record.isAttribute, // 只有模块行可以选择，属性行不可选择
      }),
    }),
    [selectedModules]
  );

  // 🎯 保存配置 - 保存所有dirty模块，然后更新实体关联
  const handleSave = async () => {
    try {
      // 1. 保存所有有更改的模块
      await saveAllDirtyModules();

      // 2. 更新实体的模块关联（使用nanoid）
      console.log('💾 保存模块配置:', { selectedModules });
      updateEntity({ bundles: selectedModules });

      onClose();
    } catch (error) {
      console.error('💾 保存失败:', error);
    }
  };

  // 🎯 取消配置 - 丢弃所有更改
  const handleCancel = () => {
    const dirtyModuleIds = getDirtyModuleIds();
    if (dirtyModuleIds.length > 0) {
      // 有未保存的更改，需要确认
      Modal.confirm({
        title: '确定取消吗？',
        content: `有 ${dirtyModuleIds.length} 个模块有未保存的更改，取消将丢失这些更改。`,
        onOk: () => {
          // 丢弃所有更改
          dirtyModuleIds.forEach((moduleId) => {
            cancelEditModule(moduleId);
          });
          onClose();
        },
      });
    } else {
      onClose();
    }
  };

  // 🎯 检查是否有未保存的更改
  const hasDirtyChanges = getDirtyModuleIds().length > 0;

  // 🎯 表格数据源
  const modalDataSource = useMemo(
    () =>
      modalTableData.map((module) => ({
        ...module,
        children: module.children?.map((attr) => ({
          ...attr,
          isAttribute: true,
          parentKey: module.key,
        })),
      })),
    [modalTableData]
  );

  return (
    <Modal
      title="配置模块"
      visible={visible}
      onCancel={handleCancel}
      width={800}
      height={600}
      bodyStyle={{ height: 'calc(600px - 108px)', padding: '16px' }}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button
            type="primary"
            onClick={handleSave}
            disabled={!hasDirtyChanges && selectedModules.length === 0}
          >
            保存{hasDirtyChanges ? ` (${getDirtyModuleIds().length}个更改)` : ''}
          </Button>
        </Space>
      }
    >
      <Table
        dataSource={modalDataSource}
        columns={modalColumns}
        rowSelection={rowSelection}
        scroll={{ y: 400 }}
        pagination={false}
        size="small"
        rowKey="key"
      />
    </Modal>
  );
};

// 兼容原有接口的包装组件
export const ModulePropertyTreeTable: React.FC<ModulePropertyTreeTableProps> = (props) => (
  <SidebarModulePropertyTable {...props} />
);
