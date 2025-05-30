import { useState } from 'react';

import { NodeRenderReturnType } from '@flowgram.ai/free-layout-editor';

import { SidebarContext } from '../../context';

interface SidebarProviderProps {
  children: React.ReactNode;
  selectedEntityId: string | null;
}

export function SidebarProvider({ children, selectedEntityId }: SidebarProviderProps) {
  const [nodeRender, setNodeRender] = useState<NodeRenderReturnType | undefined>();
  return (
    <SidebarContext.Provider
      value={{
        visible: !!nodeRender,
        nodeRender,
        setNodeRender,
        selectedEntityId,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}
