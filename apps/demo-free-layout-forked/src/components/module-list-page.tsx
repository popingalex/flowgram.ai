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
  Badge,
} from '@douyinfe/semi-ui';
import {
  IconPlus,
  IconDelete,
  IconEdit,
  IconSave,
  IconUndo,
  IconRefresh,
  IconLink,
} from '@douyinfe/semi-icons';

import { DataRestrictionButton, EntityPropertyTypeSelector } from './ext/type-selector-ext';
import { SearchFilterBar } from './ext/search-filter-bar';
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
    addModule,
    updateModuleField,
    updateModuleAttribute,
    saveModule,
    deleteModule,
    addAttributeToModuleLocal,
    removeAttributeFromModuleLocal,
    loadModules,
  } = useModuleStore();

  const [searchText, setSearchText] = useState('');

  // 🐛 调试：监控组件重新渲染
  console.log(
    '🔄 ModuleListPage重新渲染，模块数量:',
    modules.length,
    '第一个模块状态:',
    modules[0]?._status,
    '加载状态:',
    loading
  );

  // 初始化加载
  React.useEffect(() => {
    console.log('🔄 ModuleListPage useEffect: 手动触发loadModules');
    loadModules();
  }, [loadModules]);

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

  // 🎯 本地编辑状态 - 避免每次输入都更新全局store（参考实体的实现）
  const [localEdits, setLocalEdits] = useState<Map<string, any>>(new Map());

  // 检查模块是否有修改（包括本地编辑状态）
  const isModuleDirty = useCallback(
    (module: any) => {
      const status = module._status;
      const hasLocalEdits = localEdits.has(module._indexId);
      return status === 'dirty' || status === 'new' || hasLocalEdits;
    },
    [localEdits]
  );

  // 🎯 获取合并后的模块数据（原始数据 + 本地编辑）
  const getMergedModule = useCallback(
    (module: any) => {
      const localEdit = localEdits.get(module._indexId);
      if (!localEdit) return module;

      const mergedModule = { ...module, ...localEdit };

      // 合并属性编辑
      if (localEdit.attributes) {
        mergedModule.attributes = (module.attributes || []).map((attr: any) => {
          const attrEdit = localEdit.attributes[attr._indexId];
          return attrEdit ? { ...attr, ...attrEdit } : attr;
        });
      }

      return mergedModule;
    },
    [localEdits]
  );

  // 🎯 应用本地编辑到store（保存时调用）- 参考实体的实现
  const applyLocalEdits = useCallback(
    async (moduleIndexId: string) => {
      const localEdit = localEdits.get(moduleIndexId);
      if (!localEdit) return;

      const originalModule = modules.find((m) => m._indexId === moduleIndexId);
      if (!originalModule) return;

      try {
        console.log('🔍 应用本地编辑到store:', moduleIndexId, localEdit);

        // 应用模块字段编辑
        if (localEdit.id !== undefined || localEdit.name !== undefined) {
          Object.keys(localEdit).forEach((field) => {
            if (field !== 'attributes' && localEdit[field] !== undefined) {
              updateModuleField(moduleIndexId, field, localEdit[field]);
            }
          });
        }

        // 应用属性编辑
        if (localEdit.attributes) {
          Object.keys(localEdit.attributes).forEach((attrId) => {
            const attrEdit = localEdit.attributes[attrId];
            Object.keys(attrEdit).forEach((field) => {
              updateModuleAttribute(moduleIndexId, attrId, field, attrEdit[field]);
            });
          });
        }

        // 清除本地编辑状态
        setLocalEdits((prev) => {
          const newEdits = new Map(prev);
          newEdits.delete(moduleIndexId);
          return newEdits;
        });
      } catch (error) {
        console.error('❌ 应用本地编辑失败:', error);
      }
    },
    [localEdits, modules, updateModuleField, updateModuleAttribute]
  );

  // 转换为表格数据 - 带排序逻辑，使用合并后的数据
  const tableData = useMemo(() => {
    console.log('🔄 重新计算表格数据，模块数量:', modules.length, '本地编辑数量:', localEdits.size);
    const data: any[] = [];

    // 模块排序：新增的在前，然后按ID排序
    const sortedModules = [...modules].sort((a, b) => {
      // 新增状态的模块排在前面
      if (a._status === 'new' && b._status !== 'new') return -1;
      if (a._status !== 'new' && b._status === 'new') return 1;
      // 同样状态的按ID排序，确保id不为空
      return (a.id || '').localeCompare(b.id || '');
    });

    sortedModules.forEach((originalModule) => {
      // 🎯 使用合并后的模块数据（原始数据 + 本地编辑）
      const module = getMergedModule(originalModule);

      const moduleRow: any = {
        key: module._indexId,
        type: 'module',
        module: module, // 🎯 使用合并后的模块数据
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
  }, [modules, localEdits, getMergedModule]); // 🎯 添加localEdits依赖

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

  // 🎯 字段变更处理 - 使用本地状态，避免频繁更新store
  const handleModuleFieldChange = useCallback(
    (moduleIndexId: string, field: string, value: any) => {
      console.log('🔍 更新模块字段（本地）:', moduleIndexId, field, value);
      setLocalEdits((prev) => {
        const newEdits = new Map(prev);
        const currentEdit = newEdits.get(moduleIndexId) || {};
        newEdits.set(moduleIndexId, { ...currentEdit, [field]: value });
        return newEdits;
      });
    },
    []
  );

  const handleAttributeFieldChange = useCallback(
    (moduleIndexId: string, attributeIndexId: string, field: string, value: any) => {
      console.log('🔍 更新属性字段（本地）:', moduleIndexId, attributeIndexId, field, value);
      setLocalEdits((prev) => {
        const newEdits = new Map(prev);
        const currentEdit = newEdits.get(moduleIndexId) || {};
        const attributes = currentEdit.attributes || {};
        newEdits.set(moduleIndexId, {
          ...currentEdit,
          attributes: {
            ...attributes,
            [attributeIndexId]: { ...attributes[attributeIndexId], [field]: value },
          },
        });
        return newEdits;
      });
    },
    []
  );

  const handleTypeChange = (moduleId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(moduleId, attributeId, 'type', typeInfo.type);
  };

  // 🎯 模块保存逻辑 - 参考实体的实现
  const handleSaveModule = async (module: any) => {
    try {
      // 先应用本地编辑到store
      await applyLocalEdits(module._indexId);
      // 然后保存模块
      await saveModule(module);
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
    // 第一列：展开按钮
    {
      key: 'expand',
      title: '',
      width: 40,
      render: (_: any, record: any, index: number, { expandIcon }: any) => expandIcon,
    },
    // 第二列：类型标签
    {
      key: 'type',
      title: '类型',
      width: 60,
      render: (_: any, record: any) => {
        if (record.type === 'module') {
          const isNew = record.module?._status === 'new';
          const attributeCount = record.module?.attributes?.length || 0;

          return (
            <Tooltip
              content={`模块详情页面: /modules/${record.module?.id || 'new'}`}
              position="bottom"
            >
              <Badge
                count={attributeCount > 0 ? attributeCount : undefined}
                overflowCount={99}
                type="success"
                theme="inverted"
                data-badge-type="success"
              >
                <Tag
                  color="green"
                  style={
                    isNew
                      ? {
                          boxShadow: '0 0 8px rgba(34, 197, 94, 0.6)',
                          animation: 'pulse 2s infinite',
                          cursor: 'pointer',
                        }
                      : { cursor: 'pointer' }
                  }
                  onClick={(e) => {
                    e.stopPropagation();
                    if (e.ctrlKey || e.metaKey) {
                      // Ctrl/Cmd + 点击在新窗口打开
                      window.open(`/modules/${record.module?.id || 'new'}`, '_blank');
                    } else {
                      // 普通点击在当前窗口导航
                      window.location.href = `/modules/${record.module?.id || 'new'}`;
                    }
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>模块</span>
                </Tag>
              </Badge>
            </Tooltip>
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
    // 第三列：ID
    {
      title: 'ID',
      key: 'id',
      width: 200,
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
    // 第四列：Name
    {
      title: '名称',
      key: 'name',
      width: 240,
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
    // 第五列：操作按钮
    {
      title: () => (
        <Button size="small" icon={<IconPlus />} type="primary" onClick={handleAddModule}>
          添加模块
        </Button>
      ),
      key: 'actions',
      // width: 100, // 移除固定宽度，让其自适应
      render: (_: any, record: any) => (
        <div
          style={{
            display: 'flex',
            gap: '2px',
            justifyContent: 'flex-start',
            alignItems: 'center',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 类型选择器 - 只在属性行显示 */}
          {record.type === 'attribute' && record.attribute && (
            <>
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
              <DataRestrictionButton
                value={{ type: record.attribute.type }}
                onClick={() => {
                  console.log('编辑数据限制:', record.attribute);
                }}
                disabled={record.readonly}
              />
            </>
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
            <>
              <Button size="small" disabled style={{ opacity: 0.3 }} />
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
            </>
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

      // 如果属性是新增状态，直接从本地删除
      if (attribute._status === 'new') {
        console.log('🗑️ 删除新增属性（仅本地）:', attribute.id);
        removeAttributeFromModuleLocal(module._indexId, attribute._indexId);
        console.log('✅ 属性删除成功');
        Notification.success({
          title: '删除成功',
          content: `属性 "${attribute.name || attribute.id}" 已删除`,
          duration: 3,
        });
        return;
      }

      // 已保存的属性需要先本地删除，然后等用户保存模块时一起保存
      removeAttributeFromModuleLocal(module._indexId, attribute._indexId);
      console.log('✅ 属性删除成功（需保存模块以同步到后台）');
      Notification.success({
        title: '删除成功',
        content: `属性 "${attribute.name || attribute.id}" 已删除，请保存模块以同步到后台`,
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
      id: '', // 业务ID由用户填写（必填）
      name: '', // 名称可以为空
      attributes: [],
    };

    addModule(newModule);
    console.log('✅ 添加新模块到本地状态');
  };

  const handleAddAttribute = (moduleId: string) => {
    const newAttribute = {
      id: '', // 让用户自己填写
      name: '',
      type: 'string',
    };
    addAttributeToModuleLocal(moduleId, newAttribute);
    console.log('✅ 为模块添加属性:', moduleId);
  };

  return (
    <div style={{ padding: '24px', minWidth: '720px', maxWidth: '960px' }}>
      <SearchFilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        onRefresh={async () => {
          console.log('🔄 刷新模块数据');
          await loadModules();
          console.log('🔄 模块数据已刷新');
        }}
        loading={loading}
        placeholder="搜索模块、属性..."
      />
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
        scroll={{ y: 'calc(100vh - 186px)' }}
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
            padding-right: 8px;
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

          /* Badge深色边框样式 - 通用样式 */
          .module-list-table .semi-badge .semi-badge-count,
          .module-list-table .semi-badge-count {
            border: 1px solid var(--semi-color-text-1) !important;
            box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.15) !important;
            min-width: 16px !important;
            height: 16px !important;
            font-size: 10px !important;
            line-height: 14px !important;
            padding: 0 4px !important;
            transform: scale(0.8) !important;
            transform-origin: center !important;
          }

          /* 调整Badge位置，避免完全覆盖标签 */
          .module-list-table .semi-badge {
            position: relative !important;
          }

          .module-list-table .semi-badge .semi-badge-count {
            top: -8px !important;
            right: -8px !important;
          }

          /* success类型Badge的边框颜色 */
          .module-list-table .semi-badge-success .semi-badge-count,
          .module-list-table [data-badge-type="success"] .semi-badge-count {
            border-color: var(--semi-color-success) !important;
            box-shadow: 0 0 0 1px var(--semi-color-success) !important;
          }
        `}
      </style>
    </div>
  );
};
