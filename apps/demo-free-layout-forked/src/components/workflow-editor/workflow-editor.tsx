import React, { useEffect, useCallback, useRef, useMemo, useState } from 'react';

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
import { Spin } from '@douyinfe/semi-ui';

import '@flowgram.ai/free-layout-editor/index.css';
import '../../styles/index.css';
import { DemoTools } from '../tools';
import { SidebarRenderer, SidebarProvider } from '../sidebar';
import { EnumStoreProvider } from '../ext/type-selector-ext/enum-store';
import {
  convertGraphToWorkflowData,
  hasWorkflowGraphForEntity,
} from '../../utils/graph-to-workflow';
import { entityToWorkflowData } from '../../utils/entity-to-workflow';
import { useGraphActions, useGraphList } from '../../stores/workflow-list';
import { useModuleStore } from '../../stores/module-list';
import { useEntityList, useEntityListActions } from '../../stores';
import { useCurrentEntity, useCurrentGraph, useCurrentGraphActions } from '../../stores';

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

                // 🎯 深度比较，只有真正不同时才更新
                const currentStr = JSON.stringify(currentOutputs);
                const newStr = JSON.stringify(newOutputs);

                if (currentStr !== newStr) {
                  console.log('[EntityPropertySyncer] 检测到属性变化，更新节点数据');

                  // 更新节点数据
                  (formModel as FormModelV2).setValueIn('data.outputs', newOutputs);

                  updatedCount++;
                } else {
                  console.log('[EntityPropertySyncer] 属性无变化，跳过更新');
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
    const { modules } = useModuleStore.getState(); // 获取模块数据
    if (!editingEntity || !editingEntity.attributes) {
      return null;
    }

    try {
      // 简化版本：直接使用editingEntity的attributes构建JSONSchema
      const properties: Record<string, any> = {};

      // 🎯 将实体基础属性重命名为$前缀，避免与业务层面的id属性冲突
      properties['$id'] = {
        id: '$id',
        name: '实体ID',
        type: 'string',
        title: editingEntity.id,
        default: editingEntity.id,
        _indexId: `${editingEntity._indexId}_$id`, // 使用实体的稳定索引+字段名
        isEntityProperty: true,
        isSystemProperty: true,
      };

      properties['$name'] = {
        id: '$name',
        name: '实体名称',
        type: 'string',
        title: editingEntity.name,
        default: editingEntity.name,
        _indexId: `${editingEntity._indexId}_$name`,
        isEntityProperty: true,
        isSystemProperty: true,
      };

      properties['$description'] = {
        id: '$description',
        name: '实体描述',
        type: 'string',
        title: editingEntity.description || '',
        default: editingEntity.description || '',
        _indexId: `${editingEntity._indexId}_$description`,
        isEntityProperty: true,
        isSystemProperty: true,
      };

      // 然后添加实体自身的扩展属性（用户定义的业务属性）
      editingEntity.attributes.forEach((attr: any) => {
        if (!attr._indexId || !attr.id) {
          console.warn('编辑实体属性缺少必要字段:', attr);
          return;
        }

        // 🎯 使用业务ID作为变量key，nanoid存储在_indexId中用于内部引用
        const businessId = (attr as any).$id || attr.id;
        properties[businessId] = {
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

      // 🎯 添加模块属性处理
      if (editingEntity.bundles && editingEntity.bundles.length > 0) {
        console.log('[WorkflowEditor] 处理实体模块关联:', {
          entityId: editingEntity.id,
          bundles: editingEntity.bundles,
          availableModules: modules.map((m: any) => ({
            id: m.id,
            _indexId: m._indexId,
            name: m.name,
          })),
        });

        // 遍历实体关联的模块
        editingEntity.bundles.forEach((bundleId: string) => {
          // 先用业务ID查找，再用索引ID查找
          const module = modules.find((m: any) => m.id === bundleId || m._indexId === bundleId);

          if (module) {
            console.log(`[WorkflowEditor] 找到模块 ${bundleId}:`, module.name);
          } else {
            console.warn(`[WorkflowEditor] 未找到模块 ${bundleId}`);
          }

          if (module && module.attributes) {
            module.attributes.forEach((attr: any) => {
              // 🎯 模块属性ID处理：attr.id已经是完整格式（如"container/strategy"），直接使用
              const moduleBusinessId = attr.id; // 直接使用完整ID，不需要添加前缀
              const moduleAttrIndexId = attr._indexId || `module_${module.id}_${attr.id}`;

              properties[moduleBusinessId] = {
                ...attr, // 保留所有原始属性
                id: moduleBusinessId, // 使用业务ID
                name: attr.name, // 保持原始名称
                description: `${attr.description || attr.name} (来自模块: ${module.name})`,
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
                _indexId: moduleAttrIndexId, // 保留索引ID用于内部引用
                isModuleProperty: true,
                moduleId: module.id,
                moduleName: module.name,
              };
            });
          }
        });
      }

      // 🎯 添加Context作为object属性 - 使用固定的ID避免重新生成
      properties['$context'] = {
        id: '$context',
        name: '上下文',
        description: '工作流执行上下文',
        type: 'object',
        properties: {
          currentTime: {
            id: 'currentTime',
            name: '当前时刻',
            type: 'string',
            description: '当前执行时刻',
            _indexId: 'context_currentTime', // 固定ID
          },
          currentBranch: {
            id: 'currentBranch',
            name: '当前分支',
            type: 'string',
            description: '当前执行分支',
            _indexId: 'context_currentBranch', // 固定ID
          },
          currentScene: {
            id: 'currentScene',
            name: '当前场景',
            type: 'string',
            description: '当前场景信息',
            _indexId: 'context_currentScene', // 固定ID
          },
        },
        _indexId: 'context_root', // 固定ID
        isContextProperty: true,
        isObjectContainer: true, // 标记为对象容器，不可直接选中
      };

      const jsonSchemaData = {
        type: 'object',
        properties,
      };

      // 🔍 添加调试信息
      console.log('[WorkflowEditor] 生成的属性数据:', {
        entityId: editingEntity.id,
        propertiesCount: Object.keys(properties).length,
        propertyKeys: Object.keys(properties),
        sampleProperty: properties[Object.keys(properties)[0]],
      });

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
      // 如果实体Store还在加载中，直接返回，依赖useEffect重新调用
      if (loading) {
        return;
      }

      const performSync = () => {
        const success = syncEntityToStartNodes(entityId, editingEntityData);

        if (!success && retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          // 直接重新调用
          performSync();
        }
      };

      // 立即执行
      performSync();
    },
    [syncEntityToStartNodes, loading]
  );

  // 🎯 稳定化的属性依赖计算
  const attributesHash = useMemo(() => {
    if (!editingEntity?.attributes) return '';
    return JSON.stringify(
      editingEntity.attributes.map((attr) => ({ id: attr.id, name: attr.name, type: attr.type }))
    );
  }, [editingEntity?.attributes]);

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

    // 🎯 立即同步，避免防抖延迟影响用户输入体验
    const hasChanges = JSON.stringify(editingEntity) !== JSON.stringify(originalEntity);
    syncWithRetry(editingEntity.id, hasChanges ? editingEntity : undefined);
  }, [
    editingEntity?.id,
    attributesHash, // 🎯 使用稳定的属性hash而不是JSON.stringify
    loading,
    entities.length,
    syncWithRetry,
  ]);

  return null;
};

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({ style, className }) => {
  const { loadModules } = useModuleStore();
  const { workflowData, entityId, loading } = useCurrentGraph();
  const { editingEntity } = useCurrentEntity(); // 获取当前编辑的实体

  // 🔍 添加调试信息
  console.log('[WorkflowEditor] 渲染状态:', {
    hasWorkflowData: !!workflowData,
    workflowNodeCount: workflowData?.nodes?.length || 0,
    entityId,
    editingEntityId: editingEntity?.id,
    editingEntityBusinessId: (editingEntity as any)?.$id,
    loading,
  });

  // 使用当前图的工作流数据，如果没有则使用初始数据
  const finalWorkflowData = workflowData || initialData;

  // 🔍 添加最终数据调试
  console.log('[WorkflowEditor] 最终工作流数据:', {
    finalNodeCount: finalWorkflowData?.nodes?.length || 0,
    isUsingWorkflowData: !!workflowData,
    isUsingInitialData: !workflowData,
  });
  const editorProps = useEditorProps(finalWorkflowData, nodeRegistries);

  useEffect(() => {
    loadModules();
  }, [loadModules]);

  // 自动布局逻辑
  const lastEntityIdRef = useRef<string | null>(null);
  const [shouldTriggerLayout, setShouldTriggerLayout] = useState(false);

  useEffect(() => {
    // 只有在实体ID实际发生变化时才触发布局
    const isEntityChanged = lastEntityIdRef.current !== entityId;
    lastEntityIdRef.current = entityId;

    if (!loading && workflowData && workflowData.nodes?.length > 0 && isEntityChanged) {
      setShouldTriggerLayout(true);
    }
  }, [loading, workflowData?.nodes?.length, entityId]);

  // 使用useEffect进行布局触发
  useEffect(() => {
    if (shouldTriggerLayout) {
      // 使用requestAnimationFrame确保DOM已渲染
      const frameId = requestAnimationFrame(() => {
        const autoLayoutButton = document.querySelector(
          '[data-auto-layout-button]'
        ) as HTMLButtonElement;
        if (autoLayoutButton) {
          autoLayoutButton.click();

          // 使用另一个requestAnimationFrame确保布局完成后适应视图
          const frameId2 = requestAnimationFrame(() => {
            const fitViewButton = document.querySelector(
              '[data-fit-view-button]'
            ) as HTMLButtonElement;
            if (fitViewButton) {
              fitViewButton.click();
            }
          });
        }
      });

      setShouldTriggerLayout(false);

      // 清理函数
      return () => {
        cancelAnimationFrame(frameId);
      };
    }
  }, [shouldTriggerLayout]);

  // 🎯 核心修复：使用实体的稳定索引ID和工作流状态
  const stableEntityKey = editingEntity?._indexId || entityId || 'no-entity';
  const workflowKey = workflowData ? `${stableEntityKey}-with-data` : `${stableEntityKey}-no-data`;

  return (
    <div style={style} className={className}>
      <EnumStoreProvider>
        <SidebarProvider>
          <FreeLayoutEditorProvider
            key={`workflow-${workflowKey}`} // 🎯 关键修复：包含工作流数据状态，确保数据变化时重新创建编辑器
            nodeRegistries={nodeRegistries}
            initialData={finalWorkflowData}
            {...editorProps}
          >
            <EntityPropertySyncer />
            <EditorRenderer />
            <SidebarRenderer />
            <DemoTools />
          </FreeLayoutEditorProvider>
        </SidebarProvider>
      </EnumStoreProvider>
    </div>
  );
};
