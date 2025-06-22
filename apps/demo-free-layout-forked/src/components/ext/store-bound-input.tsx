import React, { useState, useEffect } from 'react';

import { Input, Typography } from '@douyinfe/semi-ui';

const { Text } = Typography;

// 通用字段输入组件 - 可以绑定任何store
const FieldInput = React.memo(
  ({
    value,
    onChange,
    placeholder,
    readonly = false,
    isIdField = false,
    required = false,
    errorMessage = '',
  }: {
    value: string;
    onChange: (newValue: string) => void;
    placeholder: string;
    readonly?: boolean;
    isIdField?: boolean;
    required?: boolean;
    errorMessage?: string;
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

    const isEmpty = !value || value.trim() === '';
    const hasError = (required && isEmpty) || !!errorMessage;

    return (
      <Input
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
  }
);
FieldInput.displayName = 'FieldInput';

// 通用的store绑定输入组件
export const StoreBoundInput = React.memo(
  ({
    storeKey,
    itemIndexId,
    subItemIndexId,
    field,
    placeholder,
    isIdField = false,
    required = false,
    readonly = false,
    useStore,
    useStoreActions,
    validationFn,
  }: {
    storeKey: string; // 用于标识不同的store类型
    itemIndexId: string; // 主项目的nanoid
    subItemIndexId?: string; // 子项目的nanoid（如属性）
    field: string; // 字段名
    placeholder: string;
    isIdField?: boolean;
    required?: boolean;
    readonly?: boolean;
    useStore: () => any; // store hook
    useStoreActions: () => any; // store actions hook
    validationFn?: (
      value: string,
      allItems: any[],
      itemIndexId: string,
      subItemIndexId?: string
    ) => string;
  }) => {
    const storeData = useStore();
    const actions = useStoreActions();

    // 根据storeKey确定数据结构
    const items = storeData.entities || storeData.modules || storeData.expressions || [];

    // 找到对应的项目和子项目
    const item = items.find((i: any) => i._indexId === itemIndexId);
    if (!item) return null;

    let value = '';
    let updateFn: (newValue: string) => void;

    if (subItemIndexId) {
      // 处理子项目（如属性）
      const subItem = item.attributes?.find((attr: any) => attr._indexId === subItemIndexId);
      if (!subItem) return null;

      value = subItem[field] || '';
      updateFn = (newValue: string) => {
        if (actions.updateEntityAttribute) {
          actions.updateEntityAttribute(itemIndexId, subItemIndexId, field, newValue);
        } else if (actions.updateModuleAttribute) {
          actions.updateModuleAttribute(itemIndexId, subItemIndexId, field, newValue);
        } else if (actions.updateExpressionAttribute) {
          actions.updateExpressionAttribute(itemIndexId, subItemIndexId, field, newValue);
        }
      };
    } else {
      // 处理主项目
      value = item[field] || '';
      updateFn = (newValue: string) => {
        if (actions.updateEntityField) {
          actions.updateEntityField(itemIndexId, field, newValue);
        } else if (actions.updateModuleField) {
          actions.updateModuleField(itemIndexId, field, newValue);
        } else if (actions.updateExpressionField) {
          actions.updateExpressionField(itemIndexId, field, newValue);
        }
      };
    }

    // 校验
    const errorMessage = validationFn
      ? validationFn(value, items, itemIndexId, subItemIndexId)
      : '';

    return (
      <FieldInput
        value={value}
        onChange={updateFn}
        placeholder={placeholder}
        isIdField={isIdField}
        required={required}
        readonly={readonly}
        errorMessage={errorMessage}
      />
    );
  }
);
StoreBoundInput.displayName = 'StoreBoundInput';

// 预定义的校验函数
export const createIdValidator =
  (fieldType: 'entity-id' | 'attribute-id' | 'module-id' | 'expression-id') =>
  (value: string, allItems: any[], itemIndexId: string, subItemIndexId?: string): string => {
    if (!value || value.trim() === '') {
      return `${fieldType.split('-')[0]}ID不能为空`;
    }

    if (fieldType === 'entity-id' || fieldType === 'module-id' || fieldType === 'expression-id') {
      // 检查主项目ID重复
      const isDuplicate = allItems.some(
        (item) => item._indexId !== itemIndexId && item.id === value
      );
      if (isDuplicate) {
        return `${fieldType.split('-')[0]}ID "${value}" 已存在`;
      }
    } else if (fieldType === 'attribute-id' && subItemIndexId) {
      // 检查属性ID重复（在同一主项目内）
      const item = allItems.find((i) => i._indexId === itemIndexId);
      if (item) {
        const isDuplicate = item.attributes?.some(
          (attr: any) => attr._indexId !== subItemIndexId && attr.id === value
        );
        if (isDuplicate) {
          return `属性ID "${value}" 在此项目中已存在`;
        }
      }
    }

    return '';
  };
