import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

// 当前图状态
export interface CurrentGraphState {
  // 当前工作流数据（flowgram格式）
  workflowData: any | null;

  // 关联的实体ID
  entityId: string | null;

  // 关联的工作流图ID
  graphId: string | null;

  // 状态标记
  loading: boolean;
  error: string | null;
}

// 当前图操作
export interface CurrentGraphActions {
  // 设置当前图
  setGraph: (workflowData: any, entityId: string, graphId: string) => void;

  // 清除当前图
  clearGraph: () => void;

  // 更新工作流数据
  updateWorkflowData: (workflowData: any) => void;

  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type CurrentGraphStore = CurrentGraphState & CurrentGraphActions;

// 创建当前图store
export const useCurrentGraphStore = create<CurrentGraphStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      workflowData: null,
      entityId: null,
      graphId: null,
      loading: false,
      error: null,

      // 设置当前图
      setGraph: (workflowData, entityId, graphId) => {
        set((state) => {
          console.log(`[CurrentGraphStore] 设置图: 实体=${entityId}, 图=${graphId}`);
          state.workflowData = workflowData;
          state.entityId = entityId;
          state.graphId = graphId;
          state.loading = false;
          state.error = null;
        });
      },

      // 清除当前图
      clearGraph: () => {
        set((state) => {
          console.log(`[CurrentGraphStore] 清除图`);
          state.workflowData = null;
          state.entityId = null;
          state.graphId = null;
          state.loading = false;
          state.error = null;
        });
      },

      // 更新工作流数据
      updateWorkflowData: (workflowData) => {
        set((state) => {
          console.log(`[CurrentGraphStore] 更新工作流数据`);
          state.workflowData = workflowData;
          state.error = null;
        });
      },

      // 设置加载状态
      setLoading: (loading) => {
        set((state) => {
          state.loading = loading;
        });
      },

      // 设置错误状态
      setError: (error) => {
        set((state) => {
          state.error = error;
          state.loading = false;
        });
      },
    })),
    {
      name: 'current-graph-store',
    }
  )
);

// 导出状态 hooks
export const useCurrentGraph = () =>
  useCurrentGraphStore(
    useShallow((state) => ({
      workflowData: state.workflowData,
      entityId: state.entityId,
      graphId: state.graphId,
      loading: state.loading,
      error: state.error,
    }))
  );

// 导出操作 hooks
export const useCurrentGraphActions = () =>
  useCurrentGraphStore(
    useShallow((state) => ({
      setGraph: state.setGraph,
      clearGraph: state.clearGraph,
      updateWorkflowData: state.updateWorkflowData,
      setLoading: state.setLoading,
      setError: state.setError,
    }))
  );
