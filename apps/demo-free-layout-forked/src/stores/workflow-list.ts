import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

// graphApi已废弃，图形工作流功能不再使用
import { REAL_GRAPHS } from '../mock-data';

// 数据转换函数：前端 → 后台
const transformFrontendToBackend = (frontendGraph: WorkflowGraph): any => {
  console.log(
    '🔄 [transformFrontendToBackend] 开始转换，原始节点类型:',
    frontendGraph.nodes.map((n) => ({ id: n.id, type: n.type }))
  );

  const result = {
    ...frontendGraph,
    // 🔑 修复：前端type为'behavior'时，后台应该是'graph'
    type: frontendGraph.type === 'behavior' ? 'graph' : frontendGraph.type,
    nodes: frontendGraph.nodes.map((node) => {
      const originalType = node.type;
      // 转换节点类型：前端的 start → 后台的 nest
      const convertedType = node.type === 'start' ? 'nest' : node.type;

      if (originalType !== convertedType) {
        console.log(
          `🔄 [transformFrontendToBackend] 节点类型转换: ${node.id} ${originalType} → ${convertedType}`
        );
      }

      return {
        ...node,
        type: convertedType,
      };
    }),
  };

  console.log(
    '🔄 [transformFrontendToBackend] 转换完成，type转换:',
    `${frontendGraph.type} → ${result.type}`,
    '最终节点类型:',
    result.nodes.map((n) => ({ id: n.id, type: n.type }))
  );

  return result;
};

// 数据转换函数：后台 → 前端
const transformBackendToFrontend = (backendGraph: any): WorkflowGraph => ({
  ...backendGraph,
  // 🔑 修复：后台type为'graph'时，前端应该是'behavior'
  type: backendGraph.type === 'graph' ? 'behavior' : backendGraph.type,
  // 确保_indexId存在
  _indexId: backendGraph._indexId || nanoid(),
  nodes: (backendGraph.nodes || []).map((node: any) => ({
    ...node,
    // 如果需要，可以在这里进行反向转换
    // 但通常保持后台返回的类型即可
  })),
  // 确保edges字段存在，如果后台没有返回则设为空数组
  edges: backendGraph.edges || [],
});

// 工作流图数据类型
export interface WorkflowGraphNode {
  id: string;
  name: string;
  desc?: string;
  type: string; // nest, action, condition, sequence
  inputs?: Array<{
    id: string;
    type?: string;
    name?: string;
    desc?: string;
  }>;
  outputs?: Array<{
    id: string;
    type?: string;
    name?: string;
    desc?: string;
  }>;
  // 🔧 新增：FlowGram节点数据结构，用于存储start节点的属性
  data?: {
    title?: string; // 节点标题
    outputs?: {
      type: string;
      properties?: {
        [key: string]: {
          type: string;
          default?: any;
        };
      };
    };
    [key: string]: any; // 支持其他任意属性
  };
  stateData?: {
    order?: number;
    phase?: string;
    match?: string;
    conditions?: Array<{
      segments: string[];
      value: string;
      compareOperator: string;
      negation: boolean;
      partial: boolean;
    }>;
  };
  state?: {
    id?: string; // state的唯一标识符
    order?: number;
    phase?: string;
    match?: string;
    conditions?: Array<{
      segments: string[];
      value: string;
      compareOperator: string;
      negation: boolean;
      partial: boolean;
    }>;
  };
  // 🔧 新增：适配后台数据结构变化，states数组替代单个state
  states?: Array<{
    id?: string; // state的唯一标识符，用作condition的key
    order?: number;
    phase?: string;
    match?: string;
    conditions?: Array<{
      segments: string[];
      value: string;
      compareOperator: string;
      negation: boolean;
      partial: boolean;
    }>;
  }>;
  exp?: {
    id?: string; // 🔧 新增：函数的完整ID，如 com.gsafety.simulation.behavior.entity.Vehicle.dumperAction
    body?: string;
  };
  threshold?: number;
}

export interface WorkflowGraphEdge {
  input: {
    node: string;
    socket: string;
  };
  output: {
    node: string;
    socket: string;
  };
}

