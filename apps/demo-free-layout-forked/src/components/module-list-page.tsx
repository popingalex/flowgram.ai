import React, { useState, useMemo } from 'react';

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

// 模块ID输入组件
const ModuleIdInput = React.memo(
  ({
    module,
    onFieldChange,
  }: {
    module: any;
    onFieldChange: (moduleId: string, field: string, value: any) => void;
  }) => (
    <Input
      value={module.id}
      onChange={(newValue) => onFieldChange(module._indexId, 'id', newValue)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      size="small"
      placeholder="模块ID"
      style={{
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: '12px',
      }}
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
    <Input
      value={module.name}
      onChange={(newValue) => onFieldChange(module._indexId, 'name', newValue)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      size="small"
      placeholder="模块名称"
      style={{ fontSize: '13px' }}
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
  }: {
    attribute: any;
    moduleId: string;
    onFieldChange: (moduleId: string, attributeId: string, field: string, value: any) => void;
  }) => {
    // 对于模块属性，只显示属性ID部分，不显示模块前缀
    const displayValue =
      attribute.displayId || attribute.id?.split('/').pop() || attribute.id || '';

    return (
      <Input
        value={displayValue}
        onChange={(newValue) => onFieldChange(moduleId, attribute._indexId, 'id', newValue)}
        onClick={(e) => e.stopPropagation()}
        onFocus={(e) => e.stopPropagation()}
        size="small"
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
    <Input
      value={attribute.name}
      onChange={(newValue) => onFieldChange(moduleId, attribute._indexId, 'name', newValue)}
      onClick={(e) => e.stopPropagation()}
      onFocus={(e) => e.stopPropagation()}
      size="small"
      placeholder="属性名称"
      style={{ fontSize: '13px' }}
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
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingChanges, setEditingChanges] = useState<Record<string, any>>({});

  // 转换为表格数据
  const tableData = useMemo(() => {
    const data: any[] = [];

    modules.forEach((module) => {
      const moduleRow: any = {
        key: module._indexId,
        type: 'module',
        module: module,
        children: [] as any[],
      };

      // 模块属性
      module.attributes?.forEach((attr: any) => {
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
  }, [modules]);

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

  // 获取显示数据（包含编辑中的更改）
  const getDisplayModule = (module: any) => {
    const changes = editingChanges[module._indexId];
    return changes ? { ...module, ...changes } : module;
  };

  const getDisplayAttribute = (module: any, attribute: any) => {
    const moduleChanges = editingChanges[module._indexId];
    if (moduleChanges?.attributes) {
      const attrChanges = moduleChanges.attributes.find(
        (a: any) => a._indexId === attribute._indexId
      );
      return attrChanges ? { ...attribute, ...attrChanges } : attribute;
    }
    return attribute;
  };

  // 字段变更处理
  const handleModuleFieldChange = (moduleId: string, field: string, value: any) => {
    setEditingChanges((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }));
  };

  const handleAttributeFieldChange = (
    moduleId: string,
    attributeId: string,
    field: string,
    value: any
  ) => {
    setEditingChanges((prev) => {
      const moduleChanges = prev[moduleId] || {};
      const attributes = moduleChanges.attributes || [];
      const existingAttrIndex = attributes.findIndex((a: any) => a._indexId === attributeId);

      let newAttributes;
      if (existingAttrIndex >= 0) {
        newAttributes = [...attributes];
        newAttributes[existingAttrIndex] = {
          ...newAttributes[existingAttrIndex],
          [field]: value,
        };
      } else {
        newAttributes = [...attributes, { _indexId: attributeId, [field]: value }];
      }

      return {
        ...prev,
        [moduleId]: {
          ...moduleChanges,
          attributes: newAttributes,
        },
      };
    });
  };

  const handleTypeChange = (moduleId: string, attributeId: string, typeInfo: any) => {
    handleAttributeFieldChange(moduleId, attributeId, 'type', typeInfo.type);
  };

  // 检查是否有修改
  const hasChanges = (moduleId: string) => !!editingChanges[moduleId];

  // 保存更改
  const handleSaveChanges = async (moduleId: string) => {
    const changes = editingChanges[moduleId];
    if (!changes) return;

    const module = modules.find((m) => m._indexId === moduleId);
    if (!module) return;

    try {
      const updatedModule = { ...module };

      // 更新模块基本信息
      if (changes.id !== undefined) updatedModule.id = changes.id;
      if (changes.name !== undefined) updatedModule.name = changes.name;

      // 更新属性
      if (changes.attributes) {
        updatedModule.attributes = updatedModule.attributes?.map((attr) => {
          const attrChanges = changes.attributes.find((a: any) => a._indexId === attr._indexId);
          return attrChanges ? { ...attr, ...attrChanges } : attr;
        });
      }

      // 调用模块 store 的更新方法，这会触发 API 保存
      await updateModule(moduleId, updatedModule);

      // 清除编辑状态
      setEditingChanges((prev) => {
        const newChanges = { ...prev };
        delete newChanges[moduleId];
        return newChanges;
      });

      console.log('✅ 模块保存成功:', moduleId);
    } catch (error) {
      console.error('❌ 模块保存失败:', error);
    }
  };

  // 撤销更改
  const handleResetChanges = (moduleId: string) => {
    setEditingChanges((prev) => {
      const newChanges = { ...prev };
      delete newChanges[moduleId];
      return newChanges;
    });
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
        if (record.type === 'module') return <Tag color="green">模块</Tag>;
        if (record.type === 'attribute') return <Tag color="blue">属性</Tag>;
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
          const displayModule = getDisplayModule(record.module);
          return <ModuleIdInput module={displayModule} onFieldChange={handleModuleFieldChange} />;
        } else if (record.type === 'attribute') {
          const displayAttribute = getDisplayAttribute(record.module, record.attribute);
          return (
            <AttributeIdInput
              attribute={displayAttribute}
              moduleId={record.module?._indexId || ''}
              onFieldChange={handleAttributeFieldChange}
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
          const displayModule = getDisplayModule(record.module);
          return <ModuleNameInput module={displayModule} onFieldChange={handleModuleFieldChange} />;
        } else if (record.type === 'attribute') {
          const displayAttribute = getDisplayAttribute(record.module, record.attribute);
          return (
            <AttributeNameInput
              attribute={displayAttribute}
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
                value={{ type: getDisplayAttribute(record.module, record.attribute).type }}
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
              const module = record.module;
              const moduleHasChanges = hasChanges(module._indexId);

              return (
                <>
                  <Tooltip content="保存模块修改">
                    <Button
                      size="small"
                      type="primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveChanges(module._indexId);
                      }}
                      icon={<IconSave />}
                      disabled={!moduleHasChanges}
                    />
                  </Tooltip>
                  <Tooltip content="撤销修改">
                    <Button
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleResetChanges(module._indexId);
                      }}
                      icon={<IconUndo />}
                      disabled={!moduleHasChanges}
                    />
                  </Tooltip>
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
                      title="确定删除这个模块吗？"
                      onConfirm={(e) => {
                        e?.stopPropagation?.();
                        handleDeleteModule(module);
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
  const handleDeleteModule = (module: any) => {
    deleteModule(module._indexId);
  };

  const handleDeleteAttribute = (module: any, attribute: any) => {
    removeAttributeFromModule(module._indexId, attribute._indexId);
  };

  const handleAddModule = () => {
    setShowModuleModal(true);
  };

  const handleAddAttribute = (moduleId: string) => {
    const newAttribute = {
      _indexId: `attr_${Date.now()}`,
      id: `new_attr_${Date.now()}`,
      name: '新属性',
      type: 'string',
    };
    addAttributeToModule(moduleId, newAttribute);
  };

  const handleSaveModule = (values: any) => {
    const newModule = {
      _indexId: `module_${Date.now()}`,
      id: values.id,
      name: values.name,
      attributes: [],
    };
    createModule(newModule);
    setShowModuleModal(false);
  };

  return (
    <div style={{ padding: '24px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '16px' }}>
        <Input
          placeholder="搜索模块、属性..."
          value={searchText}
          onChange={setSearchText}
          style={{ width: 300 }}
        />
      </div>

      <div style={{ flex: 1, overflow: 'hidden' }}>
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
          scroll={{ x: 580 }}
          onRow={(record, index) => {
            // 模块行背景色
            if (record.type === 'module') {
              return {
                style: {
                  backgroundColor: 'var(--semi-color-fill-0)',
                  borderBottom: '2px solid var(--semi-color-border)',
                },
              };
            }
            // 属性行
            if (record.type === 'attribute') {
              return {
                style: {
                  backgroundColor: 'var(--semi-color-bg-0)',
                },
              };
            }
            return {};
          }}
        />
      </div>

      <style>
        {`
          .module-list-table .semi-table-tbody > .semi-table-row > .semi-table-row-cell {
            padding-right: 12px;
            padding-left: 8px;
          }
        `}
      </style>

      {/* 添加模块弹窗 */}
      <Modal
        title="添加模块"
        visible={showModuleModal}
        onCancel={() => setShowModuleModal(false)}
        footer={null}
      >
        <Form onSubmit={handleSaveModule}>
          <Form.Input
            field="id"
            label="模块ID"
            placeholder="模块ID"
            rules={[{ required: true, message: '请输入模块ID' }]}
          />
          <Form.Input
            field="name"
            label="模块名称"
            placeholder="模块名称"
            rules={[{ required: true, message: '请输入模块名称' }]}
          />
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setShowModuleModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
