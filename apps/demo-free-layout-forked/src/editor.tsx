import React from 'react';

import { EditorRenderer, FreeLayoutEditorProvider } from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import './styles/index.css';
import { nodeRegistries } from './nodes';
import { initialData } from './initial-data';
import { useEditorProps } from './hooks';
import { DemoTools } from './components/tools';
import { SidebarProvider, SidebarRenderer } from './components/sidebar';

interface EditorProps {
  selectedEntityId: string | null;
}

export const Editor: React.FC<EditorProps> = ({ selectedEntityId }) => {
  const editorProps = useEditorProps(initialData, nodeRegistries);
  return (
    <div className="doc-free-feature-overview">
      <FreeLayoutEditorProvider {...editorProps}>
        <SidebarProvider selectedEntityId={selectedEntityId}>
          <div className="demo-container">
            <EditorRenderer className="demo-editor" />
          </div>
          <DemoTools />
          <SidebarRenderer />
        </SidebarProvider>
      </FreeLayoutEditorProvider>
    </div>
  );
};
