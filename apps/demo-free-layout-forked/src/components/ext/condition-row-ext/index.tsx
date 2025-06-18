import React, { useMemo } from 'react';

import { JsonSchemaBasicType } from '@flowgram.ai/form-materials';

import { useCurrentEntity } from '../../../stores';
import { Op, ConditionRowValueType } from './types';
import { UIContainer, UILeft, UIOperator, UIRight, UIValues } from './styles';
import { useRule } from './hooks/useRule';
import { useOp } from './hooks/useOp';
import { EnhancedVariableSelector } from '../variable-selector-ext';
import { EnhancedDynamicValueInput } from '../dynamic-value-input-ext';

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
            <EnhancedDynamicValueInput
              readonly={readonly}
              value={right}
              schema={{ type: 'string', extra: { weak: true } }}
              onChange={(v) => onChange({ ...value, right: v })}
            />
          )}
        </UIRight>
      </UIValues>
    </UIContainer>
  );
}
