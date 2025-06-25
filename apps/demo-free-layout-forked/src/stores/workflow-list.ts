import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { graphApi } from '../services/api-service';
import { REAL_GRAPHS } from '../mock-data';

// 数据转换函数：前端 → 后台
const transformFrontendToBackend = (frontendGraph: WorkflowGraph): any => {
  console.log(
    '🔄 [transformFrontendToBackend] 开始转换，原始节点类型:',
    frontendGraph.nodes.map((n) => ({ id: n.id, type: n.type }))
  );

  const result = {
    ...frontendGraph,
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
    '🔄 [transformFrontendToBackend] 转换完成，最终节点类型:',
    result.nodes.map((n) => ({ id: n.id, type: n.type }))
  );

  return result;
};

// 数据转换函数：后台 → 前端
const transformBackendToFrontend = (backendGraph: any): WorkflowGraph => ({
  ...backendGraph,
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
  name: string;
  type: string;
  desc?: string;
  entityId?: string; // 关联的实体_indexId（保留向后兼容）
  moduleIds?: string[]; // 关联的模块ID列表
  priority?: number; // 优先级，数值越小优先级越高
  nodes: WorkflowGraphNode[];
  edges: WorkflowGraphEdge[];
  _indexId?: string; // nanoid索引，用作React key
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
  createGraph: (graph: Omit<WorkflowGraph, 'id'> & { id?: string }) => Promise<void>;
  deleteGraph: (id: string) => Promise<void>;
  addNewBehavior: () => string; // 添加新行为，返回_indexId

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
      graphs: [],
      loading: false,
      error: null,
      lastLoaded: null,

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
          const data = await graphApi.getAll();

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

                  if (!isValid) {
                    console.log('🔍 [GraphStore] 过滤掉的图:', {
                      id: graph?.id,
                      name: graph?.name,
                      hasNodes: Array.isArray(graph?.nodes),
                      graph: graph,
                    });
                  }

                  return isValid;
                })
                .map((graph) => transformBackendToFrontend(graph))
            : [];

          console.log('🔍 [GraphStore] 处理后的数据:', {
            validCount: validGraphs.length,
            firstValid: validGraphs[0],
          });

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
            savedGraph = await graphApi.update(originalId, backendGraph);
          } else {
            // 新图：使用create API
            console.log('📝 GraphStore: 创建新行为树图', { newId: graph.id });
            savedGraph = await graphApi.create(backendGraph);
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
          const savedGraph = await graphApi.create(backendGraph);

          // 🔄 数据转换：后台 → 前端格式
          const frontendGraph = transformBackendToFrontend(savedGraph);

          set((state) => {
            state.graphs.push(frontendGraph);
          });
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : '创建行为树图失败';
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
          await graphApi.delete(id);

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

      // 添加新行为 - 在store中处理业务逻辑
      addNewBehavior: () => {
        const indexId = nanoid();
        const startNodeId = nanoid();
        const newBehavior: WorkflowGraph = {
          id: '', // 空ID，用户需要填写
          name: '新建一个行为',
          type: 'behavior',
          desc: '新建两个行为',
          moduleIds: [], // 空数组，不预设模块
          priority: get().graphs.filter((g) => g.type === 'behavior').length,
          nodes: [
            {
              id: startNodeId,
              name: '开始',
              type: 'start',
            },
          ],
          edges: [],
          _indexId: indexId,
          isNew: true, // 标记为新建
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
      updateEntityIdMapping: state.updateEntityIdMapping,
      updateGraphs: state.updateGraphs,
    }))
  );

// 导出单独的状态选择器
export const useGraphLoading = () => useGraphStoreBase((state) => state.loading);
export const useGraphError = () => useGraphStoreBase((state) => state.error);
