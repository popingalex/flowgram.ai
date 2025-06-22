import React, { useCallback, useState, useRef, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Input } from '@douyinfe/semi-ui';

import type { IndexPath, FieldUpdater, ValidationFunction } from '../../typings/types';

interface UniversalInputProps {
  // 数据标识
  dataType: 'entity' | 'module' | 'api-parameter' | 'expression' | 'graph';
  indexPath: IndexPath; // nanoid路径数组
  field: string;

  // 显示属性
  value: string;
  placeholder?: string;
  required?: boolean;
  readonly?: boolean;
  isIdField?: boolean;

  // 样式
  style?: React.CSSProperties;
  className?: string;
  size?: 'small' | 'default' | 'large';

  // 验证
  validationFn?: ValidationFunction;
  errorMessage?: string;

  // 回调
  onChange: FieldUpdater;
  onBlur?: () => void;
  onFocus?: () => void;
}

// 🔑 为每个输入框生成稳定的key
const inputKeyMap = new Map<string, string>();

const getStableInputKey = (dataType: string, indexPath: IndexPath, field: string): string => {
  const keyIdentifier = `${dataType}-${indexPath.join('.')}-${field}`;
  if (!inputKeyMap.has(keyIdentifier)) {
    inputKeyMap.set(keyIdentifier, nanoid());
  }
  return inputKeyMap.get(keyIdentifier)!;
};

export const UniversalInput: React.FC<UniversalInputProps> = ({
  dataType,
  indexPath,
  field,
  value,
  placeholder,
  required = false,
  readonly = false,
  isIdField = false,
  style,
  className,
  size = 'small',
  validationFn,
  errorMessage,
  onChange,
  onBlur,
  onFocus,
}) => {
  // 🔑 使用稳定的key避免组件重新挂载
  const stableKey = getStableInputKey(dataType, indexPath, field);

  // 内部状态管理焦点
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // 记住光标位置
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  // 恢复光标位置
  useEffect(() => {
    if (isFocused && cursorPosition !== null && inputRef.current) {
      inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
    }
  }, [value, isFocused, cursorPosition]);

  // 处理值变更
  const handleChange = useCallback(
    (newValue: string) => {
      // 保存当前光标位置
      if (inputRef.current) {
        setCursorPosition(inputRef.current.selectionStart);
      }

      // 🎯 调用统一的字段更新函数
      onChange(indexPath, field, newValue);
    },
    [indexPath, field, onChange]
  );

  // 处理焦点事件
  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      setCursorPosition(e.target.selectionStart);
      onFocus?.();
    },
    [onFocus]
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    setCursorPosition(null);
    onBlur?.();
  }, [onBlur]);

  // 样式计算
  const computedStyle = {
    ...style,
    ...(isIdField && {
      fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
      fontSize: '12px',
    }),
  };

  // 验证状态
  const hasError = !!(errorMessage || (validationFn && validationFn(value, [], indexPath, field)));

  return (
    <Input
      key={stableKey} // 🔑 使用稳定的key
      ref={inputRef}
      value={value || ''}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder={placeholder}
      size={size}
      style={computedStyle}
      className={className}
      disabled={readonly}
      validateStatus={hasError ? 'error' : undefined}
      suffix={required && !value ? <span style={{ color: 'red' }}>*</span> : undefined}
    />
  );
};

// 🎯 通用的验证函数创建器
export const createUniversalValidator =
  (
    field: string,
    options: {
      dataType: string;
      scope?: 'global' | 'parent' | 'local';
      required?: boolean;
    }
  ): ValidationFunction =>
  (value: any, allData: any[], indexPath: IndexPath, fieldName: string): string => {
    // 必填验证
    if (options.required && (!value || value.trim() === '')) {
      return `${field}不能为空`;
    }

    // ID字段的特殊验证
    if (field === 'id' && value) {
      // 这里可以添加ID格式验证等
      if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
        return 'ID只能包含字母、数字、下划线和连字符';
      }
    }

    return ''; // 无错误
  };