export interface WorkflowGraph {
  id: string;
  name?: string;
  type: string;
  desc?: string;
  entityId?: string; // 关联的实体_indexId（保留向后兼容）
  moduleIds?: string[]; // 关联的模块ID列表
  priority?: number; // 优先级，数值越小优先级越高
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  _indexId?: string; // nanoid索引，用作React key
  _status?: 'new' | 'saved' | 'dirty' | 'saving'; // 统一状态管理
}

// Store状态
export interface GraphStoreState {
  graphs: WorkflowGraph[];
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
}

// Store操作
export interface GraphActions {
  loadGraphs: () => Promise<void>;
  getGraphById: (id: string) => WorkflowGraph | null;
  getGraphsByType: (type: string) => WorkflowGraph[];
  refreshGraphs: () => Promise<void>;
  clearError: () => void;

  // 行为树图编辑操作
  saveGraph: (graph: WorkflowGraph) => Promise<void>;
  createGraph: (graph: Omit<WorkflowGraph, 'id'> & { id?: string }) => Promise<WorkflowGraph>;
  deleteGraph: (id: string) => Promise<void>;
  addNewBehavior: () => string; // 添加新行为，返回_indexId
  clearNewBehaviors: () => void; // 清理新建行为

  // 🔑 实体ID映射管理
  updateEntityIdMapping: (mapping: Map<string, string>) => void;

  // 🔑 更新graphs数据（用于nanoid共享）
  updateGraphs: (graphs: WorkflowGraph[]) => void;
}

export type GraphStore = GraphStoreState & GraphActions;

