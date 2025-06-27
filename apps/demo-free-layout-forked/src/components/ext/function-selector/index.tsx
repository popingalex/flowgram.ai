import React, { useEffect, useMemo } from 'react';

import { Select, Typography, Space, Tag, Spin } from '@douyinfe/semi-ui';
import { IconCode } from '@douyinfe/semi-icons';

import { useBehaviorStore, useBehaviorActions } from '../../../stores/function-list';
import { useExpressionStore, useExpressionActions } from '../../../stores/api-list';

const { Text } = Typography;

interface FunctionSelectorProps {
  value?: string; // 选中的函数ID
  onChange: (functionId: string) => void;
  type: 'remote_service' | 'local_function'; // 函数类型
  readonly?: boolean;
}

export const FunctionSelector: React.FC<FunctionSelectorProps> = ({
  value,
  onChange,
  type,
  readonly = false,
}) => {
  // 加载远程服务和本地函数数据
  const { expressions, behaviors, allItems, loading: expressionLoading } = useExpressionStore();
  const { behaviors: localBehaviors, loading: behaviorLoading } = useBehaviorStore();
  const { loadAll, loadBehaviors: loadExpressionBehaviors } = useExpressionActions();
  const { loadBehaviors } = useBehaviorActions();

  // 加载数据
  useEffect(() => {
    if (type === 'remote_service') {
      loadAll();
    } else {
      // 🎯 本地函数：同时加载两个store的数据
      loadBehaviors(); // BehaviorStore
      loadExpressionBehaviors(); // ExpressionStore
    }
  }, [type, loadAll, loadBehaviors, loadExpressionBehaviors]);

  // 🎯 修复：构建正确的选项列表，避免重复和混乱
  const optionList = useMemo(() => {
    if (type === 'remote_service') {
      // 远程服务选项：显示完整的服务名称
      return expressions.map((expr) => ({
        value: expr.id,
        label: `${expr.name} (${expr.method || 'POST'})`, // 显示名称和方法
      }));
    } else {
      // 本地函数选项：显示完整的函数ID和名称
      const allBehaviors = [...localBehaviors];

      // 去重：按ID去重，避免重复显示
      const uniqueBehaviors = allBehaviors.filter(
        (behavior, index, arr) => arr.findIndex((b) => b.id === behavior.id) === index
      );

      return uniqueBehaviors.map((behavior) => ({
        value: behavior.id,
        label: `${behavior.id}${
          behavior.name && behavior.name !== behavior.id ? ` (${behavior.name})` : ''
        }`,
      }));
    }
  }, [type, expressions, localBehaviors]);

  // 获取选中函数的详细信息
  const selectedFunction = useMemo(() => {
    if (!value) return null;

    if (type === 'remote_service') {
      return expressions.find((expr) => expr.id === value);
    } else {
      return localBehaviors.find((behavior) => behavior.id === value);
    }
  }, [value, type, expressions, localBehaviors]);

  const loading = type === 'remote_service' ? expressionLoading : behaviorLoading;

  console.log('🔍 [FunctionSelector] 数据状态:', {
    type,
    expressionsCount: expressions.length,
    behaviorsCount: behaviors.length,
    localBehaviorsCount: localBehaviors.length,
    optionListCount: optionList.length,
    loading,
    selectedValue: value,
    selectedFunction: selectedFunction?.name || selectedFunction?.id,
  });

  return (
    <div>
      {/* 🎯 简化的函数选择器 - 不显示重复信息 */}
      <Select
        placeholder={`选择${type === 'remote_service' ? '远程服务' : '本地函数'}`}
        style={{ width: '100%' }}
        value={value}
        onChange={(val) => onChange(val as string)}
        optionList={optionList}
        disabled={readonly || loading}
        showClear
        filter
        searchPlaceholder="搜索函数..."
        dropdownStyle={{
          maxHeight: '300px',
        }}
        prefix={<IconCode />}
      />

      {/* 加载状态 */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="small" />
          <Text type="tertiary" style={{ marginLeft: '8px', fontSize: '12px' }}>
            加载{type === 'remote_service' ? '远程服务' : '本地函数'}...
          </Text>
        </div>
      )}

      {/* 空状态 */}
      {!loading && optionList.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Text type="tertiary" style={{ fontSize: '12px' }}>
            暂无可用的{type === 'remote_service' ? '远程服务' : '本地函数'}
          </Text>
        </div>
      )}
    </div>
  );
};
