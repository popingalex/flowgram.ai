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
  IconSave,
  IconUndo,
} from '@douyinfe/semi-icons';

import { ModuleSelectorModal } from '../module-selector-bt';
import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useModuleStore } from '../../../stores/module.store';
import { useEntityList } from '../../../stores';
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
    const { modules, getEditingModule } = useModuleStore();
    const baseModule = modules.find((m) => m._indexId === moduleNanoid);
    const module = baseModule ? getEditingModule(baseModule.id) || baseModule : undefined;

    return (
      <Input
        value={module?.id || ''}
        onChange={(newValue) => onModuleChange(moduleNanoid, 'id', newValue)}
        size="small"
        placeholder="模块ID"
        style={{
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '12px',
          width: '130px',
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
    const { modules, getEditingModule } = useModuleStore();
    const baseModule = modules.find((m) => m._indexId === moduleNanoid);
    const module = baseModule ? getEditingModule(baseModule.id) || baseModule : undefined;

    return (
      <Input
        value={module?.name || ''}
        onChange={(newValue) => onModuleChange(moduleNanoid, 'name', newValue)}
        size="small"
        placeholder="模块名称"
        style={{
          fontSize: '13px',
          width: '160px',
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
    const { modules, getEditingModule } = useModuleStore();
    const baseModule = modules.find((m) => m._indexId === moduleNanoid);
    const module = baseModule ? getEditingModule(baseModule.id) || baseModule : undefined;
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
          width: '130px',
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
    const { modules, getEditingModule } = useModuleStore();
    const baseModule = modules.find((m) => m._indexId === moduleNanoid);
    const module = baseModule ? getEditingModule(baseModule.id) || baseModule : undefined;
    const attribute = module?.attributes?.find((a) => a._indexId === attributeNanoid);

    return (
      <Input
        value={attribute?.name || ''}
        onChange={(newValue) => onAttributeChange(moduleNanoid, attributeNanoid, 'name', newValue)}
        size="small"
        placeholder="属性名称"
        style={{
          fontSize: '13px',
          width: '160px',
        }}
      />
    );
  }
);
ModuleAttributeNameInput.displayName = 'ModuleAttributeNameInput';

// 🎯 边栏模块属性表 - 只显示已关联的模块，不支持编辑
const SidebarModulePropertyTable: React.FC<ModulePropertyTreeTableProps> = ({
  title = '模块属性',
}) => {
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>();

  // Store hooks
  const { modules } = useModuleStore();
  const { editingEntity } = useCurrentEntity();
  const { updateEntity } = useCurrentEntityActions();

  // 🎯 只显示已关联的模块数据 - 通过nanoid匹配
  const linkedModuleTreeData = useMemo(() => {
    const entityBundles = editingEntity?.bundles || [];

    return modules
      .filter(
        (module) =>
          // 支持旧的ID匹配和新的nanoid匹配
          entityBundles.includes(module.id) || entityBundles.includes(module._indexId || '')
      )
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
            {/* 移除模块标签，简化显示 */}
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
              setFocusModuleId(undefined); // 一般配置，不聚焦特定模块
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
                  {moduleData.attributeCount}
                </Tag>
                <Tooltip content="查看模块详情">
                  <Button
                    theme="borderless"
                    type="tertiary"
                    size="small"
                    icon={<IconLink />}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFocusModuleId(moduleData.id); // 聚焦到当前模块
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
    [setConfigModalVisible, setFocusModuleId]
  );

  return (
    <div>
      <Table
        columns={sidebarColumns}
        dataSource={linkedModuleTreeData}
        rowKey="key"
        pagination={false}
        size="small"
        hideExpandedColumn={false}
        defaultExpandAllRows={false}
        onRow={(record) => {
          if (record && !record.isAttribute) {
            return {
              style: {
                backgroundColor: 'var(--semi-color-fill-0)',
                fontWeight: 600,
              },
            };
          }
          return {};
        }}
        indentSize={20}
        style={{
          borderRadius: '6px',
          border: '1px solid var(--semi-color-border)',
          overflow: 'hidden',
        }}
      />

      {/* 模块配置弹窗 */}
      <ModuleConfigModal
        visible={configModalVisible}
        onClose={() => {
          setConfigModalVisible(false);
          setFocusModuleId(undefined);
        }}
        focusModuleId={focusModuleId}
      />
    </div>
  );
};

// 🎯 模块配置弹窗组件
const ModuleConfigModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  focusModuleId?: string; // 需要聚焦的模块ID
}> = ({ visible, onClose, focusModuleId }) => {
  // Store hooks - 确保正确订阅editingModules状态变化
  const {
    modules,
    editingModules,
    getEditingModule,
    isModuleDirty,
    startEditModule,
    updateEditingModule,
    addAttributeToEditingModule,
    removeAttributeFromEditingModule,
    updateAttributeInEditingModule,
    saveAllDirtyModules,
    saveModule,
    resetModuleChanges,
    createModule,
    deleteModule,
  } = useModuleStore();
  const { editingEntity } = useCurrentEntity();
  const { updateEntity } = useCurrentEntityActions();

  // 🎯 本地状态
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0); // 强制刷新用

  // 🎯 同步选中状态 - 根据实体的bundles字段
  React.useEffect(() => {
    if (visible && editingEntity?.bundles) {
      const entityBundles = editingEntity.bundles;
      console.log('🔄 同步选中状态:', { entityBundles, modules: modules.length });

      const selectedNanoids = modules
        .filter((module) => {
          // 优先使用nanoid匹配，其次使用ID匹配
          const isSelected =
            entityBundles.includes(module._indexId || '') || entityBundles.includes(module.id);
          return isSelected;
        })
        .map((module) => module._indexId || module.id);

      console.log('🔍 计算出的选中模块:', selectedNanoids);
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
      console.log('🔥 handleAddAttribute 被调用了！', moduleNanoid);
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        // 确保模块在编辑状态
        if (!getEditingModule(module.id)) {
          startEditModule(module.id);
        }

        const newAttribute = {
          id: `attr_${Date.now()}`,
          name: '新属性',
          type: 's',
          description: '',
          _indexId: nanoid(), // 确保新属性有nanoid
        };
        console.log('➕ 执行添加属性:', { moduleId: module.id, newAttribute });
        addAttributeToEditingModule(module.id, newAttribute);

        // 强制展开该模块以显示新添加的属性
        setExpandedRowKeys((prev) => {
          if (!prev.includes(moduleNanoid)) {
            return [...prev, moduleNanoid];
          }
          return prev;
        });

        // 强制刷新表格数据
        setRefreshKey((prev) => prev + 1);
        console.log('✅ 属性添加成功');
      } else {
        console.error('❌ 未找到模块:', { moduleNanoid });
      }
    },
    [modules, addAttributeToEditingModule, getEditingModule, startEditModule, setExpandedRowKeys]
  );

  // 🎯 删除模块属性 - 使用编辑模式
  const handleRemoveAttribute = useCallback(
    (moduleNanoid: string, attributeNanoid: string) => {
      console.log('🔥 handleRemoveAttribute 被调用了！', { moduleNanoid, attributeNanoid });
      const module = modules.find((m) => m._indexId === moduleNanoid);

      if (module) {
        console.log('🗑️ 找到模块，删除属性:', { moduleId: module.id, attributeNanoid });

        // 确保模块在编辑状态
        if (!getEditingModule(module.id)) {
          startEditModule(module.id);
        }

        // 获取删除前的属性列表
        const editingModule = getEditingModule(module.id);
        const beforeCount = editingModule?.attributes.length || 0;
        const beforeAttrs =
          editingModule?.attributes.map((a) => ({ id: a.id, _indexId: a._indexId })) || [];
        console.log('🔍 删除前属性列表:', { beforeCount, beforeAttrs });

        removeAttributeFromEditingModule(module.id, attributeNanoid);

        // 检查删除后的属性列表
        const afterEditingModule = getEditingModule(module.id);
        const afterCount = afterEditingModule?.attributes.length || 0;
        const afterAttrs =
          afterEditingModule?.attributes.map((a) => ({ id: a.id, _indexId: a._indexId })) || [];
        console.log('🔍 删除后属性列表:', { afterCount, afterAttrs });

        // 强制刷新表格数据
        setRefreshKey((prev) => prev + 1);
        console.log('✅ 属性删除成功');
      } else {
        console.error('❌ 未找到模块:', {
          moduleNanoid,
          modules: modules.length,
          moduleIds: modules.map((m) => ({ id: m.id, _indexId: m._indexId })),
        });
      }
    },
    [modules, removeAttributeFromEditingModule, getEditingModule, startEditModule]
  );

  // 🎯 添加新模块
  const handleAddModule = useCallback(async () => {
    console.log('🔥 handleAddModule 被调用了！');
    try {
      const newModule = {
        id: `module_${Date.now()}`,
        name: '新模块',
        description: '',
        attributes: [],
        _indexId: nanoid(), // 确保新模块有nanoid
      };
      console.log('➕ 创建新模块:', newModule);
      await createModule(newModule);
      console.log('✅ 模块创建成功');
    } catch (error) {
      console.error('➕ 创建模块失败:', error);
    }
  }, [createModule]);

  // 🎯 删除模块
  const handleDeleteModule = useCallback(
    async (moduleNanoid: string) => {
      console.log('🔥 handleDeleteModule 被调用了！', moduleNanoid);
      try {
        const module = modules.find((m) => m._indexId === moduleNanoid);
        if (module) {
          console.log('🗑️ 删除模块:', { moduleId: module.id, moduleNanoid });

          // 1. 删除模块
          await deleteModule(module.id);

          // 2. 从选中列表中移除
          setSelectedModules((prev) => {
            const newSelected = prev.filter((id) => id !== moduleNanoid);
            console.log('🔄 更新选中列表:', { prev, newSelected });
            return newSelected;
          });

          // 3. 立即更新实体的模块关联
          const newBundles = selectedModules.filter((id) => id !== moduleNanoid);
          updateEntity({ bundles: newBundles });
          console.log('🔗 更新实体模块关联:', { newBundles });

          console.log('✅ 模块删除成功');
        } else {
          console.error('❌ 未找到要删除的模块:', {
            moduleNanoid,
            availableModules: modules.map((m) => ({ id: m.id, _indexId: m._indexId })),
          });
        }
      } catch (error) {
        console.error('🗑️ 删除模块失败:', error);
      }
    },
    [modules, deleteModule, setSelectedModules, selectedModules, updateEntity]
  );

  // 🎯 构建模块表格数据，包含选择状态，使用nanoid作为key
  const modalTableData = useMemo(() => {
    console.log('🔄 重新计算modalTableData:', {
      modulesCount: modules.length,
      selectedCount: selectedModules.length,
      editingModulesCount: editingModules.size,
    });

    return modules.map((module) => {
      const moduleNanoid = module._indexId || `module_${module.id}`;
      const isSelected = selectedModules.includes(moduleNanoid);
      const moduleKey = moduleNanoid;
      const isDirty = isModuleDirty(module.id);

      // 使用编辑中的模块数据
      const editingModule = getEditingModule(module.id) || module;

      const children: ModulePropertyData[] = editingModule.attributes.map((attr) => {
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
        id: editingModule.id,
        name: editingModule.name,
        attributeCount: editingModule.attributes.length,
        children,
        isAttribute: false,
        _indexId: moduleKey, // 保持一致
        isSelected,
      };
    });
  }, [modules, selectedModules, getEditingModule, isModuleDirty, editingModules, refreshKey]);

  // 🎯 完全自定义渲染的列配置
  const modalColumns = useMemo(
    () => [
      {
        title: '选择',
        key: 'selection',
        width: 80,
        render: (_: any, record: any) => {
          // 只有模块行显示复选框，属性行不显示
          if (!record.isAttribute) {
            return (
              <Checkbox
                checked={selectedModules.includes(record._indexId)}
                onChange={(e) => {
                  const newSelectedModules = e.target.checked
                    ? [...selectedModules, record._indexId]
                    : selectedModules.filter((nanoid) => nanoid !== record._indexId);
                  setSelectedModules(newSelectedModules);
                }}
              />
            );
          }
          return null; // 属性行不显示复选框
        },
      },
      {
        title: 'ID',
        key: 'id',
        width: 150,
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
        width: 180,
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
          <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAddModule}>
            新建模块
          </Button>
        ),
        key: 'type',
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
          if (record.isAttribute) {
            // 属性行：类型选择器和删除按钮
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
                  disabled={false} // 模块配置页面允许编辑所有属性
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
                {/* 删除属性按钮 */}
                <Tooltip content="删除属性">
                  <Button
                    type="danger"
                    icon={<IconDelete />}
                    size="small"
                    onClick={() => {
                      console.log('🔥 删除属性按钮被点击！', propertyData._indexId);
                      if (module) {
                        Modal.confirm({
                          title: '确认删除属性',
                          content: `确定要删除属性"${propertyData.name}"吗？\n\n删除后无法恢复`,
                          okText: '确认删除',
                          cancelText: '取消',
                          onOk: () => {
                            handleRemoveAttribute(module._indexId!, propertyData._indexId);
                          },
                        });
                      }
                    }}
                  />
                </Tooltip>
              </Space>
            );
          } else {
            // 模块行：显示属性数量、添加属性按钮、保存/撤销按钮和删除模块按钮
            const moduleData = record as ModuleTreeData;
            const module = modules.find((m) => m._indexId === moduleData._indexId);
            const isDirty = module ? isModuleDirty(module.id) : false;

            return (
              <Space>
                <Tag size="small" color="blue">
                  {moduleData.attributeCount}
                </Tag>
                {/* 添加属性按钮 */}
                <Tooltip content="添加属性">
                  <Button
                    size="small"
                    icon={<IconPlus />}
                    type="primary"
                    onClick={() => handleAddAttribute(moduleData._indexId)}
                  />
                </Tooltip>
                {/* 保存按钮 - 只在有更改时启用 */}
                <Tooltip content={isDirty ? '保存模块更改' : '无更改需要保存'}>
                  <Button
                    size="small"
                    icon={<IconSave />}
                    type="primary"
                    disabled={!isDirty}
                    onClick={async () => {
                      if (module) {
                        try {
                          await saveModule(module.id);
                          console.log('✅ 模块保存成功:', module.id);
                        } catch (error) {
                          console.error('❌ 模块保存失败:', error);
                        }
                      }
                    }}
                  />
                </Tooltip>
                {/* 撤销/删除按钮 - dirty时显示撤销，非dirty时显示删除 */}
                {isDirty ? (
                  <Tooltip content="撤销模块更改">
                    <Button
                      size="small"
                      icon={<IconUndo />}
                      onClick={() => {
                        if (module) {
                          resetModuleChanges(module.id);
                          console.log('↩️ 重置模块更改:', module.id);
                        }
                      }}
                    />
                  </Tooltip>
                ) : (
                  <Tooltip content="删除模块">
                    <Button
                      type="danger"
                      icon={<IconDelete />}
                      size="small"
                      onClick={() => {
                        console.log('🔥 删除模块按钮被点击！', moduleData._indexId);
                        Modal.confirm({
                          title: '确认删除模块',
                          content: `确定要删除模块"${moduleData.name}"吗？\n\n此操作将：\n• 永久删除该模块及其所有属性\n• 从当前实体中移除该模块关联\n• 无法撤销`,
                          okText: '确认删除',
                          cancelText: '取消',
                          onOk: () => {
                            handleDeleteModule(moduleData._indexId);
                          },
                        });
                      }}
                    />
                  </Tooltip>
                )}
              </Space>
            );
          }
        },
      },
    ],
    [
      selectedModules,
      modules,
      handleModuleChange,
      handleAttributeChange,
      handleAddAttribute,
      handleRemoveAttribute,
      handleDeleteModule,
      handleAddModule,
    ]
  );

  // 🎯 检查是否有更改
  const hasChanges = useMemo(() => {
    // 检查是否有dirty模块
    const dirtyModuleIds = modules.filter((m) => isModuleDirty(m.id)).map((m) => m.id);
    if (dirtyModuleIds.length > 0) return true;

    // 检查选中状态是否有变化
    const entityBundles = editingEntity?.bundles || [];
    const currentSelected = modules
      .filter(
        (module) =>
          entityBundles.includes(module._indexId || '') || entityBundles.includes(module.id)
      )
      .map((module) => module._indexId || module.id);

    if (selectedModules.length !== currentSelected.length) return true;
    if (selectedModules.some((id) => !currentSelected.includes(id))) return true;

    return false;
  }, [selectedModules, editingEntity?.bundles, modules, isModuleDirty, editingModules]);

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
      title="模块配置"
      visible={visible}
      onCancel={onClose}
      onOk={hasChanges ? handleSave : undefined}
      okButtonProps={{ disabled: !hasChanges }}
      okText="保存配置"
      cancelText="取消"
      width="750px"
      height="70vh"
      style={{ top: '5vh' }}
      bodyStyle={{
        height: 'calc(70vh - 108px)',
        overflow: 'auto',
        padding: '16px',
      }}
    >
      <Table
        columns={modalColumns}
        dataSource={modalDataSource}
        rowKey="key"
        pagination={false}
        size="small"
        hideExpandedColumn={false}
        expandedRowKeys={expandedRowKeys}
        onExpandedRowsChange={(rows) => {
          // 根据Semi Design文档，onExpandedRowsChange接收展开的行数据数组
          // 需要从行数据中提取rowKey对应的值
          const keys = Array.isArray(rows) ? rows.map((item: any) => item.key) : [];
          setExpandedRowKeys(keys);
        }}
        onRow={(record) => {
          if (record && !record.isAttribute) {
            return {
              style: {
                backgroundColor: record.isSelected
                  ? 'var(--semi-color-primary-light-default)'
                  : 'var(--semi-color-fill-0)',
                fontWeight: 600,
              },
            };
          }
          return {};
        }}
        indentSize={20}
        scroll={{ y: 'calc(70vh - 150px)' }}
        style={{
          borderRadius: '6px',
          border: '1px solid var(--semi-color-border)',
        }}
      />
    </Modal>
  );
};

// 兼容原有接口的包装组件
export const ModulePropertyTreeTable: React.FC<ModulePropertyTreeTableProps> = (props) => (
  <SidebarModulePropertyTable {...props} />
);