// 创建Store
const useGraphStoreBase = create<GraphStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      graphs: [] as WorkflowGraph[],
      loading: false as boolean,
      error: null as string | null,
      lastLoaded: null as number | null,

      // 加载所有工作流图
      loadGraphs: async () => {
        const state = get();

        // 避免重复加载 - 5分钟内不重复请求
        if (state.lastLoaded && Date.now() - state.lastLoaded < 5 * 60 * 1000) {
          return;
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 使用mock数据，graphApi已废弃
          const data = REAL_GRAPHS;

          // console.log('🔍 [GraphStore] API返回的原始数据:', {
          //   isArray: Array.isArray(data),
          //   length: data?.length,
          //   firstItem: data?.[0],
          // });

          // 确保数据是数组且每个图都有必要的属性
          const validGraphs = Array.isArray(data)
            ? data
                .filter((graph) => {
                  const isValid =
                    graph &&
                    typeof graph.id === 'string' &&
                    typeof graph.name === 'string' &&
                    Array.isArray(graph.nodes);
                  // 移除对edges的强制要求，因为图可以只有节点没有边

                  // 过滤无效图（移除过度调试信息）

                  return isValid;
                })
                .map((graph) => transformBackendToFrontend(graph))
            : [];

          // 数据处理完成（移除过度调试信息）

          set((state) => {
            state.graphs = validGraphs;
            state.lastLoaded = Date.now();
          });
        } catch (error) {
          console.error('Failed to load graphs from API, using mock data:', error);
          // 使用mock数据作为备选，同时为mock数据添加_indexId
          const graphsWithIndexId = (REAL_GRAPHS as WorkflowGraph[]).map((graph) => ({
            ...graph,
            _indexId: graph._indexId || nanoid(),
          }));

          set({
            graphs: graphsWithIndexId,
            lastLoaded: Date.now(),
            error: 'API请求失败，使用本地数据',
            loading: false,
          });
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      // 根据ID获取工作流图（支持大小写兼容）
      getGraphById: (id: string) => {
        const state = get();

        // 先尝试精确匹配
        let graph = state.graphs.find((graph) => graph.id === id);

        if (!graph) {
          // 尝试大小写不敏感匹配
          graph = state.graphs.find((graph) => graph.id.toLowerCase() === id.toLowerCase());
        }

        return graph || null;
      },

      // 根据类型获取工作流图
      getGraphsByType: (type: string) => {
        const state = get();
        return state.graphs.filter((graph) => graph.type === type);
      },

      // 强制刷新
      refreshGraphs: async () => {
        set((state) => {
          state.lastLoaded = null; // 清除缓存时间戳
        });
        await get().loadGraphs();
      },

      // 清除错误
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // 保存行为树图
      saveGraph: async (graph: WorkflowGraph) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 🔄 数据转换：前端 → 后台格式
          const backendGraph = transformFrontendToBackend(graph);

          // 🎯 关键修复：查找原始图的ID，支持ID变更
          const currentState = get();
          const originalGraph = currentState.graphs.find(
            (g) =>
              g.id === graph.id || (g._indexId && graph._indexId && g._indexId === graph._indexId)
          );

          let savedGraph;
          if (originalGraph) {
            // 更新现有图：使用原始ID调用API
            const originalId = originalGraph.id;
            console.log('📝 GraphStore: 更新行为树图', {
              originalId,
              newId: graph.id,
              isIdChanged: originalId !== graph.id,
            });
            savedGraph = backendGraph; // graphApi已废弃，模拟保存成功
          } else {
            // 新图：使用create API
            console.log('📝 GraphStore: 创建新行为树图', { newId: graph.id });
            savedGraph = backendGraph; // graphApi已废弃，模拟保存成功
          }

          // 🔄 数据转换：后台 → 前端格式
          const frontendGraph = transformBackendToFrontend(savedGraph);

          set((state) => {
            const index = state.graphs.findIndex(
              (g) =>
                g.id === (originalGraph?.id || graph.id) ||
                (g._indexId && graph._indexId && g._indexId === graph._indexId)
            );
            if (index >= 0) {
              state.graphs[index] = frontendGraph;
            } else {
              state.graphs.push(frontendGraph);
            }
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '保存行为树图失败';
          });
          throw error;
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      // 创建行为树图
      createGraph: async (graph) => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 🔄 数据转换：前端 → 后台格式
          const graphWithId: WorkflowGraph = { ...graph, id: graph.id || nanoid() };
          const backendGraph = transformFrontendToBackend(graphWithId);

          // 创建行为数据转换完成（移除过度调试信息）

          const savedGraph = backendGraph; // graphApi已废弃，模拟保存成功

          // 🔄 数据转换：后台 → 前端格式
          const frontendGraph = transformBackendToFrontend(savedGraph);

          set((state) => {
            // 🔑 修复：创建成功后，移除临时的新建行为，添加保存后的行为
            const tempBehaviorIndex = state.graphs.findIndex(
              (g) => g._indexId === graph._indexId && 'isNew' in g && (g as any).isNew
            );

            if (tempBehaviorIndex >= 0) {
              console.log('🧹 [GraphStore] 移除临时新建行为，替换为保存后的行为');
              state.graphs.splice(tempBehaviorIndex, 1);
            }

            state.graphs.push(frontendGraph);
          });

          console.log('✅ [GraphStore] 行为创建成功:', frontendGraph.id);

          // 🔑 修复：返回创建后的行为数据，供后续处理使用
          return frontendGraph;
        } catch (error) {
          console.error('❌ [GraphStore] 创建行为失败:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : '创建行为树图失败';

            // 🔑 修复：创建失败时，移除临时的新建行为，避免数据重复
            const tempBehaviorIndex = state.graphs.findIndex(
              (g) => g._indexId === graph._indexId && 'isNew' in g && (g as any).isNew
            );

            if (tempBehaviorIndex >= 0) {
              console.log('🧹 [GraphStore] 创建失败，移除临时新建行为');
              state.graphs.splice(tempBehaviorIndex, 1);
            }
          });
          throw error;
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      // 删除行为树图
      deleteGraph: async (id: string) => {
        console.log('🗑️ [GraphStore] 开始删除行为:', id);

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 调用删除API
          console.log('🗑️ [GraphStore] 调用删除API:', id);
          // graphApi已废弃，模拟删除成功
          console.log('模拟删除成功:', id);

          console.log('✅ [GraphStore] 删除API调用成功，重新查询后台数据同步状态');

          // 🎯 关键修复：删除后重新查询后台数据，确保前端状态与后台一致
          // 这样可以处理两种情况：
          // 1. Mock模式：真正删除，查询结果不包含该图
          // 2. 真实后台：标记deprecated，查询结果可能仍包含但状态已变
          const beforeCount = get().graphs.length;
          await get().loadGraphs();
          const afterCount = get().graphs.length;

          console.log('✅ [GraphStore] 删除操作完成，数据已同步:', {
            beforeCount,
            afterCount,
            deletedCount: beforeCount - afterCount,
          });
        } catch (error) {
          console.error('❌ [GraphStore] 删除失败:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : '删除行为树图失败';
          });
          throw error;
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      // 🔑 实体ID映射管理 - 建立原始ID到nanoid的映射关系
      updateEntityIdMapping: (mapping: Map<string, string>) => {
        // 这个方法主要用于建立实体ID映射关系
        // 暂时存储映射关系，供EntityWorkflowSyncer使用
        console.log('🔄 [GraphStore] 更新实体ID映射:', Object.fromEntries(mapping));

        // 可以考虑在这里更新图数据中的实体引用，但目前先保持简单
        // 实际的关联逻辑在EntityWorkflowSyncer中处理
      },

      // 🔑 更新graphs数据（用于nanoid共享）
      updateGraphs: (graphs: WorkflowGraph[]) => {
        set((state) => {
          state.graphs = graphs;
        });
        console.log('🔄 [GraphStore] 更新graphs数据:', graphs);
      },

      // 清理新建行为 - 移除所有状态为'new'的行为
      clearNewBehaviors: () => {
        set((state) => {
          const beforeCount = state.graphs.length;
          state.graphs = state.graphs.filter((g) => g._status !== 'new');
          const afterCount = state.graphs.length;
          const removedCount = beforeCount - afterCount;

          if (removedCount > 0) {
            console.log(`🧹 [GraphStore] 清理了 ${removedCount} 个新建行为`);
          }
        });
      },

      // 添加新行为 - 在store中处理业务逻辑
      addNewBehavior: () => {
        // 🔑 修复：检查是否已经有新建行为，避免重复创建
        const existingNewBehavior = get().graphs.find((g) => g._status === 'new');
        if (existingNewBehavior) {
          console.log('⚠️ [GraphStore] 已存在新建行为，跳过创建:', existingNewBehavior._indexId);
          return existingNewBehavior._indexId!;
        }

        const indexId = nanoid();
        const startNodeId = nanoid();
        const newBehavior: WorkflowGraph = {
          id: '', // 🔑 新建行为ID为空，用户可以编辑设置
          name: '新建行为', // 🔑 行为名称存储在WorkflowGraph层面
          desc: '', // 🔑 行为描述存储在WorkflowGraph层面
          type: 'behavior',
          priority: -1, // 🔑 修复：新建行为优先级设为-1，确保排在所有现有行为前面
          nodes: [
            {
              id: startNodeId,
              name: 'Start', // 🔑 节点固定名称，不存储行为属性
              type: 'start',
              // 🔑 start节点不存储行为属性，只保留基本的FlowGram节点结构
              data: {
                title: 'Start',
                outputs: {
                  type: 'object',
                  properties: {
                    // 只保留工作流执行相关的输出属性
                    result: {
                      type: 'string',
                      title: '结果',
                    },
                    status: {
                      type: 'string',
                      title: '状态',
                      enum: ['success', 'error', 'pending'],
                    },
                  },
                },
              },
            },
          ],
          edges: [],
          _indexId: indexId,
          _status: 'new', // 统一使用_status管理状态
        } as any;

        set((state) => {
          // 新行为添加到列表顶部
          state.graphs.unshift(newBehavior);
        });

        console.log('➕ [GraphStore] 添加新行为:', indexId);
        return indexId;
      },
    })),
    {
      name: 'graph-store',
    }
  )
);

// 导出Store hooks
export const useGraphStore = () => useGraphStoreBase();

// 导出状态 hooks
export const useGraphList = () =>
  useGraphStoreBase(
    useShallow((state) => ({
      graphs: state.graphs,
      loading: state.loading,
      error: state.error,
      lastLoaded: state.lastLoaded,
    }))
  );

// 导出操作 hooks
export const useGraphActions = () =>
  useGraphStoreBase(
    useShallow((state) => ({
      loadGraphs: state.loadGraphs,
      getGraphById: state.getGraphById,
      getGraphsByType: state.getGraphsByType,
      refreshGraphs: state.refreshGraphs,
      clearError: state.clearError,
      saveGraph: state.saveGraph,
      createGraph: state.createGraph,
      deleteGraph: state.deleteGraph,
      addNewBehavior: state.addNewBehavior,
      clearNewBehaviors: state.clearNewBehaviors,
      updateEntityIdMapping: state.updateEntityIdMapping,
      updateGraphs: state.updateGraphs,
    }))
  );

// 导出单独的状态选择器
export const useGraphLoading = () => useGraphStoreBase((state) => state.loading);
export const useGraphError = () => useGraphStoreBase((state) => state.error);
