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
      // 🎯 只在有问题且数据已加载时打印错误信息，避免数据加载期间的误报
      if (
        process.env.NODE_ENV === 'development' &&
        !_option?.keyPath &&
        treeData.length > 0 &&
        treeValue
      ) {
        // 收集所有可选择的路径用于调试
        const collectSelectablePaths = (nodes: TreeNodeData[], paths: string[] = []): string[] => {
          nodes.forEach((node) => {
            if (!node.disabled && (!node.children || node.children.length === 0)) {
              paths.push(node.value || node.keyPath?.join('.') || '');
            }
            if (node.children) {
              collectSelectablePaths(node.children, paths);
            }
          });
          return paths;
        };

        const allSelectablePaths = collectSelectablePaths(treeData);
        const moduleRelatedPaths = allSelectablePaths.filter((path) => path.includes('/'));

        console.error('[变量选择器] 无法找到选中项:', {
          expectedPath: treeValue,
          currentValue: value,
          option: _option,
          treeDataLength: treeData.length,
          allSelectablePathsCount: allSelectablePaths.length,
          moduleRelatedPaths: moduleRelatedPaths,
          // 检查是否有相似的路径
          similarPaths: allSelectablePaths.filter(
            (path) =>
              path.includes(treeValue?.split('.').pop() || '') ||
              treeValue?.includes(path.split('.').pop() || '')
          ),
        });
      }

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
    },
    [readonly, config?.notFoundContent, onChange, renderIcon]
  );

  // 如果变量数据还没加载完成且有值，先显示加载状态
  if (treeData.length === 0 && treeValue) {
    return (
      <TreeSelect
        size="small"
        disabled={true}
        value={treeValue}
        placeholder="正在加载变量..."
        style={{ ...style, backgroundColor: '#f8f9fa' }}
        renderSelectedItem={() => (
          <Tag color="blue">{Array.isArray(value) ? value.join('.') : treeValue}</Tag>
        )}
      />
    );
  }

  return (
    <>
      <TreeSelect
        key={`${treeData.length}-${treeValue || 'empty'}`}
        dropdownMatchSelectWidth={false}
        disabled={readonly}
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
