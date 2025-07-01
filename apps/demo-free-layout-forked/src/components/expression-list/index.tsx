import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { Typography, Button, Space, Popconfirm, Tabs, Toast } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete, IconSync } from '@douyinfe/semi-icons';

import { DataManagementLayout } from '../data-management/layout';
import { useEndpointProbeStore } from '../../stores/endpoint-probe';
import { useCurrentExpression, useCurrentExpressionActions } from '../../stores/current-api';
import { useExpressionStore } from '../../stores/api-list';
import { useRouter } from '../../hooks/use-router';
import { ApiSidebar } from './components/api-sidebar';

const { Title, Text } = Typography;

export const ExpressionListPage: React.FC = () => {
  const { routeState, navigate } = useRouter();
  const expressionStore = useExpressionStore();
  const currentExpression = useCurrentExpression();
  const currentExpressionActions = useCurrentExpressionActions();
  const endpointProbe = useEndpointProbeStore();

  // 从路由获取选中的表达式ID
  const selectedExpressionId = routeState.expressionId;
  const [syncLoading, setSyncLoading] = useState(false);

  // 🎯 根据路由类型确定当前Tab和页面标题
  const getCurrentTab = () => {
    switch (routeState.route) {
      case 'exp-remote':
        return 'remote';
      case 'exp-local':
        return 'local';
      case 'exp-inline':
        return 'inline';
      default:
        return 'remote'; // 默认显示远程tab
    }
  };

  const currentTab = getCurrentTab();
  const pageTitle = '行为管理';

  // 添加调试日志
  console.log('🔍 [ExpressionListPage] 路由状态:', {
    routeState,
    selectedExpressionId,
    currentUrl: window.location.href,
    currentTab,
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

  // Tab切换处理
  const handleTabChange = (activeKey: string) => {
    switch (activeKey) {
      case 'remote':
        navigate({ route: 'exp-remote' });
        break;
      case 'local':
        navigate({ route: 'exp-local' });
        break;
      case 'inline':
        navigate({ route: 'exp-inline' });
        break;
    }
  };

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

  // 全局同步监控功能
  const handleGlobalSyncToKuma = useCallback(async () => {
    try {
      setSyncLoading(true);
      const result = await endpointProbe.syncToKuma();

      if (result.success) {
        Toast.success(result.message);
      } else {
        Toast.error(result.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '同步失败';
      Toast.error(message);
    } finally {
      setSyncLoading(false);
    }
  }, [endpointProbe]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* 页面标题、Tab和按钮在同一行 */}
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
        {/* 左侧：标题 + Tab */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Title heading={4} style={{ margin: 0 }}>
            {pageTitle}
          </Title>

          <Tabs
            activeKey={currentTab}
            onChange={handleTabChange}
            size="small"
            type="line"
            // style={{ height: '100%' }}
          >
            <Tabs.TabPane tab="远程" itemKey="remote" />
            <Tabs.TabPane tab="本地" itemKey="local" />
            <Tabs.TabPane tab="脚本" itemKey="inline" />
          </Tabs>
        </div>

        {/* 右侧：操作按钮 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 全局同步监控按钮 - 只在远程标签时显示 */}
          {currentTab === 'remote' && (
            <Button
              icon={<IconSync />}
              onClick={handleGlobalSyncToKuma}
              loading={syncLoading}
              type="primary"
              size="small"
              style={{ color: '#52c41a', borderColor: '#52c41a' }}
            >
              同步监控
            </Button>
          )}

          {/* 原有的表达式操作按钮 - 只在选中表达式时显示 */}
          {selectedExpressionId && currentExpression.editingExpression && (
            <>
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
            </>
          )}
        </div>
      </div>

      {/* 主要内容区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ApiSidebar selectedExpressionId={selectedExpressionId} />
      </div>
    </div>
  );
};
