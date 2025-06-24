import React from 'react';

import { useCurrentGraph, useCurrentEntity } from './stores';
import { WorkflowEditor } from './components/workflow-editor/workflow-editor';

export const Editor: React.FC = () => {
  const { selectedEntityId } = useCurrentEntity();
  const { workflowData, entityId } = useCurrentGraph();

  console.log('[Editor] 渲染状态:', {
    selectedEntityId,
    graphEntityId: entityId,
    hasWorkflowData: !!workflowData,
    nodeCount: workflowData?.nodes?.length || 0,
  });

  return <WorkflowEditor data-testid="workflow-editor" />;
};
