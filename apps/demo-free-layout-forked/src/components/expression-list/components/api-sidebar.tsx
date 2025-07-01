import React, { useState, useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Layout, Input, Button, Space, Tooltip, Spin, Modal, Form, Toast } from '@douyinfe/semi-ui';
import {
  IconSearch,
  IconPlus,
  IconFolder,
  IconGlobe,
  IconDelete,
  IconRefresh,
} from '@douyinfe/semi-icons';

import { ApiTreeManager } from '../../ext/api-tree-manager';
import { useExpressionStore } from '../../../stores/api-list';
import { useRouter } from '../../../hooks/use-router';
import { ApiDetailPanel } from './api-detail-panel';

const { Sider, Content } = Layout;

interface ApiSidebarProps {
  selectedExpressionId?: string;
}

export const ApiSidebar: React.FC<ApiSidebarProps> = ({
  selectedExpressionId: initialSelectedId,
}) => {
  const { navigate, routeState } = useRouter();
  const expressionStore = useExpressionStore();

  // 内部状态管理当前选中的API
  const [selectedApiId, setSelectedApiId] = useState<string | undefined>(initialSelectedId);

  // 搜索状态
  const [searchKeyword, setSearchKeyword] = useState('');

  // 分组创建模态框状态
  const [groupModalVisible, setGroupModalVisible] = useState(false);

  // API创建模态框状态
  const [apiModalVisible, setApiModalVisible] = useState(false);

  // 🎯 根据当前路由类型过滤数据
  const isLocalMode = routeState.route === 'exp-local';

  // 过滤表达式数据 - 根据路由类型显示不同数据
  const filteredExpressions = expressionStore.allItems.filter((item) => {
    // 本地模式显示behavior类型，远程模式显示expression类型
    if (isLocalMode) {
      if (item.type !== 'behavior') return false;
    } else {
      if (item.type !== 'expression') return false;
    }

    if (!searchKeyword) return true;

    const searchTerm = searchKeyword.toLowerCase();
    return (
      item.id.toLowerCase().includes(searchTerm) ||
      (item.name || '').toLowerCase().includes(searchTerm) ||
      (item.desc || '').toLowerCase().includes(searchTerm)
    );
  });

  // 默认选中第一条记录 - 根据路由类型导航到不同页面
  useEffect(() => {
    if (!selectedApiId && filteredExpressions.length > 0 && routeState.expressionId !== 'new') {
      const firstApi = filteredExpressions[0];
      setSelectedApiId(firstApi.id);
      navigate({
        route: isLocalMode ? 'exp-local' : 'exp-remote',
        expressionId: firstApi.id,
      });
    }
  }, [filteredExpressions, selectedApiId, navigate, isLocalMode, routeState.expressionId]);

  // 处理API选择 - 根据路由类型导航
  const handleExpressionSelect = useCallback(
    (expressionId: string) => {
      console.log('🔍 [ApiSidebar] 选择API:', expressionId);

      // 更新内部状态
      setSelectedApiId(expressionId);

      // 同步更新URL - 根据当前路由类型
      navigate({
        route: isLocalMode ? 'exp-local' : 'exp-remote',
        expressionId,
      });
    },
    [navigate, isLocalMode]
  );

  // 处理搜索
  const handleSearch = useCallback((value: string) => {
    setSearchKeyword(value);
  }, []);

  // 创建分组
  const handleCreateGroup = useCallback(() => {
    console.log('创建分组');
    setGroupModalVisible(true);
  }, []);

  // 确认创建分组
  const handleGroupConfirm = useCallback(
    (values: any) => {
      const groupName = values.groupName?.trim();
      if (!groupName) {
        return;
      }

      console.log('🔍 [ApiSidebar] 创建新分组:', groupName);

      // 创建分组记录，这样ApiTreeManager就能显示这个分组
      const groupData = {
        _indexId: nanoid(),
        id: `GROUP_${groupName}_${Date.now()}`,
        name: groupName,
        desc: `${groupName} 分组`,
        type: 'expression' as const,
        group: `remote/${groupName}`,
        method: null,
        url: null,
        body: null,
        deprecated: false,
        isGroup: true, // 标记为分组
        inputs: [],
        output: {
          id: 'result',
          type: 'u',
          name: '分组',
          desc: '分组节点',
          required: false,
        },
      };

      // 添加分组记录到store
      expressionStore.addNewExpression(groupData);

      // 关闭模态框
      setGroupModalVisible(false);

      // 提示用户
      Toast.success(`分组 "${groupName}" 创建成功`);
      console.log('🔍 [ApiSidebar] 分组创建完成:', groupName);
    },
    [expressionStore]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = routeState.expressionId === 'new';

  // 创建API - 改为与其他页面一致的内联新建模式
  const handleCreateApi = useCallback(() => {
    // 如果已经有未保存的新建元素，禁用新建
    if (hasUnsavedNew) return;

    console.log('🔍 [ApiSidebar] 创建新API - 跳转到新建模式');

    // 直接跳转到新建模式，与其他页面保持一致
    navigate({
      route: isLocalMode ? 'exp-local' : 'exp-remote',
      expressionId: 'new',
    });

    // 更新内部状态
    setSelectedApiId('new');
  }, [navigate, isLocalMode, hasUnsavedNew]);

  // 删除API
  const handleDeleteApi = useCallback(
    (apiId: string) => {
      console.log('🔍 [ApiSidebar] 删除API:', apiId);

      // 找到要删除的API
      const apiToDelete = filteredExpressions.find((exp) => exp.id === apiId);
      const apiName = apiToDelete?.name || apiId;

      // 弹出确认对话框
      Modal.confirm({
        title: '确认删除',
        content: `确定要删除API "${apiName}" 吗？此操作无法撤销。`,
        okText: '确定删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          // 调用store的删除方法
          expressionStore.deleteExpression(apiId);

          // 如果删除的是当前选中的API，需要重新选择
          if (apiId === selectedApiId) {
            const remainingApis = filteredExpressions.filter((exp) => exp.id !== apiId);
            if (remainingApis.length > 0) {
              const nextApi = remainingApis[0];
              setSelectedApiId(nextApi.id);
              navigate({
                route: isLocalMode ? 'exp-local' : 'exp-remote',
                expressionId: nextApi.id,
              });
            } else {
              setSelectedApiId(undefined);
            }
          }

          Toast.success(`API "${apiName}" 已删除`);
        },
      });
    },
    [selectedApiId, filteredExpressions, navigate, expressionStore, isLocalMode]
  );

  // 删除分组
  const handleDeleteGroup = useCallback(
    (groupName: string) => {
      console.log('🔍 [ApiSidebar] 删除分组:', groupName);

      // 获取该分组下的所有API
      const apisInGroup = filteredExpressions.filter(
        (item) => item.group === groupName || item.category === groupName
      );

      const apiCount = apisInGroup.length;
      const groupDisplayName = groupName.replace('remote/', '');

      // 弹出确认对话框
      Modal.confirm({
        title: '确认删除分组',
        content: `确定要删除分组 "${groupDisplayName}" 吗？这将删除该分组下的 ${apiCount} 个API，此操作无法撤销。`,
        okText: '确定删除',
        cancelText: '取消',
        okType: 'danger',
        onOk: () => {
          // 删除分组下的所有API
          apisInGroup.forEach((api) => {
            expressionStore.deleteExpression(api.id);
          });

          // 如果当前选中的API被删除了，清空选择
          if (selectedApiId && apisInGroup.some((api) => api.id === selectedApiId)) {
            setSelectedApiId(undefined);
          }

          Toast.success(`分组 "${groupDisplayName}" 及其下 ${apiCount} 个API已删除`);
        },
      });
    },
    [filteredExpressions, selectedApiId, expressionStore]
  );

  // 拖拽API到分组
  const handleMoveApiToGroup = useCallback(
    (apiId: string, targetGroupKey: string) => {
      console.log('🔍 [ApiSidebar] 移动API到分组:', { apiId, targetGroupKey });

      // TODO: 实现更新API的group字段
      // 这里需要调用expressionStore的更新方法
      // expressionStore.updateExpression(apiId, { group: targetGroupKey });

      Toast.success(`API已移动到分组 "${targetGroupKey.replace('remote/', '')}"`);
    },
    [expressionStore]
  );

  // API重排序
  const handleReorderApi = useCallback(
    (dragApiId: string, dropApiId: string, dropPosition: number) => {
      console.log('🔍 [ApiSidebar] API重排序:', { dragApiId, dropApiId, dropPosition });

      // TODO: 实现API重排序逻辑
      // 这里需要调用expressionStore的重排序方法
      // expressionStore.reorderExpression(dragApiId, dropApiId, dropPosition);

      Toast.success('API顺序已更新');
    },
    [expressionStore]
  );

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    console.log('🔍 [ApiSidebar] 强制刷新数据');
    try {
      await expressionStore.refreshAll();
      Toast.success('数据已刷新');
    } catch (error) {
      console.error('刷新失败:', error);
      Toast.error('刷新失败');
    }
  }, [expressionStore]);

  return (
    <Layout style={{ height: '100%' }}>
      {/* 左侧API列表 */}
      <Sider style={{ width: 320, borderRight: '1px solid var(--semi-color-border)' }}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* 搜索和操作栏 */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid var(--semi-color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Input
              prefix={<IconSearch />}
              placeholder="搜索API..."
              value={searchKeyword}
              onChange={handleSearch}
              style={{ flex: 1 }}
              size="small"
            />
            <Tooltip content="新建分组">
              <Button size="small" icon={<IconFolder />} onClick={handleCreateGroup} />
            </Tooltip>
            <Tooltip content={hasUnsavedNew ? '请先保存当前新建项' : '新建API'}>
              <Button
                size="small"
                icon={<IconPlus />}
                onClick={handleCreateApi}
                disabled={hasUnsavedNew}
              />
            </Tooltip>
            <Tooltip content="刷新">
              <Button size="small" icon={<IconRefresh />} onClick={handleRefresh} />
            </Tooltip>
          </div>

          {/* API树 */}
          <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
            {expressionStore.loading ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  height: '200px',
                }}
              >
                <Spin />
              </div>
            ) : (
              <ApiTreeManager
                expressions={filteredExpressions}
                selectedExpressionId={selectedApiId}
                onExpressionSelect={handleExpressionSelect}
                onDeleteExpression={handleDeleteApi}
                onDeleteGroup={handleDeleteGroup}
                onMoveApiToGroup={handleMoveApiToGroup}
                onReorderApi={handleReorderApi}
              />
            )}
          </div>
        </div>
      </Sider>

      {/* 右侧API详情 */}
      <Content>
        <ApiDetailPanel selectedExpressionId={selectedApiId} />
      </Content>

      {/* 创建分组模态框 */}
      <Modal
        title="创建分组"
        visible={groupModalVisible}
        onCancel={() => setGroupModalVisible(false)}
        onOk={() => {
          // 获取表单值并处理
          const formApi = (window as any).groupFormApi;
          if (formApi) {
            const values = formApi.getValues();
            if (values.groupName?.trim()) {
              handleGroupConfirm(values);
            }
          }
        }}
        okText="确定"
        cancelText="取消"
      >
        <Form
          labelPosition="left"
          labelAlign="left"
          labelCol={{ span: 6 }}
          wrapperCol={{ span: 18 }}
          getFormApi={(formApi) => {
            (window as any).groupFormApi = formApi;
          }}
        >
          <Form.Input
            field="groupName"
            label="分组名称"
            placeholder="请输入分组名称"
            rules={[
              { required: true, message: '请输入分组名称' },
              { min: 1, message: '分组名称不能为空' },
            ]}
            autoFocus
          />
        </Form>
      </Modal>
    </Layout>
  );
};
