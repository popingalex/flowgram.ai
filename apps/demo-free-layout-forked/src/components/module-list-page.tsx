import React, { useState, useMemo, useCallback } from 'react';

import { nanoid } from 'nanoid';
import {
  Table,
  Button,
  Space,
  Input,
  Popconfirm,
  Modal,
  Form,
  Typography,
  Tag,
  Tooltip,
  Notification,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconSave,
  IconUndo,
  IconRefresh,
} from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from './ext/type-selector-ext';
import { useModuleStore } from '../stores';

const { Text } = Typography;

// 通用字段输入组件 - 简化版本，只显示错误状态
const FieldInput = React.memo(
  ({
    value,
    onChange,
    placeholder,
    readonly = false,
    isIdField = false, // ID字段使用等宽字体
    required = false, // 是否必填
    isDuplicate = false, // 是否重复
    errorMessage = '', // 校验错误信息
  }: {
    value: string;
    onChange: (newValue: string) => void;
    placeholder: string;
    readonly?: boolean;
    isIdField?: boolean;
    required?: boolean;
    isDuplicate?: boolean;
    errorMessage?: string;
  }) => {
    if (readonly) {
      const displayValue = isIdField && value ? value.split('/').pop() : value;
      return (
        <Text
          style={{
            fontFamily: isIdField
              ? 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
              : undefined,
            fontSize: isIdField ? '12px' : '13px',
          }}
        >
          {displayValue}
        </Text>
      );
    }

    // 检查是否为空（用于必填校验）
    const isEmpty = !value || value.trim() === '';
    const hasError = (required && isEmpty) || isDuplicate || !!errorMessage;

    return (
      <Input
        value={value}
        onChange={onChange}
        onClick={(e) => e.stopPropagation()}
        size="small"
        placeholder={placeholder}
        validateStatus={hasError ? 'error' : 'default'}
        style={{
          fontFamily: isIdField
            ? 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace'
            : undefined,
          fontSize: isIdField ? '12px' : '13px',
        }}
      />
    );
  }
);
FieldInput.displayName = 'FieldInput';

// 模块ID输入组件
const ModuleIdInput = React.memo(
  ({
    module,
    onFieldChange,
    errorMessage = '',
  }: {
    module: any;
    onFieldChange: (moduleId: string, field: string, value: any) => void;
    errorMessage?: string;
  }) => (
    <FieldInput
      value={module.id}
      onChange={(newValue) => onFieldChange(module._indexId, 'id', newValue)}
      placeholder="模块ID（必填）"
      isIdField={true}
      required={true}
      errorMessage={errorMessage}
    />
  )
);
ModuleIdInput.displayName = 'ModuleIdInput';

// 模块名称输入组件
const ModuleNameInput = React.memo(
  ({
    module,
    onFieldChange,
  }: {
    module: any;
    onFieldChange: (moduleId: string, field: string, value: any) => void;
  }) => (
    <FieldInput
      value={module.name}
      onChange={(newValue) => onFieldChange(module._indexId, 'name', newValue)}
      placeholder="模块名称"
    />
  )
);
ModuleNameInput.displayName = 'ModuleNameInput';

// 属性ID输入组件
const AttributeIdInput = React.memo(
  ({
    attribute,
    moduleId,
    onFieldChange,
    errorMessage = '',
  }: {
    attribute: any;
    moduleId: string;
    onFieldChange: (moduleId: string, attributeId: string, field: string, value: any) => void;
    errorMessage?: string;
  }) => {
    // 对于模块属性，只显示属性ID部分，不显示模块前缀
    const displayValue =
      attribute.displayId || attribute.id?.split('/').pop() || attribute.id || '';

    return (
      <FieldInput
        value={displayValue}
        onChange={(newValue) => onFieldChange(moduleId, attribute._indexId, 'id', newValue)}
        placeholder="属性ID（必填）"
        isIdField={true}
        required={true}
        errorMessage={errorMessage}
      />
    );
  }
);
AttributeIdInput.displayName = 'AttributeIdInput';

