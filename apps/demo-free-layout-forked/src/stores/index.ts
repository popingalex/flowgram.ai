// 实体列表管理
export { useEntityListStore, useEntityList, useEntityListActions } from './entity-list';
export type { EntityListState } from './entity-list';

// 当前实体编辑管理
export { useCurrentEntityStore, useCurrentEntity, useCurrentEntityActions } from './current-entity';
export type { CurrentEntityState, CurrentEntityActions } from './current-entity';

// 函数行为管理
export {
  useBehaviorStore,
  useBehaviorList,
  useBehaviorActions,
  useBehaviorLoading,
  useBehaviorError,
  useBehaviorCategories,
} from './function-list';
export type { BehaviorStoreState, BehaviorActions, BehaviorStore } from './function-list';

// API管理 (行为函数 + 远程服务)
export {
  useExpressionStore,
  useExpressionList,
  useExpressionActions,
  useExpressionLoading,
  useExpressionError,
  useExpressionCategories,
  useExpressionCallResults,
} from './api-list';
export type { ExpressionStoreState, ExpressionActions, ExpressionStore } from './api-list';

// 工作流图管理
export {
  useGraphStore,
  useGraphList,
  useGraphActions,
  useGraphLoading,
  useGraphError,
} from './workflow-list';
export type {
  GraphStoreState,
  GraphActions,
  GraphStore,
  WorkflowGraph,
  WorkflowGraphNode,
  WorkflowGraphEdge,
} from './workflow-list';

// 当前工作流管理
export { useCurrentBehavior, useCurrentBehaviorActions } from './current-workflow';
export type { CurrentBehaviorState, CurrentBehaviorActions } from './current-workflow';

// 模块管理
export { useModuleStore, ModuleStoreProvider } from './module-list';
export type {
  ModuleStoreState,
  ModuleActions,
  ModuleStore,
  Module,
  ModuleAttribute,
} from './module-list';

// 当前模块编辑管理
export { useCurrentModuleStore, useCurrentModule, useCurrentModuleActions } from './current-module';
export type { CurrentModuleState, CurrentModuleActions } from './current-module';

// 当前API编辑管理
export {
  useCurrentExpressionStore,
  useCurrentExpression,
  useCurrentExpressionActions,
} from './current-api';
export type { CurrentExpressionState, CurrentExpressionActions } from './current-api';

// 兼容性导出 - 为了让现有代码能够正常工作
// 将新的 hooks 映射到旧的命名
export { useEntityList as useEntityStore } from './entity-list';
export { useCurrentEntity as useEntityEditState } from './current-entity';
export { useCurrentEntityActions as useEntityEditActions } from './current-entity';

// 临时兼容性导出 - 为旧的useCurrentGraph提供替代
import {
  useCurrentBehavior as _useCurrentBehavior,
  useCurrentBehaviorActions as _useCurrentBehaviorActions,
} from './current-workflow';

export const useCurrentGraph = () => {
  const { editingBehavior } = _useCurrentBehavior();
  return {
    workflowData: editingBehavior?.nodes
      ? { nodes: editingBehavior.nodes, edges: editingBehavior.edges }
      : null,
    entityId: editingBehavior?.id || null,
    graphId: editingBehavior?.id || null,
    loading: false,
    error: null,
  };
};

export const useCurrentGraphActions = () => {
  const { updateWorkflowData } = _useCurrentBehaviorActions();
  return {
    setGraph: () => {},
    clearGraph: () => {},
    updateWorkflowData,
    setLoading: () => {},
    setError: () => {},
  };
};

// 组件导出
export { EntityEditProvider } from '../components/providers/entity-edit-provider';

export * from './current-entity';
export * from './entity-list';
