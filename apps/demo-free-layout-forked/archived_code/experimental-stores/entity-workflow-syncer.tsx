import React, { useEffect } from 'react';

import { convertGraphToWorkflowData } from '../utils/graph-to-workflow';
import { useEntityGraphMappingActions } from '../stores/entity-graph-mapping.store';
import {
  useGraphStore,
  useEntityListActions,
  useCurrentGraphStore,
  useCurrentEntity,
} from '../stores';

/**
 * 实体工作流同步器
 * 监听实体切换，自动更新当前工作流数据
 */
export const EntityWorkflowSyncer: React.FC = () => {
  const { selectedEntityId, editingEntity } = useCurrentEntity();
  const { getEntityByStableId } = useEntityListActions();
  const { graphs } = useGraphStore();
  const { setGraph, clearGraph, setLoading } = useCurrentGraphStore();
  const { findGraphByEntityIndexId, findGraphByEntityBusinessId } = useEntityGraphMappingActions();

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
      console.warn(`[EntityWorkflowSyncer] 清空图 - 未找到实体数据: ${selectedEntityId}`);
      clearGraph();
      return;
    }

    // 🔑 查找对应的工作流图 - 使用新的映射系统（基于indexId的稳定关联）

    // 策略1：使用实体indexId查找对应的行为树（推荐方式）
    let graphMapping = findGraphByEntityIndexId(entity._indexId);
    let entityGraph = null;
    let searchMethod = '';

    if (graphMapping) {
      // 通过映射找到行为树
      entityGraph = graphs.find((graph) => graph._indexId === graphMapping!.graphIndexId);
      searchMethod = 'indexId映射';
    }

    // 策略2：如果映射系统没找到，使用业务ID匹配（向后兼容）
    if (!entityGraph) {
      const entityBusinessId = entity.id;
      graphMapping = findGraphByEntityBusinessId(entityBusinessId);

      if (graphMapping) {
        entityGraph = graphs.find((graph) => graph._indexId === graphMapping!.graphIndexId);
        searchMethod = '业务ID映射';
      } else {
        // 直接匹配业务ID（最后的兜底策略）
        entityGraph = graphs.find((graph) => graph.id === entityBusinessId);
        if (!entityGraph) {
          entityGraph = graphs.find(
            (graph) => graph.id.toLowerCase() === entityBusinessId.toLowerCase()
          );
        }
        searchMethod = entityGraph ? '直接ID匹配' : '未找到';
      }
    }

    console.log('🔍 [EntityWorkflowSyncer] 查找结果:', {
      entity: entity.id,
      method: searchMethod,
      found: entityGraph?.id || '无',
    });

    if (!entityGraph) {
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

      setGraph(defaultWorkflowData, selectedEntityId, `default-${entity._indexId}`);
      return;
    }

    // 设置loading状态并直接处理
    setLoading(true);

    try {
      // 转换为工作流数据
      const convertedData = convertGraphToWorkflowData(entityGraph);

      // 设置到当前图存储
      setGraph(convertedData, selectedEntityId, entityGraph.id);
    } catch (error) {
      console.error('[EntityWorkflowSyncer] 转换失败:', error);
      clearGraph();
    } finally {
      setLoading(false);
    }
  }, [
    selectedEntityId,
    editingEntity,
    graphs,
    setGraph,
    clearGraph,
    setLoading,
    getEntityByStableId,
    findGraphByEntityIndexId,
    findGraphByEntityBusinessId,
  ]);

  return null;
};
