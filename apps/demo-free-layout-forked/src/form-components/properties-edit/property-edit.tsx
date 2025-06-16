import React, { useState, useLayoutEffect } from 'react';

import { VariableSelector, TypeSelector } from '@flowgram.ai/form-materials';
import { Input, Button } from '@douyinfe/semi-ui';
import { IconCrossCircleStroked } from '@douyinfe/semi-icons';

import { ExtendedJsonSchema } from '../../typings/extended-json-schema';
import { EnhancedDynamicValueInput } from '../../components/ext/dynamic-value-input-ext';
import { LeftColumn, Row } from './styles';

export interface PropertyEditProps {
  propertyKey: string;
  value: ExtendedJsonSchema;
  useFx?: boolean;
  disabled?: boolean;
  onChange: (value: ExtendedJsonSchema, propertyKey: string, newPropertyKey?: string) => void;
  onDelete?: () => void;
}

export const PropertyEdit: React.FC<PropertyEditProps> = (props) => {
  const { value, disabled } = props;
  const [inputKey, updateKey] = useState(props.propertyKey);
  const updateProperty = (key: keyof ExtendedJsonSchema, val: any) => {
    value[key] = val;
    props.onChange(value, props.propertyKey);
  };

  const partialUpdateProperty = (val?: Partial<ExtendedJsonSchema>) => {
    props.onChange({ ...value, ...val }, props.propertyKey);
  };

  useLayoutEffect(() => {
    updateKey(props.propertyKey);
  }, [props.propertyKey]);
  return (
    <Row>
      <LeftColumn>
        <TypeSelector
          value={value}
          disabled={disabled}
          style={{ position: 'absolute', top: 2, left: 4, zIndex: 1, padding: '0 5px', height: 20 }}
          onChange={(val) => partialUpdateProperty(val)}
        />
        <Input
          value={inputKey}
          disabled={disabled}
          size="small"
          onChange={(v) => updateKey(v.trim())}
          onBlur={() => {
            if (inputKey !== '') {
              props.onChange(value, props.propertyKey, inputKey);
            } else {
              updateKey(props.propertyKey);
            }
          }}
          style={{ paddingLeft: 26 }}
        />
      </LeftColumn>
      {
        <EnhancedDynamicValueInput
          value={value.default}
          onChange={(val) => updateProperty('default', val)}
          schema={value}
          style={{ flexGrow: 1 }}
        />
      }
      {props.onDelete && !disabled && (
        <Button
          style={{ marginLeft: 5, position: 'relative', top: 2 }}
          size="small"
          theme="borderless"
          icon={<IconCrossCircleStroked />}
          onClick={props.onDelete}
        />
      )}
    </Row>
  );
};
