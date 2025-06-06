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

// 兼容性导出 - 为了让现有代码能够正常工作
// 将新的 hooks 映射到旧的命名
export { useEntityList as useEntityStore } from './entity-list';
export { useCurrentEntity as useEntityEditState } from './current-entity.store';
export { useCurrentEntityActions as useEntityEditActions } from './current-entity.store';

// 组件导出
export { EntityEditProvider } from '../components/providers/entity-edit-provider';

export * from './current-entity.store';
export * from './entity-list';
