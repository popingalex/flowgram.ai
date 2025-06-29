import React, { useMemo } from 'react';

import { Input, Select, Button } from '@douyinfe/semi-ui';
import { IconChevronDownStroked } from '@douyinfe/semi-icons';

// 简化的操作符枚举
export enum SimpleOp {
  EQ = 'eq',
  NEQ = 'neq',
  GT = 'gt',
  GTE = 'gte',
  LT = 'lt',
  LTE = 'lte',
  IN = 'in',
  NIN = 'nin',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IS_TRUE = 'is_true',
  IS_FALSE = 'is_false',
}

// 操作符配置接口
interface OpConfig {
  label: string;
  abbreviation: string;
  needsValue: boolean;
  rightDisplay?: string;
}

// 操作符配置
const opConfigs: Record<SimpleOp, OpConfig> = {
  [SimpleOp.EQ]: { label: 'Equal', abbreviation: '=', needsValue: true },
  [SimpleOp.NEQ]: { label: 'Not Equal', abbreviation: '≠', needsValue: true },
  [SimpleOp.GT]: { label: 'Greater Than', abbreviation: '>', needsValue: true },
  [SimpleOp.GTE]: { label: 'Greater Than or Equal', abbreviation: '>=', needsValue: true },
  [SimpleOp.LT]: { label: 'Less Than', abbreviation: '<', needsValue: true },
  [SimpleOp.LTE]: { label: 'Less Than or Equal', abbreviation: '<=', needsValue: true },
  [SimpleOp.IN]: { label: 'In', abbreviation: '∈', needsValue: true },
  [SimpleOp.NIN]: { label: 'Not In', abbreviation: '∉', needsValue: true },
  [SimpleOp.CONTAINS]: { label: 'Contains', abbreviation: '⊇', needsValue: true },
  [SimpleOp.NOT_CONTAINS]: { label: 'Not Contains', abbreviation: '⊉', needsValue: true },
  [SimpleOp.IS_EMPTY]: {
    label: 'Is Empty',
    abbreviation: '=',
    needsValue: false,
    rightDisplay: 'Empty',
  },
  [SimpleOp.IS_NOT_EMPTY]: {
    label: 'Is Not Empty',
    abbreviation: '≠',
    needsValue: false,
    rightDisplay: 'Empty',
  },
  [SimpleOp.IS_TRUE]: {
    label: 'Is True',
    abbreviation: '=',
    needsValue: false,
    rightDisplay: 'True',
  },
  [SimpleOp.IS_FALSE]: {
    label: 'Is False',
    abbreviation: '=',
    needsValue: false,
    rightDisplay: 'False',
  },
};

// 根据数据类型获取可用操作符
const getAvailableOps = (dataType: string): SimpleOp[] => {
  switch (dataType) {
    case 'string':
      return [
        SimpleOp.EQ,
        SimpleOp.NEQ,
        SimpleOp.CONTAINS,
        SimpleOp.NOT_CONTAINS,
        SimpleOp.IN,
        SimpleOp.NIN,
        SimpleOp.IS_EMPTY,
        SimpleOp.IS_NOT_EMPTY,
      ];
    case 'number':
    case 'integer':
      return [
        SimpleOp.EQ,
        SimpleOp.NEQ,
        SimpleOp.GT,
        SimpleOp.GTE,
        SimpleOp.LT,
        SimpleOp.LTE,
        SimpleOp.IN,
        SimpleOp.NIN,
        SimpleOp.IS_EMPTY,
        SimpleOp.IS_NOT_EMPTY,
      ];
    case 'boolean':
      return [
        SimpleOp.EQ,
        SimpleOp.NEQ,
        SimpleOp.IS_TRUE,
        SimpleOp.IS_FALSE,
        SimpleOp.IN,
        SimpleOp.NIN,
        SimpleOp.IS_EMPTY,
        SimpleOp.IS_NOT_EMPTY,
      ];
    case 'array':
    case 'object':
      return [SimpleOp.IS_EMPTY, SimpleOp.IS_NOT_EMPTY];
    default:
      return [SimpleOp.EQ, SimpleOp.NEQ, SimpleOp.IS_EMPTY, SimpleOp.IS_NOT_EMPTY];
  }
};

export interface SimpleConditionValue {
  property?: string;
  operator?: SimpleOp;
  value?: any;
}

interface SimpleConditionRowProps {
  value?: SimpleConditionValue;
  onChange: (value?: SimpleConditionValue) => void;
  propertyOptions?: Array<{ label: string; value: string; type?: string }>;
  readonly?: boolean;
  style?: React.CSSProperties;
}

export const SimpleConditionRow: React.FC<SimpleConditionRowProps> = ({
  value,
  onChange,
  propertyOptions = [],
  readonly = false,
  style,
}) => {
  const { property, operator, value: conditionValue } = value || {};

  // 获取选中属性的类型
  const selectedPropertyType = useMemo(() => {
    const selectedProp = propertyOptions.find((opt) => opt.value === property);
    return selectedProp?.type || 'string';
  }, [propertyOptions, property]);

  // 获取可用操作符
  const availableOps = useMemo(() => getAvailableOps(selectedPropertyType), [selectedPropertyType]);

  // 操作符选项
  const opOptions = useMemo(
    () =>
      availableOps.map((op) => ({
        label: opConfigs[op].label,
        value: op,
      })),
    [availableOps]
  );

  const currentOpConfig = operator ? opConfigs[operator] : null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      {/* 属性选择 */}
      <Select
        style={{ width: 150 }}
        size="small"
        placeholder="选择属性"
        value={property}
        optionList={propertyOptions}
        onChange={(v) => {
          onChange({
            ...value,
            property: v as string,
            operator: undefined, // 清空操作符
            value: undefined, // 清空值
          });
        }}
        disabled={readonly}
      />

      {/* 操作符选择 */}
      <Select
        style={{ width: 80 }}
        size="small"
        value={operator}
        optionList={opOptions}
        onChange={(v) => {
          onChange({
            ...value,
            operator: v as SimpleOp,
            value: undefined, // 清空值
          });
        }}
        disabled={readonly || !property}
        triggerRender={({ value: triggerValue }) => (
          <Button size="small" disabled={readonly || !property}>
            {currentOpConfig?.abbreviation || <IconChevronDownStroked size="small" />}
          </Button>
        )}
      />

      {/* 值输入 */}
      {currentOpConfig?.needsValue ? (
        <Input
          style={{ width: 120 }}
          size="small"
          placeholder="输入值"
          value={conditionValue}
          onChange={(v) => {
            onChange({
              ...value,
              value: v,
            });
          }}
          disabled={readonly || !operator}
        />
      ) : (
        <Input
          style={{ width: 120 }}
          size="small"
          disabled
          value={currentOpConfig?.rightDisplay || ''}
        />
      )}
    </div>
  );
};

export default SimpleConditionRow;
