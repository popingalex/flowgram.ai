// 实体列表管理
export { useEntityListStore, useEntityList, useEntityListActions } from './entity-list';
export type { EntityListState } from './entity-list';

// 当前实体编辑管理
export {
  useCurrentEntityStore,
  useCurrentEntity,
  useCurrentEntityActions,
} from './current-entity.store';
export type { CurrentEntityState, CurrentEntityActions } from './current-entity.store';

// 函数行为管理
export {
  useBehaviorStore,
  useBehaviorList,
  useBehaviorActions,
  useBehaviorLoading,
  useBehaviorError,
  useBehaviorCategories,
} from './behavior.store';
export type { BehaviorStoreState, BehaviorActions, BehaviorStore } from './behavior.store';

// 表达式管理 (行为函数 + 远程服务)
export {
  useExpressionStore,
  useExpressionList,
  useExpressionActions,
  useExpressionLoading,
  useExpressionError,
  useExpressionCategories,
  useExpressionCallResults,
} from './expression.store';
export type { ExpressionStoreState, ExpressionActions, ExpressionStore } from './expression.store';

// 工作流图管理
export {
  useGraphStore,
  useGraphList,
  useGraphActions,
  useGraphLoading,
  useGraphError,
} from './graph.store';
export type {
  GraphStoreState,
  GraphActions,
  GraphStore,
  WorkflowGraph,
  WorkflowGraphNode,
  WorkflowGraphEdge,
} from './graph.store';

// 当前图管理
export {
  useCurrentGraphStore,
  useCurrentGraph,
  useCurrentGraphActions,
} from './current-graph.store';
export type { CurrentGraphState, CurrentGraphActions } from './current-graph.store';

// 模块管理
export { useModuleStore, ModuleStoreProvider } from './module.store';
export type {
  ModuleStoreState,
  ModuleActions,
  ModuleStore,
  Module,
  ModuleAttribute,
} from './module.store';

// 当前模块编辑管理
export {
  useCurrentModuleStore,
  useCurrentModule,
  useCurrentModuleActions,
} from './current-module.store';
export type { CurrentModuleState, CurrentModuleActions } from './current-module.store';

// 兼容性导出 - 为了让现有代码能够正常工作
// 将新的 hooks 映射到旧的命名
export { useEntityList as useEntityStore } from './entity-list';
export { useCurrentEntity as useEntityEditState } from './current-entity.store';
export { useCurrentEntityActions as useEntityEditActions } from './current-entity.store';

// 组件导出
export { EntityEditProvider } from '../components/providers/entity-edit-provider';

export * from './current-entity.store';
export * from './entity-list';
