import React, { useState } from 'react';

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
  Typography,
  Checkbox,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconArticle,
  IconChevronDown,
  IconChevronRight,
  IconSetting,
  IconLink,
  IconSave,
  IconUndo,
} from '@douyinfe/semi-icons';

// 移除外部组件引用，改为内联实现
import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { TypedParser, Primitive } from '../../../typings/mas/typed';
import { useModuleStore } from '../../../stores/module.store';
import { useCurrentEntityActions, useCurrentEntityStore } from '../../../stores';
import type { Attribute } from '../../../services/types';

// 内联组件的类型定义
export interface NodeModuleData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  attributes: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    displayId?: string;
    _indexId?: string;
  }>;
}

// 扩展Attribute类型以支持模块信息
interface ExtendedAttribute extends Attribute {
  moduleId?: string;
  moduleName?: string;
}

const { Text } = Typography;

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

export interface UniversalPropertyTableProps {
  // 显示模式
  mode?: 'node' | 'sidebar';
  // 功能控制
  editable?: boolean;
  readonly?: boolean; // 兼容原有接口
  // 显示配置
  showEntityProperties?: boolean;
  showModuleProperties?: boolean;
  // 标题配置
  entityTitle?: string;
  moduleTitle?: string;
}

// 独立的属性字段组件
const AttributeIdInput = React.memo(
  ({
    record,
    onFieldChange,
    readonly: readonlyProp,
  }: {
    record: ExtendedAttribute;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => {
    const value = (record as any).$id || record.id || '';
    const isModuleProperty = record.isModuleProperty || false;

    if (readonlyProp) {
      return (
        <Text
          style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '12px',
            color: 'var(--semi-color-text-1)',
          }}
        >
          {value || '未设置'}
        </Text>
      );
    }

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(record._indexId, '$id', newValue)}
        size="small"
        readOnly={isModuleProperty}
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

const AttributeNameInput = React.memo(
  ({
    record,
    onFieldChange,
    readonly: readonlyProp,
  }: {
    record: ExtendedAttribute;
    onFieldChange: (id: string, field: string, value: any) => void;
    readonly: boolean;
  }) => {
    const value = (record as any).$name || record.name || '';
    const isModuleProperty = record.isModuleProperty || false;

    if (readonlyProp) {
      return (
        <Text
          style={{
            fontSize: '13px',
            color: 'var(--semi-color-text-1)',
          }}
        >
          {value || '未设置'}
        </Text>
      );
    }

    return (
      <Input
        value={value}
        onChange={(newValue) => onFieldChange(record._indexId, '$name', newValue)}
        size="small"
        readOnly={isModuleProperty}
        placeholder="属性名称"
        style={{
          fontSize: '13px',
        }}
      />
    );
  }
);
AttributeNameInput.displayName = 'AttributeNameInput';

// 内联NodeModuleDisplay组件
const NodeModuleDisplay: React.FC<{ modules: NodeModuleData[] }> = ({ modules }) => {
  const columns = [
    {
      title: '',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      ellipsis: true,
      render: (text: string, record: NodeModuleData) => (
        <span
          style={{
            fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
            fontSize: '12px',
          }}
        >
          {text}
        </span>
      ),
    },
    {
      title: '',
      dataIndex: 'name',
      key: 'name',
      ellipsis: true,
      render: (text: string, record: NodeModuleData) => (
        <span style={{ fontSize: '12px' }}>{text}</span>
      ),
    },
    {
      title: '',
      dataIndex: 'attributeCount',
      key: 'attributeCount',
      width: 80,
      align: 'right' as const,
      render: (count: number, record: NodeModuleData) => {
        // 创建属性列表的tooltip内容
        const tooltipContent = (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
              {record.name}模块属性 ({count}个)
            </div>
            {record.attributes.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '4px',
                  fontSize: '12px',
                }}
              >
                <div style={{ fontWeight: 'bold' }}>ID</div>
                <div style={{ fontWeight: 'bold' }}>名称</div>
                <div style={{ fontWeight: 'bold' }}>类型</div>
                {record.attributes.map((attr, index) => (
                  <React.Fragment key={index}>
                    <div>{attr.displayId || attr.id}</div>
                    <div>{attr.name}</div>
                    <div>{attr.type}</div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div style={{ color: '#999' }}>无属性信息</div>
            )}
          </div>
        );

        return (
          <Tooltip content={tooltipContent} style={{ width: '300px' }}>
            <Tag color="blue" style={{ cursor: 'help', fontSize: '11px' }}>
              {count}
            </Tag>
          </Tooltip>
        );
      },
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={modules}
      pagination={false}
      size="small"
      rowKey="key"
      showHeader={false}
      onRow={() => ({
        style: {
          backgroundColor: 'transparent',
        },
      })}
      style={{
        borderRadius: '6px',
        border: '1px solid var(--semi-color-border)',
        overflow: 'hidden',
      }}
    />
  );
};

// 内联ModulePropertyTreeTable组件 - 边栏模块属性表格
interface ModulePropertyData {
  key: string;
  id: string;
  name: string;
  type: string;
  description?: string;
  isAttribute?: boolean;
  parentKey?: string;
  _indexId: string;
  isSelected?: boolean;
  moduleId?: string;
  displayId?: string;
}

interface ModuleTreeData {
  key: string;
  id: string;
  name: string;
  attributeCount: number;
  children?: ModulePropertyData[];
  isAttribute?: boolean;
  _indexId: string;
  isSelected?: boolean;
}

const ModulePropertyTreeTable: React.FC = () => {
  const [configModalVisible, setConfigModalVisible] = useState(false);
  const [focusModuleId, setFocusModuleId] = useState<string | undefined>();

  // 模块配置弹窗状态
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

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
  const editingEntity = useCurrentEntityStore(useShallow((state) => state.editingEntity));
  const { updateEntity } = useCurrentEntityActions();

  // 🎯 同步选中状态 - 根据实体的bundles字段
  React.useEffect(() => {
    if (configModalVisible && editingEntity?.bundles) {
      const entityBundles = editingEntity.bundles;
      console.log('🔄 同步选中状态:', { entityBundles, modules: modules.length });

      // 🎯 导入IdTransform工具
      const { IdTransform } = require('../../../utils/id-transform');

      const selectedNanoids = modules
        .filter((module) => {
          // 🎯 检查实体关联是否包含此模块（通过任意ID匹配）
          const isSelected = entityBundles.some(
            (bundleId) => bundleId === module.id || bundleId === module._indexId
          );
          return isSelected;
        })
        .map((module) => IdTransform.getModuleStableId(module));

      console.log('🔍 计算出的选中模块:', selectedNanoids);
      setSelectedModules(selectedNanoids);

      // 为所有模块开始编辑会话
      modules.forEach((module) => {
        if (module.id) {
          startEditModule(module.id);
        }
      });
    }
  }, [configModalVisible, editingEntity?.bundles, modules, startEditModule]);

  // 🎯 初始化展开状态
  React.useEffect(() => {
    if (configModalVisible && !isInitialized) {
      if (focusModuleId) {
        const targetModule = modules.find((m) => m.id === focusModuleId);
        if (targetModule && targetModule._indexId) {
          setExpandedRowKeys([targetModule._indexId]);
        } else {
          setExpandedRowKeys([]);
        }
      } else {
        setExpandedRowKeys([]);
      }
      setIsInitialized(true);
    } else if (!configModalVisible) {
      setIsInitialized(false);
    }
  }, [configModalVisible, isInitialized, focusModuleId, modules]);

  // 🎯 模块字段修改处理
  const handleModuleChange = React.useCallback(
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

  // 🎯 模块属性字段修改处理
  const handleAttributeChange = React.useCallback(
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

  // 🎯 添加模块属性
  const handleAddAttribute = React.useCallback(
    (moduleNanoid: string) => {
      console.log('🔥 handleAddAttribute 被调用了！', moduleNanoid);
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        if (!getEditingModule(module.id)) {
          startEditModule(module.id);
        }

        const newAttribute = {
          id: `attr_${Date.now()}`,
          name: '新属性',
          type: 's',
          description: '',
          _indexId: nanoid(),
        };
        console.log('➕ 执行添加属性:', { moduleId: module.id, newAttribute });
        addAttributeToEditingModule(module.id, newAttribute);

        setExpandedRowKeys((prev) => {
          if (!prev.includes(moduleNanoid)) {
            return [...prev, moduleNanoid];
          }
          return prev;
        });

        setRefreshKey((prev) => prev + 1);
        console.log('✅ 属性添加成功');
      } else {
        console.error('❌ 未找到模块:', { moduleNanoid });
      }
    },
    [modules, addAttributeToEditingModule, getEditingModule, startEditModule, setExpandedRowKeys]
  );

  // 🎯 删除模块属性
  const handleRemoveAttribute = React.useCallback(
    (moduleNanoid: string, attributeNanoid: string) => {
      console.log('🔥 handleRemoveAttribute 被调用了！', { moduleNanoid, attributeNanoid });
      const module = modules.find((m) => m._indexId === moduleNanoid);

      if (module) {
        console.log('🗑️ 找到模块，删除属性:', { moduleId: module.id, attributeNanoid });

        if (!getEditingModule(module.id)) {
          startEditModule(module.id);
        }

        removeAttributeFromEditingModule(module.id, attributeNanoid);
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
  const handleAddModule = React.useCallback(async () => {
    console.log('🔥 handleAddModule 被调用了！');
    try {
      const newModule = {
        id: `module_${Date.now()}`,
        name: '新模块',
        description: '',
        attributes: [],
        _indexId: nanoid(),
      };
      console.log('➕ 创建新模块:', newModule);
      await createModule(newModule);
      console.log('✅ 模块创建成功');
    } catch (error) {
      console.error('➕ 创建模块失败:', error);
    }
  }, [createModule]);

  // 🎯 删除模块
  const handleDeleteModule = React.useCallback(
    async (moduleNanoid: string) => {
      console.log('🔥 handleDeleteModule 被调用了！', moduleNanoid);
      try {
        const module = modules.find((m) => m._indexId === moduleNanoid);
        if (module) {
          console.log('🗑️ 删除模块:', { moduleId: module.id, moduleNanoid });

          await deleteModule(module.id);

          setSelectedModules((prev) => {
            const newSelected = prev.filter((id) => id !== moduleNanoid);
            console.log('🔄 更新选中列表:', { prev, newSelected });
            return newSelected;
          });

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

  // 只显示已关联的模块数据
  const linkedModuleTreeData = React.useMemo(() => {
    const entityBundles = editingEntity?.bundles || [];

    // 🎯 导入IdTransform工具
    const { IdTransform } = require('../../../utils/id-transform');

    return modules
      .filter((module) =>
        // 🎯 使用统一的查找逻辑
        entityBundles.some((bundleId) => bundleId === module.id || bundleId === module._indexId)
      )
      .map((module) => {
        const moduleKey = `module_${module._indexId || module.id}`;

        const children: ModulePropertyData[] = module.attributes.map((attr) => ({
          key: `${moduleKey}_${attr._indexId || attr.id}`,
          id: `${module.id}/${attr.id}`,
          name: attr.name || attr.id,
          type: attr.type,
          description: attr.description,
          isAttribute: true,
          parentKey: moduleKey,
          _indexId: attr._indexId || nanoid(),
          isSelected: true,
          moduleId: module.id,
          displayId: attr.displayId || attr.id,
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

  // 边栏表格列配置
  const sidebarColumns = React.useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        width: 120,
        ellipsis: true,
        render: (_: any, record: ModuleTreeData | ModulePropertyData) => {
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

  // 🎯 构建模块表格数据，包含选择状态，使用nanoid作为key
  const modalTableData = React.useMemo(() => {
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
  const modalColumns = React.useMemo(
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
  const hasChanges = React.useMemo(() => {
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

      setConfigModalVisible(false);
    } catch (error) {
      console.error('💾 保存失败:', error);
    }
  };

  // 🎯 表格数据源
  const modalDataSource = React.useMemo(
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
    <div>
      <Table
        columns={sidebarColumns}
        dataSource={linkedModuleTreeData}
        rowKey="key"
        pagination={false}
        size="small"
        hideExpandedColumn={false}
        defaultExpandAllRows={false}
        expandRowByClick={true}
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
      <Modal
        title="模块配置"
        visible={configModalVisible}
        onCancel={() => setConfigModalVisible(false)}
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
    </div>
  );
};

export const UniversalPropertyTable: React.FC<UniversalPropertyTableProps> = ({
  mode = 'sidebar',
  editable,
  readonly = false,
  showEntityProperties = true,
  showModuleProperties = false,
  entityTitle = '实体属性',
  moduleTitle = '实体模块',
}) => {
  // 兼容处理：如果传了readonly，则以readonly为准；否则根据mode判断
  const isReadonly = readonly || mode === 'node';
  const isEditable = editable !== undefined ? editable : !isReadonly;

  const [descriptionEditModal, setDescriptionEditModal] = useState<{
    visible: boolean;
    attributeId: string;
    attributeName: string;
    description: string;
  }>({
    visible: false,
    attributeId: '',
    attributeName: '',
    description: '',
  });

  const { updateAttributeProperty, addAttribute, removeAttribute } = useCurrentEntityActions();

  const attributes = useCurrentEntityStore(
    useShallow((state) => state.editingEntity?.attributes || [])
  );

  const editingEntity = useCurrentEntityStore(useShallow((state) => state.editingEntity));

  // 准备节点模块数据
  const nodeModuleData: NodeModuleData[] = React.useMemo(() => {
    if (!showModuleProperties) {
      console.log('🔍 模块属性显示被禁用:', { showModuleProperties });
      return [];
    }

    if (!editingEntity?.bundles) {
      console.log('🔍 实体没有关联模块:', {
        editingEntity: editingEntity?.id,
        bundles: editingEntity?.bundles,
      });
      return [];
    }

    const { modules } = useModuleStore.getState();
    console.log(
      '🔍 所有模块数据:',
      modules.map((m) => ({ id: m.id, _indexId: m._indexId, name: m.name }))
    );
    console.log('🔍 实体关联的模块ID:', editingEntity.bundles);

    // 🎯 导入IdTransform工具
    const { IdTransform } = require('../../../utils/id-transform');

    const matchedModules = modules.filter((module) => {
      const isMatched = editingEntity.bundles.some(
        (bundleId) => bundleId === module.id || bundleId === module._indexId
      );
      console.log('🔍 模块匹配检查:', {
        moduleId: module.id,
        moduleIndexId: module._indexId,
        isMatched,
        bundles: editingEntity.bundles,
      });
      return isMatched;
    });

    console.log(
      '🔍 匹配到的模块:',
      matchedModules.map((m) => ({ id: m.id, name: m.name, attributeCount: m.attributes?.length }))
    );

    return matchedModules.map((module) => ({
      key: `module-${module._indexId || module.id}`,
      id: module.id,
      name: module.name,
      attributeCount: module.attributes?.length || 0,
      attributes:
        module.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          type: attr.type,
          displayId: attr.displayId,
          _indexId: attr._indexId,
        })) || [],
    }));
  }, [editingEntity, showModuleProperties]);

  const stableFieldChange = React.useCallback(
    (id: string, field: string, value: any) => {
      updateAttributeProperty(id, field, value);
    },
    [updateAttributeProperty]
  );

  const handleDelete = (id: string) => {
    removeAttribute(id);
  };

  const handleAdd = () => {
    const newAttribute: Attribute = {
      _indexId: nanoid(),
      id: '',
      name: '新属性',
      type: 'string',
      description: '',
      isEntityProperty: true,
    };
    addAttribute(newAttribute);
  };

  const handleDescriptionEdit = React.useCallback((property: Attribute) => {
    setDescriptionEditModal({
      visible: true,
      attributeId: property._indexId,
      attributeName: property.name || property.id || '未命名属性',
      description: property.description || '',
    });
  }, []);

  const handleDescriptionSave = React.useCallback(() => {
    stableFieldChange(
      descriptionEditModal.attributeId,
      'description',
      descriptionEditModal.description
    );
    setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
  }, [stableFieldChange, descriptionEditModal.attributeId, descriptionEditModal.description]);

  const handleDescriptionCancel = React.useCallback(() => {
    setDescriptionEditModal((prev) => ({ ...prev, visible: false }));
  }, []);

  const handleTypeChange = React.useCallback(
    (recordIndexId: string, typeInfo: any) => {
      console.log('Type changed:', typeInfo);
      stableFieldChange(recordIndexId, 'type', typeInfo.type);
      if (typeInfo.enumClassId) {
        stableFieldChange(recordIndexId, 'enumClassId', typeInfo.enumClassId);
      } else {
        stableFieldChange(recordIndexId, 'enumClassId', undefined);
      }
    },
    [stableFieldChange]
  );

  const columns = React.useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        width: 120,
        render: (_: any, record: Attribute) => (
          <AttributeIdInput
            record={record}
            onFieldChange={stableFieldChange}
            readonly={isReadonly}
          />
        ),
      },
      {
        title: '名称',
        key: 'name',
        width: 200,
        render: (_: any, record: Attribute) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AttributeNameInput
              record={record}
              onFieldChange={stableFieldChange}
              readonly={isReadonly}
            />
            {record.isModuleProperty && (
              <Tag
                size="small"
                color="green"
                style={{
                  fontSize: '11px',
                  height: '18px',
                  lineHeight: '16px',
                  padding: '1px 6px',
                }}
              >
                模块
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: () =>
          isEditable ? (
            <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAdd}>
              添加属性
            </Button>
          ) : (
            ''
          ),
        key: 'controls',
        width: 150,
        render: (_: any, record: Attribute) => (
          <Space>
            <EntityPropertyTypeSelector
              value={(() => {
                const typedInfo = TypedParser.fromString(record.type);
                if (typedInfo.dimensions.length > 0) {
                  const itemType = (() => {
                    if (typedInfo.attributes.length > 0) {
                      return 'object';
                    }
                    switch (typedInfo.primitive) {
                      case Primitive.STRING:
                        return 'string';
                      case Primitive.NUMBER:
                        return 'number';
                      case Primitive.BOOLEAN:
                        return 'boolean';
                      case Primitive.UNKNOWN:
                        return 'unknown';
                      default:
                        return 'unknown';
                    }
                  })();
                  return {
                    type: 'array',
                    items: { type: itemType },
                    ...(record.enumClassId && { enumClassId: record.enumClassId }),
                  };
                } else if (typedInfo.attributes.length > 0) {
                  return {
                    type: 'object',
                    ...(record.enumClassId && { enumClassId: record.enumClassId }),
                  };
                } else {
                  const primitiveType = (() => {
                    switch (typedInfo.primitive) {
                      case Primitive.STRING:
                        return 'string';
                      case Primitive.NUMBER:
                        return 'number';
                      case Primitive.BOOLEAN:
                        return 'boolean';
                      case Primitive.UNKNOWN:
                        return 'unknown';
                      default:
                        return 'unknown';
                    }
                  })();
                  return {
                    type: primitiveType,
                    ...(record.enumClassId && { enumClassId: record.enumClassId }),
                  };
                }
              })()}
              onChange={(typeInfo: any) => handleTypeChange(record._indexId, typeInfo)}
              disabled={isReadonly || record.isModuleProperty}
              onDataRestrictionClick={() => {
                console.log('打开数据限制弹窗:', record);
              }}
            />

            {isEditable && (
              <>
                <Tooltip content={record.description || '点击编辑描述'}>
                  <Button
                    theme="borderless"
                    size="small"
                    icon={<IconArticle />}
                    onClick={() => handleDescriptionEdit(record)}
                    disabled={isReadonly || record.isModuleProperty}
                    type={record.description ? 'primary' : 'tertiary'}
                  />
                </Tooltip>

                {!record.isModuleProperty && (
                  <Popconfirm
                    title="确定删除此属性吗？"
                    content="删除后无法恢复"
                    onConfirm={() => handleDelete(record._indexId)}
                  >
                    <Tooltip content="删除属性">
                      <Button
                        type="danger"
                        icon={<IconDelete />}
                        size="small"
                        disabled={isReadonly || record.isModuleProperty}
                      />
                    </Tooltip>
                  </Popconfirm>
                )}
              </>
            )}
          </Space>
        ),
      },
    ],
    [
      isReadonly,
      isEditable,
      stableFieldChange,
      handleTypeChange,
      handleDescriptionEdit,
      handleDelete,
    ]
  );

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);
  const [moduleExpanded, setModuleExpanded] = useState(true);

  const expandedRowRender = React.useCallback((record: any) => {
    if (!record || !record._indexId) return null;

    const typedInfo = TypedParser.fromString(record.type);

    if (typedInfo.attributes.length > 0) {
      return (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--semi-color-fill-0)',
            borderTop: '1px solid var(--semi-color-border)',
          }}
        >
          <div style={{ marginBottom: 8, fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
            复合类型子属性：
          </div>
          {typedInfo.attributes.map((attr, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
                fontSize: '12px',
              }}
            >
              <span style={{ minWidth: 80, fontFamily: 'monospace' }}>{attr.id}:</span>
              <span style={{ color: 'var(--semi-color-text-1)' }}>
                {TypedParser.toString(attr.type)}
              </span>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }, []);

  return (
    <div style={{ width: '100%' }}>
      {/* 实体属性部分 */}
      {showEntityProperties && (
        <>
          {/* 组件标题 */}
          <div
            className="property-table-title"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '0px',
            }}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
            <Typography.Text strong>{entityTitle}</Typography.Text>
            <Typography.Text type="tertiary" size="small">
              ({attributes.length})
            </Typography.Text>
          </div>

          {isExpanded && (
            <Table
              columns={columns}
              dataSource={attributes}
              rowKey="_indexId"
              pagination={false}
              size="small"
              expandedRowRender={expandedRowRender}
              expandedRowKeys={Array.from(expandedRows)}
              hideExpandedColumn={false}
              indentSize={0}
              rowExpandable={(record) => {
                if (!record) return false;
                const typedInfo = TypedParser.fromString(record.type);
                return typedInfo.attributes.length > 0;
              }}
              onExpand={(expanded, record) => {
                if (expanded && record && (record as any)._indexId) {
                  setExpandedRows((prev) => new Set([...prev, (record as any)._indexId]));
                } else if (!expanded && record && (record as any)._indexId) {
                  setExpandedRows((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete((record as any)._indexId);
                    return newSet;
                  });
                }
              }}
              style={{
                borderRadius: '6px',
                border: '1px solid var(--semi-color-border)',
                overflow: 'hidden',
                width: '100%',
                tableLayout: 'fixed',
              }}
            />
          )}
        </>
      )}

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

      {/* 模块属性部分 */}
      {showModuleProperties && (
        <div style={{ marginTop: showEntityProperties ? 16 : 0 }}>
          <div
            className="property-table-title"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '0px',
            }}
            onClick={() => setModuleExpanded(!moduleExpanded)}
          >
            {moduleExpanded ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
            <Typography.Text strong>{moduleTitle}</Typography.Text>
          </div>

          {moduleExpanded && (
            <div style={{ marginTop: 8 }}>
              {mode === 'sidebar' ? (
                <ModulePropertyTreeTable />
              ) : (
                <NodeModuleDisplay modules={nodeModuleData} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
