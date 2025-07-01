import React, { useState, useMemo, useCallback, useEffect } from 'react';

import { Toast, Button, Badge, Tooltip, Popconfirm, Typography } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { DetailPanel } from '../data-management/detail-panel';
import { CodeType, SystemBehavior, BehaviorParameter } from '../../typings/behavior';
import {
  useSystemBehaviorList,
  useSystemBehaviorActions,
  useSystemBehaviorEdit,
} from '../../stores/system-behavior';
import { useModuleStore } from '../../stores/module-list';
import { useRouter } from '../../hooks/use-router';
import { BehaviorDetail } from './behavior-detail';

const { Text } = Typography;

export const BehaviorEditor: React.FC = () => {
  const { behaviors, loading } = useSystemBehaviorList();
  const { loadBehaviors, createBehavior, updateBehavior, deleteBehavior, resetChanges, startEdit } =
    useSystemBehaviorActions();
  const { routeState, navigate } = useRouter();
  const { modules } = useModuleStore();

  const selectedBehaviorId = routeState.entityId || null;
  const [searchText, setSearchText] = useState('');

  // 初始化加载数据
  useEffect(() => {
    loadBehaviors();
  }, [loadBehaviors]);

  // 获取当前选中的行为
  const selectedBehavior = useMemo(() => {
    console.log('🔍 [BehaviorEditor] 计算selectedBehavior:', {
      entityId: routeState.entityId,
      behaviorsCount: behaviors.length,
      behaviors: behaviors.map((b) => ({ id: b.id, name: b.name })),
    });

    if (!routeState.entityId) {
      console.log('🔍 [BehaviorEditor] 没有entityId，返回null');
      return null;
    }

    // 新建行为模式
    if (routeState.entityId === 'new') {
      console.log('🔍 [BehaviorEditor] 新建模式');
      return {
        _indexId: 'new',
        id: '',
        name: '',
        description: '',
        parameters: [],
        codeConfig: { type: CodeType.LOCAL },
        _status: 'new' as const,
      };
    }

    // 查找现有行为
    const found = behaviors.find((behavior) => behavior.id === routeState.entityId);
    console.log('🔍 [BehaviorEditor] 查找结果:', {
      searchId: routeState.entityId,
      found: found ? { id: found.id, name: found.name } : null,
    });

    return found || null;
  }, [behaviors, routeState.entityId]);

  // 🔑 关键修复：当选中行为变化时，同步到SystemBehaviorStore的编辑状态
  useEffect(() => {
    if (selectedBehavior) {
      console.log('🔄 [BehaviorEditor] 同步行为到编辑状态:', selectedBehavior.id || '新建行为');
      startEdit(selectedBehavior);
    }
  }, [selectedBehavior, startEdit]);

  // 默认选中第一个行为
  useEffect(() => {
    if (!loading && behaviors.length > 0 && !routeState.entityId) {
      const firstBehavior = behaviors[0];
      navigate({ route: 'behavior', entityId: firstBehavior.id });
    }
  }, [loading, behaviors, routeState.entityId, navigate]);

  // 过滤行为列表
  const filteredBehaviors = useMemo(() => {
    if (!searchText.trim()) return behaviors;
    const searchLower = searchText.toLowerCase();
    return behaviors.filter(
      (behavior) =>
        behavior.id.toLowerCase().includes(searchLower) ||
        (behavior.name || '').toLowerCase().includes(searchLower)
    );
  }, [behaviors, searchText]);

  // 选择行为
  const handleBehaviorSelect = useCallback(
    (behavior: any) => {
      navigate({ route: 'behavior', entityId: behavior.id });
    },
    [navigate]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = useMemo(() => routeState.entityId === 'new', [routeState.entityId]);

  // 添加行为
  const handleAddBehavior = useCallback(async () => {
    if (hasUnsavedNew) return;
    navigate({ route: 'behavior', entityId: 'new' });
  }, [navigate, hasUnsavedNew]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    await loadBehaviors();
    Toast.info('数据已刷新');
  }, [loadBehaviors]);

  // 保存行为
  const handleSave = useCallback(async () => {
    if (!selectedBehavior) return;

    try {
      const wasNewBehavior = selectedBehavior._status === 'new';

      if (wasNewBehavior) {
        await createBehavior(selectedBehavior);
        console.log('✅ 新行为创建成功:', selectedBehavior.id);
        if (selectedBehavior.id) {
          navigate({ route: 'behavior', entityId: selectedBehavior.id });
        }
      } else {
        await updateBehavior(selectedBehavior._indexId, selectedBehavior);
        console.log('✅ 行为保存成功:', selectedBehavior.id);
      }

      Toast.success('行为保存成功');
    } catch (error) {
      console.error('❌ 行为保存失败:', error);
      Toast.error('行为保存失败');
    }
  }, [selectedBehavior, createBehavior, updateBehavior, navigate]);

  // 撤销修改
  const handleUndo = useCallback(() => {
    if (!selectedBehavior) return;
    console.log('↩️ 撤销行为修改:', selectedBehavior.id);
    resetChanges();
    Toast.info('已撤销修改');
  }, [selectedBehavior, resetChanges]);

  // 删除行为
  const handleDelete = useCallback(async () => {
    if (!selectedBehavior || selectedBehavior._status === 'new') return;

    try {
      await deleteBehavior(selectedBehavior._indexId);
      console.log('🗑️ 行为删除成功:', selectedBehavior.id);
      Toast.success('行为删除成功');

      // 跳转到第一个行为或清空选择
      if (behaviors.length > 1) {
        const remainingBehaviors = behaviors.filter(
          (b) => b._indexId !== selectedBehavior._indexId
        );
        if (remainingBehaviors.length > 0) {
          navigate({ route: 'behavior', entityId: remainingBehaviors[0].id });
        }
      } else {
        navigate({ route: 'behavior' });
      }
    } catch (error) {
      console.error('❌ 行为删除失败:', error);
      Toast.error('行为删除失败');
    }
  }, [selectedBehavior, deleteBehavior, behaviors, navigate]);

  // 验证能否保存
  const canSave = useMemo(() => {
    if (!selectedBehavior) return false;
    if (!selectedBehavior.id?.trim()) return false;
    if (!selectedBehavior.name?.trim()) return false;
    return true;
  }, [selectedBehavior]);

  // 验证错误信息
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!selectedBehavior) return errors;

    if (!selectedBehavior.id?.trim()) {
      errors.push('行为ID不能为空');
    }
    if (!selectedBehavior.name?.trim()) {
      errors.push('行为名称不能为空');
    }

    return errors;
  }, [selectedBehavior]);

  // 从store获取编辑状态
  const { isDirty, isSaving } = useSystemBehaviorEdit();

  // 获取行为关联的模块数量 - 用于显示统计标签
  const getModuleCount = useCallback((behavior: SystemBehavior) => {
    let moduleCount = 0;

    // 统计参数中配置的模块数量
    behavior.parameters?.forEach((param: BehaviorParameter) => {
      const whitelistCount = param.filter?.moduleFilter?.whitelist?.length || 0;
      const blacklistCount = param.filter?.moduleFilter?.blacklist?.length || 0;
      moduleCount += whitelistCount + blacklistCount;
    });

    return moduleCount;
  }, []);

  // 为行为列表添加模块统计信息
  const behaviorsWithStats = useMemo(
    () =>
      filteredBehaviors.map((behavior) => ({
        ...behavior,
        // 添加bundles字段用于显示统计标签（虽然名字是bundles，但实际统计的是参数中的模块）
        bundles:
          behavior.parameters
            ?.flatMap((param) => [
              ...(param.filter?.moduleFilter?.whitelist || []),
              ...(param.filter?.moduleFilter?.blacklist || []),
            ])
            .filter((moduleId, index, arr) => arr.indexOf(moduleId) === index) || [], // 去重
      })),
    [filteredBehaviors]
  );

  return (
    <DataManagementLayout
      title="系统管理"
      headerActions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 原有的行为操作按钮 */}
          {selectedBehavior && (
            <>
              {isSaving && (
                <Text type="secondary" size="small">
                  正在保存...
                </Text>
              )}

              {/* 保存按钮 */}
              {validationErrors.length > 0 ? (
                <Tooltip
                  content={
                    <div>
                      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                        发现 {validationErrors.length} 个问题：
                      </div>
                      <ul style={{ margin: 0, paddingLeft: '16px' }}>
                        {validationErrors.map((error, index) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            {error}
                          </li>
                        ))}
                      </ul>
                    </div>
                  }
                  position="bottomLeft"
                >
                  <Badge count={validationErrors.length} type="danger">
                    <Button
                      icon={<IconSave />}
                      onClick={handleSave}
                      disabled={!canSave || !isDirty}
                      loading={isSaving}
                      type="primary"
                      size="small"
                      data-testid="save-behavior-btn"
                    >
                      保存
                    </Button>
                  </Badge>
                </Tooltip>
              ) : (
                <Button
                  icon={<IconSave />}
                  onClick={handleSave}
                  disabled={!canSave || !isDirty}
                  loading={isSaving}
                  type="primary"
                  size="small"
                  data-testid="save-behavior-btn"
                >
                  保存
                </Button>
              )}

              {selectedBehavior?._status !== 'new' && (
                <Button
                  icon={<IconUndo />}
                  onClick={handleUndo}
                  disabled={!isDirty}
                  size="small"
                  data-testid="undo-behavior-btn"
                >
                  撤销
                </Button>
              )}

              <Popconfirm
                title="确定删除这个行为吗？"
                content="删除后将无法恢复"
                onConfirm={handleDelete}
              >
                <Button
                  icon={<IconDelete />}
                  type="danger"
                  theme="borderless"
                  size="small"
                  data-testid="delete-behavior-btn"
                >
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </div>
      }
      sidebarContent={
        <DataListSidebar
          items={behaviorsWithStats}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索行为ID、名称..."
          selectedId={selectedBehaviorId || undefined}
          selectedIdField="id"
          onItemSelect={handleBehaviorSelect}
          onAdd={handleAddBehavior}
          onRefresh={handleRefresh}
          emptyText="暂无行为"
          modules={modules}
        />
      }
      detailContent={
        <DetailPanel
          selectedItem={selectedBehavior}
          isDirty={isDirty}
          isSaving={isSaving}
          canSave={canSave}
          onSave={handleSave}
          onUndo={handleUndo}
          onDelete={handleDelete}
          validationErrors={validationErrors}
          emptyText="请选择左侧行为查看详情"
          deleteConfirmTitle="确定删除这个行为吗？"
          deleteConfirmContent="删除后将无法恢复"
          testId="behavior"
          renderContent={(behavior, actionButtons, statusInfo) => (
            <BehaviorDetail selectedBehavior={behavior} />
          )}
        />
      }
    />
  );
};
