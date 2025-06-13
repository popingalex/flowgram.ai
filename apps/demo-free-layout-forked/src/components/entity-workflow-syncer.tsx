import React, { useEffect } from 'react';

import { convertGraphToWorkflowData } from '../utils/graph-to-workflow';
import { useGraphStore } from '../stores/graph.store';
import { useEntityListActions } from '../stores/entity-list';
import { useCurrentGraphStore } from '../stores/current-graph.store';
import { useCurrentEntity } from '../stores/current-entity.store';

/**
 * 实体工作流同步器
 * 监听实体切换，自动更新当前工作流数据
 */
export const EntityWorkflowSyncer: React.FC = () => {
  const { selectedEntityId, editingEntity } = useCurrentEntity();
  const { getEntityByStableId } = useEntityListActions();
  const { graphs } = useGraphStore();
  const { setGraph, clearGraph, setLoading } = useCurrentGraphStore();

  useEffect(() => {
    console.log('[EntityWorkflowSyncer] 🔄 实体切换检测，selectedEntityId:', selectedEntityId);
    console.log('[EntityWorkflowSyncer] 当前可用图数量:', graphs.length);
    console.log(
      '[EntityWorkflowSyncer] 可用图列表:',
      graphs.map((g) => ({ id: g.id, nodeCount: g.nodes?.length || 0 }))
    );

    if (!selectedEntityId) {
      console.log('[EntityWorkflowSyncer] 🧹 清除当前图 - 无选中实体');
      clearGraph();
      return;
    }

    // 等待graphs数据加载完成
    if (graphs.length === 0) {
      console.log('[EntityWorkflowSyncer] ⏳ 等待图数据加载...');
      return;
    }

    // 获取实体数据
    const entity = editingEntity || getEntityByStableId(selectedEntityId);
    if (!entity) {
      console.warn(`[EntityWorkflowSyncer] 未找到实体数据: ${selectedEntityId}`);
      clearGraph();
      return;
    }

    console.log(`[EntityWorkflowSyncer] 实体数据:`, {
      _indexId: entity._indexId,
      id: entity.id,
      name: entity.name,
    });

    // 查找对应的工作流图 - 使用实体的真实ID
    const entityRealId = entity.id;
    let entityGraph = graphs.find((graph) => graph.id === entityRealId);

    // 如果还是没找到，尝试小写匹配
    if (!entityGraph) {
      entityGraph = graphs.find((graph) => graph.id.toLowerCase() === entityRealId.toLowerCase());
    }

    if (!entityGraph) {
      console.warn(`[EntityWorkflowSyncer] 未找到实体${entityRealId}的工作流图`);
      console.log(
        '[EntityWorkflowSyncer] 可用的图ID:',
        graphs.map((g) => g.id)
      );
      console.log(`[EntityWorkflowSyncer] 🎯 生成默认实体节点 for ${entity.name}`);

      // 生成默认的实体节点
      const defaultWorkflowData = {
        nodes: [
          {
            id: 'start-node',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              entityId: entity.id,
              entityName: entity.name,
              outputs: {}, // 这里会由EntityPropertySyncer填充
            },
          },
        ],
        edges: [],
      };

      setGraph(defaultWorkflowData, selectedEntityId, `default-${entityRealId}`);
      console.log(`[EntityWorkflowSyncer] 已设置默认图: 实体=${entityRealId}`);
      return;
    }

    console.log(
      `[EntityWorkflowSyncer] 找到匹配的工作流图: ${entityGraph.id} for 实体: ${entityRealId}`
    );

    // 设置loading状态
    setLoading(true);

    // 使用setTimeout确保loading状态能正确显示，并避免阻塞UI
    setTimeout(() => {
      try {
        console.log(
          `[EntityWorkflowSyncer] 开始转换工作流图，节点数:${entityGraph.nodes?.length || 0}`
        );

        // 🔧 打印转换前的完整行为树
        console.log(`[EntityWorkflowSyncer] 📥 转换前完整行为树:`, {
          entityId: selectedEntityId,
          entityRealId: entityRealId,
          graphId: entityGraph.id,
          totalNodes: entityGraph.nodes?.length || 0,
          totalEdges: entityGraph.edges?.length || 0,
          completeOriginalGraph: entityGraph,
        });

        // 转换为工作流数据
        const convertedData = convertGraphToWorkflowData(entityGraph);

        // 🔧 打印转换后的完整工作流数据
        console.log(`[EntityWorkflowSyncer] 📤 转换后完整工作流数据:`, {
          entityId: selectedEntityId,
          entityRealId: entityRealId,
          nodeCount: convertedData.nodes?.length || 0,
          edgeCount: convertedData.edges?.length || 0,
          completeConvertedWorkflow: convertedData,
        });

        // 设置到当前图存储
        setGraph(convertedData, selectedEntityId, entityGraph.id);
        console.log(`[EntityWorkflowSyncer] 已设置图: 实体=${entityRealId}, 图=${entityGraph.id}`);
      } catch (error) {
        console.error('[EntityWorkflowSyncer] 转换失败:', error);
        clearGraph();
      }
    }, 100); // 100ms延迟，确保loading状态能显示
  }, [
    selectedEntityId,
    editingEntity,
    graphs,
    setGraph,
    clearGraph,
    setLoading,
    getEntityByStableId,
  ]);

  return null;
};
