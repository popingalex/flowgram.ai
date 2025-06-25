import { nanoid } from 'nanoid';

import type { WorkflowGraph, WorkflowGraphNode, WorkflowGraphEdge } from '../stores/workflow-list';

// 节点类型映射：后台类型 -> 编辑器类型
const NODE_TYPE_MAPPING: Record<string, string> = {
  nest: 'start',
  action: 'action',
  invoke: 'action', // invoke节点映射为action
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

    case 'action':
    case 'invoke':
      // action/invoke节点按order分层布局
      const actionX = 200 + order * 300; // 按order水平分布
      const actionY = 200 + (index % 3) * 150; // 同order内垂直排列
      return { x: actionX, y: actionY };

    case 'condition':
      // condition节点按order分层，位于对应action节点前面
      const conditionX = 50 + order * 300; // 比对应action节点靠左
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

    case 'action':
    case 'invoke':
      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          title: graphNode.name || `调用${graphNode.id}`,
          exp: graphNode.exp, // 保留后台的exp字段
          inputs: convertGraphInputsToInvokeInputs(graphNode.inputs || []),
          outputs: convertGraphOutputsToInvokeOutputs(graphNode.outputs || [], true),
        },
      };

    case 'condition':
      // 🔧 修复：适配新的后台数据结构，states替代state
      // 检查是否已经有转换好的conditions数据
      let existingConditions = null;

      // 🔧 新增：适配后台数据结构变化，从states数组中提取conditions
      let allConditions: any[] = [];
      if (graphNode.states && Array.isArray(graphNode.states)) {
        // 新格式：states数组，每个state包含conditions，需要保持state.id作为key
        graphNode.states.forEach((state: any) => {
          if (state.conditions && Array.isArray(state.conditions)) {
            // 为每个condition添加对应的state.id作为key
            state.conditions.forEach((condition: any) => {
              allConditions.push({
                ...condition,
                _stateId: state.id, // 保存state.id用作condition的key
              });
            });
          }
        });
      } else if (graphNode.state?.conditions) {
        // 兼容旧格式：单个state.conditions
        allConditions = graphNode.state.conditions.map((condition: any) => ({
          ...condition,
          _stateId: graphNode.state?.id || '$out', // 使用state.id或默认$out
        }));
      }

      const conditions = existingConditions || convertGraphConditionsToConditionData(allConditions);

      let conditionTitle = graphNode.id;

      return {
        ...baseNode,
        data: {
          ...baseNode.data,
          title: conditionTitle,
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
          key: condition._stateId || '$out', // 🔧 使用state.id作为key，而不是硬编码$out
          value: conditionValue,
        };
      } catch (error) {
        console.warn('[GraphConverter] 转换条件失败:', condition, error);
        // 返回默认条件
        return {
          key: condition._stateId || '$out', // 🔧 使用state.id作为key
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

  // 聚合打印Phase结构信息
  if (Object.keys(phaseChildren).length > 0) {
    const phaseStructure = Object.keys(phaseChildren).reduce((acc, phaseId) => {
      acc[phaseId] = phaseChildren[phaseId].map((n) => n.id);
      return acc;
    }, {} as Record<string, string[]>);
    // console.log('[GraphConverter] Phase结构分析完成:', phaseStructure);
  }

  return { phaseNodes, otherNodes, phaseChildren };
}

// 将后台工作流图边转换为编辑器连线格式
function convertGraphEdgesToWorkflowEdges(edges: WorkflowGraphEdge[], nodes?: any[]): any[] {
  // console.log('[GraphConverter] 开始转换edges:', {
  //   inputEdgesCount: edges.length,
  //   edges: edges.slice(0, 3), // 只显示前3条避免日志过多
  // });

  // 🔧 新增：构建节点到条件key的映射，用于修复条件节点的端口ID
  const nodeToConditionKeyMap = new Map<string, string>();
  if (nodes) {
    nodes.forEach((node) => {
      if (node.type === 'condition' && node.data?.conditions && node.data.conditions.length > 0) {
        // 对于条件节点，使用第一个条件的key作为主要输出端口
        const firstConditionKey = node.data.conditions[0].key;
        if (firstConditionKey && firstConditionKey !== '$out') {
          nodeToConditionKeyMap.set(node.id, firstConditionKey);
        }
      }
    });
  }

  // 收集端口修复信息，避免逐条打印
  const portFixLog: string[] = [];

  const convertedEdges = edges.map((edge, index) => {
    let sourcePortID = edge.input.socket;
    let targetPortID = edge.output.socket === '$in' ? undefined : edge.output.socket;

    // 🔧 修复：如果源节点是条件节点且使用$out端口，尝试找到正确的条件端口ID
    if (sourcePortID === '$out' && nodeToConditionKeyMap.has(edge.input.node)) {
      const conditionKey = nodeToConditionKeyMap.get(edge.input.node);
      if (conditionKey) {
        sourcePortID = conditionKey;
        portFixLog.push(`${edge.input.node}: $out -> ${conditionKey}`);
      }
    }

    const edgeData = {
      sourceNodeID: edge.input.node,
      targetNodeID: edge.output.node,
      sourcePortID: sourcePortID,
      targetPortID: targetPortID,
    };

    return edgeData;
  });

  // 聚合打印端口修复信息
  if (portFixLog.length > 0) {
    // 移除垃圾技术细节日志
    // console.log(`[GraphConverter] 修复了${portFixLog.length}个条件节点端口:`, portFixLog);
  }

  // console.log('[GraphConverter] 转换完成edges:', {
  //   outputEdgesCount: convertedEdges.length,
  //   edges: convertedEdges.slice(0, 5), // 显示前5条
  //   conditionPortMappings: Object.fromEntries(nodeToConditionKeyMap), // 显示条件节点端口映射
  // });

  return convertedEdges;
}

// 主转换函数：将后台工作流图转换为编辑器可用的工作流数据
export function convertGraphToWorkflowData(graph: WorkflowGraph): any {
  try {
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

    // 🔧 修复：传递节点信息给边转换函数，用于修复条件节点端口ID
    const mainEdges = convertGraphEdgesToWorkflowEdges(graph.edges || [], mainNodes);

    const workflowData = {
      nodes: mainNodes,
      edges: mainEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      _needsAutoLayout: true,
    };

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
