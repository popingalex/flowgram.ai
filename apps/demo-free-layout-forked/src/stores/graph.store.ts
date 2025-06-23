import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

import { graphApi } from '../services/api-service';
import { REAL_GRAPHS } from '../mock-data';

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

          // 确保数据是数组且每个图都有必要的属性
          const validGraphs = Array.isArray(data)
            ? data
                .filter(
                  (graph) =>
                    graph &&
                    typeof graph.id === 'string' &&
                    typeof graph.name === 'string' &&
                    Array.isArray(graph.nodes) &&
                    Array.isArray(graph.edges)
                )
                .map((graph) => ({
                  ...graph,
                  // 🔑 动态生成_indexId，如果已存在则保持不变
                  _indexId: graph._indexId || nanoid(),
                }))
            : [];

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
            savedGraph = await graphApi.update(originalId, graph);
          } else {
            // 新图：使用create API
            console.log('📝 GraphStore: 创建新行为树图', { newId: graph.id });
            savedGraph = await graphApi.create(graph);
          }

          set((state) => {
            const index = state.graphs.findIndex(
              (g) =>
                g.id === (originalGraph?.id || graph.id) ||
                (g._indexId && graph._indexId && g._indexId === graph._indexId)
            );
            if (index >= 0) {
              state.graphs[index] = savedGraph;
            } else {
              state.graphs.push(savedGraph);
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
          const newGraph = await graphApi.create(graph);

          set((state) => {
            state.graphs.push(newGraph);
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
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 调用删除API
          await graphApi.delete(id);

          console.log('✅ GraphStore: 删除API调用成功，重新查询后台数据同步状态');

          // 🎯 关键修复：删除后重新查询后台数据，确保前端状态与后台一致
          // 这样可以处理两种情况：
          // 1. Mock模式：真正删除，查询结果不包含该图
          // 2. 真实后台：标记deprecated，查询结果可能仍包含但状态已变
          await get().loadGraphs();

          console.log('✅ GraphStore: 删除操作完成，数据已同步');
        } catch (error) {
          console.error('❌ GraphStore: 删除失败:', error);
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
      updateEntityIdMapping: state.updateEntityIdMapping,
      updateGraphs: state.updateGraphs,
    }))
  );

// 导出单独的状态选择器
export const useGraphLoading = () => useGraphStoreBase((state) => state.loading);
export const useGraphError = () => useGraphStoreBase((state) => state.error);
