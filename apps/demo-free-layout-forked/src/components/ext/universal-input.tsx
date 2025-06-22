import React from 'react';

import { Input, Typography } from '@douyinfe/semi-ui';

const { Text } = Typography;

// 通用输入组件 - 支持任意深度的嵌套路径
export const UniversalInput = React.memo(
  ({
    storeName,
    path, // nanoid路径数组，如 [entityId] 或 [entityId, attributeId]
    field, // 要更新的字段名
    placeholder,
    readonly = false,
    required = false,
    useStore,
    useStoreActions,
    validationFn,
    style = {},
  }: {
    storeName: string; // store名称，用于调试
    path: string[]; // nanoid路径数组
    field: string; // 字段名
    placeholder: string;
    readonly?: boolean;
    required?: boolean;
    useStore: () => any;
    useStoreActions: () => any;
    validationFn?: (value: string, allData: any, path: string[], field: string) => string;
    style?: React.CSSProperties;
  }) => {
    const storeData = useStore();
    const actions = useStoreActions();

    // 获取数据集合（entities, modules, expressions等）
    const dataCollection =
      storeData.entities || storeData.modules || storeData.expressions || storeData.items || [];

    // 根据路径找到目标对象
    let targetObject = null;
    let currentLevel = dataCollection;

    for (let i = 0; i < path.length; i++) {
      const nanoid = path[i];

      if (i === 0) {
        // 第一层：在主集合中查找
        targetObject = currentLevel.find((item: any) => item._indexId === nanoid);
        if (!targetObject) return null;
        currentLevel = targetObject;
      } else {
        // 后续层：在attributes中查找
        if (!currentLevel.attributes) return null;
        targetObject = currentLevel.attributes.find((attr: any) => attr._indexId === nanoid);
        if (!targetObject) return null;
        currentLevel = targetObject;
      }
    }

    if (!targetObject) return null;

    const value = targetObject[field] || '';

    // 更新函数
    const updateValue = (newValue: string) => {
      if (path.length === 1) {
        // 更新主对象字段
        if (actions.updateEntityField) {
          actions.updateEntityField(path[0], field, newValue);
        } else if (actions.updateModuleField) {
          actions.updateModuleField(path[0], field, newValue);
        } else if (actions.updateExpressionField) {
          actions.updateExpressionField(path[0], field, newValue);
        } else if (actions.updateField) {
          actions.updateField(path[0], field, newValue);
        }
      } else if (path.length === 2) {
        // 更新子对象字段（如属性）
        if (actions.updateEntityAttribute) {
          actions.updateEntityAttribute(path[0], path[1], field, newValue);
        } else if (actions.updateModuleAttribute) {
          actions.updateModuleAttribute(path[0], path[1], field, newValue);
        } else if (actions.updateExpressionAttribute) {
          actions.updateExpressionAttribute(path[0], path[1], field, newValue);
        } else if (actions.updateSubField) {
          actions.updateSubField(path[0], path[1], field, newValue);
        }
      }
      // 可以扩展支持更深层级的嵌套
    };

    // 校验
    const errorMessage = validationFn ? validationFn(value, dataCollection, path, field) : '';

    if (readonly) {
      return <Text style={{ fontSize: '13px', ...style }}>{value}</Text>;
    }

    const isEmpty = !value || value.trim() === '';
    const hasError = (required && isEmpty) || !!errorMessage;

    return (
      <Input
        value={value}
        onChange={updateValue}
        onClick={(e) => e.stopPropagation()}
        size="small"
        placeholder={placeholder}
        validateStatus={hasError ? 'error' : 'default'}
        style={{ fontSize: '13px', ...style }}
      />
    );
  }
);
UniversalInput.displayName = 'UniversalInput';

// 通用校验函数
export const createUniversalValidator =
  (
    validationType: 'id' | 'required' | 'unique',
    options?: {
      entityType?: string; // 实体类型名称，用于错误提示
      scope?: 'global' | 'parent'; // id唯一性检查范围
    }
  ) =>
  (value: string, allData: any[], path: string[], field: string): string => {
    const { entityType = '项目', scope = 'global' } = options || {};

    if (validationType === 'required') {
      if (!value || value.trim() === '') {
        return `${field}不能为空`;
      }
    }

    if (validationType === 'id' || validationType === 'unique') {
      if (!value || value.trim() === '') {
        return `${entityType}ID不能为空`;
      }

      if (scope === 'global' && path.length === 1) {
        // 检查主对象ID在全局范围内的唯一性
        const isDuplicate = allData.some(
          (item) => item._indexId !== path[0] && item[field] === value
        );
        if (isDuplicate) {
          return `${entityType}ID "${value}" 已存在`;
        }
      } else if (scope === 'parent' && path.length === 2) {
        // 检查子对象ID在父对象范围内的唯一性
        const parentItem = allData.find((item) => item._indexId === path[0]);
        if (parentItem && parentItem.attributes) {
          const isDuplicate = parentItem.attributes.some(
            (attr: any) => attr._indexId !== path[1] && attr[field] === value
          );
          if (isDuplicate) {
            return `${entityType}ID "${value}" 在此范围内已存在`;
          }
        }
      }
    }

    return '';
  };
