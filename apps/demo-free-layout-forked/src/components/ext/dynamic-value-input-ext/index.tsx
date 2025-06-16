import React, { useMemo } from 'react';

import { ConstantInput, IFlowConstantRefValue, IJsonSchema } from '@flowgram.ai/form-materials';
import { IconButton } from '@douyinfe/semi-ui';
import { Input } from '@douyinfe/semi-ui';
import { IconSetting } from '@douyinfe/semi-icons';

import { UIContainer, UIMain, UITrigger } from './styles';
import { EnhancedVariableSelector } from '../variable-selector-ext';

interface Strategy {
  [key: string]: any;
}

interface PropsType {
  value?: IFlowConstantRefValue;
  onChange: (value?: IFlowConstantRefValue) => void;
  readonly?: boolean;
  hasError?: boolean;
  style?: React.CSSProperties;
  schema?: IJsonSchema;
  constantProps?: {
    strategies?: Strategy[];
    [key: string]: any;
  };
}

export function EnhancedDynamicValueInput({
  value,
  onChange,
  readonly,
  style,
  schema,
  constantProps,
}: PropsType) {
  // When is number type, include integer as well
  const includeSchema = useMemo(() => {
    if (schema?.type === 'number') {
      return [schema, { type: 'integer' }];
    }
    return schema;
  }, [schema]);

  const renderMain = () => {
    if (readonly) {
      return (
        <Input
          size="small"
          disabled
          value={String(value?.content || '')}
          style={{ backgroundColor: '#f5f5f5', color: '#666' }}
        />
      );
    }

    if (value?.type === 'ref') {
      return (
        <EnhancedVariableSelector
          readonly={readonly}
          style={{ width: '100%' }}
          value={Array.isArray(value.content) ? value.content : undefined}
          onChange={(v) => {
            if (v && v.length > 0) {
              onChange?.({
                type: 'ref',
                content: v,
              });
            } else {
              onChange?.(undefined);
            }
          }}
        />
      );
    }

    return (
      <ConstantInput
        value={value?.content}
        onChange={(v) => onChange({ type: 'constant', content: v })}
        schema={schema || { type: 'string' }}
        readonly={readonly}
      />
    );
  };

  const renderTrigger = () => (
    <EnhancedVariableSelector
      style={{ width: '100%' }}
      value={value?.type === 'ref' && Array.isArray(value.content) ? value.content : undefined}
      onChange={(v: string[] | undefined) => {
        if (v && v.length > 0) {
          onChange({ type: 'ref', content: v });
        } else {
          onChange({ type: 'ref', content: [] });
        }
      }}
      includeSchema={includeSchema}
      readonly={readonly}
      triggerRender={() => (
        <IconButton disabled={readonly} size="small" icon={<IconSetting size="small" />} />
      )}
    />
  );

  return (
    <UIContainer style={style}>
      <UIMain>{renderMain()}</UIMain>
      <UITrigger>{renderTrigger()}</UITrigger>
    </UIContainer>
  );
}
