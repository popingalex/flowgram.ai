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
    console.log('[EntityWorkflowSyncer] useEffect触发:', {
      selectedEntityId,
      hasEditingEntity: !!editingEntity,
      graphsCount: graphs.length,
    });

    if (!selectedEntityId) {
      console.log('[EntityWorkflowSyncer] 清空图 - 无selectedEntityId');
      clearGraph();
      return;
    }

    // 等待graphs数据加载完成
    if (graphs.length === 0) {
      console.log('[EntityWorkflowSyncer] 等待graphs加载...');
      return;
    }

    // 获取实体数据
    const entity = editingEntity || getEntityByStableId(selectedEntityId);
    if (!entity) {
      console.warn(`[EntityWorkflowSyncer] 清空图 - 未找到实体数据: ${selectedEntityId}`);
      clearGraph();
      return;
    }

    // 查找对应的工作流图 - 使用实体的原始业务ID ($id)
    const entityBusinessId = (entity as any).$id || entity.id; // 优先使用$id，回退到id
    let entityGraph = graphs.find((graph) => graph.id === entityBusinessId);

    // 如果还是没找到，尝试小写匹配
    if (!entityGraph) {
      entityGraph = graphs.find(
        (graph) => graph.id.toLowerCase() === entityBusinessId.toLowerCase()
      );
    }

    console.log(`[EntityWorkflowSyncer] 查找工作流图:`, {
      selectedEntityId,
      entityNanoid: entity.id,
      entityBusinessId,
      foundGraph: !!entityGraph,
      availableGraphs: graphs.map((g) => g.id),
    });

    if (!entityGraph) {
      console.warn(`[EntityWorkflowSyncer] 未找到实体${entityBusinessId}的工作流图`);

      // 生成默认的实体节点
      const defaultWorkflowData = {
        nodes: [
          {
            id: 'start-node',
            type: 'start',
            position: { x: 100, y: 100 },
            data: {
              entityId: entity.id, // 使用nanoid作为内部标识
              entityName: entity.name,
              outputs: {}, // 这里会由EntityPropertySyncer填充
            },
          },
        ],
        edges: [],
      };

      console.log('[EntityWorkflowSyncer] 设置默认工作流:', { selectedEntityId, entityBusinessId });
      setGraph(defaultWorkflowData, selectedEntityId, `default-${entityBusinessId}`);
      return;
    }

    // 设置loading状态
    setLoading(true);

    // 使用setTimeout确保loading状态能正确显示，并避免阻塞UI
    setTimeout(() => {
      try {
        // 转换为工作流数据
        const convertedData = convertGraphToWorkflowData(entityGraph);

        // 设置到当前图存储
        console.log('[EntityWorkflowSyncer] 设置工作流图:', {
          selectedEntityId,
          graphId: entityGraph.id,
          nodeCount: convertedData?.nodes?.length,
        });
        setGraph(convertedData, selectedEntityId, entityGraph.id);
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
