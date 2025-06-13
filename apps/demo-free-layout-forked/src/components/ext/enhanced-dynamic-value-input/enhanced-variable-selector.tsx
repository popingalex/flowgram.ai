import React, { useMemo, useState } from 'react';

import styled from 'styled-components';
import { useScopeAvailable, ASTMatch } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { TriggerRenderProps } from '@douyinfe/semi-ui/lib/es/treeSelect';
import { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { TreeSelect, Tag } from '@douyinfe/semi-ui';
import { IconChevronDownStroked, IconIssueStroked } from '@douyinfe/semi-icons';

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
  hasError,
  triggerRender,
}) => {
  const [expandedKeys, setExpandedKeys] = useState<string[]>([]);

  // 使用系统提供的变量数据源
  let available: any;
  try {
    available = useScopeAvailable();
  } catch (error) {
    console.warn(
      '[EnhancedVariableSelector] useScopeAvailable failed, falling back to empty data:',
      error
    );
    available = { variables: [] };
  }

  // 构建树形数据结构
  const treeData = useMemo(() => {
    if (!available?.variables) {
      return [];
    }

    const renderVariable = (variable: any, parentFields: any[] = []): TreeNodeData | null => {
      const type = variable?.type;
      if (!type) return null;

      let children: TreeNodeData[] | undefined;

      // 处理对象类型的子属性
      if (ASTMatch?.isObject && ASTMatch.isObject(type)) {
        children = (type.properties || [])
          .map((property: any) => renderVariable(property, [...parentFields, variable]))
          .filter(Boolean) as TreeNodeData[];

        if (!children?.length) {
          return null;
        }
      }

      const keyPath = [...parentFields.map((field) => field.key), variable.key];
      const key = keyPath.join('.');

      const hasChildren = children && children.length > 0;

      return {
        key: key,
        label: hasChildren ? (
          // 🎯 为父节点创建可点击的自定义label
          <div
            style={{
              cursor: 'pointer',
              width: '100%',
              padding: '2px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
            onClick={(e) => {
              e.stopPropagation();

              if (expandedKeys.includes(key)) {
                // 如果已展开，则收缩
                setExpandedKeys(expandedKeys.filter((k) => k !== key));
              } else {
                // 如果未展开，则展开
                setExpandedKeys([...expandedKeys, key]);
              }
            }}
          >
            {variable.meta?.icon && (
              <span style={{ marginRight: '4px' }}>
                {typeof variable.meta.icon === 'string' ? (
                  <img style={{ width: 12, height: 12 }} src={variable.meta.icon} alt="" />
                ) : (
                  variable.meta.icon
                )}
              </span>
            )}
            {variable.meta?.title || variable.key}
          </div>
        ) : (
          variable.meta?.title || variable.key
        ),
        value: key,
        keyPath,
        children,
        disabled: hasChildren, // 🎯 父节点禁用选择，只能展开
        rootMeta: parentFields[0]?.meta,
      };
    };

    return available.variables
      .slice(0)
      .reverse()
      .map((variable: any) => renderVariable(variable))
      .filter(Boolean) as TreeNodeData[];
  }, [available?.variables, expandedKeys]);

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
      expandedKeys={expandedKeys}
      onExpand={setExpandedKeys}
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
  );
};
