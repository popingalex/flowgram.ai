import React, { useState, useMemo, useCallback, useRef } from 'react';

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

// 通用字段输入组件 - 🔧 优化memo条件和稳定性
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
    inputKey, // 🔧 添加稳定的key参数
  }: {
    value: string;
    onChange: (newValue: string) => void;
    placeholder: string;
    readonly?: boolean;
    isIdField?: boolean;
    required?: boolean;
    isDuplicate?: boolean;
    errorMessage?: string;
    inputKey?: string; // 🔧 稳定的key，用于防止重绘
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
        key={inputKey} // 🔧 使用稳定的key防止重绘
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
  },
  // 🔧 优化memo条件，只在关键属性变化时重新渲染
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.required === nextProps.required &&
    prevProps.isDuplicate === nextProps.isDuplicate &&
    prevProps.errorMessage === nextProps.errorMessage &&
    prevProps.inputKey === nextProps.inputKey
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
      inputKey={`module-id-${module._indexId}`} // 🔧 使用稳定的inputKey
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
      inputKey={`module-name-${module._indexId}`} // 🔧 使用稳定的inputKey
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
    // 🔧 从modules中获取模块信息
    const { modules } = useModuleStore();
    const module = modules.find((m) => m._indexId === moduleId);

    // 对于模块属性，只显示属性ID部分，不显示模块前缀
    const displayValue =
      attribute.displayId || attribute.id?.split('/').pop() || attribute.id || '';

    return (
      <FieldInput
        value={displayValue}
        onChange={(newValue) => {
          // 🔧 修复：同时更新displayId和完整的id
          onFieldChange(moduleId, attribute._indexId, 'displayId', newValue);
          // 构建完整的模块属性ID：模块ID/属性ID
          const fullId = module?.id ? `${module.id}/${newValue}` : newValue;
          onFieldChange(moduleId, attribute._indexId, 'id', fullId);
        }}
        placeholder="属性ID（必填）"
        isIdField={true}
        required={true}
        errorMessage={errorMessage}
        inputKey={`attr-id-${attribute._indexId}`} // 🔧 使用稳定的inputKey
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
      placeholder="属性名称（可选）"
      required={false} // 🔧 属性名称不是必填项
      inputKey={`attr-name-${attribute._indexId}`} // 🔧 使用稳定的inputKey
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
    resetModuleChanges,
    resetModuleChangesById,
  } = useModuleStore();

  const [searchText, setSearchText] = useState('');

  // 🔧 优化调试：减少日志频率，只在模块数量变化时输出
  const prevModulesLengthRef = useRef(modules.length);
  if (modules.length !== prevModulesLengthRef.current) {
    console.log(
      '🔄 ModuleListPage模块数量变化:',
      prevModulesLengthRef.current,
      '->',
      modules.length
    );
    prevModulesLengthRef.current = modules.length;
  }

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

  // 🎯 检查模块是否有修改 - 直接检查模块状态（参考实体的实现）
  const isModuleDirty = useCallback((module: any) => {
    const status = module._status;
    return status === 'dirty' || status === 'new';
  }, []);

  // 转换为表格数据 - 带排序逻辑（参考实体的实现）
  const tableData = useMemo(() => {
    console.log('🔄 重新计算表格数据，模块:', modules);
    const data: any[] = [];

    // 模块排序：新增的在前，然后按ID排序
    const sortedModules = [...modules].sort((a, b) => {
      // 新增状态的模块排在前面
      if (a._status === 'new' && b._status !== 'new') return -1;
      if (a._status !== 'new' && b._status === 'new') return 1;
      // 同样状态的按ID排序，确保id不为空
      return (a.id || '').localeCompare(b.id || '');
    });

    sortedModules.forEach((module) => {
      const moduleRow: any = {
        key: module._indexId,
        type: 'module',
        module: module,
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
  }, [modules]); // 🎯 简化依赖，只依赖modules

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
      console.log('🔍 更新模块字段（立即更新到store）:', moduleIndexId, field, value);
      // 🎯 直接更新到store中，而不是本地状态
      updateModuleField(moduleIndexId, field, value);
    },
    [updateModuleField]
  );

  const handleAttributeFieldChange = useCallback(
    (moduleIndexId: string, attributeIndexId: string, field: string, value: any) => {
      console.log(
        '🔍 更新属性字段（立即更新到store）:',
        moduleIndexId,
        attributeIndexId,
        field,
        value
      );
      // 🎯 直接更新到store中，而不是本地状态
      updateModuleAttribute(moduleIndexId, attributeIndexId, field, value);
    },
    [updateModuleAttribute]
  );

  const handleTypeChange = (moduleId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(moduleId, attributeId, 'type', typeInfo.type);
  };

  // 🎯 模块保存逻辑 - 简化版本，直接保存store中的数据
  const handleSaveModule = async (module: any) => {
    try {
      // 直接保存模块，数据已经在store中了
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
      width: 80,
      render: (_: any, record: any) => {
        if (record.type === 'module') {
          const isNew = record.module?._status === 'new';
          const attributeCount = record.module?.attributes?.length || 0;

          return (
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
                模块
              </Tag>
            </Badge>
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
    // 第四列：名称
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
          {/* 类型选择器和数据限制按钮 - 只在属性行显示 */}
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
                          resetModuleChangesById(module.id);
                          console.log('撤销修改:', module.id);
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
          if (record.type === 'module' && record.module?._status === 'new') {
            return { className: 'module-row-new' };
          }
          if (record.type === 'attribute' && (record.attribute as any)?._status === 'new') {
            return { className: 'attribute-row-new' };
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