// 属性名称输入组件
const AttributeNameInput = React.memo(
  ({
    attribute,
    moduleId,
    onFieldChange,
  }: {
    attribute: any;
    moduleId: string;
    onFieldChange: (moduleId: string, attributeId: string, field: string, value: any) => void;
  }) => (
    <FieldInput
      value={attribute.name}
      onChange={(newValue) => onFieldChange(moduleId, attribute._indexId, 'name', newValue)}
      placeholder="属性名称"
    />
  )
);
AttributeNameInput.displayName = 'AttributeNameInput';

export const ModuleListPage: React.FC = () => {
  const {
    modules,
    loading,
    createModule,
    updateModule,
    deleteModule,
    addAttributeToModule,
    removeAttributeFromModule,
  } = useModuleStore();

  const [searchText, setSearchText] = useState('');

  // 🐛 调试：监控组件重新渲染
  console.log(
    '🔄 ModuleListPage重新渲染，模块数量:',
    modules.length,
    '第一个模块状态:',
    modules[0]?._status
  );

  // 检查字段校验错误信息
  const getFieldValidationError = useCallback(
    (
      moduleId: string,
      field: 'id' | 'attribute-id',
      value: string,
      attributeId?: string
    ): string => {
      if (!value || value.trim() === '') {
        return field === 'id' ? '模块ID不能为空' : '属性ID不能为空';
      }

      if (field === 'id') {
        // 检查模块ID重复
        const isDuplicate = modules.some((m) => m._indexId !== moduleId && m.id === value);
        if (isDuplicate) {
          return `模块ID "${value}" 已存在`;
        }
      } else if (field === 'attribute-id' && attributeId) {
        // 检查属性ID重复（在同一模块内）
        const module = modules.find((m) => m._indexId === moduleId);
        if (module) {
          const isDuplicate = module.attributes?.some(
            (attr) => attr._indexId !== attributeId && attr.id === value
          );
          if (isDuplicate) {
            return `属性ID "${value}" 在此模块中已存在`;
          }
        }
      }

      return '';
    },
    [modules]
  );

  // 检查模块是否有修改
  const isModuleDirty = useCallback((module: any) => {
    const status = module._status;
    return status === 'dirty' || status === 'new';
  }, []);

  // 检查模块是否可以保存（必填项都已填写且无重复）
  const canSaveModule = (module: any): boolean => {
    // 检查模块ID
    if (!module.id || module.id.trim() === '') {
      return false;
    }

    // 检查模块ID是否与其他模块重复
    const otherModules = modules.filter((m) => m._indexId !== module._indexId);
    if (otherModules.some((m) => m.id === module.id)) {
      return false;
    }

    // 检查所有属性的ID
    if (module.attributes && module.attributes.length > 0) {
      const attributeIds = new Set();
      for (const attr of module.attributes) {
        // 检查属性ID是否为空
        if (!attr.id || attr.id.trim() === '') {
          return false;
        }
        // 检查属性ID是否重复
        if (attributeIds.has(attr.id)) {
          return false;
        }
        attributeIds.add(attr.id);
      }
    }

    return true;
  };

  // 获取保存错误提示
  const getSaveErrorMessage = (module: any): string => {
    // 检查模块ID
    const moduleIdError = getFieldValidationError(module._indexId, 'id', module.id);
    if (moduleIdError) {
      return moduleIdError;
    }

    // 检查所有属性ID
    if (module.attributes && module.attributes.length > 0) {
      for (const attr of module.attributes) {
        const attrIdError = getFieldValidationError(
          module._indexId,
          'attribute-id',
          attr.id,
          attr._indexId
        );
        if (attrIdError) {
          return attrIdError;
        }
      }
    }

    return '保存模块修改';
  };

  // 转换为表格数据 - 带排序逻辑
  const tableData = useMemo(() => {
    console.log('🔄 重新计算表格数据，模块数量:', modules.length);
    const data: any[] = [];

    modules.forEach((module) => {
      const moduleRow: any = {
        key: module._indexId,
        type: 'module',
        module: module, // 🎯 直接使用模块数据
        children: [] as any[],
      };

      // 模块属性 - 排序：新增的在前，然后按ID排序
      const sortedAttributes = [...(module.attributes || [])].sort((a, b) => {
        // 新增状态的属性排在前面
        if ((a as any)._status === 'new' && (b as any)._status !== 'new') return -1;
        if ((a as any)._status !== 'new' && (b as any)._status === 'new') return 1;
        // 同样状态的按ID排序
        return (a.id || '').localeCompare(b.id || '');
      });

      sortedAttributes.forEach((attr: any) => {
        moduleRow.children.push({
          key: attr._indexId,
          type: 'attribute',
          module: module,
          attribute: attr,
        });
      });

      data.push(moduleRow);
    });

    return data;
  }, [modules]); // 🎯 简化依赖

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!searchText) return tableData;

    return tableData.filter((item) => {
      const module = item.module;
      if (!module) return false;

      const moduleMatch =
        (module.id || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (module.name || '').toLowerCase().includes(searchText.toLowerCase());

      const childrenMatch = item.children?.some((child: any) => {
        const attribute = child.attribute;
        return (
          attribute &&
          ((attribute.id || '').toLowerCase().includes(searchText.toLowerCase()) ||
            (attribute.name || '').toLowerCase().includes(searchText.toLowerCase()))
        );
      });

      return moduleMatch || childrenMatch;
    });
  }, [tableData, searchText]);

  // 🎯 字段变更处理 - 直接更新模块，简化逻辑
  const handleModuleFieldChange = useCallback(
    (moduleIndexId: string, field: string, value: any) => {
      console.log('🔍 更新模块字段:', moduleIndexId, field, value);
      // 找到模块并更新字段，触发store状态更新
      const module = modules.find((m) => m._indexId === moduleIndexId);
      if (module) {
        const updatedModule = { ...module, [field]: value };
        updateModule(moduleIndexId, updatedModule);
      }
    },
    [modules, updateModule]
  );

  const handleAttributeFieldChange = useCallback(
    (moduleIndexId: string, attributeIndexId: string, field: string, value: any) => {
      console.log('🔍 更新属性字段:', moduleIndexId, attributeIndexId, field, value);
      // 找到模块和属性并更新，触发store状态更新
      const module = modules.find((m) => m._indexId === moduleIndexId);
      if (module) {
        const updatedAttributes = (module.attributes || []).map((attr) =>
          (attr as any)._indexId === attributeIndexId ? { ...attr, [field]: value } : attr
        );
        const updatedModule = { ...module, attributes: updatedAttributes };
        updateModule(moduleIndexId, updatedModule);
      }
    },
    [modules, updateModule]
  );

  const handleTypeChange = (moduleId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(moduleId, attributeId, 'type', typeInfo.type);
  };

  // 🎯 模块保存逻辑 - 直接调用store方法，简化逻辑
  const handleSaveModule = async (module: any) => {
    try {
      await updateModule(module._indexId, module);
      console.log('✅ 模块保存成功');
      Notification.success({
        title: '保存成功',
        content: `模块 "${module.name || module.id}" 已保存`,
        duration: 3,
      });
    } catch (error) {
      console.error('❌ 模块保存失败:', error);
      Notification.error({
        title: '保存失败',
        content: `模块 "${module.name || module.id}" 保存失败`,
        duration: 5,
      });
    }
  };

  // 表格列定义
  const columns = [
    // 第一列：展开按钮 20px
    {
      key: 'expand',
      width: 20,
      render: (_: any, record: any, index: number, { expandIcon }: any) => expandIcon,
    },
    // 第三列：标签 60px
    {
      key: 'type',
      width: 60,
      render: (_: any, record: any) => {
        if (record.type === 'module') {
          const isNew = record.module?._status === 'new';
          return (
            <Tag
              color="green"
              style={
                isNew
                  ? {
                      boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                      animation: 'pulse 2s infinite',
                    }
                  : {}
              }
            >
              模块
            </Tag>
          );
        }
        if (record.type === 'attribute') {
          const isNew = (record.attribute as any)?._status === 'new';
          return (
            <Tag
              color="blue"
              style={
                isNew
                  ? {
                      boxShadow: '0 0 8px rgba(59, 130, 246, 0.6)',
                      animation: 'pulse 2s infinite',
                    }
                  : {}
              }
            >
              属性
            </Tag>
          );
        }
        return <Tag>{record.type}</Tag>;
      },
    },
    // 第四列：ID 160px
    {
      title: 'ID',
      key: 'id',
      width: 160,
      render: (_: any, record: any) => {
        if (record.type === 'module') {
          const errorMessage = getFieldValidationError(
            record.module._indexId,
            'id',
            record.module.id
          );
          return (
            <ModuleIdInput
              module={record.module}
              onFieldChange={handleModuleFieldChange}
              errorMessage={errorMessage}
            />
          );
        } else if (record.type === 'attribute') {
          const errorMessage = getFieldValidationError(
            record.module._indexId,
            'attribute-id',
            record.attribute.id,
            record.attribute._indexId
          );
          return (
            <AttributeIdInput
              attribute={record.attribute}
              moduleId={record.module?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
              errorMessage={errorMessage}
            />
          );
        }
        return null;
      },
    },
    // 第五列：Name 200px
    {
      title: '名称',
      key: 'name',
      width: 200,
      render: (_: any, record: any) => {
        if (record.type === 'module') {
          return <ModuleNameInput module={record.module} onFieldChange={handleModuleFieldChange} />;
        } else if (record.type === 'attribute') {
          return (
            <AttributeNameInput
              attribute={record.attribute}
              moduleId={record.module?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
            />
          );
        }
        return null;
      },
    },
    // 第六列：操作按钮 100px
    {
      title: () => (
        <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAddModule}>
          添加模块
        </Button>
      ),
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <div
          style={{
            display: 'flex',
            gap: '2px',
            justifyContent: 'flex-start',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 类型选择器 - 只在属性行显示 */}
          {record.type === 'attribute' && record.attribute && (
            <Tooltip content="选择属性类型">
              <EntityPropertyTypeSelector
                value={{ type: record.attribute.type }}
                onChange={(typeInfo) =>
                  handleTypeChange(
                    record.module?._indexId || '',
                    record.attribute._indexId,
                    typeInfo
                  )
                }
              />
            </Tooltip>
          )}

          {/* 模块操作按钮 */}
          {record.type === 'module' &&
            record.module &&
            (() => {
              const module = record.module; // 直接使用模块数据
              const moduleIsDirty = isModuleDirty(module);
              const canSave = canSaveModule(module);

              return (
                <>
                  <Tooltip content={getSaveErrorMessage(module)}>
                    <Popconfirm
                      title="确定保存模块修改吗？"
                      content="保存后将更新到后台数据"
                      onConfirm={async (e) => {
                        e?.stopPropagation?.();
                        await handleSaveModule(module);
                      }}
                    >
                      <Button
                        size="small"
                        type="primary"
                        onClick={(e) => e.stopPropagation()}
                        icon={<IconSave />}
                        disabled={!moduleIsDirty || !canSave}
                        loading={module._editStatus === 'saving'}
                      />
                    </Popconfirm>
                  </Tooltip>
                  {module._status !== 'new' ? (
                    <Tooltip content="撤销修改">
                      <Button
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 实现撤销修改
                          console.log('撤销修改:', module._indexId);
                        }}
                        icon={<IconUndo />}
                        disabled={!moduleIsDirty}
                      />
                    </Tooltip>
                  ) : (
                    <Button size="small" disabled style={{ opacity: 0.3 }} />
                  )}
                  <Tooltip content="添加属性">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAttribute(module._indexId);
                      }}
                      icon={<IconPlus />}
                    />
                  </Tooltip>
                  <Tooltip content="删除模块">
                    <Popconfirm
                      title={
                        module._status === 'new'
                          ? '确定删除这个新增模块吗？'
                          : '确定删除这个模块吗？删除后将从后台数据中移除。'
                      }
                      onConfirm={async (e) => {
                        e?.stopPropagation?.();
                        await handleDeleteModule(module);
                      }}
                    >
                      <Button
                        size="small"
                        type="danger"
                        icon={<IconDelete />}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Popconfirm>
                  </Tooltip>
                </>
              );
            })()}

          {/* 属性删除按钮 */}
          {record.type === 'attribute' && record.module && record.attribute && (
            <Tooltip content="删除属性">
              <Popconfirm
                title="确定删除这个属性吗？"
                onConfirm={(e) => {
                  e?.stopPropagation?.();
                  handleDeleteAttribute(record.module, record.attribute);
                }}
              >
                <Button
                  size="small"
                  type="danger"
                  icon={<IconDelete />}
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  // 事件处理
  const handleDeleteModule = async (module: any) => {
    try {
      console.log('🗑️ 开始删除模块:', module.id);
      await deleteModule(module._indexId);
      console.log('✅ 模块删除成功:', module.id);
      Notification.success({
        title: '删除成功',
        content: `模块 "${module.name || module.id}" 已删除`,
        duration: 3,
      });
    } catch (error) {
      console.error('❌ 模块删除失败:', error);
      Notification.error({
        title: '删除失败',
        content: `模块 "${module.name || module.id}" 删除失败`,
        duration: 5,
      });
    }
  };

  const handleDeleteAttribute = async (module: any, attribute: any) => {
    try {
      console.log('🗑️ 删除属性:', attribute.id, '从模块:', module.id);
      removeAttributeFromModule(module._indexId, attribute._indexId);
      console.log('✅ 属性删除成功');
      Notification.success({
        title: '删除成功',
        content: `属性 "${attribute.name || attribute.id}" 已删除`,
        duration: 3,
      });
    } catch (error) {
      console.error('❌ 属性删除失败:', error);
      Notification.error({
        title: '删除失败',
        content: `属性 "${attribute.name || attribute.id}" 删除失败`,
        duration: 5,
      });
    }
  };

  const handleAddModule = () => {
    const newModule = {
      _indexId: nanoid(), // 使用nanoid作为稳定的React key
      id: '', // 业务ID由用户填写（必填）
      name: '', // 名称可以为空
      attributes: [],
      _status: 'new' as const, // 标记为新增状态
    };

    createModule(newModule);
    console.log('✅ 添加新模块:', newModule._indexId);
  };

  const handleAddAttribute = (moduleId: string) => {
    const newAttribute = {
      _indexId: nanoid(),
      id: '', // 让用户自己填写
      name: '',
      type: 'string',
      _status: 'new' as const, // 标记为新增状态
    };
    addAttributeToModule(moduleId, newAttribute);
    console.log('✅ 为模块添加属性:', moduleId);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px' }}>
        <Input
          placeholder="搜索模块、属性..."
          value={searchText}
          onChange={setSearchText}
          style={{ width: 300 }}
        />
        <Button
          icon={<IconRefresh />}
          onClick={() => {
            console.log('🔄 刷新数据');
            // TODO: 添加数据刷新逻辑
            console.log('🔄 数据已刷新');
          }}
          loading={loading}
        >
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        loading={loading}
        pagination={false}
        childrenRecordName="children"
        defaultExpandAllRows={false}
        expandIcon={false}
        expandRowByClick={true}
        hideExpandedColumn={true}
        indentSize={0}
        size="small"
        style={{ tableLayout: 'fixed' }}
        className="module-list-table"
        scroll={{ x: 580, y: 'calc(100vh - 200px)' }}
        rowKey="key"
        onRow={useCallback((record: any, index?: number) => {
          // 为新增状态的行添加className，避免每次渲染创建新对象
          if (record.type === 'module') {
            const className = record.module?._status === 'new' ? 'module-row-new' : '';
            return {
              className,
              style: {
                backgroundColor: 'var(--semi-color-fill-0)',
                borderBottom: '2px solid var(--semi-color-border)',
              },
            };
          }
          if (record.type === 'attribute') {
            const className =
              (record.attribute as any)?._status === 'new' ? 'attribute-row-new' : '';
            return {
              className,
              style: {
                backgroundColor: 'var(--semi-color-bg-0)',
              },
            };
          }
          return {};
        }, [])}
      />

      <style>
        {`
          .module-list-table .semi-table-tbody > .semi-table-row > .semi-table-row-cell {
            padding-right: 12px;
            padding-left: 8px;
          }

          /* 新增模块行的左边框 */
          .module-list-table .module-row-new {
            border-left: 4px solid var(--semi-color-primary) !important;
          }

          /* 新增属性行的左边框 */
          .module-list-table .attribute-row-new {
            border-left: 4px solid var(--semi-color-primary) !important;
          }

          /* 新增元素的泛光动画 */
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.7; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};
