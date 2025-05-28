import React, { useMemo } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Cascader, Button, Tooltip, Tag } from '@douyinfe/semi-ui';
import Icon from '@douyinfe/semi-icons';

import { options, DataRestrictionIcon, getSchemaIcon } from './constants';

export interface EntityPropertyTypeSelectorProps {
  value?: Partial<IJsonSchema>;
  onChange?: (value: Partial<IJsonSchema>) => void;
  onDataRestrictionClick?: () => void;
}

// 解析类型选择值
const getTypeSelectValue = (value?: Partial<IJsonSchema>): string[] | undefined => {
  if (value?.type === 'array' && value?.items) {
    return [value.type, ...(getTypeSelectValue(value.items) || [])];
  }
  return value?.type ? [value.type] : undefined;
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

export const EntityPropertyTypeSelector: React.FC<EntityPropertyTypeSelectorProps> = ({
  value,
  onChange,
  onDataRestrictionClick,
}) => {
  // 判断是否为字符串类型
  const isStringType = value?.type === 'string';

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

  const selectValue = useMemo(() => getTypeSelectValue(value), [value]);

  const handleTypeChange = (newValue: any) => {
    if (onChange) {
      const valueArray = Array.isArray(newValue) ? newValue : [newValue];
      onChange(parseTypeSelectValue(valueArray));
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, width: '100%' }}>
      {/* 类型选择器 - 只显示图标 */}
      <div style={{ width: 28, flexShrink: 0 }}>
        <Cascader
          size="small"
          triggerRender={() => (
            <Button size="small" style={{ width: '100%' }}>
              {getSchemaIcon(value)}
            </Button>
          )}
          treeData={options}
          value={selectValue}
          leafOnly={true}
          onChange={handleTypeChange}
        />
      </div>

      {/* 数据限制按钮 - 固定位置 */}
      <div style={{ width: 24, flexShrink: 0 }}>
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
              onClick={onDataRestrictionClick}
              style={{
                width: 24,
                height: 24,
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
              width: 24,
              height: 24,
              padding: '2px',
              opacity: 0.3,
            }}
          />
        )}
      </div>
    </div>
  );
};

// 保持向后兼容
export const TypeSelector = EntityPropertyTypeSelector;
