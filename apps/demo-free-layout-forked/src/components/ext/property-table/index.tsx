// 新的组件结构 - 按照5种展示形态重新整理

// 实体属性组件
export {
  UnifiedDisplay as UnifiedPropertyDisplay,
  type PropertyData,
} from '../entity-property-tables';

// 模块属性组件
export {
  NodeDisplay as NodeModuleDisplay,
  SidebarTree as ModulePropertyTreeTable,
  type NodeModuleData,
  type ModuleTreeData,
  type ModulePropertyData,
} from '../module-property-tables';

// 保留的组件
export { EntityModuleTable } from './entity-module-table';
