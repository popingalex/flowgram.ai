import React from 'react';

import { NodeRenderReturnType } from '@flowgram.ai/free-layout-editor';

export const SidebarContext = React.createContext<{
  visible: boolean;
  nodeRender?: NodeRenderReturnType;
  setNodeRender: (node: NodeRenderReturnType | undefined) => void;
  selectedEntityId: string | null;
}>({
  visible: false,
  setNodeRender: () => {},
  selectedEntityId: null,
});

export const IsSidebarContext = React.createContext<boolean>(false);
