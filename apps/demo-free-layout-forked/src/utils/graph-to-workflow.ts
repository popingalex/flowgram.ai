import { nanoid } from 'nanoid';

import type { WorkflowGraph, WorkflowGraphNode, WorkflowGraphEdge } from '../stores/graph.store';

// 节点类型映射：后台类型 -> 编辑器类型
const NODE_TYPE_MAPPING: Record<string, string> = {
  nest: 'start',
  action: 'invoke',
  condition: 'condition',
  sequence: 'phase',
  fallback: 'phase',
  parallel: 'phase',
};

// 智能布局算法：根据节点类型和order进行流程布局
function calculateNodePosition(
  graphNode: WorkflowGraphNode,
  index: number,
  editorType: string
): { x: number; y: number } {
  const nodeId = graphNode.id || '';
  const order = graphNode.state?.order ?? 999;

  switch (editorType) {
    case 'start':
      return { x: 100, y: 50 + index * 100 }; // 起始节点左上角

    case 'invoke':
      // invoke节点按order分层布局
      const invokeX = 200 + order * 300; // 按order水平分布
      const invokeY = 200 + (index % 3) * 150; // 同order内垂直排列
      return { x: invokeX, y: invokeY };

    case 'condition':
      // condition节点按order分层，位于对应invoke节点前面
      const conditionX = 50 + order * 300; // 比对应invoke节点靠左
      const conditionY = 200 + (index % 3) * 150; // 同order内垂直排列
      return { x: conditionX, y: conditionY };

    default:
      // 其他节点按order水平分布
      const defaultX = 150 + order * 300;
      const defaultY = 150 + (index % 4) * 120;
      return { x: defaultX, y: defaultY };
  }
}

// 将后台工作流图节点转换为编辑器节点格式
function convertGraphNodeToWorkflowNode(
  graphNode: WorkflowGraphNode,
  index: number,
  forcedType?: string
): any {
  // 🔧 修复：正确识别节点类型，特别是以$condition/开头的condition节点
  let editorType = forcedType || NODE_TYPE_MAPPING[graphNode.type] || 'invoke';

  // 特殊处理：如果节点ID以$condition/开头，强制设置为condition类型
  if (!forcedType && graphNode.id && graphNode.id.startsWith('$condition/')) {
    editorType = 'condition';
  }

  // 基础节点数据 - 让dagre自动布局处理
  const baseNode = {
    id: graphNode.id || nanoid(),
    type: editorType,
    position: { x: 0, y: 0 }, // 临时位置，dagre会重新计算
    data: {
      title: graphNode.name || graphNode.id || `节点${index + 1}`, // 确保标题显示
      name: graphNode.name || `节点${index + 1}`,
      description: graphNode.desc || '',
    },
  };

  // 根据节点类型添加特定数据
  switch (editorType) {
    case 'start':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          outputs: {}, // 输出会由EntityPropertySyncer自动填充
        },
      };

    case 'invoke':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          title: graphNode.name || `调用${graphNode.id}`, // 显示具体的函数名
          functionMeta: {
            id: graphNode.id,
            name: graphNode.name,
            description: `Action: ${graphNode.name}`,
            functionType: 'backend-action',
          },
          inputs: convertGraphInputsToInvokeInputs(graphNode.inputs || []),
          outputs: convertGraphOutputsToInvokeOutputs(graphNode.outputs || [], true), // 添加默认输出
        },
      };

    case 'condition':
      const conditions = convertGraphConditionsToConditionData(graphNode.state?.conditions || []);
      // 🔧 修复：condition节点标题处理，去掉$condition/前缀显示实际名称
      let conditionTitle = graphNode.name || '条件分支';
      if (graphNode.id && graphNode.id.startsWith('$condition/')) {
        const baseName = graphNode.id.replace('$condition/', '') || '条件分支';
        conditionTitle = `${baseName} 条件`;
      }

      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          title: conditionTitle, // 显示去掉前缀的条件名
          conditions:
            conditions.length > 0
              ? conditions
              : [
                  {
                    key: `if_${nanoid(6)}`,
                    value: {
                      left: { type: 'ref', content: ['$start', 'id'] },
                      operator: 'is_not_empty',
                      right: { type: 'constant', content: '' },
                    },
                  },
                ],
          expression: graphNode.exp?.body || '',
        },
      };

    case 'phase':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          phaseType: graphNode.type, // sequence, fallback, parallel
          phase: graphNode.stateData?.phase,
          order: graphNode.stateData?.order,
        },
      };

    // comment节点处理已移除

    default:
      return baseNode;
  }
}

