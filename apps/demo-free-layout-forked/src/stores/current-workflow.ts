import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep, isEqual } from 'lodash-es';

import type { WorkflowGraph } from './workflow-list';

// 深度比较行为数据，忽略状态字段
const deepCompareBehaviors = (
  behavior1: WorkflowGraph | null,
  behavior2: WorkflowGraph | null
): boolean => {
  if (!behavior1 && !behavior2) return true;
  if (!behavior1 || !behavior2) return false;

  // 🔑 修复：对于新建行为，如果ID相同且都是新建状态，则认为相等
  if ((behavior1 as any).isNew && (behavior2 as any).isNew) {
    if (behavior1.id === behavior2.id) {
      return true;
    }
  }

  // 创建副本，移除状态字段进行比较
  const clean1 = cleanBehaviorForComparison(behavior1);
  const clean2 = cleanBehaviorForComparison(behavior2);

  const areEqual = isEqual(clean1, clean2);

  // 🔑 修复：减少日志输出，只在不相等时输出
  if (!areEqual) {
    console.log('🔍 [BehaviorDeepCompare] 行为深度比较:', {
      behavior1Id: behavior1.id,
      behavior2Id: behavior2.id,
      areEqual,
      behavior1IsNew: (behavior1 as any).isNew,
      behavior2IsNew: (behavior2 as any).isNew,
    });
  }

  return areEqual;
};

// 清理行为数据，移除状态字段和动态字段
const cleanBehaviorForComparison = (behavior: WorkflowGraph): any => {
  const cleaned = { ...behavior };

  // 移除索引字段和状态字段
  delete (cleaned as any)._indexId;
  delete (cleaned as any)._status;
  delete (cleaned as any)._editStatus;
  delete (cleaned as any).isNew;

  // 清理节点和边的状态字段
  if (cleaned.nodes) {
    cleaned.nodes = cleaned.nodes.map((node: any) => {
      const cleanedNode = { ...node };
      delete cleanedNode._indexId;
      delete cleanedNode._status;
      return cleanedNode;
    });
  }

  if (cleaned.edges) {
    cleaned.edges = cleaned.edges.map((edge: any) => {
      const cleanedEdge = { ...edge };
      delete cleanedEdge._indexId;
      delete cleanedEdge._status;
      return cleanedEdge;
    });
  }

  return cleaned;
};

// 当前行为编辑状态
export interface CurrentBehaviorState {
  // 选择状态
  selectedBehaviorId: string | null;

  // 编辑状态
  originalBehavior: WorkflowGraph | null;
  editingBehavior: WorkflowGraph | null;

  // 状态标记
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// 当前行为编辑操作
export interface CurrentBehaviorActions {
  // 选择行为（创建编辑副本）
  selectBehavior: (behavior: WorkflowGraph | null) => void;

  // 编辑操作
  updateProperty: (path: string, value: any) => void;
  updateBehavior: (updates: Partial<WorkflowGraph>) => void;
  updateWorkflowData: (data: { nodes: any[]; edges: any[] }) => void;

  // 保存/重置
  saveChanges: (graphActions?: {
    saveGraph: (graph: any) => Promise<void>;
    createGraph: (graph: any) => Promise<void>;
  }) => Promise<void>;
  resetChanges: () => void;

  // 刷新行为数据
  refreshBehavior: (behaviorId: string) => Promise<void>;

  // 状态管理
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;

  // 验证
  validateBehavior: () => { isValid: boolean; errors: string[] };
}

type CurrentBehaviorStore = CurrentBehaviorState & CurrentBehaviorActions;

// 创建当前行为编辑store，使用Immer中间件
export const useCurrentBehaviorStore = create<CurrentBehaviorStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      selectedBehaviorId: null,
      originalBehavior: null,
      editingBehavior: null,
      isDirty: false,
      isSaving: false,
      error: null,

