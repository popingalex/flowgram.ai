import React, { useState, useEffect, useMemo } from 'react';

import { Table, Modal, Button, Input, Space, Typography, Tag } from '@douyinfe/semi-ui';
import { IconSearch } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { useModuleStore, Module, ModuleAttribute } from '../../../stores/module.store';
import { useEntityListStore } from '../../../stores/entity-list';

const { Text } = Typography;

// 定义表格数据结构
interface ModuleTableData extends Module {
  key: string;
  children?: ModuleAttributeTableData[];
}

interface ModuleAttributeTableData extends ModuleAttribute {
  key: string;
  isAttribute: true;
  parentModuleId: string;
}

interface ModuleSelectorTableModalProps {
  visible: boolean;
  selectedModuleIds: string[];
  onConfirm: (selectedModuleIds: string[]) => void;
  onCancel: () => void;
  entityId?: string; // 用于关联的实体ID
}

export const ModuleSelectorTableModal: React.FC<ModuleSelectorTableModalProps> = ({
  visible,
  selectedModuleIds,
  onConfirm,
  onCancel,
  entityId,
}) => {
  const { modules, loading } = useModuleStore();
  const { entities } = useEntityListStore();
  const [searchText, setSearchText] = useState('');
  const [tempSelectedKeys, setTempSelectedKeys] = useState<string[]>([]);

  // 获取当前实体名称
  const currentEntity = useMemo(
    () => entities.find((e) => e.id === entityId || e._indexId === entityId),
    [entities, entityId]
  );

  useEffect(() => {
    if (visible) {
      console.log('🔍 ModuleSelectorTableModal: 初始化选中状态:', { selectedModuleIds });
      // 根据selectedModuleIds查找对应的_indexId
      const indexIds = selectedModuleIds.map((moduleId) => {
        const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
        return module?._indexId || moduleId;
      });
      setTempSelectedKeys(indexIds);
    }
  }, [visible, selectedModuleIds, modules]);

  // 过滤模块
  const filteredModules = useMemo(
    () =>
      modules.filter((module) => {
        if (!searchText) return true;
        const searchTermLower = searchText.toLowerCase();
        const nameMatch = module.name.toLowerCase().includes(searchTermLower);
        const idMatch = module.id.toLowerCase().includes(searchTermLower);
        const descriptionMatch =
          module.description?.toLowerCase().includes(searchTermLower) || false;
        return nameMatch || idMatch || descriptionMatch;
      }),
    [modules, searchText]
  );

  // 转换为表格数据
  const tableData: ModuleTableData[] = useMemo(
    () =>
      filteredModules.map((module) => ({
        ...module,
        key: module._indexId || module.id,
        children:
          module.attributes?.map((attr) => ({
            ...attr,
            key: `${module._indexId || module.id}-${attr.id}`,
            isAttribute: true,
            parentModuleId: module.id,
          })) || [],
      })),
    [filteredModules]
  );

  // 检查是否有修改
  const hasChanges = useMemo(() => {
    const originalIndexIds = selectedModuleIds
      .map((moduleId) => {
        const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
        return module?._indexId || moduleId;
      })
      .sort();

    const currentIndexIds = [...tempSelectedKeys].sort();

    return JSON.stringify(originalIndexIds) !== JSON.stringify(currentIndexIds);
  }, [selectedModuleIds, tempSelectedKeys, modules]);

  const handleConfirm = () => {
    console.log('✅ ModuleSelectorTableModal: 确认选择:', { tempSelectedKeys });
    // 将_indexId转换回moduleId，并去重过滤
    const moduleIds = Array.from(
      new Set(
        tempSelectedKeys
          .map((indexId) => {
            const module = modules.find((m) => m._indexId === indexId);
            return module?.id;
          })
          .filter((id): id is string => Boolean(id)) // 类型守卫，确保只有string类型
      )
    );
    console.log('🔄 转换后的moduleIds:', { moduleIds });
    onConfirm(moduleIds);
  };

  const handleCancel = () => {
    setSearchText('');
    // 重置选中状态
    const indexIds = selectedModuleIds.map((moduleId) => {
      const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
      return module?._indexId || moduleId;
    });
    setTempSelectedKeys(indexIds);
    onCancel();
  };

  // 行选择配置
  const rowSelection: any = {
    selectedRowKeys: tempSelectedKeys,
    onSelect: (record: any, selected: boolean) => {
      if (!record) return;
      console.log('🔄 行选择:', { record: record.key, selected });
      setTempSelectedKeys((prev) =>
        selected ? [...prev, record.key] : prev.filter((key) => key !== record.key)
      );
    },
    onSelectAll: (selected: boolean, selectedRows: any[], changedRows: any[]) => {
      console.log('🔄 全选:', { selected, changedRows });
      if (selected) {
        const allKeys = tableData.map((row) => row.key);
        setTempSelectedKeys(allKeys);
      } else {
        setTempSelectedKeys([]);
      }
    },
    getCheckboxProps: (record: any) => ({
      // 只允许选择模块，不允许选择模块属性
      disabled: 'isAttribute' in record,
    }),
  };

  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      ellipsis: true,
      render: (text: string, record: ModuleTableData | ModuleAttributeTableData) => {
        // 模块属性去掉前缀显示
        const displayText =
          'isAttribute' in record
            ? record.displayId || record.id?.split('/').pop() || record.id
            : text;

        return (
          <Text
            style={{
              fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
              fontSize: '12px',
            }}
            ellipsis={{ showTooltip: true }}
          >
            {displayText}
          </Text>
        );
      },
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      ellipsis: true,
      render: (text: string, record: ModuleTableData | ModuleAttributeTableData) => (
        <Text style={{ fontSize: '13px' }} ellipsis={{ showTooltip: true }}>
          {text}
        </Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (text: string, record: ModuleTableData | ModuleAttributeTableData) => {
        if ('isAttribute' in record) {
          // 模块属性显示类型选择器
          return (
            <EntityPropertyTypeSelector
              value={{ type: text }}
              disabled={true} // 只读模式
            />
          );
        }
        // 模块行不显示类型
        return null;
      },
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (text: string, record: ModuleTableData | ModuleAttributeTableData) => (
        <Text type="tertiary" style={{ fontSize: '12px' }} ellipsis={{ showTooltip: true }}>
          {text || '暂无描述'}
        </Text>
      ),
    },
  ];

  const modalTitle = currentEntity
    ? `模块配置 - ${currentEntity.name} (${currentEntity.id})`
    : '模块配置';

  return (
    <Modal
      title={modalTitle}
      visible={visible}
      onOk={handleConfirm}
      onCancel={handleCancel}
      width={900}
      height={700}
      bodyStyle={{ padding: '16px' }}
      okText="更新"
      cancelText="取消"
      okButtonProps={{ disabled: !hasChanges }}
    >
      <div style={{ marginBottom: '16px' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            prefix={<IconSearch />}
            placeholder="搜索模块..."
            value={searchText}
            onChange={setSearchText}
            style={{ width: '300px' }}
          />
          <Text type="secondary">已选择 {tempSelectedKeys.length} 个模块</Text>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={tableData}
        loading={loading}
        pagination={false}
        childrenRecordName="children"
        defaultExpandAllRows={false}
        expandRowByClick={true}
        hideExpandedColumn={false}
        indentSize={20}
        size="small"
        scroll={{ y: 500 }}
        rowSelection={rowSelection}
      />
    </Modal>
  );
};
