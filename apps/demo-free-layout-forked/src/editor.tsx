import React from 'react';

import { WorkflowEditor } from './components/workflow-editor/workflow-editor';

interface EditorProps {
  selectedEntityId: string | null;
}

export const Editor: React.FC<EditorProps> = ({ selectedEntityId }) => (
  <WorkflowEditor selectedEntityId={selectedEntityId} />
);
