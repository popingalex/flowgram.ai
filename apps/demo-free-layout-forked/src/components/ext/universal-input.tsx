import React from 'react';

import { Input } from '@douyinfe/semi-ui';

export interface UniversalInputProps {
  storeName: string;
  path: string[];
  field: string;
  placeholder?: string;
  required?: boolean;
  useStore: () => any;
  useStoreActions: () => any;
  validationFn?: (value: string) => { isValid: boolean; message?: string };
  style?: React.CSSProperties;
}

export const UniversalInput: React.FC<UniversalInputProps> = ({
  storeName,
  path,
  field,
  placeholder,
  required = false,
  useStore,
  useStoreActions,
  validationFn,
  style,
}) => {
  const store = useStore();
  const actions = useStoreActions();

  // 获取当前值
  const getCurrentValue = () => {
    if (storeName === 'entity') {
      const entities = store.entities || [];
      if (path.length === 1) {
        // 实体字段
        const entity = entities.find((e: any) => e._indexId === path[0]);
        return entity?.[field] || '';
      } else if (path.length === 2) {
        // 实体属性字段
        const entity = entities.find((e: any) => e._indexId === path[0]);
        const attribute = entity?.attributes?.find((a: any) => a._indexId === path[1]);
        return attribute?.[field] || '';
      }
    }
    return '';
  };

  const value = getCurrentValue();

  // 处理值变化
  const handleChange = (newValue: string) => {
    if (storeName === 'entity') {
      if (path.length === 1) {
        // 更新实体字段
        actions.updateEntityField?.(path[0], field, newValue);
      } else if (path.length === 2) {
        // 更新实体属性字段
        actions.updateEntityAttribute?.(path[0], path[1], field, newValue);
      }
    }
  };

  // 验证
  const validation = validationFn ? validationFn(value) : { isValid: true };

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      style={style}
      validateStatus={validation.isValid ? undefined : 'error'}
    />
  );
};

// 创建通用验证器
export const createUniversalValidator =
  (
    type: 'id' | 'name',
    options: {
      entityType?: string;
      scope?: 'global' | 'parent';
    } = {}
  ) =>
  (value: string) => {
    if (type === 'id') {
      if (!value || value.trim() === '') {
        return {
          isValid: false,
          message: `${options.entityType || '项目'}ID不能为空`,
        };
      }

      // 简单的ID格式验证
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
        return {
          isValid: false,
          message: 'ID只能包含字母、数字和下划线，且必须以字母或下划线开头',
        };
      }
    }

    return { isValid: true };
  };
