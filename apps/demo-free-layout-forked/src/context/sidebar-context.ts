import React, { createContext } from 'react';

import { NodeRenderReturnType } from '@flowgram.ai/free-layout-editor';

import { Entity } from '../components/ext/entity-store';

export interface SidebarContextType {
  visible: boolean;
  nodeRender?: NodeRenderReturnType;
  setNodeRender: (nodeRender?: NodeRenderReturnType) => void;

  // 实体编辑状态管理 - 现在通过Zustand store管理
  currentEntity?: Entity | null; // 当前编辑的实体
  selectedEntityId?: string; // 当前选中的实体ID
  isDirty: boolean; // 是否有未保存的修改
  updateEntityProperty?: (path: string, value: any) => void; // 更新实体属性
  resetEntity?: () => void; // 重置实体

  // 兼容性别名
  clonedEntity?: Entity | null; // currentEntity 的别名，用于兼容现有组件
}

export const SidebarContext = createContext<SidebarContextType>({
  visible: false,
  setNodeRender: () => {},
  isDirty: false,
});

export const IsSidebarContext = React.createContext<boolean>(false);
