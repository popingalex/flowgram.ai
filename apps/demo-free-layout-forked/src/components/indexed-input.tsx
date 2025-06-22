import React from 'react';

import { Input, Typography } from '@douyinfe/semi-ui';

import { IndexPath, ValidationFunction, EditableIndexed } from '../typings/types';
import {
  BaseIndexedStoreState,
  BaseIndexedStoreActions,
  findByPath,
} from '../stores/base-indexed-store';

const { Text } = Typography;

// 索引输入组件Props
export interface IndexedInputProps<T extends EditableIndexed> {
  // 数据路径
  indexPath: IndexPath;
  field: keyof T | string;

  // Store hooks
  useStore: () => BaseIndexedStoreState<T>;
  useActions: () => BaseIndexedStoreActions<T>;

  // 显示配置
  placeholder?: string;
  readonly?: boolean;
  required?: boolean;
  style?: React.CSSProperties;

  // 验证
  validation?: ValidationFunction;

  // 调试信息
  debugName?: string;
}

// 通用索引输入组件
export const IndexedInput = React.memo(
  <T extends EditableIndexed>({
    indexPath,
    field,
    useStore,
    useActions,
    placeholder = '',
    readonly = false,
    required = false,
    style = {},
    validation,
    debugName = 'IndexedInput',
  }: IndexedInputProps<T>) => {
    const { items } = useStore();
    const { updateField } = useActions();

    // 根据路径查找目标对象
    const targetObject = findByPath(items, indexPath);

    if (!targetObject) {
      console.warn(`${debugName}: 无法找到路径对应的对象`, { indexPath, items });
      return null;
    }

    const value = targetObject[field] || '';

    // 更新处理
    const handleChange = (newValue: string) => {
      console.log(`🔍 ${debugName} 字段更新:`, {
        indexPath,
        field,
        oldValue: value,
        newValue,
      });

      updateField(indexPath, field as keyof T, newValue);
    };

    // 验证处理
    const errorMessage = validation ? validation(value, items, indexPath, field as string) : '';

    // 只读模式
    if (readonly) {
      return <Text style={{ fontSize: '13px', ...style }}>{value}</Text>;
    }

    // 计算验证状态
    const isEmpty = !value || value.trim() === '';
    const hasError = (required && isEmpty) || !!errorMessage;

    return (
      <Input
        value={value}
        onChange={handleChange}
        onClick={(e) => e.stopPropagation()}
        size="small"
        placeholder={placeholder}
        validateStatus={hasError ? 'error' : 'default'}
        style={{ fontSize: '13px', ...style }}
      />
    );
  }
);

IndexedInput.displayName = 'IndexedInput';

// 验证函数工厂
export const createIndexedValidator = (
  type: 'required' | 'unique-global' | 'unique-parent' | 'id',
  options: {
    entityName?: string;
    fieldName?: string;
  } = {}
): ValidationFunction => {
  const { entityName = '项目', fieldName = '字段' } = options;

  return (value: any, allData: EditableIndexed[], indexPath: IndexPath, field: string): string => {
    // 必填验证
    if (type === 'required') {
      if (!value || value.trim() === '') {
        return `${fieldName}不能为空`;
      }
    }

    // ID验证（必填 + 全局唯一）
    if (type === 'id' || type === 'unique-global') {
      if (!value || value.trim() === '') {
        return `${entityName}ID不能为空`;
      }

      if (indexPath.length === 1) {
        // 顶级对象全局唯一性检查
        const isDuplicate = allData.some(
          (item) => item._indexId !== indexPath[0] && (item as any)[field] === value
        );
        if (isDuplicate) {
          return `${entityName}ID "${value}" 已存在`;
        }
      }
    }

    // 父级范围内唯一
    if (type === 'unique-parent' && indexPath.length === 2) {
      const parentItem = allData.find((item) => item._indexId === indexPath[0]);
      if (parentItem && 'attributes' in parentItem) {
        const attributes = (parentItem as any).attributes || [];
        const isDuplicate = attributes.some(
          (attr: any) => attr._indexId !== indexPath[1] && attr[field] === value
        );
        if (isDuplicate) {
          return `${entityName}ID "${value}" 在此范围内已存在`;
        }
      }
    }

    return '';
  };
};
