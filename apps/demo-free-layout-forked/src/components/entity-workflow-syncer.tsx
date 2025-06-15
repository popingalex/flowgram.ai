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
    if (!selectedEntityId) {
      clearGraph();
      return;
    }

    // 等待graphs数据加载完成
    if (graphs.length === 0) {
      return;
    }

    // 获取实体数据
    const entity = editingEntity || getEntityByStableId(selectedEntityId);
    if (!entity) {
      console.warn(`[EntityWorkflowSyncer] 未找到实体数据: ${selectedEntityId}`);
      clearGraph();
      return;
    }

    // 查找对应的工作流图 - 使用实体的真实ID
    const entityRealId = entity.id;
    let entityGraph = graphs.find((graph) => graph.id === entityRealId);

    // 如果还是没找到，尝试小写匹配
    if (!entityGraph) {
      entityGraph = graphs.find((graph) => graph.id.toLowerCase() === entityRealId.toLowerCase());
    }

    if (!entityGraph) {
      console.warn(`[EntityWorkflowSyncer] 未找到实体${entityRealId}的工作流图`);

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
