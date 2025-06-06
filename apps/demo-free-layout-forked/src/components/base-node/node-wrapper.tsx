import React, { useState, useContext } from 'react';

import { WorkflowPortRender } from '@flowgram.ai/free-layout-editor';
import { useClientContext } from '@flowgram.ai/free-layout-editor';

import { useCurrentEntity } from '../../stores';
import { useNodeRenderContext } from '../../hooks';
import { SidebarContext } from '../../context';
import { scrollToView } from './utils';
import { NodeWrapperStyle } from './styles';

export interface NodeWrapperProps {
  isScrollToView?: boolean;
  children: React.ReactNode;
}

/**
 * Used for drag-and-drop/click events and ports rendering of nodes
 * 用于节点的拖拽/点击事件和点位渲染
 */
export const NodeWrapper: React.FC<NodeWrapperProps> = (props) => {
  const { children, isScrollToView = false } = props;
  const nodeRender = useNodeRenderContext();
  const { selected, startDrag, ports, selectNode, nodeRef, onFocus, onBlur } = nodeRender;
  const [isDragging, setIsDragging] = useState(false);
  const sidebar = useContext(SidebarContext);
  const form = nodeRender.form;
  const ctx = useClientContext();

  // 获取当前实体的dirty状态
  const { isDirty } = useCurrentEntity();

  // 检查当前节点是否应该显示dirty状态
  // 目前简单地对所有Start节点显示dirty状态
  // TODO: 将来可以通过节点的entityId来精确匹配
  const isStartNode = nodeRender.node.getNodeRegistry?.()?.type === 'start';
  const shouldShowDirty = isStartNode && isDirty;

  const portsRender = ports.map((p) => <WorkflowPortRender key={p.id} entity={p} />);

  return (
    <>
      <NodeWrapperStyle
        className={selected ? 'selected' : ''}
        ref={nodeRef}
        draggable
        onDragStart={(e) => {
          startDrag(e);
          setIsDragging(true);
        }}
        onClick={(e) => {
          selectNode(e);
          if (!isDragging) {
            console.log('NodeWrapper - 点击节点，设置边栏:', {
              nodeId: nodeRender.node.id,
              nodeType: nodeRender.node.getNodeRegistry?.()?.type,
              hasForm: !!nodeRender.form,
            });
            sidebar.setNodeRender(nodeRender);
            // 可选：将 isScrollToView 设为 true，可以让节点选中后滚动到画布中间
            // Optional: Set isScrollToView to true to scroll the node to the center of the canvas after it is selected.
            if (isScrollToView) {
              scrollToView(ctx, nodeRender.node);
            }
          }
        }}
        onMouseUp={() => setIsDragging(false)}
        onFocus={onFocus}
        onBlur={onBlur}
        data-node-selected={String(selected)}
        style={{
          outline: form?.state.invalid ? '1px solid red' : 'none',
          // 添加橙色阴影表示dirty状态
          boxShadow: shouldShowDirty
            ? '0 0 0 2px rgba(255, 140, 0, 0.3), 0 0 8px rgba(255, 140, 0, 0.2)'
            : undefined,
          transition: 'box-shadow 0.2s ease-in-out',
        }}
      >
        {children}
      </NodeWrapperStyle>
      {portsRender}
    </>
  );
};
