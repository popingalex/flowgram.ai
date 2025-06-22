// 通用输入组件抽象

import React, { useState, useCallback, useMemo } from 'react';

import { nanoid } from 'nanoid';
import { Input, Select } from '@douyinfe/semi-ui';

// 🔑 通用输入组件Props
export interface IndexedInputProps {
  // 数据绑定
  value: any;
  onChange: (value: any) => void;

  // 输入配置
  type?: 'text' | 'select' | 'number' | 'textarea';
  placeholder?: string;
  disabled?: boolean;

  // 选择器配置（type='select'时使用）
  options?: Array<{ label: string; value: any }>;

  // 稳定性配置
  stableKey?: string; // 稳定的React key，避免重新挂载

  // 样式配置
  style?: React.CSSProperties;
  size?: 'small' | 'default' | 'large';
}

// 🔑 通用输入组件 - 避免光标移动和组件重绘
export const IndexedInput: React.FC<IndexedInputProps> = ({
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  options = [],
  stableKey,
  style,
  size = 'small',
}) => {
  // 🔑 为每个输入框生成稳定的key，避免组件重新挂载
  const [inputKey] = useState(() => stableKey || nanoid());

  // 处理值变化
  const handleChange = useCallback(
    (newValue: any) => {
      onChange(newValue);
    },
    [onChange]
  );

  // 根据类型渲染不同的输入组件
  const renderInput = useMemo(() => {
    const commonProps = {
      key: inputKey,
      value: value || '',
      onChange: handleChange,
      placeholder,
      disabled,
      style,
      size,
    };

    switch (type) {
      case 'select':
        return <Select {...commonProps} optionList={options} showClear />;

      case 'number':
        return <Input {...commonProps} type="number" />;

      case 'textarea':
        return <Input {...commonProps} type="textarea" />;

      case 'text':
      default:
        return <Input {...commonProps} type="text" />;
    }
  }, [inputKey, value, handleChange, placeholder, disabled, style, size, type, options]);

  return renderInput;
};

// 🔑 通用字段更新Hook - 封装字段更新逻辑
export interface UseIndexedFieldUpdateConfig<T> {
  // 数据项
  item: T;

  // 更新函数
  onFieldUpdate: (indexId: string, field: string, value: any) => void;

  // 索引ID获取函数
  getIndexId: (item: T) => string;
}

export function useIndexedFieldUpdate<T>({
  item,
  onFieldUpdate,
  getIndexId,
}: UseIndexedFieldUpdateConfig<T>) {
  // 生成字段更新函数
  const createFieldUpdater = useCallback(
    (field: string) => (value: any) => {
      const indexId = getIndexId(item);
      onFieldUpdate(indexId, field, value);
    },
    [item, onFieldUpdate, getIndexId]
  );

  // 生成稳定的输入key
  const createInputKey = useCallback(
    (field: string) => {
      const indexId = getIndexId(item);
      return `${indexId}-${field}`;
    },
    [item, getIndexId]
  );

  return {
    createFieldUpdater,
    createInputKey,
  };
}

// 🔑 通用表格行组件Props
export interface IndexedTableRowProps<T> {
  // 数据项
  item: T;

  // 字段配置
  fields: Array<{
    key: string;
    label: string;
    type?: 'text' | 'select' | 'number' | 'textarea';
    options?: Array<{ label: string; value: any }>;
    placeholder?: string;
    disabled?: boolean;
    render?: (value: any, item: T) => React.ReactNode;
  }>;

  // 更新配置
  onFieldUpdate: (indexId: string, field: string, value: any) => void;
  getIndexId: (item: T) => string;

  // 操作配置
  actions?: Array<{
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: (item: T) => void;
    disabled?: (item: T) => boolean;
    type?: 'primary' | 'secondary' | 'danger';
  }>;
}

// 🔑 通用表格行组件 - 可复用的行渲染逻辑
export function IndexedTableRow<T>({
  item,
  fields,
  onFieldUpdate,
  getIndexId,
  actions = [],
}: IndexedTableRowProps<T>) {
  const { createFieldUpdater, createInputKey } = useIndexedFieldUpdate({
    item,
    onFieldUpdate,
    getIndexId,
  });

  return (
    <>
      {fields.map((field) => {
        const value = (item as any)[field.key];

        // 如果有自定义渲染函数，使用自定义渲染
        if (field.render) {
          return field.render(value, item);
        }

        // 否则使用通用输入组件
        return (
          <IndexedInput
            key={field.key}
            value={value}
            onChange={createFieldUpdater(field.key)}
            type={field.type}
            placeholder={field.placeholder}
            disabled={field.disabled}
            options={field.options}
            stableKey={createInputKey(field.key)}
            size="small"
          />
        );
      })}

      {/* 操作按钮 */}
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => action.onClick(item)}
          disabled={action.disabled?.(item)}
          className={`action-button action-${action.type || 'secondary'}`}
        >
          {action.icon}
          {action.label}
        </button>
      ))}
    </>
  );
}
