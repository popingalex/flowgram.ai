import React, { useEffect, useMemo } from 'react';

import {
  EditorRenderer,
  FreeLayoutEditorProvider,
  useService,
  WorkflowDocument,
} from '@flowgram.ai/free-layout-editor';
import { Spin } from '@douyinfe/semi-ui';

import '@flowgram.ai/free-layout-editor/index.css';
import '../../styles/index.css';
import { DemoTools } from '../tools';
import { SidebarRenderer, SidebarProvider } from '../sidebar';
import { EnumStoreProvider } from '../ext/type-selector-ext/enum-store';
import { useModuleStore } from '../../stores/module.store';
import { nodeRegistries } from '../../nodes';
import { useEditorProps } from '../../hooks';

export interface EcsWorkflowEditorProps {
  systemId: string;
  systemName: string;
  workflowData: {
    nodes: any[];
    edges: any[];
  };
  style?: React.CSSProperties;
  className?: string;
}

export const EcsWorkflowEditor: React.FC<EcsWorkflowEditorProps> = ({
  systemId,
  systemName,
  workflowData,
  style,
  className,
}) => {
  const { loadModules } = useModuleStore();

  console.log('[EcsWorkflowEditor] 渲染状态:', {
    systemId,
    systemName,
    nodeCount: workflowData?.nodes?.length || 0,
    edgeCount: workflowData?.edges?.length || 0,
  });

  const editorProps = useEditorProps(workflowData, nodeRegistries);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  return (
    <div style={style} className={className}>
      <EnumStoreProvider>
        <SidebarProvider>
          <FreeLayoutEditorProvider
            key={`ecs-workflow-${systemId}`} // 确保系统切换时重新创建编辑器
            nodeRegistries={nodeRegistries}
            initialData={workflowData}
            {...editorProps}
          >
            <EditorRenderer />
            <SidebarRenderer />
            <DemoTools />
          </FreeLayoutEditorProvider>
        </SidebarProvider>
      </EnumStoreProvider>
    </div>
  );
};
