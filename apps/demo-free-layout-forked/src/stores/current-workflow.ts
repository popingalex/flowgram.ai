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
    createGraph: (graph: any) => Promise<WorkflowGraph>;
  }) => Promise<WorkflowGraph | void>;
  resetChanges: () => void;
  clearAll: () => void;

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

          // 🔑 修复：避免不必要的重新创建工作副本，但要考虑新建行为保存后的情况
          const isSameBehavior =
            state.selectedBehaviorId === behavior._indexId ||
            state.selectedBehaviorId === behavior.id ||
            // 特殊情况：当前选中的是新建行为，但要切换到同一个行为的保存版本
            (state.editingBehavior?._status === 'new' &&
              state.editingBehavior.id === behavior.id &&
              behavior._status !== 'new');

          if (isSameBehavior && behavior._status !== 'new') {
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

          state.selectedBehaviorId = behavior._indexId!;
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

          // 🔑 创建新的对象引用确保React能检测到变化
          state.editingBehavior = { ...state.editingBehavior, ...updates };

          // 🔑 同步行为属性到start节点
          if (state.editingBehavior.nodes && state.editingBehavior.nodes.length > 0) {
            const startNode = state.editingBehavior.nodes.find(
              (node: any) => node.type === 'start' || node.type === 'nest'
            );

            if (startNode && startNode.data) {
              let nodeUpdated = false;

              // 同步属性到 outputs.properties
              if (startNode.data.outputs && startNode.data.outputs.properties) {
                const props = startNode.data.outputs.properties;

                Object.keys(updates).forEach((key) => {
                  if (props[key] && state.editingBehavior) {
                    props[key].default = (state.editingBehavior as any)[key];
                    nodeUpdated = true;
                  }
                });
              }

              if (nodeUpdated) {
                console.log('🔄 [CurrentBehaviorStore] 反向同步行为属性到start节点完成');
              }
            }
          }

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

          const currentNodes = state.editingBehavior.nodes || [];
          const currentEdges = state.editingBehavior.edges || [];
          const newNodes = data.nodes || [];
          const newEdges = data.edges || [];

          // 深度比较，避免无意义的更新
          const nodesChanged = JSON.stringify(currentNodes) !== JSON.stringify(newNodes);
          const edgesChanged = JSON.stringify(currentEdges) !== JSON.stringify(newEdges);

          if (!nodesChanged && !edgesChanged) {
            // 数据没有变化，直接返回，避免无限循环
            return;
          }

          console.log('📝 [CurrentBehaviorStore] 更新工作流数据:', {
            behaviorId: state.editingBehavior.id,
            oldNodeCount: currentNodes.length,
            newNodeCount: newNodes.length,
            oldEdgeCount: currentEdges.length,
            newEdgeCount: newEdges.length,
            nodesChanged,
            edgesChanged,
          });

          // 只在真正有变化时才更新
          if (nodesChanged) {
            state.editingBehavior.nodes = newNodes;
          }
          if (edgesChanged) {
            state.editingBehavior.edges = newEdges;
          }

          // 🔑 移除复杂的双向同步逻辑
          // start节点不存储行为属性，只是逻辑节点
          // 行为属性统一存储在WorkflowGraph层面

          // 检查是否有变化
          state.isDirty = !deepCompareBehaviors(state.originalBehavior, state.editingBehavior);
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

        // 🔑 修复：name不是必填项，移除name验证
        // if (!nameValue || !nameValue.trim()) {
        //   errors.push('行为名称不能为空');
        // }

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
            _status: (behaviorToSave as any)._status,
            isNew: (behaviorToSave as any)._status === 'new',
            isDirty: state.isDirty,
          });

          let savedBehavior: WorkflowGraph | null = null;

          // 🔑 修复：使用_status判断是新建还是更新
          if ((behaviorToSave as any)._status === 'new') {
            // 新建行为
            const cleanBehavior = { ...behaviorToSave };
            delete (cleanBehavior as any)._status; // 移除临时标记
            delete (cleanBehavior as any)._indexId; // 移除索引ID，让后台重新生成

            console.log('💾 [CurrentBehaviorStore] 准备创建新行为:', {
              originalId: behaviorToSave.id,
              cleanBehavior: cleanBehavior,
            });

            savedBehavior = await graphActions.createGraph(cleanBehavior);
            console.log('✅ [CurrentBehaviorStore] 新建行为成功:', savedBehavior.id);
          } else {
            // 更新现有行为
            const cleanBehavior = { ...behaviorToSave };
            delete (cleanBehavior as any)._status; // 移除状态标记

            console.log('💾 [CurrentBehaviorStore] 准备更新行为:', {
              behaviorId: cleanBehavior.id,
              cleanBehavior: cleanBehavior,
            });

            await graphActions.saveGraph(cleanBehavior);
            console.log('✅ [CurrentBehaviorStore] 更新行为成功');
          }

          set((s) => {
            s.originalBehavior = cloneDeep(s.editingBehavior);
            s.isDirty = false;
          });

          // 🔑 修复：返回保存后的行为数据（新建时）
          return savedBehavior || undefined;
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '保存失败';
          console.error('❌ [CurrentBehaviorStore] 保存失败:', error);

          set((s) => {
            s.error = errorMsg;
            // 🔑 修复：保存失败时，如果是新建行为，保持_status状态，不清理
            console.log('🧹 [CurrentBehaviorStore] 保存失败，保持编辑状态');
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
          if (!state.originalBehavior) {
            console.log('⚠️ [CurrentBehaviorStore] 重置失败: 没有originalBehavior');
            return;
          }

          const beforeReset = {
            id: state.editingBehavior?.id,
            name: state.editingBehavior?.name,
            isDirty: state.isDirty,
          };

          state.editingBehavior = cloneDeep(state.originalBehavior);
          state.isDirty = false;
          state.error = null;

          console.log('🔄 [CurrentBehaviorStore] 重置变化完成:', {
            behaviorId: state.originalBehavior.id,
            beforeReset,
            afterReset: {
              id: state.editingBehavior.id,
              name: state.editingBehavior.name,
              isDirty: state.isDirty,
            },
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

      // 🔑 新增：强制清理所有状态（用于保存成功后清理新建行为）
      clearAll: () => {
        set((state) => {
          console.log('🔄 [CurrentBehaviorStore] 强制清理所有状态');
          state.selectedBehaviorId = null;
          state.originalBehavior = null;
          state.editingBehavior = null;
          state.isDirty = false;
          state.isSaving = false;
          state.error = null;
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
      clearAll: state.clearAll,
      refreshBehavior: state.refreshBehavior,
      setError: state.setError,
      setSaving: state.setSaving,
      validateBehavior: state.validateBehavior,
    }))
  );
