import React from 'react';

import { useClientContext, WorkflowDocument, useService } from '@flowgram.ai/free-layout-editor';
import { Tooltip, IconButton, Toast } from '@douyinfe/semi-ui';
import { IconBranch } from '@douyinfe/semi-icons';

import {
  useCurrentEntity,
  useGraphActions,
  useGraphList,
  type WorkflowGraph,
  type WorkflowGraphNode,
  type WorkflowGraphEdge,
} from '../../stores';

export const GenerateEntityWorkflow: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const { playground } = useClientContext();
  const workflowDocument = useService(WorkflowDocument);
  const entity = useCurrentEntity();
  const { graphs, loading } = useGraphList();
  const { loadGraphs, getGraphById } = useGraphActions();

  const convertNodeType = (graphNodeType: string): string => {
    // 将后台的节点类型转换为编辑器支持的节点类型
    switch (graphNodeType) {
      case 'nest':
        return 'start'; // 嵌套节点转换为start节点
      case 'action':
        return 'invoke'; // 动作节点转换为invoke节点
      case 'condition':
        return 'condition'; // 条件节点保持不变
      case 'sequence':
        return 'condition'; // 序列节点暂时用condition表示
      default:
        return 'invoke'; // 默认转换为invoke节点
    }
  };

  const calculateNodePosition = (index: number, totalNodes: number) => {
    // 计算节点位置，使用网格布局
    const cols = Math.ceil(Math.sqrt(totalNodes));
    const row = Math.floor(index / cols);
    const col = index % cols;

    return {
      x: 100 + col * 300,
      y: 100 + row * 200,
    };
  };

  const handleGenerateWorkflow = async () => {
    const currentEntity = entity.editingEntity;
    if (!currentEntity) {
      Toast.warning('请先选择一个实体');
      return;
    }

    Toast.info('正在获取工作流图...');

    try {
      // 确保已加载工作流图数据
      if (graphs.length === 0) {
        await loadGraphs();
      }

      // 获取实体对应的工作流图
      const graph = getGraphById(currentEntity.id);

      if (!graph) {
        Toast.warning(`未找到实体 ${currentEntity.id} 的工作流图`);
        return;
      }

      console.log(`[工作流生成] 获取到 ${graph.name}，包含 ${graph.nodes.length} 个节点`);

      // 清空当前画布（可选）
      // workflowDocument.clear();

      // 转换并创建节点
      const nodeMap = new Map<string, any>();

      graph.nodes.forEach((graphNode: WorkflowGraphNode, index: number) => {
        const position = calculateNodePosition(index, graph.nodes.length);
        const nodeType = convertNodeType(graphNode.type);

        // 创建节点数据
        const nodeData = {
          id: `${graphNode.id}_${Date.now()}`,
          type: nodeType,
          meta: { position },
          data: {
            title: graphNode.name,
            description: graphNode.desc,
            // 根据节点类型设置特定数据
            ...((nodeType === 'action' || nodeType === 'invoke') && {
              selectedFunction: {
                id: graphNode.id,
                name: graphNode.name,
                description: graphNode.desc,
                parameters: graphNode.inputs?.filter((input: any) => input.id !== '$in') || [],
                returns: graphNode.outputs?.filter((output: any) => output.id !== '$out') || [],
              },
            }),
            ...(nodeType === 'condition' && {
              conditions: graphNode.stateData?.conditions || [],
              expression: graphNode.exp?.body || '',
            }),
          },
        };

        // 创建节点
        const node = workflowDocument.createWorkflowNodeByType(nodeType, position, nodeData);
        nodeMap.set(graphNode.id, node);

        console.log(`[节点创建] ${graphNode.name} (${graphNode.type} -> ${nodeType})`);
      });

      // TODO: 创建连线
      // 注意：当前编辑器的连线创建可能需要特殊处理
      // graph.edges.forEach(edge => {
      //   const sourceNode = nodeMap.get(edge.input.node);
      //   const targetNode = nodeMap.get(edge.output.node);
      //   if (sourceNode && targetNode) {
      //     // 创建连线的逻辑需要根据具体的编辑器API来实现
      //   }
      // });

      Toast.success(`成功生成 ${graph.name}，包含 ${graph.nodes.length} 个节点`);

      // 🔧 自动适应视图 - 使用requestAnimationFrame替代setTimeout
      requestAnimationFrame(() => {
        playground.config.fitView(workflowDocument.root.bounds.pad(30));
      });
    } catch (error) {
      console.error('生成工作流失败:', error);
      Toast.error('生成工作流失败，请检查网络连接');
    }
  };

  return (
    <Tooltip content={`生成 ${entity.editingEntity?.name || '实体'} 行为工作流`}>
      <IconButton
        type="tertiary"
        theme="borderless"
        icon={<IconBranch />}
        disabled={disabled || !entity.editingEntity}
        onClick={handleGenerateWorkflow}
      />
    </Tooltip>
  );
};