      // 选择行为（创建编辑副本）
      selectBehavior: (behavior) => {
        set((state) => {
          if (!behavior) {
            state.selectedBehaviorId = null;
            state.originalBehavior = null;
            state.editingBehavior = null;
            state.isDirty = false;
            state.error = null;
            return;
          }

          // 避免不必要的重新创建工作副本
          if (
            state.selectedBehaviorId === behavior._indexId ||
            state.selectedBehaviorId === behavior.id
          ) {
            console.log('🔄 行为已选中，跳过重新创建工作副本:', behavior.id);
            return;
          }

          // 创建副本，避免修改外部对象
          const behaviorCopy = cloneDeep(behavior);

          console.log('📝 [CurrentBehaviorStore] 选择行为，创建工作副本:', {
            behaviorId: behavior.id,
            behaviorName: behavior.name,
            behaviorDesc: behavior.desc,
            isNew: (behavior as any).isNew,
            fullBehaviorData: behavior,
          });

          state.selectedBehaviorId = behavior._indexId || behavior.id;
          state.originalBehavior = behaviorCopy;
          state.editingBehavior = cloneDeep(behaviorCopy);
          state.isDirty = false;
          state.error = null;
        });
      },

      // 更新属性
      updateProperty: (path, value) => {
        set((state) => {
          if (!state.editingBehavior) return;

          // 使用点分割路径更新嵌套属性
          const pathParts = path.split('.');
          let current = state.editingBehavior as any;

          for (let i = 0; i < pathParts.length - 1; i++) {
            if (!current[pathParts[i]]) {
              current[pathParts[i]] = {};
            }
            current = current[pathParts[i]];
          }

          current[pathParts[pathParts.length - 1]] = value;

          // 检查是否有变化
          state.isDirty = !deepCompareBehaviors(state.originalBehavior, state.editingBehavior);

          console.log('📝 [CurrentBehaviorStore] 更新属性:', {
            path,
            value,
            isDirty: state.isDirty,
          });
        });
      },

      // 更新行为
      updateBehavior: (updates) => {
        set((state) => {
          if (!state.editingBehavior) {
            console.log('⚠️ [CurrentBehaviorStore] updateBehavior: 没有editingBehavior');
            return;
          }

          const beforeUpdate = {
            id: state.editingBehavior.id,
            name: state.editingBehavior.name,
            _indexId: state.editingBehavior._indexId,
          };

          Object.assign(state.editingBehavior, updates);

          // 检查是否有变化
          const wasDirty = state.isDirty;
          state.isDirty = !deepCompareBehaviors(state.originalBehavior, state.editingBehavior);

          const afterUpdate = {
            id: state.editingBehavior.id,
            name: state.editingBehavior.name,
            _indexId: state.editingBehavior._indexId,
          };

          console.log('📝 [CurrentBehaviorStore] 更新行为工作副本:', {
            updates,
            beforeUpdate,
            afterUpdate,
            wasDirty,
            nowDirty: state.isDirty,
            dirtyChanged: wasDirty !== state.isDirty,
          });
        });
      },

      // 更新工作流数据（节点和边）
      updateWorkflowData: (data) => {
        set((state) => {
          if (!state.editingBehavior) return;

          // 🔑 修复：避免不必要的更新，检查数据是否真的发生了变化
          const currentNodeCount = state.editingBehavior.nodes?.length || 0;
          const currentEdgeCount = state.editingBehavior.edges?.length || 0;
          const newNodeCount = data.nodes?.length || 0;
          const newEdgeCount = data.edges?.length || 0;

          // 如果节点和边的数量都没有变化，并且不是初始化状态，则跳过更新
          if (
            currentNodeCount === newNodeCount &&
            currentEdgeCount === newEdgeCount &&
            currentNodeCount > 0 // 确保不是初始化状态
          ) {
            return;
          }

          state.editingBehavior.nodes = data.nodes || [];
          state.editingBehavior.edges = data.edges || [];

          // 🔑 同步start节点的ID到行为ID（只在真正变化时同步，避免频繁更新）
          if (data.nodes && data.nodes.length > 0) {
            const startNode = data.nodes.find(
              (node: any) => node.type === 'start' || node.type === 'nest'
            );

            if (startNode && startNode.data && startNode.data.id && startNode.data.id.trim()) {
              // 只有当ID真正不同时才同步，避免频繁触发
              const newId = startNode.data.id.trim();
              if (state.editingBehavior.id !== newId) {
                state.editingBehavior.id = newId;
                console.log('🔄 [CurrentBehaviorStore] 同步start节点ID到行为ID:', newId);
              }
            }
          }

          // 🔑 修复：减少深度比较的频率，只在必要时进行
          const wasClean = !state.isDirty;
          state.isDirty = !deepCompareBehaviors(state.originalBehavior, state.editingBehavior);

          // 只在状态真正变化时输出日志
          if (wasClean !== !state.isDirty) {
            console.log('📝 [CurrentBehaviorStore] 更新工作流数据:', {
              nodeCount: newNodeCount,
              edgeCount: newEdgeCount,
              behaviorId: state.editingBehavior.id,
              isDirty: state.isDirty,
            });
          }
        });
      },

