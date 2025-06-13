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
import { EnumStoreProvider } from '../ext/entity-property-type-selector/enum-store';
import {
  convertGraphToWorkflowData,
  hasWorkflowGraphForEntity,
} from '../../utils/graph-to-workflow';
import { entityToWorkflowData } from '../../utils/entity-to-workflow';
import { useModuleStore } from '../../stores/module.store';
import { useGraphActions, useGraphList } from '../../stores/graph.store';
import { useEntityList, useEntityListActions } from '../../stores';
import { useCurrentEntity, useCurrentWorkflow, useCurrentWorkflowActions } from '../../stores';

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
  const { entities, loading } = useEntityList();
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
          // 回退到使用当前实体数据
          const currentEntity = entities.find((e) => e.id === entityId || e._indexId === entityId);
          properties = currentEntity
            ? getEntityCompletePropertiesFromEditingEntity(currentEntity)
            : null;
        }

        if (!properties) {
          console.warn('EntityPropertySyncer - No properties found for entity:', entityId);
          return false;
        }

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

        retryCountRef.current = 0; // 重置重试计数
        return true;
      } catch (error) {
        console.error('EntityPropertySyncer - Error in syncEntityToStartNodes:', error);
        return false;
      }
    },
    [entities]
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

      // 🎯 首先添加基础属性（系统属性）
      properties['$id'] = {
        id: '$id',
        name: '实体ID',
        description: '实体的唯一标识符',
        type: 'string',
        _indexId: '$id',
        isEntityProperty: true,
        isSystemProperty: true,
      };

      properties['$name'] = {
        id: '$name',
        name: '实体名称',
        description: '实体的显示名称',
        type: 'string',
        _indexId: '$name',
        isEntityProperty: true,
        isSystemProperty: true,
      };

      properties['$desc'] = {
        id: '$desc',
        name: '实体描述',
        description: '实体的详细描述',
        type: 'string',
        _indexId: '$desc',
        isEntityProperty: true,
        isSystemProperty: true,
      };

      // 然后添加实体自身的扩展属性
      editingEntity.attributes.forEach((attr: any) => {
        if (!attr._indexId || !attr.id) {
          console.warn('编辑实体属性缺少必要字段:', attr);
          return;
        }

        // 🎯 使用语义化的ID作为key，而不是nanoid
        const propertyKey = attr.id;
        properties[propertyKey] = {
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
          _indexId: attr._indexId, // 保留原始的nanoid用于内部引用
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
  const { getEntityByStableId } = useEntityListActions();
  const { getModulesByIds } = useModuleStore();
  const { graphs } = useGraphList();
  const { getGraphById } = useGraphActions();

  // 新增：当前工作流store
  const { workflowData: currentWorkflowData, entityId: currentEntityId } = useCurrentWorkflow();

  // 记录已经自动布局过的实体，避免重复布局
  const autoLayoutedEntitiesRef = React.useRef<Set<string>>(new Set());

  // 自动布局配置
  const AUTO_LAYOUT_CONFIG = {
    // 是否启用自动布局
    enabled: true,
    // 是否每次切换实体都重新布局（false = 每个实体只布局一次）
    layoutOnEntitySwitch: false,
  };

  // 当切换实体时的处理
  React.useEffect(() => {
    if (AUTO_LAYOUT_CONFIG.layoutOnEntitySwitch) {
      // 清理所有标记，让每个实体都能重新进行初始布局
      autoLayoutedEntitiesRef.current.clear();
    }
  }, [selectedEntityId]);

  // 🎯 自动布局逻辑：监听工作流数据变化，触发自动布局
  React.useEffect(() => {
    if (!currentWorkflowData || !currentEntityId) return;

    // 如果需要自动布局且该实体未布局过，延迟触发
    if (
      AUTO_LAYOUT_CONFIG.enabled &&
      currentWorkflowData._needsAutoLayout &&
      !autoLayoutedEntitiesRef.current.has(currentEntityId)
    ) {
      setTimeout(() => {
        // 直接使用flowgram的自动布局服务，确保使用LR配置
        const autoLayoutButton = document.querySelector(
          '[data-auto-layout-button]'
        ) as HTMLButtonElement;
        if (autoLayoutButton) {
          autoLayoutButton.click();
          // 标记该实体已经自动布局过
          autoLayoutedEntitiesRef.current.add(currentEntityId);
        }
      }, 100);
    }
  }, [currentWorkflowData, currentEntityId]);

  // 🎯 从CurrentWorkflowStore获取工作流数据
  const workflowData = currentWorkflowData || initialData;

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