// 转换输入参数格式
function convertGraphInputsToInvokeInputs(inputs: any[]): Record<string, any> {
  const result: Record<string, any> = {};

  inputs.forEach((input) => {
    if (input.id && input.id !== '$in') {
      // 过滤掉控制端口
      result[input.id] = {
        name: input.name || input.id,
        type: mapParameterType(input.type) || 'string',
        description: input.desc || '',
        value: null, // 默认值为空
        _originalType: input.type, // 保留原始类型用于调试
      };
    }
  });

  return result;
}

// 参数类型映射
function mapParameterType(backendType: string): string {
  const typeMap: Record<string, string> = {
    u: 'object', // unknown/user type
    s: 'string',
    n: 'number',
    b: 'boolean',
  };

  return typeMap[backendType] || 'string';
}

// 为没有输出的节点添加默认$out输出
function ensureDefaultOutput(outputs: Record<string, any>): Record<string, any> {
  // 如果没有任何输出，添加默认$out端口
  if (Object.keys(outputs).length === 0) {
    return {
      ...outputs,
      $out: {
        name: 'output',
        type: 'object',
        description: 'Default output port',
      },
    };
  }
  return outputs;
}

// 转换输出参数格式
function convertGraphOutputsToInvokeOutputs(
  outputs: any[],
  addDefaultOutput = false
): Record<string, any> {
  const result: Record<string, any> = {};

  outputs.forEach((output) => {
    if (output.id && output.id !== '$out') {
      // 过滤掉控制端口
      result[output.id] = {
        name: output.name || output.id,
        type: mapParameterType(output.type) || 'string',
        description: output.desc || '',
        _originalType: output.type, // 保留原始类型用于调试
      };
    }
  });

  // 使用新的通用函数添加默认输出
  return addDefaultOutput ? ensureDefaultOutput(result) : result;
}

// 操作符映射：后台操作符 -> 编辑器操作符 (Op枚举值)
function mapOperator(backendOperator: string): string {
  const operatorMap: Record<string, string> = {
    EMPTY: 'is_empty',
    EQUALS: 'eq',
    CONTAINS: 'contains',
    AMONG: 'in',
    NOT_EMPTY: 'is_not_empty',
    NOT_EQUALS: 'neq',
  };

  return operatorMap[backendOperator] || 'eq';
}

