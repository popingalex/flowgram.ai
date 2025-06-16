import React from 'react';

// 实体属性组件
export { EditableEntityAttributeTable } from './sidebar-editor';
export { UnifiedPropertyDisplay as UnifiedDisplay, type PropertyData } from './unified-display';

// 模块属性组件
export { NodeModuleDisplay, type NodeModuleData } from './node-display';
export {
  ModulePropertyTreeTable,
  type ModuleTreeData,
  type ModulePropertyData,
} from './sidebar-tree';

// 统一属性表格组件配置
export interface PropertyTableConfig {
  modular?: boolean; // false=实体属性, true=模块属性
  mode?: 'sidebar' | 'node'; // 显示模式
  readonly?: boolean;
}

// 组件选择器工具函数
export function getPropertyComponent(config: PropertyTableConfig) {
  const { modular = false, mode = 'sidebar' } = config;

  if (modular) {
    // 模块属性模式
    return mode === 'node' ? 'NodeModuleDisplay' : 'ModulePropertyTreeTable';
  } else {
    // 实体属性模式
    return mode === 'node' ? 'UnifiedDisplay' : 'EditableEntityAttributeTable';
  }
}

// 使用说明：
// import { EditableEntityAttributeTable, ModulePropertyTreeTable, getPropertyComponent } from './property-list';
//
// 根据配置选择组件：
// const componentName = getPropertyComponent({ modular: true, mode: 'sidebar' });
//
// 或直接使用具体组件：
// <EditableEntityAttributeTable readonly={false} />  // 实体属性
// <ModulePropertyTreeTable readonly={false} />       // 模块属性
