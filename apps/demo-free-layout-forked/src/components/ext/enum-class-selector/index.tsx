import React, { useState } from 'react';

import { Button, Modal, Input, Select, Space, Typography, List } from '@douyinfe/semi-ui';
import { IconPlus, IconEdit } from '@douyinfe/semi-icons';

const { Text } = Typography;

// 枚举类定义
export interface EnumClass {
  id: string;
  name: string;
  items: string[];
}

// 模拟的枚举类数据（后续应该从数据服务获取）
const mockEnumClasses: EnumClass[] = [
  {
    id: 'vehicle',
    name: '汽车类型',
    items: ['推土机', '挖掘机', '装载机', '压路机'],
  },
  {
    id: 'color',
    name: '颜色',
    items: ['红色', '蓝色', '绿色', '黄色'],
  },
  {
    id: 'size',
    name: '尺寸',
    items: ['小', '中', '大', '特大'],
  },
];

interface EnumClassSelectorProps {
  value?: string; // 当前选中的枚举类ID
  onChange?: (enumClassId: string, enumClass: EnumClass) => void;
  disabled?: boolean;
}

export function EnumClassSelector({ value, onChange, disabled }: EnumClassSelectorProps) {
  const [visible, setVisible] = useState(false);
  const [enumClasses, setEnumClasses] = useState<EnumClass[]>(mockEnumClasses);
  const [newClassName, setNewClassName] = useState('');
  const [newClassItems, setNewClassItems] = useState<string[]>(['']);

  const selectedEnumClass = enumClasses.find((ec) => ec.id === value);

  const handleSelectEnumClass = (enumClass: EnumClass) => {
    onChange?.(enumClass.id, enumClass);
    setVisible(false);
  };

  const handleCreateNewClass = () => {
    if (!newClassName.trim()) return;

    const validItems = newClassItems.filter((item) => item.trim());
    if (validItems.length === 0) return;

    const newEnumClass: EnumClass = {
      id: `custom_${Date.now()}`,
      name: newClassName.trim(),
      items: validItems,
    };

    setEnumClasses([...enumClasses, newEnumClass]);
    onChange?.(newEnumClass.id, newEnumClass);
    setVisible(false);
    setNewClassName('');
    setNewClassItems(['']);
  };

  const addNewItem = () => {
    setNewClassItems([...newClassItems, '']);
  };

  const updateItem = (index: number, value: string) => {
    const updated = [...newClassItems];
    updated[index] = value;
    setNewClassItems(updated);
  };

  const removeItem = (index: number) => {
    if (newClassItems.length > 1) {
      const updated = newClassItems.filter((_, i) => i !== index);
      setNewClassItems(updated);
    }
  };

  return (
    <>
      <Button
        size="small"
        disabled={disabled}
        onClick={() => setVisible(true)}
        style={{ minWidth: 120 }}
      >
        {selectedEnumClass ? selectedEnumClass.name : '选择枚举类'}
      </Button>

      <Modal
        title="选择或创建枚举类"
        visible={visible}
        onCancel={() => setVisible(false)}
        footer={null}
        width={600}
      >
        <div style={{ marginBottom: 24 }}>
          <Text strong>现有枚举类</Text>
          <List
            dataSource={enumClasses}
            renderItem={(enumClass) => (
              <List.Item
                main={
                  <div>
                    <Text strong>{enumClass.name}</Text>
                    <div style={{ marginTop: 4 }}>
                      <Text type="tertiary">{enumClass.items.join(', ')}</Text>
                    </div>
                  </div>
                }
                extra={
                  <Button size="small" onClick={() => handleSelectEnumClass(enumClass)}>
                    选择
                  </Button>
                }
              />
            )}
            style={{ border: '1px solid var(--semi-color-border)', borderRadius: 6, marginTop: 8 }}
          />
        </div>

        <div>
          <Text strong>创建新枚举类</Text>
          <div style={{ marginTop: 12 }}>
            <Input
              placeholder="枚举类名称（如：汽车类型）"
              value={newClassName}
              onChange={setNewClassName}
              style={{ marginBottom: 12 }}
            />

            <Text type="secondary">枚举项：</Text>
            {newClassItems.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <Input
                  placeholder={`枚举项 ${index + 1}`}
                  value={item}
                  onChange={(value) => updateItem(index, value)}
                  style={{ flex: 1 }}
                />
                {newClassItems.length > 1 && (
                  <Button size="small" type="danger" onClick={() => removeItem(index)}>
                    删除
                  </Button>
                )}
              </div>
            ))}

            <Button size="small" icon={<IconPlus />} onClick={addNewItem} style={{ marginTop: 8 }}>
              添加枚举项
            </Button>
          </div>

          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setVisible(false)}>取消</Button>
              <Button
                type="primary"
                onClick={handleCreateNewClass}
                disabled={
                  !newClassName.trim() || newClassItems.filter((item) => item.trim()).length === 0
                }
              >
                创建并选择
              </Button>
            </Space>
          </div>
        </div>
      </Modal>
    </>
  );
}