// 转换条件数据格式 - 从表达式解析条件
function parseConditionExpression(expression: string): any[] {
  if (!expression) return [];

  try {
    // 处理否定表达式
    let isNegated = false;
    let cleanExpression = expression.trim();

    if (cleanExpression.startsWith('!(') && cleanExpression.endsWith(')')) {
      isNegated = true;
      cleanExpression = cleanExpression.slice(2, -1);
    }

    // 解析表达式格式：("field" OPERATOR "value") 或 ("field" OPERATOR value)
    const regex = /\("([^"]+)"\s+(\w+)\s+("([^"]+)"|'([^']+)'|\[([^\]]+)\])\)/;
    const match = cleanExpression.match(regex);

    if (!match) {
      console.warn('[GraphConverter] 无法解析条件表达式:', expression);
      return [];
    }

    const [, field, operator, , quotedValue, singleQuotedValue, arrayValue] = match;
    let value: any = quotedValue || singleQuotedValue || arrayValue || '';

    // 处理数组值
    if (arrayValue) {
      try {
        value = JSON.parse(`[${arrayValue}]`);
      } catch {
        value = arrayValue.split(',').map((v) => v.trim().replace(/['"]/g, ''));
      }
    }

    // 映射操作符
    let mappedOperator = mapOperator(operator);

    // 处理否定
    if (isNegated) {
      switch (mappedOperator) {
        case 'is_empty':
          mappedOperator = 'is_not_empty';
          break;
        case 'eq':
          mappedOperator = 'neq';
          break;
        case 'contains':
          mappedOperator = 'not_contains';
          break;
        case 'in':
          mappedOperator = 'nin';
          break;
        default:
          // 对于其他操作符，保持原样，但标记为否定
          break;
      }
    }

    // 构建变量路径
    const segments = field.includes('/') ? field.split('/') : [field];
    const variablePath = ['$start', ...segments];

    const conditionValue = {
      left: {
        type: 'ref',
        content: variablePath,
      },
      operator: mappedOperator,
      right: {
        type: 'constant',
        content: value,
      },
    };

    return [
      {
        key: `if_${nanoid(6)}`,
        value: conditionValue,
      },
    ];
  } catch (error) {
    console.error('[GraphConverter] 解析条件表达式失败:', expression, error);
    return [];
  }
}

// 转换条件数据格式 - 转换为condition节点期望的格式
function convertGraphConditionsToConditionData(conditions: any[]): any[] {
  // 避免重复日志刷屏，仅在出错时记录
  if (!Array.isArray(conditions) || conditions.length === 0) {
    return [];
  }

  return conditions
    .filter((condition) => condition && typeof condition === 'object')
    .map((condition) => {
      try {
        // 映射操作符
        let mappedOperator = mapOperator(condition.compareOperator || 'EQUALS');

        // 处理否定
        if (condition.negation) {
          switch (mappedOperator) {
            case 'is_empty':
              mappedOperator = 'is_not_empty';
              break;
            case 'eq':
              mappedOperator = 'neq';
              break;
            case 'contains':
              mappedOperator = 'not_contains';
              break;
            case 'in':
              mappedOperator = 'nin';
              break;
            default:
              // 对于其他操作符，保持原样
              break;
          }
        }

        // 构建变量路径 - 处理 segments 数组
        const segments = Array.isArray(condition.segments)
          ? condition.segments
          : [condition.field || 'unknown'];
        const variablePath = ['$start', ...segments];

        const conditionValue = {
          left: {
            type: 'ref',
            content: variablePath,
          },
          operator: mappedOperator,
          right: {
            type: 'constant',
            content: condition.value || '',
          },
        };

        return {
          key: '$out', // 直接使用原始socket ID
          value: conditionValue,
        };
      } catch (error) {
        console.warn('[GraphConverter] 转换条件失败:', condition, error);
        // 返回默认条件
        return {
          key: '$out', // 直接使用原始socket ID
          value: {
            left: { type: 'ref', content: ['$start'] },
            operator: 'eq',
            right: { type: 'constant', content: '' },
          },
        };
      }
    });
}

// 分析phase结构：找到phase节点和它们的子节点
function analyzePhaseStructure(graph: WorkflowGraph) {
  const phaseNodes: any[] = [];
  const otherNodes: any[] = [];
  const phaseChildren: Record<string, any[]> = {};

  // 分类节点
  graph.nodes.forEach((node) => {
    if (node.type === 'sequence' || node.type === 'fallback' || node.type === 'parallel') {
      phaseNodes.push(node);
      phaseChildren[node.id] = [];
    } else {
      otherNodes.push(node);
    }
  });

  // 分析edges，找到每个phase的子节点和它们的关联节点
  graph.edges?.forEach((edge) => {
    const sourceNode = graph.nodes.find((n) => n.id === edge.input.node);
    const targetNode = graph.nodes.find((n) => n.id === edge.output.node);

    // 如果source是phase节点，target不是phase节点，则target是source的子节点
    if (
      sourceNode &&
      targetNode &&
      (sourceNode.type === 'sequence' ||
        sourceNode.type === 'fallback' ||
        sourceNode.type === 'parallel') &&
      !(
        targetNode.type === 'sequence' ||
        targetNode.type === 'fallback' ||
        targetNode.type === 'parallel'
      )
    ) {
      // 添加到phase的子节点中
      if (!phaseChildren[sourceNode.id].find((n) => n.id === targetNode.id)) {
        phaseChildren[sourceNode.id].push(targetNode);
      }
      // 从otherNodes中移除，因为它现在是子节点
      const index = otherNodes.findIndex((n) => n.id === targetNode.id);
      if (index !== -1) {
        otherNodes.splice(index, 1);
      }
    }
  });

  // 第二次遍历：找到子节点的关联节点（如condition->action的连接）
  graph.edges?.forEach((edge) => {
    const sourceNode = graph.nodes.find((n) => n.id === edge.input.node);
    const targetNode = graph.nodes.find((n) => n.id === edge.output.node);

    if (sourceNode && targetNode) {
      // 检查source是否已经是某个phase的子节点
      for (const phaseId in phaseChildren) {
        const isSourceInPhase = phaseChildren[phaseId].find((n) => n.id === sourceNode.id);
        if (
          isSourceInPhase &&
          !phaseChildren[phaseId].find((n) => n.id === targetNode.id) &&
          !(
            targetNode.type === 'sequence' ||
            targetNode.type === 'fallback' ||
            targetNode.type === 'parallel'
          )
        ) {
          // 将target也添加到同一个phase中
          phaseChildren[phaseId].push(targetNode);
          // 从otherNodes中移除
          const index = otherNodes.findIndex((n) => n.id === targetNode.id);
          if (index !== -1) {
            otherNodes.splice(index, 1);
          }
        }
      }
    }
  });

  // 添加调试日志
  Object.keys(phaseChildren).forEach((phaseId) => {
    console.log(
      `[GraphConverter] Phase ${phaseId} 包含子节点:`,
      phaseChildren[phaseId].map((n) => n.id)
    );
  });

  return { phaseNodes, otherNodes, phaseChildren };
}

// 将后台工作流图边转换为编辑器连线格式
function convertGraphEdgesToWorkflowEdges(edges: WorkflowGraphEdge[]): any[] {
  return edges.map((edge, index) => {
    // 🔧 修复：使用正确的字段名 sourceNodeID 和 targetNodeID
    const edgeData = {
      sourceNodeID: edge.input.node,
      targetNodeID: edge.output.node,
      sourcePortID: edge.input.socket === '$out' ? undefined : edge.input.socket,
      targetPortID: edge.output.socket === '$in' ? undefined : edge.output.socket,
    };

    return edgeData;
  });
}

// 主转换函数：将后台工作流图转换为编辑器可用的工作流数据
export function convertGraphToWorkflowData(graph: WorkflowGraph): any {
  console.log(
    `[GraphConverter] 转换图${graph.id}，节点${graph.nodes.length}个，边${
      graph.edges?.length || 0
    }条`
  );

  try {
    // 🔧 简单方案：所有节点平铺，保留所有连线，让dagre处理布局

    // 转换所有节点
    const mainNodes = graph.nodes
      .map((node, index) => {
        let editorType = NODE_TYPE_MAPPING[node.type] || 'invoke';
        if (node.id && node.id.startsWith('$condition/')) {
          editorType = 'condition';
        }
        const convertedNode = convertGraphNodeToWorkflowNode(node, index, editorType);

        // 验证节点转换结果
        if (!convertedNode || !convertedNode.id) {
          console.error('[GraphConverter] 节点转换失败:', node);
          return null;
        }

        return convertedNode;
      })
      .filter(Boolean); // 过滤掉转换失败的节点

    // 转换所有连线 - 正确处理端口ID
    const mainEdges = (graph.edges || []).map((edge) => {
      const edgeData: any = {
        sourceNodeID: edge.input.node,
        targetNodeID: edge.output.node,
      };

      // 🔧 修复：条件节点的$out端口需要保留，只有$in端口才省略
      if (edge.input.socket && edge.input.socket !== '$in') {
        edgeData.sourcePortID = edge.input.socket;
      }
      if (edge.output.socket && edge.output.socket !== '$in') {
        edgeData.targetPortID = edge.output.socket;
      }

      return edgeData;
    });

    const workflowData = {
      nodes: mainNodes,
      edges: mainEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      // 触发dagre自动布局
      _needsAutoLayout: true,
    };

    console.log(`[GraphConverter] 转换完成: ${mainNodes.length}个节点, ${mainEdges.length}条连线`);

    // 直接输出完整的转换结果
    console.log('[GraphConverter] 转换后的完整工作流数据:', workflowData);

    return workflowData;
  } catch (error) {
    console.error('[GraphConverter] 转换失败:', error);
    throw error;
  }
}

// 检查是否有对应的工作流图（支持大小写兼容）
export function hasWorkflowGraphForEntity(entityId: string, graphs: WorkflowGraph[]): boolean {
  // 先尝试精确匹配
  if (graphs.some((graph) => graph.id === entityId)) {
    return true;
  }

  // 再尝试大小写不敏感匹配
  return graphs.some((graph) => graph.id.toLowerCase() === entityId.toLowerCase());
}
