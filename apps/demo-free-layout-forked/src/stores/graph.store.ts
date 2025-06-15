import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

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
          console.log('[GraphStore] 使用缓存数据，跳过API请求');
          return;
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          console.log('[GraphStore] 开始加载工作流图列表...');

          // 尝试真实API，失败时使用mock数据
          let graphs: WorkflowGraph[];
          try {
            const response = await fetch('http://localhost:9999/hub/graphs/');
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            graphs = await response.json();
            console.log('[GraphStore] 使用真实API数据');
          } catch (apiError) {
            console.warn('[GraphStore] 真实API失败，使用mock数据:', apiError);
            // 动态导入mock数据
            const { REAL_GRAPHS } = await import('../mock-data');
            graphs = REAL_GRAPHS;
            console.log('[GraphStore] 使用mock数据');
          }

          console.log(`[GraphStore] 加载完成，共 ${graphs.length} 个工作流图`);

          // 为每个graph添加稳定的索引ID (如果需要)
          const graphsWithIndex = graphs.map((graph) => ({
            ...graph,
            _indexId: graph.id, // 使用graph.id作为索引ID
          }));

          set((state) => {
            state.graphs = graphsWithIndex;
            state.loading = false;
            state.lastLoaded = Date.now();
          });

          console.log(
            `[GraphStore] 工作流图ID列表:`,
            graphs.map((g) => g.id)
          );
        } catch (error) {
          console.error('[GraphStore] 加载失败:', error);
          set((state) => {
            state.loading = false;
            state.error = error instanceof Error ? error.message : '加载工作流图失败';
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
    }))
  );

// 导出单独的状态选择器
export const useGraphLoading = () => useGraphStoreBase((state) => state.loading);
export const useGraphError = () => useGraphStoreBase((state) => state.error);
