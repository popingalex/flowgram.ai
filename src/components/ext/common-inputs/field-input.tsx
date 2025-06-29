import React from 'react';
import { Input, Typography } from '@douyinfe/semi-ui';

const { Text } = Typography;

export interface FieldInputProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder: string;
  readonly?: boolean;
  isIdField?: boolean; // ID字段使用等宽字体
  required?: boolean; // 是否必填
  isDuplicate?: boolean; // 是否重复
  errorMessage?: string; // 校验错误信息
  inputKey?: string; // 稳定的key，用于防止重绘
}

// 通用字段输入组件 - 统一的输入组件，消除重复代码
export const FieldInput = React.memo<FieldInputProps>(
  ({
    value,
    onChange,
    placeholder,
    readonly = false,
    isIdField = false,
    required = false,
    isDuplicate = false,
    errorMessage = '',
    inputKey,
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
        key={inputKey} // 使用稳定的key防止重绘
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
  // 优化memo条件，只在关键属性变化时重新渲染
  (prevProps, nextProps) =>
    prevProps.value === nextProps.value &&
    prevProps.readonly === nextProps.readonly &&
    prevProps.required === nextProps.required &&
    prevProps.isDuplicate === nextProps.isDuplicate &&
    prevProps.errorMessage === nextProps.errorMessage &&
    prevProps.inputKey === nextProps.inputKey
);

FieldInput.displayName = 'FieldInput';
