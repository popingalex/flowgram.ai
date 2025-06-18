import React, { useState, useMemo } from 'react';

import {
  Table,
  Button,
  Space,
  Typography,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Toast,
} from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconPlus } from '@douyinfe/semi-icons';

import { useModuleStore } from '../stores/module.store';

const { Title } = Typography;

interface ModuleTableRow {
  key: string;
  id: string;
  name: string;
  type: 'module' | 'module-attribute';
  moduleId?: string;
  attributeType?: string;
  children?: ModuleTableRow[];
  // 表格需要的字段
  title?: string;
  dataType?: string;
  operations?: string;
}

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

  const [editingModule, setEditingModule] = useState<any>(null);
  const [editingAttribute, setEditingAttribute] = useState<any>(null);
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showAttributeModal, setShowAttributeModal] = useState(false);

  // 将模块数据转换为树形表格数据
  const tableData = useMemo(() => {
    const data: ModuleTableRow[] = [];

    modules.forEach((module) => {
      const moduleRow: ModuleTableRow = {
        key: module._indexId || module.id,
        id: module.id,
        name: module.name,
        type: 'module',
        title: module.name,
        dataType: '模块',
        children: [],
      };

      // 模块属性
      module.attributes?.forEach((attr) => {
        moduleRow.children!.push({
          key: `${module._indexId}-attr-${attr._indexId || attr.id}`,
          id: attr.id,
          name: attr.name || attr.id,
          type: 'module-attribute',
          moduleId: module.id,
          attributeType: attr.type,
          title: attr.name || attr.id,
          dataType: attr.type || 'string',
        });
      });

      data.push(moduleRow);
    });

    return data;
  }, [modules]);

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
    },
    {
      title: '名称',
      dataIndex: 'title',
      key: 'title',
      width: 250,
    },
    {
      title: '类型',
      dataIndex: 'dataType',
      key: 'dataType',
      width: 120,
      render: (text: string, record: ModuleTableRow) => {
        const colorMap = {
          模块: 'green',
          string: 'grey',
          number: 'orange',
          boolean: 'purple',
        };
        return <Tag color={colorMap[text as keyof typeof colorMap] || 'grey'}>{text}</Tag>;
      },
    },
    {
      title: '操作列',
      key: 'operations',
      width: 200,
      render: (text: string, record: ModuleTableRow) => (
        <Space>
          {record.type === 'module' && (
            <>
              <Button
                icon={<IconEdit />}
                size="small"
                onClick={() => handleEditModule(record)}
                title="编辑模块"
              />
              <Button
                icon={<IconPlus />}
                size="small"
                onClick={() => handleAddAttribute(record)}
                title="添加属性"
              />
              <Button
                icon={<IconDelete />}
                size="small"
                type="danger"
                onClick={() => handleDeleteModule(record)}
                title="删除模块"
              />
            </>
          )}
          {record.type === 'module-attribute' && (
            <>
              <Button
                icon={<IconEdit />}
                size="small"
                onClick={() => handleEditAttribute(record)}
                title="编辑属性"
              />
              <Button
                icon={<IconDelete />}
                size="small"
                type="danger"
                onClick={() => handleDeleteAttribute(record)}
                title="删除属性"
              />
            </>
          )}
        </Space>
      ),
    },
  ];

  // 处理编辑模块
  const handleEditModule = (record: ModuleTableRow) => {
    const module = modules.find((m) => m._indexId === record.key);
    setEditingModule(module);
    setShowModuleModal(true);
  };

  // 处理添加属性
  const handleAddAttribute = (record: ModuleTableRow) => {
    setEditingAttribute({ moduleId: record.id, isNew: true });
    setShowAttributeModal(true);
  };

  // 处理编辑属性
  const handleEditAttribute = (record: ModuleTableRow) => {
    const module = modules.find((m) => m.id === record.moduleId);
    const attribute = module?.attributes?.find((a) => a.id === record.id);
    setEditingAttribute({ ...attribute, moduleId: record.moduleId, isNew: false });
    setShowAttributeModal(true);
  };

  // 处理删除模块
  const handleDeleteModule = (record: ModuleTableRow) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除模块 "${record.name}" 吗？`,
      onOk: () => {
        deleteModule(record.key);
        Toast.success('删除成功');
      },
    });
  };

  // 处理删除属性
  const handleDeleteAttribute = (record: ModuleTableRow) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除属性 "${record.name}" 吗？`,
      onOk: () => {
        if (record.moduleId) {
          removeAttributeFromModule(record.moduleId, record.id);
          Toast.success('删除成功');
        }
      },
    });
  };

  // 处理添加新模块
  const handleAddModule = () => {
    setEditingModule(null);
    setShowModuleModal(true);
  };

  return (
    <div style={{ padding: '24px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <Title heading={3}>模块列表</Title>
        <Button type="primary" icon={<IconPlus />} onClick={handleAddModule}>
          添加模块
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        defaultExpandAllRows={false}
        expandIcon={({ expanded, onExpand, record }) =>
          record.children?.length ? (
            <Button size="small" type="tertiary" onClick={(e) => onExpand(record, e)}>
              {expanded ? '收起' : '展开'}
            </Button>
          ) : null
        }
      />

      {/* 模块编辑模态框 */}
      <Modal
        title={editingModule ? '编辑模块' : '添加模块'}
        visible={showModuleModal}
        onCancel={() => setShowModuleModal(false)}
        footer={null}
      >
        <Form
          onSubmit={(values) => {
            if (editingModule) {
              updateModule(editingModule._indexId, values);
              Toast.success('更新成功');
            } else {
              createModule(values);
              Toast.success('添加成功');
            }
            setShowModuleModal(false);
          }}
        >
          <Form.Input
            field="id"
            label="模块ID"
            initValue={editingModule?.id}
            rules={[{ required: true, message: '请输入模块ID' }]}
          />
          <Form.Input
            field="name"
            label="模块名称"
            initValue={editingModule?.name}
            rules={[{ required: true, message: '请输入模块名称' }]}
          />
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setShowModuleModal(false)}>取消</Button>
            <Button type="primary" htmlType="submit" style={{ marginLeft: '8px' }}>
              {editingModule ? '更新' : '添加'}
            </Button>
          </div>
        </Form>
      </Modal>

      {/* 属性编辑模态框 */}
      <Modal
        title={editingAttribute?.isNew ? '添加属性' : '编辑属性'}
        visible={showAttributeModal}
        onCancel={() => setShowAttributeModal(false)}
        footer={null}
      >
        <Form
          onSubmit={(values) => {
            if (editingAttribute?.isNew) {
              addAttributeToModule(editingAttribute.moduleId, values);
              Toast.success('添加成功');
            } else {
              // 对于更新操作，我们需要先删除旧属性，再添加新属性
              removeAttributeFromModule(editingAttribute.moduleId, editingAttribute.id);
              addAttributeToModule(editingAttribute.moduleId, values);
              Toast.success('更新成功');
            }
            setShowAttributeModal(false);
          }}
        >
          <Form.Input
            field="id"
            label="属性ID"
            initValue={editingAttribute?.id}
            rules={[{ required: true, message: '请输入属性ID' }]}
            disabled={!editingAttribute?.isNew}
          />
          <Form.Input
            field="name"
            label="属性名称"
            initValue={editingAttribute?.name}
            rules={[{ required: true, message: '请输入属性名称' }]}
          />
          <Form.Input
            field="type"
            label="属性类型"
            initValue={editingAttribute?.type}
            rules={[{ required: true, message: '请输入属性类型' }]}
            placeholder="如：s, n, b, s[], n[], (field:type,...)[]"
          />
          <div style={{ textAlign: 'right' }}>
            <Button onClick={() => setShowAttributeModal(false)}>取消</Button>
            <Button type="primary" htmlType="submit" style={{ marginLeft: '8px' }}>
              {editingAttribute?.isNew ? '添加' : '更新'}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};
