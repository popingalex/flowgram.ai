import React, { useMemo } from 'react';

import { ConstantInput, IFlowConstantRefValue, IJsonSchema } from '@flowgram.ai/form-materials';
import { IconButton } from '@douyinfe/semi-ui';
import { IconSetting } from '@douyinfe/semi-icons';

import { UIContainer, UIMain, UITrigger } from './styles';
import { EnhancedVariableSelector } from './enhanced-variable-selector';

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
    if (value?.type === 'ref') {
      // Display Variable Or Delete
      return (
        <EnhancedVariableSelector
          value={value?.content}
          onChange={(_v: string[] | undefined) =>
            onChange(_v ? { type: 'ref', content: _v } : undefined)
          }
          includeSchema={includeSchema}
          readonly={readonly}
        />
      );
    }

    return (
      <ConstantInput
        value={value?.content}
        onChange={(_v: any) => onChange({ type: 'constant', content: _v })}
        schema={schema || { type: 'string' }}
        readonly={readonly}
        {...(constantProps as any)}
      />
    );
  };

  const renderTrigger = () => (
    <EnhancedVariableSelector
      style={{ width: '100%' }}
      value={value?.type === 'ref' ? value?.content : undefined}
      onChange={(_v: string[] | undefined) => onChange({ type: 'ref', content: _v })}
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
