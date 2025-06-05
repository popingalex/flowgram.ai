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
import { useEntityStore, EntityCompleteProperties, Entity } from '../ext/entity-store';
import { useModuleStore } from '../ext/entity-property-type-selector/module-store';
import { EnumStoreProvider } from '../ext/entity-property-type-selector/enum-store';
import { entityToWorkflowData } from '../../utils/entity-to-workflow';
import { useCurrentEntity } from '../../stores';

import { nanoid } from 'nanoid';

import { nodeRegistries } from '../../nodes';
import { initialData } from '../../initial-data';
import { useEditorProps } from '../../hooks';

export interface WorkflowEditorProps {
  style?: React.CSSProperties;
  className?: string;
}

// 实体属性同步器 - 将编辑中的实体属性同步到工作流文档
const EntityPropertySyncer: React.FC = () => {
  const { editingEntity } = useCurrentEntity();
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

      try {
        // 查找所有Start节点并更新
        const allNodes = document.getAllNodes();
        let updatedCount = 0;

        // 遍历所有节点，同步实体属性到outputs
        allNodes.forEach((node: WorkflowNodeEntity) => {
          // 获取节点的注册信息来判断类型
          const nodeRegistry = node.getNodeRegistry?.();
          if (nodeRegistry?.type === 'start') {
            // 获取节点的表单数据
            const formData = node.getData(FlowNodeFormData);
            const formModel = formData?.getFormModel();

            if (formModel) {
              // 检查节点是否已经绑定了实体
              const nodeEntityId = (formModel as FormModelV2).getValueIn('data.entityId');

              // 临时：对所有Start节点都同步（因为还没有entityId绑定机制）
              const shouldSync = true; // nodeEntityId === entityId;

              if (shouldSync) {
                // 使用allProperties格式（节点显示用）
                const currentOutputs = (formModel as FormModelV2).getValueIn('data.outputs');
                const newOutputs = properties.allProperties;

                // 检查是否需要更新
                if (JSON.stringify(currentOutputs) !== JSON.stringify(newOutputs)) {
                  // 更新节点数据
                  (formModel as FormModelV2).setValueIn('data.outputs', newOutputs);
                  updatedCount++;
                }
              }
            }
          }
        });

        retryCountRef.current = 0; // 重置重试计数
        return true;
      } catch (error) {
        console.error('EntityPropertySyncer - Error in syncEntityToStartNodes:', error);
        return false;
      }
    },
    [editingEntity?._indexId, getEntityCompleteProperties]
  );

  // 带重试的同步函数
  const syncWithRetry = useCallback(
    (entityId: string, properties?: EntityCompleteProperties) => {
      // 如果实体Store还在加载中，延迟同步
      if (loading) {
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

        const success = syncEntityToStartNodes(entityId, entityProperties);

        if (!success && retryCountRef.current < maxRetries) {
          retryCountRef.current++;

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
    if (!editingEntity) return;

    const unsubscribe = onEntityPropertiesChange((entityId, properties) => {
      // 比较业务ID，因为onEntityPropertiesChange传递的是业务ID
      if (entityId === editingEntity.id) {
        syncWithRetry(entityId, properties);
      }
    });

    return unsubscribe;
  }, [editingEntity?._indexId, onEntityPropertiesChange, syncWithRetry]);

  // 当选择的实体改变时，同步属性
  useEffect(() => {
    if (!editingEntity) {
      retryCountRef.current = 0;
      return;
    }

    // 等待实体Store加载完成
    if (loading || entities.length === 0) {
      return;
    }

    // 使用业务ID进行同步（getEntityCompleteProperties支持业务ID查找）
    // 立即执行一次
    syncWithRetry(editingEntity.id);

    // 延迟执行，确保所有服务都已初始化
    const timeoutId = setTimeout(() => {
      syncWithRetry(editingEntity.id);
    }, 300);

    // 再次延迟执行，确保所有组件都已挂载
    const timeoutId2 = setTimeout(() => {
      syncWithRetry(editingEntity.id);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
      retryCountRef.current = 0;
    };
  }, [editingEntity?._indexId, syncWithRetry, entities.length, loading]);

  return null;
};

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ style, className }) => {
  const { editingEntity, selectedEntityId } = useCurrentEntity();
  const { getEntity } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  // 根据选中的实体动态生成工作流数据
  const workflowData = React.useMemo(() => {
    if (!editingEntity) {
      // 没有选中实体时显示空的工作流
      return initialData;
    }

    try {
      // 从编辑中的实体生成工作流数据
      const workflowData = entityToWorkflowData(editingEntity);
      console.log('Generated workflow data for entity:', selectedEntityId, workflowData);
      return workflowData;
    } catch (error) {
      console.error('Error generating workflow data:', error);
      return initialData;
    }
  }, [editingEntity, selectedEntityId]);

  const editorProps = useEditorProps(workflowData, nodeRegistries);

  return (
    <div
      className={`doc-free-feature-overview ${className || ''}`}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      <EnumStoreProvider>
        <FreeLayoutEditorProvider key={selectedEntityId || 'no-entity'} {...editorProps}>
          <SidebarProvider selectedEntityId={selectedEntityId || undefined}>
            <div className="demo-container">
              <EditorRenderer className="demo-editor" />
            </div>
            <DemoTools />
            <SidebarRenderer />
            <EntityPropertySyncer />
          </SidebarProvider>
        </FreeLayoutEditorProvider>
      </EnumStoreProvider>
    </div>
  );
};
