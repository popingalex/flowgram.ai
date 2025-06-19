import React, { useMemo } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Cascader, Button, Tooltip } from '@douyinfe/semi-ui';
import Icon from '@douyinfe/semi-icons';

import { options, DataRestrictionIcon, getSchemaIcon } from './constants';

// 统一按钮尺寸常量
const BUTTON_SIZE = 24;

export interface EntityPropertyTypeSelectorProps {
  value?: Partial<IJsonSchema>;
  onChange?: (value: Partial<IJsonSchema>) => void;
  disabled?: boolean;
}

export interface DataRestrictionButtonProps {
  value?: Partial<IJsonSchema>;
  onClick?: () => void;
  disabled?: boolean;
}

// 转换简化类型为标准类型
const normalizeType = (type?: string): string => {
  if (type === 's') return 'string';
  if (type === 'n') return 'number';
  if (type === 'b') return 'boolean';
  return type || 'string';
};

// 解析类型选择值
const getTypeSelectValue = (value?: Partial<IJsonSchema>): string[] | undefined => {
  if (value?.type === 'array' && value?.items) {
    return [value.type, ...(getTypeSelectValue(value.items) || [])];
  }
  const normalizedType = normalizeType(value?.type);
  return normalizedType ? [normalizedType] : undefined;
};

// 解析选择值为类型对象
const parseTypeSelectValue = (value: string[]): Partial<IJsonSchema> => {
  if (value.length === 1) {
    return { type: value[0] as any };
  }
  if (value.length === 2 && value[0] === 'array') {
    return { type: 'array', items: { type: value[1] as any } };
  }
  return { type: 'string' };
};

// 数据限制按钮组件
export const DataRestrictionButton = React.forwardRef<HTMLDivElement, DataRestrictionButtonProps>(
  ({ value, onClick, disabled = false }, ref) => {
    // 判断是否为字符串类型
    const normalizedType = normalizeType(value?.type);
    const isStringType = normalizedType === 'string';

    // 判断是否有数据限制（枚举值）
    const hasDataRestriction = value?.enum && Array.isArray(value.enum) && value.enum.length > 0;

    // 生成悬停提示内容
    const tooltipContent = useMemo(() => {
      if (!hasDataRestriction) {
        return '数据限制';
      }

      const enumValues = value?.enum as string[];
      // 根据枚举值匹配枚举类名称
      const matchedClass = [
        { name: '车辆类型', values: ['推土机', '挖掘机', '装载机', '压路机', '起重机'] },
        { name: '颜色', values: ['红色', '蓝色', '绿色', '黄色', '黑色', '白色'] },
        { name: '尺寸', values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
      ].find(
        (cls) =>
          cls.values.length === enumValues.length &&
          cls.values.every((val) => enumValues.includes(val))
      );

      const className = matchedClass?.name || '自定义枚举';
      const displayValues = enumValues.join('、');

      return `限制：${className}\n选项：${displayValues}`;
    }, [hasDataRestriction, value?.enum]);

    if (disabled) {
      return null; // 禁用时不显示数据限制按钮
    }

    return (
      <div ref={ref} style={{ width: BUTTON_SIZE, flexShrink: 0 }}>
        {isStringType ? (
          <Tooltip
            content={
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.4',
                  maxWidth: 200,
                }}
              >
                {tooltipContent}
              </div>
            }
            position="top"
          >
            <Button
              size="small"
              type={hasDataRestriction ? 'primary' : 'tertiary'}
              theme={hasDataRestriction ? 'solid' : 'borderless'}
              icon={<Icon svg={DataRestrictionIcon} />}
              onClick={onClick}
              style={{
                width: BUTTON_SIZE,
                height: BUTTON_SIZE,
                padding: '2px',
                backgroundColor: hasDataRestriction ? 'var(--semi-color-primary)' : undefined,
                color: hasDataRestriction ? 'white' : 'var(--semi-color-text-2)',
                border: hasDataRestriction
                  ? '1px solid var(--semi-color-primary)'
                  : '1px solid var(--semi-color-border)',
              }}
            />
          </Tooltip>
        ) : (
          <Button
            size="small"
            disabled
            style={{
              width: BUTTON_SIZE,
              height: BUTTON_SIZE,
              padding: '2px',
              opacity: 0.3,
            }}
          />
        )}
      </div>
    );
  }
);

DataRestrictionButton.displayName = 'DataRestrictionButton';

// 类型选择器组件（纯粹的类型选择功能）
export const EntityPropertyTypeSelector = React.forwardRef<
  HTMLDivElement,
  EntityPropertyTypeSelectorProps
>(({ value, onChange, disabled = false }, ref) => {
  // 判断是否为字符串类型
  const normalizedType = normalizeType(value?.type);

  const selectValue = useMemo(() => getTypeSelectValue(value), [value]);

  // 创建标准化的value用于图标显示
  const normalizedValue = useMemo(
    () => ({
      ...value,
      type: normalizedType,
    }),
    [value, normalizedType]
  );

  const handleTypeChange = (newValue: unknown) => {
    console.log('EntityPropertyTypeSelector handleTypeChange:', {
      newValue,
      disabled,
      onChange: !!onChange,
    });

    if (!onChange || disabled) {
      console.log('EntityPropertyTypeSelector: onChange not available or disabled');
      return;
    }

    // 确保newValue是字符串或字符串数组
    let valueArray: string[];
    if (Array.isArray(newValue)) {
      valueArray = newValue.map((v) => String(v));
    } else if (typeof newValue === 'string' || typeof newValue === 'number') {
      valueArray = [String(newValue)];
    } else {
      console.log('EntityPropertyTypeSelector: invalid value type:', typeof newValue);
      return; // 无效的值类型
    }

    const parsedValue = parseTypeSelectValue(valueArray);
    console.log('EntityPropertyTypeSelector: calling onChange with:', parsedValue);
    onChange(parsedValue);
  };

  return (
    <div ref={ref} style={{ width: BUTTON_SIZE, flexShrink: 0 }}>
      {disabled ? (
        // 只读模式：只显示按钮样式，不提供交互
        <Button
          size="small"
          style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
          icon={getSchemaIcon(normalizedValue)}
        />
      ) : (
        // 编辑模式：提供完整的Cascader功能
        <Cascader
          size="small"
          triggerRender={() => (
            <Button
              size="small"
              style={{ width: BUTTON_SIZE, height: BUTTON_SIZE }}
              icon={getSchemaIcon(normalizedValue)}
            />
          )}
          treeData={options}
          value={selectValue}
          leafOnly={true}
          onChange={handleTypeChange}
        />
      )}
    </div>
  );
});

EntityPropertyTypeSelector.displayName = 'EntityPropertyTypeSelector';

// 组合组件（向后兼容）
export const TypeSelectorWithDataRestriction = React.forwardRef<
  HTMLDivElement,
  EntityPropertyTypeSelectorProps & { onDataRestrictionClick?: () => void }
>(({ value, onChange, onDataRestrictionClick, disabled = false }, ref) => (
  <div
    ref={ref}
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 4,
    }}
  >
    <EntityPropertyTypeSelector value={value} onChange={onChange} disabled={disabled} />
    <DataRestrictionButton value={value} onClick={onDataRestrictionClick} disabled={disabled} />
  </div>
));

TypeSelectorWithDataRestriction.displayName = 'TypeSelectorWithDataRestriction';

// 保持向后兼容
export const TypeSelector = TypeSelectorWithDataRestriction;
