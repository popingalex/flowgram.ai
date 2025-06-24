import React, { useMemo } from 'react';

import styled from 'styled-components';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { TriggerRenderProps } from '@douyinfe/semi-ui/lib/es/treeSelect';
import { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { TreeSelect, Tag } from '@douyinfe/semi-ui';
import { IconChevronDownStroked, IconIssueStroked } from '@douyinfe/semi-icons';

import { useEnhancedVariableTree } from '../variable-selector-ext/use-enhanced-variable-tree';

const UIRootTitle = styled.span`
  color: var(--semi-color-text-2);
  margin-right: 4px;
`;

const UITag = styled(Tag)`
  .semi-tag-content {
    display: flex;
    align-items: center;
    gap: 4px;
  }
`;

const UITreeSelect = styled(TreeSelect)<{ $error?: boolean }>`
  ${(props) =>
    props.$error &&
    `
    .semi-select {
      border-color: var(--semi-color-danger);
    }
  `}

  /* 🎯 加宽下拉面板 */
  .semi-tree-select-dropdown {
    min-width: 350px !important;
    max-width: 500px !important;
  }
`;

export interface EnhancedVariableSelectorProps {
  value?: string[];
  config?: {
    placeholder?: string;
    notFoundContent?: string;
  };
  onChange: (value?: string[]) => void;
  includeSchema?: IJsonSchema | IJsonSchema[];
  excludeSchema?: IJsonSchema | IJsonSchema[];
  selectedModuleIds?: string[]; // 新增：选中的模块ID列表
  readonly?: boolean;
  hasError?: boolean;
  style?: React.CSSProperties;
  triggerRender?: (props: TriggerRenderProps) => React.ReactNode;
}

export const EnhancedVariableSelector: React.FC<EnhancedVariableSelectorProps> = ({
  value,
  config = {},
  onChange,
  style,
  readonly = false,
  includeSchema,
  excludeSchema,
  selectedModuleIds,
  hasError,
  triggerRender,
}) => {
  // 使用增强的变量树，支持模块分组
  const treeData = useEnhancedVariableTree({ includeSchema, excludeSchema, selectedModuleIds });

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
      <UITreeSelect
        dropdownMatchSelectWidth={false}
        disabled={readonly}
        treeData={treeData}
        size="small"
        value={treeValue}
        clearIcon={null}
        $error={hasError}
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
              <UITag
                prefixIcon={<IconIssueStroked />}
                color="amber"
                closable={!readonly}
                onClose={() => onChange(undefined)}
              >
                {config?.notFoundContent ?? 'Undefined'}
              </UITag>
            );
          }

          return (
            <UITag
              prefixIcon={renderIcon(_option.rootMeta?.icon || _option?.icon)}
              closable={!readonly}
              onClose={() => onChange(undefined)}
            >
              <UIRootTitle>
                {_option.rootMeta?.title ? `${_option.rootMeta?.title} -` : null}
              </UIRootTitle>
              {_option.label}
            </UITag>
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
