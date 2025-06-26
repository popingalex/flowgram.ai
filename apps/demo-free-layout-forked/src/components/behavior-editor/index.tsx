import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { nanoid } from 'nanoid';
import {
  Toast,
  Button,
  ButtonGroup,
  Popconfirm,
  Form,
  Input,
  InputNumber,
  TextArea,
  List,
  Tag,
  Typography,
  Highlight,
  Spin,
  Badge,
  Tooltip,
} from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete, IconSort, IconRefresh } from '@douyinfe/semi-icons';

const { Text } = Typography;

import { DataListSidebar, RenderContext } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { useCurrentBehavior, useCurrentBehaviorActions } from '../../stores/current-workflow';
import {
  useBehaviorPriorityState,
  useBehaviorPriorityActions,
} from '../../stores/behavior-priority';
import { useGraphList, useGraphActions, useModuleStore } from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { BehaviorWorkflowEditor } from './behavior-workflow-editor';

export const BehaviorEditor: React.FC = () => {
  const { routeState, navigate } = useRouter();
  const [searchText, setSearchText] = useState('');

  // Store数据
  const { graphs: allGraphs, loading } = useGraphList();
  const { refreshGraphs, saveGraph, createGraph, deleteGraph, addNewBehavior, clearNewBehaviors } =
    useGraphActions();
  const { modules } = useModuleStore();

  // 当前行为编辑状态
  const currentBehaviorState = useCurrentBehavior();
  const editingBehavior = currentBehaviorState.editingBehavior;
  const isDirty = currentBehaviorState.isDirty;
  const isSaving = currentBehaviorState.isSaving;

  // 行为优先级管理
  const priorityState = useBehaviorPriorityState();
  const priorityActions = useBehaviorPriorityActions();

  const {
    selectBehavior,
    updateBehavior,
    updateWorkflowData,
    saveChanges,
    resetChanges,
    clearAll,
    validateBehavior,
    setError,
  } = useCurrentBehaviorActions();

  // 过滤行为图
  const filteredGraphs = useMemo(
    () => allGraphs.filter((graph) => graph.type === 'behavior'),
    [allGraphs]
  );

  // 获取当前选中的行为
  const selectedBehavior = useMemo(() => {
    if (!routeState.entityId) return null;

    // 新建行为模式 - 从Store中查找标记为_status='new'的行为
    if (routeState.entityId === 'new') {
      const newBehavior = filteredGraphs.find((graph) => graph._status === 'new');
      return newBehavior || null;
    }

    // 查找现有行为 - 使用id匹配
    const behavior = filteredGraphs.find((behavior) => behavior.id === routeState.entityId);
    return behavior || null;
  }, [filteredGraphs, routeState.entityId]);

  // 当选中的行为改变时，更新CurrentBehaviorStore
  useEffect(() => {
    if (selectedBehavior) {
      selectBehavior(selectedBehavior);
    } else {
      selectBehavior(null);
    }
  }, [selectedBehavior, selectBehavior]);

  // 默认选择逻辑：如果有行为则选第一个，否则显示空工作流
  useEffect(() => {
    if (!loading && !routeState.entityId && filteredGraphs.length > 0) {
      const firstBehavior = filteredGraphs[0];
      navigate({ route: 'behavior', entityId: firstBehavior.id });
    }
  }, [loading, filteredGraphs.length, routeState.entityId]);

  // 🔑 新增：处理刷新页面时的新建行为创建
  useEffect(() => {
    if (!loading && routeState.entityId === 'new') {
      // 检查是否已经有新建行为
      const existingNewBehavior = filteredGraphs.find((graph) => graph._status === 'new');
      if (!existingNewBehavior) {
        console.log('🔄 [BehaviorEditor] 页面刷新检测到new路由，创建新行为');
        addNewBehavior();
      }
    }
  }, [loading, routeState.entityId, filteredGraphs, addNewBehavior]);

  // 🔑 新增：初始化优先级store（带缓存检查）
  useEffect(() => {
    if (!loading && filteredGraphs.length > 0) {
      if (priorityActions.needsUpdate(filteredGraphs)) {
        console.log('🔄 [BehaviorEditor] 缓存过期或数据变化，重新初始化优先级');
        priorityActions.initFromBehaviors(filteredGraphs);
      } else {
        console.log('🔄 [BehaviorEditor] 使用缓存的优先级数据');
      }
    }
  }, [loading, filteredGraphs, priorityActions]);

  // 🔑 新增：行为列表数据，支持拖拽排序
  const [behaviorList, setBehaviorList] = useState<any[]>([]);

  // 🔑 验证逻辑：检查是否可以保存
  const canSave = useMemo(() => {
    if (!editingBehavior) return false;

    // 基础验证：行为必须有ID
    if (!editingBehavior.id?.trim()) {
      return false;
    }

    // 检查行为ID是否与其他行为重复
    const otherBehaviors = filteredGraphs.filter((b) => b._indexId !== editingBehavior._indexId);
    if (otherBehaviors.some((b) => b.id === editingBehavior.id)) {
      return false;
    }

    return true;
  }, [editingBehavior, filteredGraphs]);

  // 🎯 验证逻辑：生成详细的异常信息列表
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (!editingBehavior) return errors;

    // 1. 检查行为ID
    if (!editingBehavior.id?.trim()) {
      errors.push('行为ID不能为空');
    } else {
      // 检查行为ID是否与其他行为重复
      const otherBehaviors = filteredGraphs.filter((b) => b._indexId !== editingBehavior._indexId);
      if (otherBehaviors.some((b) => b.id === editingBehavior.id)) {
        errors.push(`行为ID "${editingBehavior.id}" 已存在`);
      }
    }

    // 2. 检查名称（可选，但如果填写了要有意义）
    if (editingBehavior.name && editingBehavior.name.trim().length === 0) {
      errors.push('行为名称不能为空白字符');
    }

    return errors;
  }, [editingBehavior, filteredGraphs]);

  // 🔑 修复：左侧列表数据同步，使用优先级store的数据
  useEffect(() => {
    // 🔑 关键检查：确保优先级store包含所有行为
    const allBehaviors =
      editingBehavior && editingBehavior._status === 'new'
        ? [
            editingBehavior,
            // 🔑 修复：过滤时同时检查_indexId和id，避免重复
            ...filteredGraphs.filter(
              (b) => b._indexId !== editingBehavior._indexId && b.id !== editingBehavior.id
            ),
          ]
        : filteredGraphs;

    // 🔑 如果优先级store需要更新，先初始化
    if (priorityActions.needsUpdate(allBehaviors)) {
      priorityActions.initFromBehaviors(allBehaviors);
      return; // 等待下次useEffect触发
    }

    // 🔑 修复：正确处理新建行为和已保存行为的合并逻辑
    let behaviors = [...filteredGraphs];

    if (editingBehavior) {
      if (editingBehavior._status === 'new') {
        // 🔑 新建行为：只有当URL是/behavior/new时才显示
        if (routeState.entityId === 'new') {
          // 🔑 修复：基于_indexId过滤，避免重复的新建行为
          behaviors = behaviors.filter((b) => b._indexId !== editingBehavior._indexId);
          // 将新建行为添加到列表顶部
          behaviors = [editingBehavior, ...behaviors];

          // 新建行为处理完成
        }
        // 如果URL不是/behavior/new，说明已经导航到其他行为，不显示新建行为
      } else {
        // 🔑 已保存行为：基于_indexId替换列表中对应的行为
        const editingIndex = behaviors.findIndex((b) => b._indexId === editingBehavior._indexId);

        if (editingIndex >= 0) {
          behaviors[editingIndex] = editingBehavior;
          // 已保存行为替换完成
        }
      }
    }

    // 应用搜索过滤
    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      behaviors = behaviors.filter(
        (behavior: any) =>
          behavior.id?.toLowerCase().includes(searchLower) ||
          behavior.name?.toLowerCase().includes(searchLower) ||
          behavior.desc?.toLowerCase().includes(searchLower) ||
          behavior.moduleIds?.some((moduleId: string) =>
            moduleId?.toLowerCase().includes(searchLower)
          )
      );
    }

    // 🔑 关键修复：使用优先级store的数据进行排序
    const sortedBehaviors = behaviors
      .map((behavior) => {
        // 从优先级store中查找对应的优先级
        const priorityItem = priorityState.items.find(
          (item) =>
            // 🔑 修复：严格基于_indexId匹配，避免不同行为因为相同ID而共享优先级数据
            item._indexId === behavior._indexId
        );

        // 新建行为的优先级匹配（移除过度调试信息）

        return {
          ...behavior,
          // 使用优先级store的priority，如果没找到则使用原始priority
          priority: priorityItem ? priorityItem.priority : behavior.priority || 0,
          bundles: behavior.moduleIds || [],
          nodeCount: behavior.nodes?.length || 0,
          edgeCount: behavior.edges?.length || 0,
        };
      })
      .sort((a, b) => {
        // 🔑 修复：严格按优先级排序，确保数据一致性
        const aPriority = a.priority || 0;
        const bPriority = b.priority || 0;
        const result = aPriority - bPriority;

        // 排序结果检查（移除过度调试信息）

        return result;
      });

    // 设置行为列表（移除过度调试信息）

    setBehaviorList(sortedBehaviors);
  }, [filteredGraphs, searchText, editingBehavior, routeState.entityId, priorityState.items]);

  // 🔑 修复：拖拽排序处理函数
  const handleDragSort = useCallback(
    (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      // 拖拽排序开始（移除过度调试信息）

      // 🔑 重要：只更新优先级store，不更新本地列表
      // 本地列表会通过useEffect自动同步优先级store的变化
      priorityActions.updateOrder(oldIndex, newIndex);

      // 拖拽排序完成（移除过度调试信息）
    },
    [priorityActions, behaviorList, priorityState.items]
  );

  // 选择行为
  const handleBehaviorSelect = useCallback(
    (behavior: any) => {
      // 选择行为（移除过度调试信息）
      // 🔑 修复：使用业务ID进行导航，新建行为使用'new'
      const entityId = behavior._status === 'new' ? 'new' : behavior.id;
      navigate({ route: 'behavior', entityId });
    },
    [navigate]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = useMemo(() => routeState.entityId === 'new', [routeState.entityId]);

  // 🔑 新增：处理保存操作
  const handleSave = useCallback(async () => {
    if (!editingBehavior) return;

    try {
      const savedBehavior = await saveChanges({ saveGraph, createGraph });

      // 🔑 修复：保存成功后的处理
      if (savedBehavior) {
        console.log('✅ [BehaviorEditor] 保存成功，执行后续操作:', savedBehavior.id);

        // 1. 清理所有新建行为
        clearNewBehaviors();
        console.log('🧹 [BehaviorEditor] 已清理新建行为');

        // 2. 刷新后台数据列表
        await refreshGraphs();
        console.log('🔄 [BehaviorEditor] 数据列表已刷新');

        // 3. 清理当前行为的working copy
        clearAll();
        console.log('🔄 [BehaviorEditor] 已清理working copy');

        // 4. 切换到新创建行为的URL
        navigate({ route: 'behavior', entityId: savedBehavior.id });
        console.log('🔄 [BehaviorEditor] 已导航到新行为:', savedBehavior.id);

        Toast.success('行为保存成功');
      } else {
        Toast.success('行为更新成功');
      }
    } catch (error) {
      console.error('❌ [BehaviorEditor] 保存失败:', error);
      Toast.error('保存失败：' + (error instanceof Error ? error.message : '未知错误'));
    }
  }, [
    editingBehavior,
    saveChanges,
    saveGraph,
    createGraph,
    refreshGraphs,
    clearNewBehaviors,
    navigate,
  ]);

  // 🔑 修改：处理行为基本信息变化
  const handleBehaviorInfoChange = useCallback(
    (field: string, value: any) => {
      // 处理字段变化（移除过度调试信息）

      // 🔑 ID变化时不需要同步优先级store，因为我们只基于_indexId操作

      // 更新行为属性，列表会通过useEffect自动同步
      updateBehavior({ [field]: value });
    },
    [updateBehavior, editingBehavior, priorityActions]
  );

  // 🔑 简化的行为列表项渲染函数 - 支持拖拽手柄
  const renderBehaviorItem = useCallback(
    (context: RenderContext<any> & { dragHandleRef?: any; dragHandleListeners?: any }) => {
      const {
        item,
        isSelected,
        index,
        searchText: contextSearchText,
        onItemSelect,
        enableDragSort,
        dragHandleRef,
        dragHandleListeners,
      } = context;

      const searchWords = contextSearchText.trim() ? [contextSearchText.trim()] : [];

      // 拖拽手柄props检查（移除过度调试信息）

      // 统计信息渲染 - 显示优先级和节点统计用于调试
      const renderBehaviorStats = () => (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}
        >
          {/* 优先级显示 - 用于调试 */}
          <Tag size="small" color="blue">
            优先级: {item.priority || 0}
          </Tag>
          {/* 节点统计 */}
          {item.nodeCount > 0 && (
            <Tag size="small" color="green">
              节点: {item.nodeCount}
            </Tag>
          )}
        </div>
      );

      // 🔑 重要：使用完整的List.Item结构，保持与其他页面一致的样式
      return (
        <List.Item
          style={{
            backgroundColor: isSelected ? 'var(--semi-color-primary-light-default)' : undefined,
            padding: '12px 16px',
            position: 'relative',
          }}
          className="data-list-item"
          data-testid={`behavior-item-${item.id || item._indexId}`}
        >
          {/* 🔑 拖拽手柄 - 修复：显示拖拽手柄 */}
          {enableDragSort && (
            <div
              ref={dragHandleRef}
              {...(dragHandleListeners || {})}
              style={{
                position: 'absolute',
                left: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'grab',
                padding: '4px',
                borderRadius: '4px',
                backgroundColor: 'var(--semi-color-fill-0)',
                border: '1px solid var(--semi-color-border)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
              }}
              onMouseDown={(e) => e.stopPropagation()}
              title="拖拽排序"
            >
              <span style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>⋮⋮</span>
            </div>
          )}

          <div
            style={{
              width: '100%',
              cursor: 'pointer',
              paddingLeft: enableDragSort ? '40px' : '0', // 🔑 为拖拽手柄留出空间
            }}
            onClick={() => onItemSelect(item)}
          >
            {/* 显示行为的基本信息：ID、名称 */}
            <div
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* ID */}
                <Text
                  style={{
                    color: isSelected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '13px',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <Highlight
                    sourceString={
                      item.id && item.id.trim()
                        ? item.id
                        : item._status === 'new'
                        ? '(请输入行为ID)'
                        : '(无ID)'
                    }
                    searchWords={searchWords}
                  />
                </Text>

                {/* 显示nanoid用于调试 */}
                <Text
                  style={{
                    color: 'var(--semi-color-text-2)',
                    fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                    fontSize: '11px',
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    marginTop: '2px',
                  }}
                >
                  nanoid: {item._indexId}
                </Text>

                {/* 名称 */}
                {item.name && (
                  <Text
                    type="secondary"
                    size="small"
                    style={{
                      color: 'var(--semi-color-text-1)',
                      display: 'block',
                      margin: '2px 0 0 0',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    <Highlight sourceString={item.name} searchWords={searchWords} />
                  </Text>
                )}
              </div>
              <div style={{ flexShrink: 0, marginLeft: '8px' }}>{renderBehaviorStats()}</div>
            </div>
          </div>
        </List.Item>
      );
    },
    [modules, routeState.entityId]
  );

  // 渲染行为基本信息表单
  const renderBehaviorInfoForm = () => {
    if (!editingBehavior) return null;

    return (
      <div style={{ padding: '16px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '80px', fontWeight: 600 }}>行为ID:</label>
            <Input
              value={editingBehavior.id || ''}
              onChange={(value) => {
                handleBehaviorInfoChange('id', value);
              }}
              placeholder="请输入行为ID"
              style={{ flex: 1 }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '80px', fontWeight: 600 }}>行为名称:</label>
            <Input
              value={editingBehavior.name || ''}
              onChange={(value) => {
                handleBehaviorInfoChange('name', value);
              }}
              placeholder="请输入行为名称"
              style={{ flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ width: '80px', fontWeight: 600 }}>描述:</label>
            <TextArea
              value={editingBehavior.desc || ''}
              onChange={(value) => {
                handleBehaviorInfoChange('desc', value);
              }}
              placeholder="请输入行为描述"
              style={{ flex: 1 }}
              rows={2}
            />
          </div>
        </div>
      </div>
    );
  };

  // 渲染工作流编辑器
  const renderWorkflowEditor = () => {
    if (!editingBehavior) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--semi-color-text-2)' }}>
          请选择一个行为进行编辑
        </div>
      );
    }

    // 工作流编辑器数据（移除过度调试信息）

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 行为基本信息表单 */}
        {renderBehaviorInfoForm()}

        {/* 工作流编辑器 */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <BehaviorWorkflowEditor
            key={editingBehavior._indexId || editingBehavior.id}
            initialData={{
              nodes: editingBehavior.nodes || [],
              edges: editingBehavior.edges || [],
            }}
            style={{ height: '100%' }}
            onDataChange={updateWorkflowData}
          />
        </div>
      </div>
    );
  };

  return (
    <DataManagementLayout
      title="行为编辑"
      headerActions={
        editingBehavior && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isSaving && (
              <Text type="secondary" size="small">
                正在保存...
              </Text>
            )}

            {/* 优先级组合按钮 */}
            <ButtonGroup>
              <Button
                icon={<IconSort />}
                size="small"
                disabled={true}
                style={{
                  cursor: 'default',
                  color: 'var(--semi-color-text-0)',
                  fontWeight: 500,
                }}
              >
                优先级
              </Button>
              <Button
                icon={<IconSave />}
                onClick={async () => {
                  try {
                    await priorityActions.savePriorities(filteredGraphs);
                    Toast.success('优先级保存成功');
                  } catch (error) {
                    Toast.error('优先级保存失败');
                  }
                }}
                disabled={!priorityState.isDirty}
                loading={priorityState.loading}
                size="small"
                type={priorityState.isDirty ? 'primary' : 'tertiary'}
                data-testid="save-priority-btn"
              />
              <Button
                icon={<IconRefresh />}
                onClick={() => {
                  // 🔑 修复：重置优先级后重新初始化
                  priorityActions.resetChanges();
                  // 重新从当前行为列表初始化优先级
                  priorityActions.initFromBehaviors(filteredGraphs);
                  Toast.success('优先级已重置');
                }}
                disabled={!priorityState.isDirty}
                size="small"
                data-testid="reset-priority-btn"
                title="重置到上次保存"
              />
            </ButtonGroup>

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

            {isDirty && (
              <Button icon={<IconUndo />} size="small" onClick={resetChanges} disabled={isSaving}>
                撤销
              </Button>
            )}
            <Popconfirm
              title="确定删除这个行为吗？"
              content="删除后将无法恢复"
              onConfirm={async () => {
                try {
                  await deleteGraph(editingBehavior.id);
                  // 删除成功后，导航到第一个行为或新建页面
                  if (filteredGraphs.length > 1) {
                    const remainingBehaviors = filteredGraphs.filter(
                      (b) => b.id !== editingBehavior.id
                    );
                    if (remainingBehaviors.length > 0) {
                      navigate({ route: 'behavior', entityId: remainingBehaviors[0].id });
                    } else {
                      navigate({ route: 'behavior', entityId: 'new' });
                    }
                  } else {
                    navigate({ route: 'behavior', entityId: 'new' });
                  }
                } catch (error) {
                  console.error('删除行为失败:', error);
                }
              }}
            >
              <Button icon={<IconDelete />} type="danger" theme="borderless" size="small">
                删除
              </Button>
            </Popconfirm>
          </div>
        )
      }
      sidebarContent={
        <DataListSidebar
          items={behaviorList}
          loading={loading}
          searchText={searchText}
          onSearchChange={setSearchText}
          searchPlaceholder="搜索行为ID、名称、模块..."
          selectedId={routeState.entityId === 'new' ? 'new' : routeState.entityId}
          selectedIdField={routeState.entityId === 'new' ? '_status' : 'id'}
          onItemSelect={handleBehaviorSelect}
          onAdd={() => {
            // 检查是否已经有新建行为
            const existingNewBehavior = filteredGraphs.find((graph) => graph._status === 'new');
            if (!existingNewBehavior) {
              addNewBehavior();
            }
            navigate({ route: 'behavior', entityId: 'new' });
          }}
          onRefresh={refreshGraphs}
          addDisabled={hasUnsavedNew}
          emptyText="暂无行为"
          modules={modules}
          enableDragSort={true}
          onDragSort={handleDragSort}
          renderMethod={{
            type: 'custom',
            render: renderBehaviorItem,
          }}
          testId="behavior-sidebar"
        />
      }
      detailContent={renderWorkflowEditor()}
    />
  );
};
