import React, { useEffect, useCallback, useRef } from 'react';

import {
  EditorRenderer,
  FreeLayoutEditorProvider,
  useClientContext,
  WorkflowDocument,
  useService,
  FlowNodeFormData,
  FormModelV2,
  WorkflowNodeEntity,
} from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import '../../styles/index.css';
import { DemoTools } from '../tools';
import { SidebarRenderer, SidebarProvider } from '../sidebar';
import { useEntityStore, EntityCompleteProperties } from '../ext/entity-store';
import { useModuleStore } from '../ext/entity-property-type-selector/module-store';
import { EnumStoreProvider } from '../ext/entity-property-type-selector/enum-store';
import { nodeRegistries } from '../../nodes';
import { initialData } from '../../initial-data';
import { useEditorProps } from '../../hooks';

interface WorkflowEditorProps {
  selectedEntityId: string | null;
  style?: React.CSSProperties;
  className?: string;
}

// 实体属性同步组件 - 必须在FreeLayoutEditorProvider内部使用
const EntityPropertySyncer: React.FC<{ selectedEntityId: string | null }> = ({
  selectedEntityId,
}) => {
  const { getEntityCompleteProperties, onEntityPropertiesChange, loading, entities } =
    useEntityStore();
  const document = useService(WorkflowDocument);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // 同步实体属性到Start节点
  const syncEntityToStartNodes = useCallback(
    (entityId: string, properties: EntityCompleteProperties) => {
      if (!document) {
        console.warn('EntityPropertySyncer - Document service not available');
        return false;
      }

      console.log('EntityPropertySyncer - Syncing entity properties:', {
        entityId,
        allPropertiesCount: Object.keys(properties.allProperties.properties || {}).length,
        editablePropertiesCount: Object.keys(properties.editableProperties.properties || {}).length,
        properties,
      });

      try {
        // 查找所有Start节点并更新
        const allNodes = document.getAllNodes();
        let updatedCount = 0;

        // 遍历所有节点，同步实体属性到outputs
        allNodes.forEach((node: WorkflowNodeEntity) => {
          // 获取节点的注册信息来判断类型
          const nodeRegistry = node.getNodeRegistry?.();
          if (nodeRegistry?.type === 'start' && selectedEntityId) {
            const entityProperties = getEntityCompleteProperties(selectedEntityId);
            if (entityProperties) {
              // 获取节点的表单数据
              const formData = node.getData(FlowNodeFormData);
              const formModel = formData?.getFormModel();

              if (formModel) {
                // 使用allProperties格式（节点显示用）
                const currentOutputs = (formModel as FormModelV2).getValueIn('data.outputs');
                const newOutputs = entityProperties.allProperties;

                // 检查是否需要更新
                if (JSON.stringify(currentOutputs) !== JSON.stringify(newOutputs)) {
                  console.log('同步实体属性到start节点:', {
                    nodeId: node.id,
                    from: currentOutputs,
                    to: newOutputs,
                  });

                  // 更新节点数据
                  (formModel as FormModelV2).setValueIn('data.outputs', newOutputs);
                  updatedCount++;
                }
              }
            }
          }
        });

        console.log(`EntityPropertySyncer - Successfully updated ${updatedCount} Start nodes`);
        retryCountRef.current = 0; // 重置重试计数
        return true;
      } catch (error) {
        console.error('EntityPropertySyncer - Error in syncEntityToStartNodes:', error);
        return false;
      }
    },
    [selectedEntityId, getEntityCompleteProperties]
  );

  // 带重试的同步函数
  const syncWithRetry = useCallback(
    (entityId: string, properties?: EntityCompleteProperties) => {
      // 如果实体Store还在加载中，延迟同步
      if (loading) {
        console.log('EntityPropertySyncer - Entity store is loading, delaying sync');
        setTimeout(() => syncWithRetry(entityId, properties), 500);
        return;
      }

      // 清除之前的定时器
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      const performSync = () => {
        const entityProperties = properties || getEntityCompleteProperties(entityId);
        if (!entityProperties) {
          console.warn('EntityPropertySyncer - No properties found for entity:', entityId);
          return;
        }

        console.log(
          'EntityPropertySyncer - Attempting sync for entity:',
          entityId,
          'retry:',
          retryCountRef.current
        );
        const success = syncEntityToStartNodes(entityId, entityProperties);

        if (!success && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(
            `EntityPropertySyncer - Retry ${retryCountRef.current}/${maxRetries} for entity:`,
            entityId
          );

          // 指数退避重试
          const delay = Math.pow(2, retryCountRef.current) * 200;
          syncTimeoutRef.current = setTimeout(performSync, delay);
        }
      };

      // 立即执行一次
      performSync();
    },
    [getEntityCompleteProperties, syncEntityToStartNodes, loading]
  );

  // 监听实体属性变化
  useEffect(() => {
    const unsubscribe = onEntityPropertiesChange((entityId, properties) => {
      console.log('EntityPropertySyncer - Entity properties changed:', entityId);
      if (entityId === selectedEntityId) {
        syncWithRetry(entityId, properties);
      }
    });

    return unsubscribe;
  }, [selectedEntityId, onEntityPropertiesChange, syncWithRetry]);

  // 当选择的实体改变时，同步属性
  useEffect(() => {
    console.log('EntityPropertySyncer - selectedEntityId changed:', selectedEntityId);
    console.log('EntityPropertySyncer - entities loaded:', entities.length, 'loading:', loading);

    if (!selectedEntityId) {
      retryCountRef.current = 0;
      return;
    }

    // 等待实体Store加载完成
    if (loading || entities.length === 0) {
      console.log('EntityPropertySyncer - Waiting for entities to load...');
      return;
    }

    // 使用多个时机确保同步成功
    // 立即执行一次
    syncWithRetry(selectedEntityId);

    // 延迟执行，确保所有服务都已初始化
    const timeoutId = setTimeout(() => {
      syncWithRetry(selectedEntityId);
    }, 300);

    // 再次延迟执行，确保所有组件都已挂载
    const timeoutId2 = setTimeout(() => {
      syncWithRetry(selectedEntityId);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      retryCountRef.current = 0;
    };
  }, [selectedEntityId, syncWithRetry, entities.length, loading]);

  return null;
};

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  selectedEntityId,
  style,
  className,
}) => {
  const editorProps = useEditorProps(initialData, nodeRegistries);

  return (
    <div className={`doc-free-feature-overview ${className || ''}`} style={style}>
      <EnumStoreProvider>
        <FreeLayoutEditorProvider {...editorProps}>
          <SidebarProvider selectedEntityId={selectedEntityId}>
            <div className="demo-container">
              <EditorRenderer className="demo-editor" />
            </div>
            <DemoTools />
            <SidebarRenderer />
            <EntityPropertySyncer selectedEntityId={selectedEntityId} />
          </SidebarProvider>
        </FreeLayoutEditorProvider>
      </EnumStoreProvider>
    </div>
  );
};
