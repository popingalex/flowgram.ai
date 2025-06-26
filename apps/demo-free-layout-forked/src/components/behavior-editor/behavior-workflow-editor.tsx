import React, { useEffect, useMemo, useCallback, useState } from 'react';

import {
  EditorRenderer,
  FreeLayoutEditorProvider,
  useService,
  WorkflowDocument,
  useClientContext,
  getNodeForm,
} from '@flowgram.ai/free-layout-editor';
import { Spin } from '@douyinfe/semi-ui';

import '@flowgram.ai/free-layout-editor/index.css';
import '../../styles/index.css';
import { DemoTools } from '../tools';
import { SidebarRenderer, SidebarProvider } from '../sidebar';
import { EnumStoreProvider } from '../ext/type-selector-ext/enum-store';
import { useModuleStore } from '../../stores/module-list';
import { nodeRegistries } from '../../nodes';
import { useEditorProps } from '../../hooks';

export interface BehaviorWorkflowEditorProps {
  initialData: {
    nodes: any[];
    edges: any[];
  };
  style?: React.CSSProperties;
  className?: string;
  onDataChange?: (data: { nodes: any[]; edges: any[] }) => void; // 数据变化回调
  onValidationChange?: (hasErrors: boolean, errorCount: number) => void; // 验证状态回调
}

export const BehaviorWorkflowEditor: React.FC<BehaviorWorkflowEditorProps> = ({
  initialData,
  style,
  className,
  onDataChange,
  onValidationChange,
}) => {
  const { loadModules } = useModuleStore();

  // 映射后台节点类型到前端类型
  const mappedInitialData = {
    ...initialData,
    nodes:
      initialData.nodes?.map((node) => ({
        ...node,
        type: node.type === 'nest' ? 'start' : node.type, // 修复：nest → start
      })) || [],
  };

  // 🔍 调试：检查传递给useEditorProps的数据
  console.log('🔍 [BehaviorWorkflowEditor] 传递给useEditorProps的数据:', {
    mappedInitialData,
    nodesLength: mappedInitialData.nodes?.length || 0,
    edgesLength: mappedInitialData.edges?.length || 0,
  });

  const editorProps = useEditorProps(mappedInitialData, nodeRegistries);

  // 创建带有数据变化回调的编辑器配置
  const editorPropsWithCallback = useMemo(() => {
    if (!onDataChange) return editorProps;

    return {
      ...editorProps,
      onContentChange: (ctx: any, event: any) => {
        // 调用原始的onContentChange
        if (editorProps.onContentChange) {
          editorProps.onContentChange(ctx, event);
        }

        // 触发数据变化回调
        console.log('🔄 [BehaviorWorkflowEditor] 工作流数据变化，触发回调');
        const data = ctx.document.toJSON();
        onDataChange({
          nodes: data.nodes || [],
          edges: data.edges || [],
        });
      },
    };
  }, [editorProps, onDataChange]);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // 内部组件用于访问ClientContext并获取验证状态
  const ValidationMonitor: React.FC = () => {
    const clientContext = useClientContext();

    useEffect(() => {
      if (!clientContext || !onValidationChange) return;

      const updateValidation = () => {
        try {
          const allForms = clientContext.document.getAllNodes().map((node) => getNodeForm(node));
          const errorCount = allForms.filter((form) => form?.state.invalid).length;
          const hasErrors = errorCount > 0;

          onValidationChange(hasErrors, errorCount);
        } catch (error) {
          console.error('验证状态更新失败:', error);
        }
      };

      // 只在初始化时验证一次
      updateValidation();

      // TODO: 应该监听文档变化事件而不是轮询
      // 暂时移除定时器避免刷屏
    }, [clientContext, onValidationChange]);

    return null;
  };

  return (
    <div style={style} className={className}>
      <EnumStoreProvider>
        <SidebarProvider>
          <FreeLayoutEditorProvider
            nodeRegistries={nodeRegistries}
            initialData={mappedInitialData}
            {...editorPropsWithCallback}
          >
            <EditorRenderer />
            <SidebarRenderer />
            <DemoTools />
            <ValidationMonitor />
          </FreeLayoutEditorProvider>
        </SidebarProvider>
      </EnumStoreProvider>
    </div>
  );
};
