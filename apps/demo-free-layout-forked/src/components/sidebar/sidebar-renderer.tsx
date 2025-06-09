import { useCallback, useContext, useEffect, useMemo } from 'react';
import React from 'react';

import {
  PlaygroundEntityContext,
  useRefresh,
  useClientContext,
} from '@flowgram.ai/free-layout-editor';
import { SideSheet, Button } from '@douyinfe/semi-ui';
import { IconClose } from '@douyinfe/semi-icons';

import { FlowNodeMeta } from '../../typings';
import { SidebarContext, IsSidebarContext, NodeRenderContext } from '../../context';

export const SidebarRenderer = () => {
  const { nodeRender, setNodeRender } = useContext(SidebarContext);
  const { selection, playground } = useClientContext();
  const refresh = useRefresh();
  const handleClose = useCallback(() => {
    setNodeRender(undefined);
  }, []);

  // 获取抽屉容器，避免遮挡导航栏
  const getPopupContainer = useCallback(() => {
    const container = document.querySelector('.semi-layout-content');
    return (container as HTMLElement) || document.body;
  }, []);

  /**
   * Listen readonly
   */
  useEffect(() => {
    const disposable = playground.config.onReadonlyOrDisabledChange(() => refresh());
    return () => disposable.dispose();
  }, [playground]);
  /**
   * Listen selection
   */
  useEffect(() => {
    const toDispose = selection.onSelectionChanged(() => {
      /**
       * 如果没有选中任何节点，则自动关闭侧边栏
       * If no node is selected, the sidebar is automatically closed
       */
      if (selection.selection.length === 0) {
        handleClose();
      } else if (selection.selection.length === 1 && selection.selection[0] !== nodeRender?.node) {
        handleClose();
      }
    });
    return () => toDispose.dispose();
  }, [selection, handleClose]);
  /**
   * Close when node disposed
   */
  useEffect(() => {
    if (nodeRender) {
      const toDispose = nodeRender.node.onDispose(() => {
        setNodeRender(undefined);
      });
      return () => toDispose.dispose();
    }
    return () => {};
  }, [nodeRender]);

  const visible = useMemo(() => {
    if (!nodeRender) {
      return false;
    }
    const { disableSideBar = false } = nodeRender.node.getNodeMeta<FlowNodeMeta>();
    return !disableSideBar;
  }, [nodeRender]);

  if (playground.config.readonly) {
    return null;
  }

  /**
   * Add key to rerender the sidebar when the node changes
   */
  const content = nodeRender ? (
    <PlaygroundEntityContext.Provider key={nodeRender.node.id} value={nodeRender.node}>
      <NodeRenderContext.Provider value={nodeRender}>
        <div style={{ position: 'relative', height: '100%' }}>
          {/* 手动添加关闭按钮 */}
          <Button
            icon={<IconClose />}
            theme="borderless"
            size="small"
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              // zIndex: 1000,
            }}
          />
          {nodeRender.form?.render()}
        </div>
      </NodeRenderContext.Provider>
    </PlaygroundEntityContext.Provider>
  ) : null;

  return (
    <SideSheet
      mask={false}
      visible={visible}
      width={600}
      closable={false}
      getPopupContainer={getPopupContainer}
      disableScroll={false}
      // zIndex={1050}
      style={{
        scrollbarGutter: 'stable',
      }}
      bodyStyle={
        {
          padding: '0 12px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarGutter: 'stable',
        } as React.CSSProperties
      }
    >
      <IsSidebarContext.Provider value={true}>{content}</IsSidebarContext.Provider>
    </SideSheet>
  );
};
