import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

// 行为优先级项 - 🔑 完全基于_indexId，不存储可变的业务ID
interface BehaviorPriorityItem {
  _indexId: string; // 行为索引ID - 唯一稳定标识符
  priority: number; // 优先级数值
  name?: string; // 行为名称（用于显示）
}

// Store状态
interface BehaviorPriorityState {
  items: BehaviorPriorityItem[];
  loading: boolean;
  error: string | null;
  isDirty: boolean; // 是否有未保存的更改
  lastUpdateTime: number; // 最后更新时间
  cacheTimeout: number; // 缓存超时时间（毫秒）
}

// Store操作
interface BehaviorPriorityActions {
  // 初始化优先级列表
  initFromBehaviors: (behaviors: any[]) => void;

  // 更新排序
  updateOrder: (oldIndex: number, newIndex: number) => void;

  // 保存优先级到后台
  savePriorities: (behaviors?: any[]) => Promise<void>;

  // 重置更改
  resetChanges: () => void;

  // 检查是否需要更新缓存
  needsUpdate: (behaviors: any[]) => boolean;

  // 清除错误
  clearError: () => void;
}

type BehaviorPriorityStore = BehaviorPriorityState & BehaviorPriorityActions;

// 创建Store
const useBehaviorPriorityStoreBase = create<BehaviorPriorityStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      items: [],
      loading: false,
      error: null,
      isDirty: false,
      lastUpdateTime: 0,
      cacheTimeout: 5 * 60 * 1000, // 5分钟缓存

      // 从行为列表初始化优先级
      initFromBehaviors: (behaviors: any[]) => {
        set((state) => {
          // 🔑 修复：基于_indexId去重，避免重复的行为条目
          const uniqueBehaviors = behaviors.reduce((acc: any[], behavior: any) => {
            const existing = acc.find((b) => b._indexId === behavior._indexId);
            if (!existing) {
              acc.push(behavior);
            } else {
              // 如果存在重复，优先保留新建行为或状态更新的行为
              if (behavior._status === 'new' || existing._status !== 'new') {
                const index = acc.indexOf(existing);
                acc[index] = behavior;
              }
            }
            return acc;
          }, []);

          // 去重后的行为列表（移除过度调试信息）

          // 🔑 修复：保持原有顺序，新建行为根据其原始优先级插入合适位置
          const sortedBehaviors = uniqueBehaviors.sort((a, b) => {
            // 新建行为使用其原始priority或0
            const aPriority = a.priority || 0;
            const bPriority = b.priority || 0;
            return aPriority - bPriority;
          });

          const resultItems = sortedBehaviors.map((behavior) => ({
            _indexId: behavior._indexId, // 🔑 只存储稳定的索引ID
            priority: behavior.priority, // 🔑 保持原有优先级，不重新分配
            name: behavior.name,
          }));

          state.items = resultItems;
          state.isDirty = false;
          state.error = null;
          state.lastUpdateTime = Date.now();

          // 初始化优先级完成（移除过度调试信息）
        });
      },

      // 更新排序
      updateOrder: (oldIndex: number, newIndex: number) => {
        if (oldIndex === newIndex) return;

        const beforeState = get();
        // 开始更新排序（移除过度调试信息）

        set((state) => {
          // 执行拖拽操作
          const newItems = [...state.items];
          const [movedItem] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, movedItem);

          // 拖拽操作完成（移除过度调试信息）

          // 🔑 修复：重新分配优先级，按新顺序分配
          newItems.forEach((item, index) => {
            const oldPriority = item.priority;
            item.priority = index * 100; // 按新顺序分配优先级
            // 优先级更新（移除过度调试信息）
          });

          state.items = newItems;
          state.isDirty = true;

          // 优先级重新分配完成（移除过度调试信息）
        });

        // 排序更新完成（移除过度调试信息）
      },

      // 保存优先级到后台 - 🔑 需要传入当前的behaviors列表来基于_indexId查找
      savePriorities: async (behaviors?: any[]) => {
        const state = get();
        if (!state.isDirty || !behaviors) return;

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 这里需要调用后台API批量更新优先级
          // 暂时使用GraphStore的saveGraph方法
          const workflowModule = await import('./workflow-list');
          const actions = workflowModule.useGraphActions();
          const { saveGraph } = actions;

          // 🔑 基于_indexId从behaviors列表中查找对应的行为
          const updatePromises = state.items.map(async (item) => {
            const behavior = behaviors.find((b) => b._indexId === item._indexId);
            if (behavior) {
              const updatedBehavior = {
                ...behavior,
                priority: item.priority,
              };
              await saveGraph(updatedBehavior);
            }
          });

          await Promise.all(updatePromises);

          set((state) => {
            state.isDirty = false;
          });

          // 优先级保存成功（移除过度调试信息）
        } catch (error) {
          console.error('❌ [BehaviorPriorityStore] 保存优先级失败:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : '保存优先级失败';
          });
          throw error;
        } finally {
          set((state) => {
            state.loading = false;
          });
        }
      },

      // 重置更改
      resetChanges: () => {
        // 🔑 修复：不能在store方法中调用React Hook
        // 直接重置isDirty状态，让外部重新初始化
        set((state) => {
          // 重置优先级变更（移除过度调试信息）
          state.isDirty = false;
          // 清空历史记录，强制重新初始化
          state.lastUpdateTime = 0;
        });
      },

      // 检查是否需要更新缓存
      needsUpdate: (behaviors: any[]) => {
        const state = get();
        const now = Date.now();

        // 检查缓存是否过期
        if (now - state.lastUpdateTime > state.cacheTimeout) {
          return true;
        }

        // 🔑 修复：包含新建行为在内的数量检查
        if (behaviors.length !== state.items.length) {
          return true;
        }

        // 🔑 关键修复：基于稳定的_indexId检查，而不是可变的id
        // 这样修改行为ID时不会触发重新初始化
        const currentIndexIds = new Set(behaviors.map((b: any) => b._indexId));
        const storeIndexIds = new Set(state.items.map((item) => item._indexId));

        if (
          currentIndexIds.size !== storeIndexIds.size ||
          [...currentIndexIds].some((indexId) => !storeIndexIds.has(indexId))
        ) {
          return true;
        }

        return false;
      },

      // 🔑 移除：不再需要更新行为ID，因为我们只基于_indexId操作

      // 清除错误
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    {
      name: 'behavior-priority-store',
    }
  )
);

// 导出Store hooks
export const useBehaviorPriorityStore = () => useBehaviorPriorityStoreBase();

// 导出状态 hooks
export const useBehaviorPriorityState = () =>
  useBehaviorPriorityStoreBase(
    useShallow((state) => ({
      items: state.items,
      loading: state.loading,
      error: state.error,
      isDirty: state.isDirty,
    }))
  );

// 导出操作 hooks
export const useBehaviorPriorityActions = () =>
  useBehaviorPriorityStoreBase(
    useShallow((state) => ({
      initFromBehaviors: state.initFromBehaviors,
      updateOrder: state.updateOrder,
      savePriorities: state.savePriorities,
      resetChanges: state.resetChanges,
      needsUpdate: state.needsUpdate,

      clearError: state.clearError,
    }))
  );

export type { BehaviorPriorityItem, BehaviorPriorityState, BehaviorPriorityActions };
