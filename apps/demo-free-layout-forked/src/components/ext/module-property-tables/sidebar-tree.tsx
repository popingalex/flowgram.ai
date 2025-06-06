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
import { useModuleStore } from '../../../stores/module.store';
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
    const { modules } = useModuleStore();
    const module = modules.find((m) => m._indexId === moduleNanoid);

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
    const { modules } = useModuleStore();
    const module = modules.find((m) => m._indexId === moduleNanoid);

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
    const { modules } = useModuleStore();
    const module = modules.find((m) => m._indexId === moduleNanoid);
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
    const { modules } = useModuleStore();
    const module = modules.find((m) => m._indexId === moduleNanoid);
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
        indentSize={20} // 增加缩进，保持与其他表格一致
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

  // Store hooks
  const { modules, updateModule, addAttributeToModule, removeAttributeFromModule } =
    useModuleStore();
  const { editingEntity } = useCurrentEntity();
  const { updateEntity } = useCurrentEntityActions();

  // 🎯 同步选中状态 - 使用nanoid确保状态稳定
  React.useEffect(() => {
    if (visible) {
      const entityBundles = editingEntity?.bundles || [];
      console.log('🔍 同步选中状态:', { entityBundles, modulesCount: modules.length });

      const selectedNanoids = modules
        .filter((module) => {
          // 优先使用nanoid匹配，其次使用ID匹配
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
        .map((module) => module._indexId || module.id);

      console.log('🔍 计算出的选中模块:', selectedNanoids);
      setSelectedModules(selectedNanoids);
    }
  }, [visible, editingEntity?.bundles, modules]);

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

  // 🎯 模块字段修改处理 - 使用nanoid作为查找依据
  const handleModuleChange = useCallback(
    (moduleNanoid: string, field: string, value: any) => {
      console.log('修改模块字段:', { moduleNanoid, field, value });
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        updateModule(module.id, { [field]: value });
      }
    },
    [modules, updateModule]
  );

  // 🎯 模块属性字段修改处理 - 使用nanoid作为查找依据
  const handleAttributeChange = useCallback(
    (moduleNanoid: string, attributeNanoid: string, field: string, value: any) => {
      console.log('修改模块属性字段:', { moduleNanoid, attributeNanoid, field, value });
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        const updatedAttributes = module.attributes.map((attr) =>
          attr._indexId === attributeNanoid ? { ...attr, [field]: value } : attr
        );
        updateModule(module.id, { attributes: updatedAttributes });
      }
    },
    [modules, updateModule]
  );

  // 🎯 添加模块属性 - 使用nanoid作为查找依据
  const handleAddAttribute = useCallback(
    (moduleNanoid: string) => {
      console.log('添加模块属性:', moduleNanoid);
      const module = modules.find((m) => m._indexId === moduleNanoid);
      if (module) {
        const newAttribute = {
          id: `attr_${Date.now()}`,
          name: '新属性',
          type: 's',
          description: '',
        };
        addAttributeToModule(module.id, newAttribute);
      }
    },
    [modules, addAttributeToModule]
  );

  // 🎯 删除模块属性 - 使用nanoid查找，然后传递正确的ID
  const handleRemoveAttribute = useCallback(
    (moduleNanoid: string, attributeNanoid: string) => {
      console.log('🗑️ 删除模块属性开始:', { moduleNanoid, attributeNanoid });
      const module = modules.find((m) => m._indexId === moduleNanoid);
      const attribute = module?.attributes?.find((a) => a._indexId === attributeNanoid);

      if (module && attribute) {
        console.log('🗑️ 找到模块和属性:', { moduleId: module.id, attributeId: attribute.id });
        // Store方法需要使用属性的实际ID，不是nanoid
        removeAttributeFromModule(module.id, attribute.id);
        console.log('🗑️ 删除命令已发送, 使用属性ID:', attribute.id);
      } else {
        console.log('🗑️ 未找到模块或属性:', {
          module: !!module,
          attribute: !!attribute,
          modules: modules.length,
          moduleIds: modules.map((m) => ({ id: m.id, _indexId: m._indexId })),
          attributeIds: module?.attributes?.map((a) => ({ id: a.id, _indexId: a._indexId })) || [],
          moduleNanoid,
          attributeNanoid,
        });
      }
    },
    [modules, removeAttributeFromModule]
  );

  // 🎯 构建模块表格数据，包含选择状态，使用nanoid作为key
  const modalTableData = useMemo(
    () =>
      modules.map((module) => {
        const moduleNanoid = module._indexId || `module_${module.id}`;
        const isSelected = selectedModules.includes(moduleNanoid);
        const moduleKey = moduleNanoid;

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
        title: '选择',
        key: 'selection',
        width: 60,
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
        width: 120,
        // ellipsis: true,
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
        // ellipsis: true,
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
        title: '类型/操作',
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
                  disabled={!record.isSelected} // 只有选中的模块属性才能编辑
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
            // 模块行：显示属性数量和添加按钮
            const moduleData = record as ModuleTreeData;
            return (
              <Space>
                <Tag size="small" color="blue">
                  {moduleData.attributeCount}个属性
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
    ]
  );

  // 🎯 保存配置 - 直接使用nanoid关联
  const handleSave = () => {
    // selectedModules 现在直接包含nanoid，无需转换
    updateEntity({ bundles: selectedModules });
    onClose();
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
      onOk={handleSave}
      okText="保存配置"
      cancelText="取消"
      width="640px"
      height="60vh"
      style={{ top: '10vh' }}
      bodyStyle={{
        height: 'calc(80vh - 108px)', // 减去头部和底部的高度
        overflow: 'auto',
        padding: '16px',
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ marginBottom: 16 }}>
          <p style={{ marginBottom: 16, color: 'var(--semi-color-text-1)' }}>
            选择要关联到当前实体的模块。选中的模块及其属性将自动添加到实体中。
            您还可以在这里编辑模块属性的类型，添加或删除属性。
          </p>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
              已选择 {selectedModules.length} / {modules.length} 个模块
            </span>
          </div>
        </div>

        {/* 使用完全自定义渲染的表格 */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
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
            style={{
              borderRadius: '6px',
              border: '1px solid var(--semi-color-border)',
              overflow: 'hidden',
              height: '100%',
            }}
            scroll={{ y: 'calc(80vh - 200px)' }}
          />
        </div>
      </div>
    </Modal>
  );
};

// 兼容原有接口的包装组件
export const ModulePropertyTreeTable: React.FC<ModulePropertyTreeTableProps> = (props) => (
  <SidebarModulePropertyTable {...props} />
);
