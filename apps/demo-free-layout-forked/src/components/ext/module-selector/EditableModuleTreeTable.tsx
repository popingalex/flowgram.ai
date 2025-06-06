import React from 'react';

import { nanoid } from 'nanoid';
import { Table, Button, Input, Space, Popconfirm, Tooltip } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';

import { useModuleStore, Module, ModuleAttribute } from '../../../stores/module.store';

// 定义树形表格的数据结构
interface ModuleTreeData extends Module {
  key: string;
  children?: ModuleAttributeTreeData[];
}

interface ModuleAttributeTreeData extends ModuleAttribute {
  key: string;
  isAttribute: true;
  parentModuleId: string;
}

export const EditableModuleTreeTable = () => {
  const {
    modules,
    createModule,
    updateModule,
    deleteModule,
    addAttributeToModule,
    removeAttributeFromModule,
  } = useModuleStore();

  const handleAddModule = () => {
    createModule({
      id: `new_module_${nanoid(4)}`,
      name: '新模块',
      description: '',
      attributes: [],
    });
  };

  const handleDeleteModule = (moduleId: string) => {
    deleteModule(moduleId);
  };

  const handleAddAttribute = (moduleId: string) => {
    addAttributeToModule(moduleId, {
      id: `new_attr_${nanoid(4)}`,
      name: '新属性',
      type: 's',
      description: '',
    });
  };

  const handleRemoveAttribute = (moduleId: string, attributeId: string) => {
    removeAttributeFromModule(moduleId, attributeId);
  };

  const handleModuleFieldChange = (moduleId: string, field: keyof Module, value: string) => {
    const module = modules.find((m) => m.id === moduleId);
    if (module) {
      updateModule(moduleId, { ...module, [field]: value });
    }
  };

  const handleAttributeFieldChange = (
    moduleId: string,
    attributeId: string,
    field: keyof ModuleAttribute,
    value: string
  ) => {
    const module = modules.find((m) => m.id === moduleId);
    const attribute = module?.attributes.find((a) => a.id === attributeId);
    if (module && attribute) {
      const updatedAttribute = { ...attribute, [field]: value };
      const updatedAttributes = module.attributes.map((a) =>
        a.id === attributeId ? updatedAttribute : a
      );
      updateModule(moduleId, { ...module, attributes: updatedAttributes });
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (text: string, record: ModuleTreeData | ModuleAttributeTreeData) => {
        if ('isAttribute' in record) {
          return (
            <Input
              size="small"
              value={record.id}
              onChange={(value) =>
                handleAttributeFieldChange(record.parentModuleId, record.id, 'id', value)
              }
            />
          );
        } else {
          return (
            <Input
              size="small"
              value={record.id}
              onChange={(value) => handleModuleFieldChange(record.id, 'id', value)}
            />
          );
        }
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (text: string, record: ModuleTreeData | ModuleAttributeTreeData) => {
        if ('isAttribute' in record) {
          return (
            <Input
              size="small"
              value={record.name}
              onChange={(value) =>
                handleAttributeFieldChange(record.parentModuleId, record.id, 'name', value)
              }
            />
          );
        } else {
          return (
            <Input
              size="small"
              value={record.name}
              onChange={(value) => handleModuleFieldChange(record.id, 'name', value)}
            />
          );
        }
      },
    },
    {
      title: '操作',
      key: 'actions',
      render: (text: string, record: ModuleTreeData | ModuleAttributeTreeData) => {
        if ('isAttribute' in record) {
          return (
            <Popconfirm
              title="确定删除此属性?"
              onConfirm={() => handleRemoveAttribute(record.parentModuleId, record.id)}
            >
              <Button type="danger" size="small" icon={<IconDelete />} />
            </Popconfirm>
          );
        } else {
          return (
            <Space>
              <Button
                size="small"
                icon={<IconPlus />}
                onClick={() => handleAddAttribute(record.id)}
              >
                添加属性
              </Button>
              <Popconfirm title="确定删除此模块?" onConfirm={() => handleDeleteModule(record.id)}>
                <Button type="danger" size="small" icon={<IconDelete />} />
              </Popconfirm>
            </Space>
          );
        }
      },
    },
  ];

  const dataSource: ModuleTreeData[] = modules.map((m) => ({
    ...m,
    key: m.id,
    children: m.attributes.map((a) => ({
      ...a,
      key: `${m.id}-${a.id}`,
      isAttribute: true,
      parentModuleId: m.id,
    })),
  }));

  return (
    <div>
      <Button icon={<IconPlus />} onClick={handleAddModule} style={{ marginBottom: 12 }}>
        添加新模块
      </Button>
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={false}
        rowExpandable={(record) => !!(record?.children && record.children.length > 0)}
        defaultExpandAllRows={true}
        hideExpandedColumn={false}
      />
    </div>
  );
};
