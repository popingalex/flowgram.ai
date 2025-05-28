// @ts-nocheck
import React, { useState, useMemo, useRef } from 'react';

import {
  Modal,
  Form,
  Input,
  Button,
  Space,
  Typography,
  Tag,
  Empty,
  List,
  TagInput,
  Popconfirm,
  Tooltip,
  RadioGroup,
} from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconEdit,
  IconDelete,
  IconSave,
  IconClose,
} from '@douyinfe/semi-icons';

import { useEnumStore, EnumClass } from './enum-store';
import { EnumClassItem } from './enum-class-item';

const { Text } = Typography;

interface PropertyInfo {
  name?: string;
  type?: string;
  key?: string;
}

interface DataRestrictionModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: (result?: { enumClassId?: string }) => void;
  currentEnumClassId?: string;
  propertyInfo?: PropertyInfo;
}

export const DataRestrictionModal: React.FC<DataRestrictionModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  currentEnumClassId,
  propertyInfo,
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedValue, setSelectedValue] = useState<string>('no-restriction');
  const [editingClassId, setEditingClassId] = useState<string | null>(null);

  // 使用全局枚举状态
  const {
    getAllEnumClasses,
    getEnumClass,
    getEnumValues,
    addEnumClass,
    updateEnumClass,
    deleteEnumClass,
  } = useEnumStore();

  // 为每个枚举类维护formApi引用
  const formApiRefs = useRef<Record<string, any>>({});

  // 获取所有枚举类
  const enumClasses = getAllEnumClasses();

  // 过滤枚举类
  const filteredClasses = useMemo(() => {
    if (!searchText) return enumClasses;
    return enumClasses.filter(
      (cls) =>
        cls.name.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.description.toLowerCase().includes(searchText.toLowerCase()) ||
        cls.values.some((val) => val.toLowerCase().includes(searchText.toLowerCase()))
    );
  }, [searchText, enumClasses]);

  // 根据当前枚举类ID获取枚举类
  const currentEnumClass = currentEnumClassId ? getEnumClass(currentEnumClassId) : null;

  // 初始化选中状态
  React.useEffect(() => {
    if (visible) {
      if (currentEnumClassId) {
        setSelectedValue(currentEnumClassId);
      } else {
        setSelectedValue('no-restriction');
      }
    }
  }, [visible, currentEnumClassId]);

  // 准备列表数据，包含无限制选项和枚举类
  const listData = [
    {
      id: 'no-restriction',
      name: '无限制',
      description: '允许任意值，不进行数据限制',
      values: [],
      isSystem: true,
    },
    ...filteredClasses.map((cls) => ({ ...cls, isSystem: false })),
  ];

  const handleEditClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingClassId(classId);
  };

  const handleSaveClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const formApi = formApiRefs.current[classId];
    if (!formApi) return;

    const formValues = formApi.getValues();
    if (!formValues.name || !formValues.values || formValues.values.length === 0) {
      return;
    }

    // 使用全局状态更新
    updateEnumClass(classId, {
      name: formValues.name,
      description: formValues.description || '',
      values: formValues.values.filter((v: string) => v && v.trim()),
    });

    setEditingClassId(null);
  };

  const handleCancelEdit = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // 重置表单到原始值
    const formApi = formApiRefs.current[classId];
    const originalClass = getEnumClass(classId);
    if (formApi && originalClass) {
      formApi.setValues({
        name: originalClass.name,
        description: originalClass.description,
        values: originalClass.values,
      });
    }

    setEditingClassId(null);
  };

  const handleDeleteClass = (classId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // 使用全局状态删除
    deleteEnumClass(classId);

    if (selectedValue === classId) {
      setSelectedValue('no-restriction');
    }
  };

  const handleCreateNew = () => {
    const newClass: EnumClass = {
      id: `new-${Date.now()}`,
      name: '新枚举类',
      description: '请编辑描述',
      values: ['选项1'],
    };

    // 使用全局状态添加
    addEnumClass(newClass);
    setEditingClassId(newClass.id);
  };

  const handleConfirm = () => {
    if (selectedValue === 'no-restriction') {
      onConfirm(undefined);
    } else {
      onConfirm({ enumClassId: selectedValue });
    }
  };

  const handleCancel = () => {
    setSearchText('');
    setSelectedValue('no-restriction');
    setEditingClassId(null);
    onCancel();
  };

  // 动态标题
  const modalTitle = propertyInfo
    ? `数据限制 - 属性 &quot;${propertyInfo.name || '未命名'}&quot; (${propertyInfo.type})`
    : '数据限制';

  return (
    <Modal
      title={modalTitle}
      visible={visible}
      onCancel={handleCancel}
      width={700}
      footer={
        <Space>
          <Button onClick={handleCancel}>取消</Button>
          <Button type="primary" onClick={handleConfirm}>
            确定应用
          </Button>
        </Space>
      }
    >
      {/* 搜索栏和新建按钮 */}
      <div style={{ marginBottom: 16 }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Input
            prefix={<IconSearch />}
            placeholder="搜索枚举类..."
            value={searchText}
            onChange={setSearchText}
            style={{ width: 350 }}
          />
          <Button type="primary" icon={<IconPlus />} onClick={handleCreateNew}>
            新建枚举类
          </Button>
        </Space>
      </div>

      {/* 当前选择提示 */}
      {currentEnumClass && (
        <div
          style={{
            padding: '4px 12px',
            marginBottom: 16,
            backgroundColor: 'var(--semi-color-warning-light-default)',
            borderRadius: 6,
            border: '1px solid var(--semi-color-warning-light-hover)',
          }}
        >
          <Text type="secondary">
            当前选择: <Tag color="orange">{currentEnumClass.name}</Tag>
            <span style={{ marginLeft: 8 }}>
              包含 {currentEnumClass.values.length} 个选项: {currentEnumClass.values.join(', ')}
            </span>
          </Text>
        </div>
      )}

      {/* 枚举类列表 */}
      <div style={{ height: '400px', overflow: 'auto', padding: '0 8px' }}>
        {listData.length === 0 ? (
          <Empty
            title="暂无匹配的枚举类"
            description="尝试调整搜索条件"
            style={{ marginTop: 100 }}
          />
        ) : (
          <RadioGroup
            value={selectedValue}
            onChange={(e) => setSelectedValue(e.target.value)}
            direction="vertical"
            style={{ width: '100%' }}
          >
            <List
              dataSource={listData}
              split={false}
              renderItem={(item) => (
                <EnumClassItem
                  key={item.id}
                  item={item}
                  isSelected={selectedValue === item.id}
                  isEditing={editingClassId === item.id}
                  onEdit={handleEditClass}
                  onSave={handleSaveClass}
                  onCancelEdit={handleCancelEdit}
                  onDelete={handleDeleteClass}
                  formApiRefs={formApiRefs}
                />
              )}
            />
          </RadioGroup>
        )}
      </div>
    </Modal>
  );
};
