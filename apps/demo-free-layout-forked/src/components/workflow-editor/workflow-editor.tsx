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
  const { editingEntity, originalEntity } = useCurrentEntity();
  const { getEntityCompleteProperties, onEntityPropertiesChange, loading, entities } =
    useEntityStore();
  const document = useService(WorkflowDocument);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // 同步实体属性到Start节点
  const syncEntityToStartNodes = useCallback(
    (entityId: string, editingEntityData?: any) => {
      if (!document) {
        console.warn('EntityPropertySyncer - Document service not available');
        return false;
      }

      try {
        // 查找所有Start节点并更新
        const allNodes = document.getAllNodes();
        let updatedCount = 0;

        // 🎯 使用编辑中的实体数据而不是原始数据
        let properties;
        if (editingEntityData) {
          // 当有编辑中的实体数据时，从编辑数据生成属性
          // 这里需要模拟EntityStore的getEntityCompleteProperties逻辑
          // 但使用editingEntity而不是原始entity
          properties = getEntityCompletePropertiesFromEditingEntity(editingEntityData);
        } else {
          // 回退到原始逻辑
          properties = getEntityCompleteProperties(entityId);
        }

        if (!properties) {
          console.warn('EntityPropertySyncer - No properties found for entity:', entityId);
          return false;
        }

        console.log('🔄 EntityPropertySyncer - 开始同步实体属性:', {
          entityId,
          totalNodes: allNodes.length,
          propertiesCount: Object.keys((properties.allProperties as any)?.properties || {}).length,
          使用编辑数据: !!editingEntityData,
          detailedProperties: Object.entries((properties.allProperties as any)?.properties || {})
            .slice(0, 5)
            .map(([key, prop]) => ({
              key,
              id: (prop as any).id,
              name: (prop as any).name,
              isEntityProperty: (prop as any).isEntityProperty,
              isModuleProperty: (prop as any).isModuleProperty,
            })),
        });

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

                // 强制更新，因为我们知道编辑数据已经改变
                const forceUpdate = !!editingEntityData;

                // 检查是否需要更新
                if (forceUpdate || JSON.stringify(currentOutputs) !== JSON.stringify(newOutputs)) {
                  console.log('🔄 EntityPropertySyncer - 更新节点属性:', {
                    nodeId: node.id,
                    oldPropertiesCount: Object.keys((currentOutputs as any)?.properties || {})
                      .length,
                    newPropertiesCount: Object.keys((newOutputs as any)?.properties || {}).length,
                    forceUpdate,
                  });

                  // 更新节点数据
                  (formModel as FormModelV2).setValueIn('data.outputs', newOutputs);

                  // 🎯 强制触发表单重新渲染
                  const formModelAny = formModel as any;
                  if (formModelAny.validateField) {
                    formModelAny.validateField('data.outputs');
                  }

                  // 🎯 强制触发表单变化事件
                  if (formModelAny.notifyFormChange) {
                    formModelAny.notifyFormChange(['data.outputs'], newOutputs);
                  }

                  updatedCount++;
                }
              }
            }
          }
        });

        console.log('🔄 EntityPropertySyncer - 同步完成:', {
          entityId,
          updatedNodes: updatedCount,
        });

        retryCountRef.current = 0; // 重置重试计数
        return true;
      } catch (error) {
        console.error('EntityPropertySyncer - Error in syncEntityToStartNodes:', error);
        return false;
      }
    },
    [getEntityCompleteProperties]
  );

  // 🎯 新增：从编辑中的实体数据生成完整属性结构
  const getEntityCompletePropertiesFromEditingEntity = useCallback((editingEntity: any) => {
    if (!editingEntity || !editingEntity.attributes) {
      return null;
    }

    try {
      // 简化版本：直接使用editingEntity的attributes构建JSONSchema
      const properties: Record<string, any> = {};

      // 🚫 移除重复的基础属性，这些已经在节点的基础信息区域显示了
      // 不再添加 __entity_id、__entity_name、__entity_description

      // 只添加实体自身的扩展属性
      editingEntity.attributes.forEach((attr: any) => {
        if (!attr._indexId) {
          console.warn('编辑实体属性缺少_indexId:', attr);
          return;
        }

        const indexId = attr._indexId;
        properties[indexId] = {
          ...attr, // 保留所有原始属性
          // 转换type格式
          type:
            attr.type === 'n'
              ? 'number'
              : attr.type === 's'
              ? 'string'
              : attr.type?.includes('[')
              ? 'array'
              : 'string',
          ...(attr.type?.includes('[') && {
            items: {
              type:
                attr.type?.replace(/\[|\]/g, '') === 'n'
                  ? 'number'
                  : attr.type?.replace(/\[|\]/g, '') === 's'
                  ? 'string'
                  : 'string',
            },
          }),
          _indexId: indexId,
          isEntityProperty: true,
        };
      });

      const jsonSchemaData = {
        type: 'object',
        properties,
      };

      return {
        allProperties: jsonSchemaData,
        editableProperties: jsonSchemaData,
      };
    } catch (error) {
      console.error('Error generating properties from editing entity:', error);
      return null;
    }
  }, []);

  // 带重试的同步函数
  const syncWithRetry = useCallback(
    (entityId: string, editingEntityData?: any) => {
      // 如果实体Store还在加载中，延迟同步
      if (loading) {
        setTimeout(() => syncWithRetry(entityId, editingEntityData), 500);
        return;
      }

      // 清除之前的定时器
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      const performSync = () => {
        const success = syncEntityToStartNodes(entityId, editingEntityData);

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
    [syncEntityToStartNodes, loading]
  );

  // 🎯 统一的实体同步逻辑 - 处理初始加载和实时更新
  useEffect(() => {
    if (!editingEntity) {
      retryCountRef.current = 0;
      return;
    }

    // 等待实体Store加载完成
    if (loading || entities.length === 0) {
      return;
    }

    console.log('🔄 EntityPropertySyncer - 实体同步触发:', {
      entityId: editingEntity.id,
      attributesCount: editingEntity.attributes?.length || 0,
      isDirty: JSON.stringify(editingEntity) !== JSON.stringify(originalEntity),
    });

    // 使用编辑中的实体数据进行同步，添加防抖避免频繁更新
    const debounceTimer = setTimeout(() => {
      // 对于编辑中的实体，使用编辑数据；对于初始加载，使用原始数据
      const hasChanges = JSON.stringify(editingEntity) !== JSON.stringify(originalEntity);
      syncWithRetry(editingEntity.id, hasChanges ? editingEntity : undefined);
    }, 100); // 100ms防抖

    return () => {
      clearTimeout(debounceTimer);
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [
    editingEntity?.id,
    JSON.stringify(editingEntity?.attributes || []), // 🎯 关键修复：使用序列化版本作为依赖
    loading,
    entities.length,
    syncWithRetry,
  ]); // 修复依赖数组，确保属性内容变化时也能触发

  return null;
};

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ style, className }) => {
  const { editingEntity, selectedEntityId } = useCurrentEntity();
  const { getEntity, getEntityByStableId } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  // 根据选中的实体动态生成工作流数据（只在选中实体时生成一次）
  const workflowData = React.useMemo(() => {
    if (!selectedEntityId) {
      // 没有选中实体时显示空的工作流
      return initialData;
    }

    // 使用原始实体数据生成工作流（不使用editingEntity，避免编辑时重新生成）
    const originalEntity = getEntityByStableId(selectedEntityId);
    if (!originalEntity) {
      return initialData;
    }

    try {
      // 从原始实体生成工作流数据
      const workflowData = entityToWorkflowData(originalEntity);
      console.log('Generated workflow data for entity:', selectedEntityId, workflowData);
      return workflowData;
    } catch (error) {
      console.error('Error generating workflow data:', error);
      return initialData;
    }
  }, [selectedEntityId, getEntity]); // 只依赖selectedEntityId，不依赖editingEntity

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
