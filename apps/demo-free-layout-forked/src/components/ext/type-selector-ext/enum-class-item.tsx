// @ts-nocheck
import React from 'react';

import { Form, Button, List, Popconfirm, Tooltip, Radio } from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconSave, IconClose } from '@douyinfe/semi-icons';

import type { EnumClass } from '../../../services/types';

interface EnumClassItemProps {
  item: EnumClass & { isSystem?: boolean };
  isSelected: boolean;
  onEdit: (classId: string, e: React.MouseEvent) => void;
  onSave: (classId: string, e: React.MouseEvent) => void;
  onCancelEdit: (classId: string, e: React.MouseEvent) => void;
  onDelete: (classId: string, e: React.MouseEvent) => void;
  onSelect: (classId: string) => void;
  formApiRefs: React.MutableRefObject<Record<string, any>>;
}

export const EnumClassItem: React.FC<EnumClassItemProps> = ({
  item,
  isSelected,
  onEdit,
  onSave,
  onCancelEdit,
  onDelete,
  onSelect,
  formApiRefs,
}) => {
  const [hasChanges, setHasChanges] = React.useState(false);
  const [originalItem, setOriginalItem] = React.useState<EnumClass>(item);

  // 检查是否有修改
  React.useEffect(() => {
    const hasItemChanges = JSON.stringify(item) !== JSON.stringify(originalItem);
    setHasChanges(hasItemChanges);
  }, [item, originalItem]);

  // 保存修改
  const handleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOriginalItem(item); // 更新原始数据
    setHasChanges(false);
    onSave(item.id, e);
  };

  // 撤销修改
  const handleCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    // 这里需要通过某种方式恢复到原始数据
    // 由于我们没有直接的方式修改item，这个逻辑需要在父组件中实现
    setHasChanges(false);
    onCancelEdit(item.id, e);
  };

  return (
    <List.Item
      style={{
        backgroundColor: isSelected
          ? 'var(--semi-color-primary-light-default)'
          : 'var(--semi-color-bg-1)',
        border: isSelected
          ? '2px solid var(--semi-color-primary)'
          : '2px solid var(--semi-color-border)',
        borderRadius: 8,
        margin: '4px 0',
        padding: '4px 16px',
        boxShadow: isSelected ? '0 4px 12px rgba(0, 0, 0, 0.1)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
      }}
      onClick={() => onSelect(item.id)}
      align="flex-start"
      header={<Radio value={item.id} style={{ marginTop: 4 }} />}
      main={
        <div style={{ flex: 1 }}>
          {item.isSystem ? (
            // 系统项目（无限制）只显示文本
            <div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
                <div
                  style={{
                    width: 80,
                    flexShrink: 0,
                    textAlign: 'right',
                    paddingRight: 8,
                    fontWeight: 500,
                  }}
                >
                  名称:
                </div>
                <div style={{ flex: 1, fontSize: 16, fontWeight: 600 }}>{item.name}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div
                  style={{
                    width: 80,
                    flexShrink: 0,
                    textAlign: 'right',
                    paddingRight: 8,
                    fontWeight: 500,
                  }}
                >
                  描述:
                </div>
                <div style={{ flex: 1, color: 'var(--semi-color-text-1)' }}>{item.description}</div>
              </div>
            </div>
          ) : (
            // 自定义枚举类显示表单
            <Form
              labelPosition="left"
              labelAlign="right"
              labelWidth={80}
              initValues={{
                id: item.id,
                name: item.name,
                description: item.description,
                values: item.values || [],
              }}
              getFormApi={(formApi) => {
                formApiRefs.current[item.id] = formApi;
              }}
              onChange={(values) => {
                // 检测表单值变化
                const hasFormChanges =
                  values.name !== originalItem.name ||
                  values.description !== originalItem.description ||
                  JSON.stringify(values.values) !== JSON.stringify(originalItem.values);
                setHasChanges(hasFormChanges);
              }}
            >
              <div style={{ display: 'flex', gap: 12, marginBottom: 4 }}>
                <div style={{ flex: 1 }}>
                  <Form.Input
                    field="id"
                    label="ID"
                    placeholder="枚举类ID"
                    disabled={true}
                    size="small"
                    rules={[
                      { required: true, message: 'ID是必填项' },
                      {
                        pattern: /^[a-zA-Z0-9-_]+$/,
                        message: 'ID只能包含字母、数字、连字符和下划线',
                      },
                    ]}
                    style={{ marginTop: 4 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Form.Input
                    field="name"
                    label="名称"
                    placeholder="枚举类名称"
                    size="small"
                    rules={[{ required: true, message: '名称是必填项' }]}
                    style={{ marginTop: 4 }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: 4 }}>
                <Form.Input
                  field="description"
                  label="描述"
                  placeholder="枚举类描述"
                  size="small"
                  style={{ marginTop: 4 }}
                />
              </div>
              <Form.TagInput
                field="values"
                label={
                  <Tooltip
                    content={
                      <div
                        style={{
                          maxWidth: 200,
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.4',
                        }}
                      >
                        {`枚举值列表，当前共 ${item.values?.length || 0} 个选项：\n${
                          item.values?.join('、') || '无'
                        }`}
                      </div>
                    }
                    position="top"
                  >
                    <span>枚举值({item.values?.length || 0})</span>
                  </Tooltip>
                }
                placeholder="输入枚举值，按回车添加"
                allowDuplicates={false}
                size="small"
              />
            </Form>
          )}
        </div>
      }
      extra={
        !item.isSystem && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              alignSelf: 'flex-start',
            }}
          >
            {hasChanges ? (
              <>
                <Button
                  type="primary"
                  size="small"
                  icon={<IconSave />}
                  onClick={handleSave}
                  style={{ width: 80 }}
                >
                  保存
                </Button>
                <Button
                  size="small"
                  icon={<IconClose />}
                  onClick={handleCancel}
                  style={{ width: 80 }}
                >
                  取消
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="tertiary"
                  theme="borderless"
                  size="small"
                  icon={<IconEdit />}
                  onClick={(e) => onEdit(item.id, e)}
                  style={{ width: 80 }}
                >
                  编辑
                </Button>
                <Popconfirm
                  title="确定删除这个枚举类吗？"
                  content="删除后无法恢复"
                  onConfirm={(e) => onDelete(item.id, e!)}
                >
                  <Button
                    type="danger"
                    theme="borderless"
                    size="small"
                    icon={<IconDelete />}
                    onClick={(e) => e.stopPropagation()}
                    style={{ width: 80 }}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </>
            )}
          </div>
        )
      }
    />
  );
};
