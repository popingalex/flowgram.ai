import React, { useMemo } from 'react';

import { IJsonSchema } from '@flowgram.ai/form-materials';
import { TriggerRenderProps } from '@douyinfe/semi-ui/lib/es/treeSelect';
import { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { TreeSelect, Tag } from '@douyinfe/semi-ui';
import { IconChevronDownStroked, IconIssueStroked } from '@douyinfe/semi-icons';

import { useEnhancedVariableTree } from './use-enhanced-variable-tree';

interface PropTypes {
  value?: string[];
  config?: {
    placeholder?: string;
    notFoundContent?: string;
  };
  onChange: (value?: string[]) => void;
  includeSchema?: IJsonSchema | IJsonSchema[];
  excludeSchema?: IJsonSchema | IJsonSchema[];
  readonly?: boolean;
  hasError?: boolean;
  style?: React.CSSProperties;
  triggerRender?: (props: TriggerRenderProps) => React.ReactNode;
}

export type EnhancedVariableSelectorProps = PropTypes;

export const EnhancedVariableSelector = ({
  value,
  config = {},
  onChange,
  style,
  readonly = false,
  includeSchema,
  excludeSchema,
  hasError,
  triggerRender,
}: PropTypes) => {
  const treeData = useEnhancedVariableTree({ includeSchema, excludeSchema });

  const treeValue = useMemo(() => {
    if (typeof value === 'string') {
      console.warn(
        'The Value of EnhancedVariableSelector is a string, it should be an ARRAY. \n',
        'Please check the value of EnhancedVariableSelector \n'
      );
      return value;
    }
    return value?.join('.');
  }, [value]);

  const renderIcon = (icon: string | JSX.Element) => {
    if (typeof icon === 'string') {
      return <img style={{ marginRight: 8 }} width={12} height={12} src={icon} />;
    }

    return icon;
  };

  return (
    <>
      <TreeSelect
        dropdownMatchSelectWidth={false}
        disabled={readonly}
        treeData={treeData}
        size="small"
        value={treeValue}
        clearIcon={null}
        style={style}
        validateStatus={hasError ? 'error' : undefined}
        dropdownStyle={{
          minWidth: '350px',
          maxWidth: '500px',
          width: 'auto',
        }}
        onChange={(_, _config) => {
          onChange((_config as TreeNodeData).keyPath as string[]);
        }}
        renderSelectedItem={(_option: TreeNodeData) => {
          if (!_option?.keyPath) {
            return (
              <Tag
                prefixIcon={<IconIssueStroked />}
                color="amber"
                closable={!readonly}
                onClose={() => onChange(undefined)}
              >
                {config?.notFoundContent ?? 'Undefined'}
              </Tag>
            );
          }

          return (
            <Tag
              prefixIcon={renderIcon(_option.rootMeta?.icon || _option?.icon)}
              closable={!readonly}
              onClose={() => onChange(undefined)}
            >
              <span style={{ fontWeight: 500 }}>
                {_option.rootMeta?.title ? `${_option.rootMeta?.title} -` : null}
              </span>
              {_option.label}
            </Tag>
          );
        }}
        showClear={false}
        arrowIcon={<IconChevronDownStroked size="small" />}
        triggerRender={triggerRender}
        placeholder={config?.placeholder ?? 'Select Variable...'}
      />
    </>
  );
};
