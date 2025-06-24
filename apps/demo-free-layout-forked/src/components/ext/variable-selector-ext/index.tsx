import React, { useMemo, useCallback, useEffect, useState } from 'react';

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
  selectedModuleIds?: string[];
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
  selectedModuleIds,
  hasError,
  triggerRender,
}: PropTypes) => {
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

  const renderIcon = useCallback((icon: string | JSX.Element) => {
    if (typeof icon === 'string') {
      return <img style={{ marginRight: 8 }} width={12} height={12} src={icon} />;
    }
    return icon;
  }, []);

  // 优化onChange回调，避免频繁重新渲染
  const handleChange = useCallback(
    (selectedValue: any, selectedNode: TreeNodeData) => {
      if (selectedNode && selectedNode.keyPath) {
        onChange(selectedNode.keyPath as string[]);
      }
    },
    [onChange]
  );

  // 自定义过滤函数
  const filterTreeNode = useCallback(
    (inputValue: string, treeNodeString: string, data?: TreeNodeData) => {
      if (!inputValue || !data) return true;

      const searchText = inputValue.toLowerCase();

      // 搜索节点的key、value、label
      const nodeKey = (data.key || '').toString().toLowerCase();
      const nodeValue = (data.value || '').toString().toLowerCase();
      const nodeLabel = (data.label || '').toString().toLowerCase();

      // 搜索meta信息
      const metaTitle = (data.meta?.title || '').toString().toLowerCase();

      // 对于模块属性，搜索原始属性名（去掉模块前缀）
      if (data.meta?.isModuleProperty && typeof data.meta.id === 'string') {
        const originalAttrName = data.meta.id.split('/').pop() || '';
        if (originalAttrName.toLowerCase().includes(searchText)) {
          return true;
        }
      }

      return (
        nodeKey.includes(searchText) ||
        nodeValue.includes(searchText) ||
        nodeLabel.includes(searchText) ||
        metaTitle.includes(searchText)
      );
    },
    []
  );

  const renderSelectedItem = useCallback(
    (_option: TreeNodeData) => {
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

      // 🎯 为选中项构建更好的显示格式
      const keyPath = _option.keyPath as string[];
      let displayText = '';

      if (keyPath.length >= 3 && keyPath[1] && keyPath[2]?.includes('/')) {
        // 模块属性格式：$start.controlled/commands -> 显示为 controlled/commands
        const moduleProperty = keyPath[2];
        displayText = moduleProperty;
      } else {
        // 其他情况使用keyPath的最后一段
        displayText = keyPath[keyPath.length - 1] || '';
      }

      return (
        <Tag
          prefixIcon={renderIcon(_option.rootMeta?.icon || _option?.icon)}
          closable={!readonly}
          onClose={() => onChange(undefined)}
        >
          {displayText}
        </Tag>
      );
    },
    [readonly, config?.notFoundContent, onChange, renderIcon]
  );

  return (
    <>
      <TreeSelect
        key={`${treeData.length}-${treeValue || 'empty'}`}
        dropdownMatchSelectWidth={false}
        disabled={false}
        treeData={treeData}
        size="small"
        value={treeValue}
        clearIcon={null}
        style={style}
        validateStatus={hasError ? 'error' : undefined}
        expandAction="click"
        treeNodeLabelProp="label"
        filterTreeNode={filterTreeNode}
        searchPosition="dropdown"
        showClear={false}
        arrowIcon={<IconChevronDownStroked size="small" />}
        triggerRender={triggerRender}
        placeholder={config?.placeholder ?? 'Select Variable...'}
        searchPlaceholder="搜索变量..."
        onChange={handleChange}
        renderSelectedItem={renderSelectedItem}
        dropdownStyle={{ maxHeight: 300, overflowY: 'auto' }}
        disableStrictly={true}
      />
    </>
  );
};
