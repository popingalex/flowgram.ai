import React, { useState, useEffect, useMemo } from 'react';

import { Typography, Button, Space, Popconfirm } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { DataManagementLayout } from '../data-management/layout';
import { useCurrentExpression, useCurrentExpressionActions } from '../../stores/current-api';
import { useExpressionStore } from '../../stores/api-list';
import { useRouter } from '../../hooks/use-router';
import { ApiSidebar } from './components/api-sidebar';

const { Title, Text } = Typography;

export const ExpressionListPage: React.FC = () => {
  const { routeState } = useRouter();
  const expressionStore = useExpressionStore();
  const currentExpression = useCurrentExpression();
  const currentExpressionActions = useCurrentExpressionActions();

  // 从路由获取选中的表达式ID
  const selectedExpressionId = routeState.expressionId;

  // 🎯 根据路由类型确定页面标题
  const isLocalMode = routeState.route === 'exp-local';
  const pageTitle = isLocalMode ? '本地函数' : '远程服务';

  // 添加调试日志
  console.log('🔍 [ExpressionListPage] 路由状态:', {
    routeState,
    selectedExpressionId,
    currentUrl: window.location.href,
    isLocalMode,
    pageTitle,
  });

  // 页面初始化时加载数据
  useEffect(() => {
    expressionStore.loadAll();
  }, [expressionStore]);

  // 监听selectedExpressionId的更新
  useEffect(() => {
    console.log('🔍 [ExpressionListPage] selectedExpressionId 更新:', selectedExpressionId);
  }, [selectedExpressionId]);

  // 按钮事件处理
  const handleSave = async () => {
    await currentExpressionActions.saveChanges();
  };

  const handleUndo = () => {
    currentExpressionActions.resetChanges();
  };

  const handleDelete = async () => {
    if (!selectedExpressionId) return;
    console.log('删除表达式:', selectedExpressionId);
    // TODO: 实现删除逻辑
  };

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页面标题和按钮 */}
      <div
        style={{
          padding: '0 24px',
          height: '48px',
          borderBottom: '1px solid var(--semi-color-border)',
          backgroundColor: 'var(--semi-color-bg-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Title heading={4} style={{ margin: 0 }}>
          {pageTitle}
        </Title>

        {selectedExpressionId && currentExpression.editingExpression && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentExpression.isSaving && (
              <Text type="secondary" size="small">
                正在保存...
              </Text>
            )}

            <Button
              icon={<IconSave />}
              onClick={handleSave}
              disabled={!currentExpression.isDirty}
              loading={currentExpression.isSaving}
              type="primary"
              size="small"
            >
              保存
            </Button>

            <Button
              icon={<IconUndo />}
              onClick={handleUndo}
              disabled={!currentExpression.isDirty}
              size="small"
            >
              撤销
            </Button>

            <Popconfirm
              title="确定删除这个表达式吗？"
              content="删除后将无法恢复"
              onConfirm={handleDelete}
            >
              <Button icon={<IconDelete />} type="danger" theme="borderless" size="small">
                删除
              </Button>
            </Popconfirm>
          </div>
        )}
      </div>

      {/* 主要内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ApiSidebar selectedExpressionId={selectedExpressionId} />
      </div>
    </div>
  );
};