      // 验证行为
      validateBehavior: () => {
        const state = get();
        const errors: string[] = [];

        if (!state.editingBehavior) {
          errors.push('没有选择行为');
          return { isValid: false, errors };
        }

        const idValue = state.editingBehavior.id;
        const nameValue = state.editingBehavior.name;

        if (!idValue || !idValue.trim()) {
          errors.push('行为ID不能为空');
        }

        if (!nameValue || !nameValue.trim()) {
          errors.push('行为名称不能为空');
        }

        const isValid = errors.length === 0;

        return { isValid, errors };
      },

      // 保存变化
      saveChanges: async (graphActions) => {
        const state = get();

        if (!state.editingBehavior || state.isSaving) return;

        // 验证数据
        const validation = state.validateBehavior();
        if (!validation.isValid) {
          const errorMsg = validation.errors.join(', ');
          set((s) => {
            s.error = errorMsg;
          });
          throw new Error(errorMsg);
        }

        if (!graphActions) {
          const errorMsg = '缺少保存方法';
          set((s) => {
            s.error = errorMsg;
          });
          throw new Error(errorMsg);
        }

        set((s) => {
          s.isSaving = true;
          s.error = null;
        });

        try {
          const behaviorToSave = { ...state.editingBehavior };

          console.log('💾 [CurrentBehaviorStore] 保存行为变化:', {
            behaviorId: behaviorToSave.id,
            isNew: 'isNew' in behaviorToSave && (behaviorToSave as any).isNew,
            isDirty: state.isDirty,
          });

          // 判断是新建还是更新
          if ('isNew' in behaviorToSave && (behaviorToSave as any).isNew) {
            // 新建行为
            delete (behaviorToSave as any).isNew; // 移除临时标记
            await graphActions.createGraph(behaviorToSave);
            console.log('✅ [CurrentBehaviorStore] 新建行为成功');
          } else {
            // 更新现有行为
            await graphActions.saveGraph(behaviorToSave);
            console.log('✅ [CurrentBehaviorStore] 更新行为成功');
          }

          set((s) => {
            s.originalBehavior = cloneDeep(s.editingBehavior);
            s.isDirty = false;
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '保存失败';
          console.error('❌ [CurrentBehaviorStore] 保存失败:', error);
          set((s) => {
            s.error = errorMsg;
          });
          throw error;
        } finally {
          set((s) => {
            s.isSaving = false;
          });
        }
      },

      // 重置变化
      resetChanges: () => {
        set((state) => {
          if (!state.originalBehavior) return;

          state.editingBehavior = cloneDeep(state.originalBehavior);
          state.isDirty = false;
          state.error = null;

          console.log('🔄 [CurrentBehaviorStore] 重置变化:', {
            behaviorId: state.originalBehavior.id,
          });
        });
      },

      // 刷新行为数据
      refreshBehavior: async (behaviorId) => {
        // 这里需要从GraphStore重新加载数据
        console.log('🔄 [CurrentBehaviorStore] 刷新行为数据:', behaviorId);
      },

      // 设置错误
      setError: (error) => {
        set((state) => {
          state.error = error;
        });
      },

      // 设置保存状态
      setSaving: (saving) => {
        set((state) => {
          state.isSaving = saving;
        });
      },
    })),
    {
      name: 'current-behavior-store',
    }
  )
);

// 导出Store hooks
export const useCurrentBehavior = () =>
  useCurrentBehaviorStore(
    useShallow((state) => ({
      selectedBehaviorId: state.selectedBehaviorId,
      originalBehavior: state.originalBehavior,
      editingBehavior: state.editingBehavior,
      isDirty: state.isDirty,
      isSaving: state.isSaving,
      error: state.error,
    }))
  );

export const useCurrentBehaviorActions = () =>
  useCurrentBehaviorStore(
    useShallow((state) => ({
      selectBehavior: state.selectBehavior,
      updateProperty: state.updateProperty,
      updateBehavior: state.updateBehavior,
      updateWorkflowData: state.updateWorkflowData,
      saveChanges: state.saveChanges,
      resetChanges: state.resetChanges,
      refreshBehavior: state.refreshBehavior,
      setError: state.setError,
      setSaving: state.setSaving,
      validateBehavior: state.validateBehavior,
    }))
  );
