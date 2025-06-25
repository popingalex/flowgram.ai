import React, { useState, useEffect, useMemo } from 'react';

import { Typography } from '@douyinfe/semi-ui';

import { useExpressionStore } from '../../stores/api-list';
import { useRouter } from '../../hooks/use-router';
import { ApiSidebar } from './components/api-sidebar';

const { Title, Text } = Typography;

export const ExpressionListPage: React.FC = () => {
  const { routeState } = useRouter();
  const expressionStore = useExpressionStore();

  // 从路由获取选中的表达式ID
  const selectedExpressionId = routeState.expressionId;

  // 添加调试日志
  console.log('🔍 [ExpressionListPage] 路由状态:', {
    routeState,
    selectedExpressionId,
    currentUrl: window.location.href,
  });

  // 页面初始化时加载数据
  useEffect(() => {
    expressionStore.loadAll();
  }, [expressionStore]);

  // 监听selectedExpressionId的更新
  useEffect(() => {
    console.log('🔍 [ExpressionListPage] selectedExpressionId 更新:', selectedExpressionId);
  }, [selectedExpressionId]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页面标题 */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <Title heading={4} style={{ margin: 0 }}>
              远程服务
            </Title>
            {/* 添加调试信息显示 */}
            {selectedExpressionId && (
              <Text type="tertiary" style={{ fontSize: '12px', marginTop: '4px' }}>
                当前选中: {selectedExpressionId}
              </Text>
            )}
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{ flex: 1 }}>
        <ApiSidebar selectedExpressionId={selectedExpressionId} />
      </div>
    </div>
  );
};
