import React from 'react';

import { convertGraphToWorkflowData } from '../utils/graph-to-workflow';
import { entityToWorkflowData } from '../utils/entity-to-workflow';
import {
  useCurrentEntity,
  useEntityListActions,
  useGraphList,
  useGraphActions,
  useCurrentGraphActions,
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
  const { setGraph, clearGraph, setLoading, setError } = useCurrentGraphActions();

  React.useEffect(() => {
    console.log(`[EntityWorkflowSyncer] 实体切换检测，selectedEntityId: ${selectedEntityId}`);
    console.log(`[EntityWorkflowSyncer] 当前可用图数量: ${graphs.length}`);

    if (!selectedEntityId) {
      // 没有选中实体时清除图
      clearGraph();
      return;
    }

    // 获取原始实体数据
    const originalEntity = getEntityByStableId(selectedEntityId);
    if (!originalEntity) {
      console.log(`[EntityWorkflowSyncer] 未找到实体: ${selectedEntityId}`);
      clearGraph();
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

        // 🔧 添加详细的节点信息调试
        console.log(
          `[EntityWorkflowSyncer] 原始图节点详情:`,
          workflowGraph.nodes.map((n) => ({
            id: n.id,
            type: n.type,
            name: n.name,
          }))
        );

        const convertedData = convertGraphToWorkflowData(workflowGraph);

        // 🔧 添加转换后数据的调试
        console.log(`[EntityWorkflowSyncer] 转换后工作流数据:`, {
          nodeCount: convertedData.nodes?.length || 0,
          edgeCount: convertedData.edges?.length || 0,
          nodes:
            convertedData.nodes?.map((n: any) => ({
              id: n.id,
              type: n.type,
              title: n.data?.title,
            })) || [],
          edges:
            convertedData.edges?.map((e: any) => ({
              source: e.sourceNodeID,
              target: e.targetNodeID,
            })) || [],
        });

        // 🔧 特别检查Vehicle.simulateDozer相关节点
        const simulateDozerNodes =
          convertedData.nodes?.filter((n: any) => n.id?.includes('simulateDozer')) || [];
        console.log(`[EntityWorkflowSyncer] simulateDozer相关节点:`, simulateDozerNodes);

        // 🔧 检查条件节点
        const conditionNodes =
          convertedData.nodes?.filter((n: any) => n.type === 'condition') || [];
        console.log(
          `[EntityWorkflowSyncer] 条件节点 (${conditionNodes.length}个):`,
          conditionNodes.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.data?.title,
            conditions: n.data?.conditions,
          }))
        );

        // 🔧 检查invoke节点
        const invokeNodes = convertedData.nodes?.filter((n: any) => n.type === 'invoke') || [];
        console.log(
          `[EntityWorkflowSyncer] invoke节点 (${invokeNodes.length}个):`,
          invokeNodes.map((n: any) => ({
            id: n.id,
            type: n.type,
            title: n.data?.title,
            functionMeta: n.data?.functionMeta?.id,
          }))
        );

        // 存储到CurrentGraphStore
        setGraph(convertedData, entityId, workflowGraph.id);
        console.log(`[EntityWorkflowSyncer] 已设置图: 实体=${entityId}, 图=${workflowGraph.id}`);
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

        // 存储默认工作流到CurrentGraphStore
        setGraph(defaultWorkflowData, entityId, 'default');
        console.log(`[EntityWorkflowSyncer] 已设置默认图: 实体=${entityId}`);
      }
    } catch (error) {
      console.error('[EntityWorkflowSyncer] Error generating workflow data:', error);
      setError(error instanceof Error ? error.message : '生成工作流数据失败');
    }
  }, [selectedEntityId, getEntityByStableId, graphs, setGraph, clearGraph, setLoading, setError]);

  // 这是一个纯逻辑组件，不渲染任何UI
  return null;
};
