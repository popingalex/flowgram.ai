import React, { useMemo, useEffect, useState } from 'react';

import {
  DynamicValueInput,
  JsonSchemaBasicType,
  VariableSelector,
} from '@flowgram.ai/form-materials';
import { Input } from '@douyinfe/semi-ui';

import { useCurrentEntity } from '../../../stores/current-entity.store';
import { Op, ConditionRowValueType } from './types';
import { UIContainer, UILeft, UIOperator, UIRight, UIValues } from './styles';
import { useRule } from './hooks/useRule';
import { useOp } from './hooks/useOp';
import { EnhancedVariableSelector } from '../enhanced-variable-selector';
import { EnhancedDynamicValueInput } from '../enhanced-dynamic-value-input';

interface PropTypes {
  value?: ConditionRowValueType;
  onChange: (value?: ConditionRowValueType) => void;
  style?: React.CSSProperties;
  readonly?: boolean;
}

export function EnhancedConditionRow({ style, value, onChange, readonly }: PropTypes) {
  const { left, operator, right } = value || {};
  const { rule } = useRule(left);
  const { renderOpSelect, opConfig } = useOp({
    rule,
    op: operator,
    onChange: (v) => onChange({ ...value, operator: v }),
  });

  const { editingEntity, selectedEntityId } = useCurrentEntity();

  const targetSchema = useMemo(() => {
    const targetType: JsonSchemaBasicType | null = rule?.[operator as Op] || null;
    return targetType ? { type: targetType, extra: { weak: true } } : null;
  }, [rule, opConfig, editingEntity, selectedEntityId]);

  return (
    <UIContainer style={style}>
      <UIOperator>{renderOpSelect()}</UIOperator>
      <UIValues>
        <UILeft>
          <EnhancedVariableSelector
            readonly={readonly}
            style={{ width: '100%' }}
            value={left?.content}
            onChange={(v) =>
              onChange({
                ...value,
                left: {
                  type: 'ref',
                  content: v,
                },
              })
            }
          />
        </UILeft>
        <UIRight>
          {targetSchema ? (
            <EnhancedDynamicValueInput
              readonly={readonly || !rule}
              value={right}
              schema={targetSchema}
              onChange={(v) => onChange({ ...value, right: v })}
            />
          ) : (
            <Input
              size="small"
              disabled
              value={opConfig?.rightDisplay || 'Empty'}
              placeholder="No target schema"
            />
          )}
        </UIRight>
      </UIValues>
    </UIContainer>
  );
}
