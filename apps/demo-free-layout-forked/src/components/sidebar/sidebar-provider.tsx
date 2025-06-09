import React, { ReactNode, useEffect, useState, useRef } from 'react';

import { NodeRenderReturnType } from '@flowgram.ai/free-layout-editor';

import { useEntityList } from '../../stores';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { SidebarContext } from '../../context';

interface SidebarProviderProps {
  children: ReactNode;
  selectedEntityId?: string; // 从外部传入的选中实体ID
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({
  children,
  selectedEntityId: propSelectedEntityId,
}) => {
  // 使用新的EntityEditContext hooks
  const { editingEntity, isDirty } = useCurrentEntity();
  const { updateProperty, resetChanges } = useCurrentEntityActions();

  // 管理 nodeRender 状态 - 这是 sidebar 显示的核心状态
  const [nodeRender, setNodeRender] = useState<NodeRenderReturnType | undefined>();

  // SidebarContext 的值
  const contextValue = {
    visible: !!nodeRender, // 有 nodeRender 就显示 sidebar
    nodeRender,
    setNodeRender,
    // 实体编辑相关的状态和方法
    currentEntity: editingEntity,
    selectedEntityId: propSelectedEntityId,
    isDirty,
    updateEntityProperty: updateProperty,
    resetEntity: resetChanges,
    // 兼容性别名
    clonedEntity: editingEntity,
  };

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>;
};
