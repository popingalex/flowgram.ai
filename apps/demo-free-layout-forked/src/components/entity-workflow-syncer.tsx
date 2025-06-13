import React from 'react';

import { convertGraphToWorkflowData } from '../utils/graph-to-workflow';
import { entityToWorkflowData } from '../utils/entity-to-workflow';
import {
  useCurrentEntity,
  useEntityListActions,
  useGraphList,
  useGraphActions,
  useCurrentWorkflowActions,
} from '../stores';
import { initialData } from '../initial-data';

/**
 * 实体工作流同步器
 * 监听实体切换，自动更新当前工作流数据
 */
export const EntityWorkflowSyncer: React.FC = () => {
  const { selectedEntityId } = useCurrentEntity();
  const { getEntityByStableId } = useEntityListActions();
  const { graphs } = useGraphList();
  const { setWorkflow, clearWorkflow, setLoading, setError } = useCurrentWorkflowActions();

  React.useEffect(() => {
    console.log(`[EntityWorkflowSyncer] 实体切换检测，selectedEntityId: ${selectedEntityId}`);

    if (!selectedEntityId) {
      // 没有选中实体时清除工作流
      clearWorkflow();
      return;
    }

    // 获取原始实体数据
    const originalEntity = getEntityByStableId(selectedEntityId);
    if (!originalEntity) {
      console.log(`[EntityWorkflowSyncer] 未找到实体: ${selectedEntityId}`);
      clearWorkflow();
      return;
    }

    // 设置加载状态
    setLoading(true);

    try {
      // 优先尝试从后台加载工作流图
      const entityId = originalEntity.id; // 使用实体的真实ID而不是_indexId
      console.log(`[EntityWorkflowSyncer] 查找实体${entityId}的工作流图...`);

      // 大小写兼容匹配：直接从graphs数组中查找
      let workflowGraph = graphs.find((g) => g.id === entityId);
      if (!workflowGraph) {
        // 尝试首字母大写的版本
        const capitalizedEntityId = entityId.charAt(0).toUpperCase() + entityId.slice(1);
        workflowGraph = graphs.find((g) => g.id === capitalizedEntityId);
        console.log(`[EntityWorkflowSyncer] 尝试大写匹配: ${entityId} -> ${capitalizedEntityId}`);

        if (!workflowGraph) {
          // 尝试小写版本
          const lowercaseEntityId = entityId.toLowerCase();
          workflowGraph = graphs.find((g) => g.id === lowercaseEntityId);
          console.log(`[EntityWorkflowSyncer] 尝试小写匹配: ${entityId} -> ${lowercaseEntityId}`);
        }
      }

      if (workflowGraph) {
        console.log(
          `[EntityWorkflowSyncer] 找到实体${entityId}的工作流图，节点数:${workflowGraph.nodes.length}`
        );
        const convertedData = convertGraphToWorkflowData(workflowGraph);

        // 存储到CurrentWorkflowStore
        setWorkflow(convertedData, entityId, workflowGraph.id);
        console.log(
          `[EntityWorkflowSyncer] 已设置工作流: 实体=${entityId}, 图=${workflowGraph.id}`
        );
      } else {
        console.log(
          `[EntityWorkflowSyncer] 未找到实体${entityId}的工作流图，可用图${graphs.length}个`
        );
        console.log(
          `[EntityWorkflowSyncer] 可用图ID列表:`,
          graphs.map((g) => g.id)
        );
        // 回退到使用实体数据生成默认工作流
        const defaultWorkflowData = entityToWorkflowData(originalEntity);
        console.log(
          'Generated default workflow data for entity:',
          selectedEntityId,
          defaultWorkflowData
        );

        // 存储默认工作流到CurrentWorkflowStore
        setWorkflow(defaultWorkflowData, entityId, 'default');
        console.log(`[EntityWorkflowSyncer] 已设置默认工作流: 实体=${entityId}`);
      }
    } catch (error) {
      console.error('[EntityWorkflowSyncer] Error generating workflow data:', error);
      setError(error instanceof Error ? error.message : '生成工作流数据失败');
    }
  }, [
    selectedEntityId,
    getEntityByStableId,
    graphs,
    setWorkflow,
    clearWorkflow,
    setLoading,
    setError,
  ]);

  // 这是一个纯逻辑组件，不渲染任何UI
  return null;
};
