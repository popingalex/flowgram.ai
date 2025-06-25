import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';

import { nanoid } from 'nanoid';
import {
  Toast,
  Button,
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
} from '@douyinfe/semi-ui';
import {
  IconSave,
  IconUndo,
  IconDelete,
  IconChevronUp,
  IconChevronDown,
} from '@douyinfe/semi-icons';

const { Text } = Typography;

import { SaveButtonWithValidation } from '../ext/save-button-with-validation';
import { DataListSidebar } from '../data-management/sidebar';
import { DataManagementLayout } from '../data-management/layout';
import { useCurrentBehavior, useCurrentBehaviorActions } from '../../stores/current-workflow';
import { useGraphList, useGraphActions, useModuleStore } from '../../stores';
import { useRouter } from '../../hooks/use-router';
import { BehaviorWorkflowEditor } from './behavior-workflow-editor';

export const BehaviorEditor: React.FC = () => {
  const { routeState, navigate } = useRouter();
  const [searchText, setSearchText] = useState('');

  // Store数据
  const { graphs: allGraphs, loading } = useGraphList();
  const { refreshGraphs, saveGraph, createGraph, deleteGraph, addNewBehavior } = useGraphActions();
  const { modules } = useModuleStore();

  // 当前行为编辑状态
  const currentBehaviorState = useCurrentBehavior();
  const editingBehavior = currentBehaviorState.editingBehavior;
  const isDirty = currentBehaviorState.isDirty;
  const isSaving = currentBehaviorState.isSaving;

  const {
    selectBehavior,
    updateBehavior,
    updateWorkflowData,
    saveChanges,
    resetChanges,
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

    // 新建行为模式 - 从Store中查找标记为isNew的行为
    if (routeState.entityId === 'new') {
      const newBehavior = filteredGraphs.find((graph) => (graph as any).isNew);
      return newBehavior || null;
    }

    // 查找现有行为 - 优先用_indexId匹配，再用id匹配
    const behavior = filteredGraphs.find(
      (behavior) => behavior._indexId === routeState.entityId || behavior.id === routeState.entityId
    );
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
      const existingNewBehavior = filteredGraphs.find((graph) => (graph as any).isNew);
      if (!existingNewBehavior) {
        console.log('🔄 [BehaviorEditor] 页面刷新检测到new路由，创建新行为');
        addNewBehavior();
      }
    }
  }, [loading, routeState.entityId, filteredGraphs, addNewBehavior]);

  // 🔑 新增：行为列表数据，支持拖拽排序
  const [behaviorList, setBehaviorList] = useState<any[]>([]);

  // 🔑 简化：直接基于store数据展示，不重复添加
  useEffect(() => {
    // 直接使用Store中的数据，不做重复处理
    let filtered = [...filteredGraphs];

    if (searchText.trim()) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (behavior: any) =>
          behavior.id?.toLowerCase().includes(searchLower) ||
          behavior.name?.toLowerCase().includes(searchLower) ||
          behavior.desc?.toLowerCase().includes(searchLower) ||
          behavior.moduleIds?.some((moduleId: string) =>
            moduleId?.toLowerCase().includes(searchLower)
          )
      );
    }

    // 按优先级排序并转换数据结构
    const sortedBehaviors = filtered
      .sort((a, b) => (a.priority || 0) - (b.priority || 0))
      .map((behavior) => ({
        ...behavior,
        bundles: behavior.moduleIds || [],
        nodeCount: behavior.nodes?.length || 0,
        edgeCount: behavior.edges?.length || 0,
      }));

    setBehaviorList(sortedBehaviors);
  }, [filteredGraphs, searchText]);

  // 🔑 新增：拖拽排序处理函数
  const handleDragSort = useCallback(
    async (oldIndex: number, newIndex: number) => {
      if (oldIndex === newIndex) return;

      setBehaviorList((prevList) => {
        const newList = [...prevList];
        const [movedItem] = newList.splice(oldIndex, 1);
        newList.splice(newIndex, 0, movedItem);

        // 更新优先级
        const updatedList = newList.map((item, index) => ({
          ...item,
          priority: index,
        }));

        // 异步保存优先级到后台
        updatedList.forEach(async (behavior) => {
          if (!behavior.isNew) {
            try {
              await saveGraph(behavior);
            } catch (error) {
              console.error('保存行为优先级失败:', error);
            }
          }
        });

        return updatedList;
      });

      // 延迟刷新数据
      setTimeout(() => {
        refreshGraphs();
      }, 100);
    },
    [saveGraph, refreshGraphs]
  );

  // 选择行为
  const handleBehaviorSelect = useCallback(
    (behavior: any) => {
      // 优先使用_indexId，如果是新建行为则使用'new'
      const entityId = (behavior as any).isNew ? 'new' : behavior._indexId || behavior.id;
      navigate({ route: 'behavior', entityId });
    },
    [navigate]
  );

  // 检查是否有未保存的新建元素
  const hasUnsavedNew = useMemo(() => routeState.entityId === 'new', [routeState.entityId]);

  // 🔑 修改：处理行为基本信息变化
  const handleBehaviorInfoChange = useCallback(
    (field: string, value: any) => {
      console.log('🔧 [BehaviorEditor] 处理字段变化:', { field, value });
      // 更新行为属性，列表会通过useEffect自动同步
      updateBehavior({ [field]: value });
    },
    [updateBehavior]
  );

  // 🔑 新增：自定义行为渲染函数，添加优先级等统计信息
  const renderBehaviorItem = useCallback(
    (item: any, isSelected: boolean, index?: number) => {
      const searchWords = searchText.trim() ? [searchText.trim()] : [];

      // 自定义统计信息渲染
      const renderBehaviorStats = () => (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}
        >
          {/* 优先级 */}
          {typeof item.priority === 'number' && (
            <Tag size="small" color="orange">
              优先级: {item.priority}
            </Tag>
          )}

          {/* 节点统计 */}
          {item.nodeCount > 0 && (
            <Tag size="small" color="green">
              节点: {item.nodeCount}
            </Tag>
          )}

          {/* 边统计 */}
          {item.edgeCount > 0 && (
            <Tag size="small" color="blue">
              连线: {item.edgeCount}
            </Tag>
          )}

          {/* 模块统计 */}
          {item.bundles && item.bundles.length > 0 && (
            <Tag size="small" color="purple">
              模块: {item.bundles.length}
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
          {item.id}
          {typeof index === 'number' && (
            <div
              style={{
                position: 'absolute',
                right: '8px',
                top: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                zIndex: 10,
              }}
            >
              <Button
                icon={<IconChevronUp />}
                size="small"
                theme="borderless"
                disabled={index === 0 || item.isNew}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDragSort(index, index - 1);
                }}
                style={{ width: '24px', height: '20px', padding: 0 }}
              />
              <Button
                icon={<IconChevronDown />}
                size="small"
                theme="borderless"
                disabled={index === behaviorList.length - 1 || item.isNew}
                onClick={(e) => {
                  e.stopPropagation();
                  handleDragSort(index, index + 1);
                }}
                style={{ width: '24px', height: '20px', padding: 0 }}
              />
            </div>
          )}

          <div
            style={{
              width: '100%',
              cursor: 'pointer',
              paddingRight: '40px', // 为拖拽按钮留出空间
            }}
            onClick={() => handleBehaviorSelect(item)}
          >
            {/* 第一行：左侧行为信息 + 右侧统计 */}
            <div
              style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
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
                      item.id || (routeState.entityId === 'new' ? '(请输入行为ID)' : '')
                    }
                    searchWords={searchWords}
                  />
                </Text>
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

            {/* 第二行：模块标签 */}
            {item.bundles && item.bundles.length > 0 && (
              <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {item.bundles.map((moduleId: string) => {
                  const module = modules.find((m) => m.id === moduleId);
                  const displayText = module?.name || moduleId;

                  return (
                    <Tag
                      key={moduleId}
                      size="small"
                      color="blue"
                      style={{
                        fontSize: '11px',
                        lineHeight: '16px',
                        padding: '2px 6px',
                      }}
                    >
                      <Highlight sourceString={displayText} searchWords={searchWords} />
                    </Tag>
                  );
                })}
              </div>
            )}
          </div>
        </List.Item>
      );
    },
    [searchText, modules, handleBehaviorSelect, handleDragSort, behaviorList.length]
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
            <label style={{ width: '80px', fontWeight: 600 }}>优先级:</label>
            <InputNumber
              value={editingBehavior.priority || 0}
              onChange={(value) => handleBehaviorInfoChange('priority', value)}
              placeholder="数值越小优先级越高"
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

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 行为基本信息表单 */}
        {renderBehaviorInfoForm()}

        {/* 工作流编辑器 */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <BehaviorWorkflowEditor
            systemId={editingBehavior._indexId || 'new-behavior'}
            systemName={editingBehavior.name || '行为编辑器'}
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
            <SaveButtonWithValidation
              onClick={() => saveChanges({ saveGraph, createGraph })}
              loading={isSaving}
              isValid={true}
              errors={[]}
              size="small"
              type="primary"
            />
            {isDirty && !('isNew' in editingBehavior && (editingBehavior as any).isNew) && (
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
          selectedId={editingBehavior?.id}
          selectedIdField="id"
          onItemSelect={handleBehaviorSelect}
          onAdd={() => {
            // 检查是否已经有新建行为
            const existingNewBehavior = filteredGraphs.find((graph) => (graph as any).isNew);
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
          renderItem={renderBehaviorItem}
          testId="behavior-sidebar"
        />
      }
      detailContent={renderWorkflowEditor()}
    />
  );
};
