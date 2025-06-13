import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

import type { BehaviorDef } from '../services/types';
import { behaviorApi } from '../services/api-service';

// Store状态
export interface BehaviorStoreState {
  behaviors: BehaviorDef[];
  categories: string[];
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
}

// Store操作
export interface BehaviorActions {
  loadBehaviors: () => Promise<void>;
  getBehaviorById: (id: string) => BehaviorDef | null;
  getBehaviorsByCategory: (category: string) => BehaviorDef[];
  searchBehaviors: (query: string) => BehaviorDef[];
  getCategories: () => string[];
  refreshBehaviors: () => Promise<void>;
  clearError: () => void;
}

export type BehaviorStore = BehaviorStoreState & BehaviorActions;

// 创建Store
const useBehaviorStoreBase = create<BehaviorStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      behaviors: [],
      categories: [],
      loading: false,
      error: null,
      lastLoaded: null,

      // 加载所有函数行为
      loadBehaviors: async () => {
        const state = get();

        // 避免重复加载 - 5分钟内不重复请求
        if (state.lastLoaded && Date.now() - state.lastLoaded < 5 * 60 * 1000) {
          // 使用缓存数据，跳过API请求
          return;
        }

        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          console.log('[BehaviorStore] 开始加载函数行为列表...');
          const behaviors = await behaviorApi.getAll();

          console.log(`[BehaviorStore] 加载完成，共 ${behaviors.length} 个函数行为`);

          // 为每个behavior添加稳定的索引ID (如果没有)
          const behaviorsWithIndex = behaviors.map((behavior) => ({
            ...behavior,
            _indexId: behavior._indexId || nanoid(), // 如果后台没有提供_indexId，生成一个
          }));

          // 提取分类
          const categories = Array.from(
            new Set(
              behaviorsWithIndex.map((b) => b.category).filter((c): c is string => Boolean(c))
            )
          ).sort();

          set((state) => {
            state.behaviors = behaviorsWithIndex;
            state.categories = categories;
            state.loading = false;
            state.lastLoaded = Date.now();
          });

          console.log(`[BehaviorStore] 数据处理完成，分类数: ${categories.length}`);
        } catch (error) {
          console.error('[BehaviorStore] 加载失败:', error);
          set((state) => {
            state.loading = false;
            state.error = error instanceof Error ? error.message : '加载函数行为失败';
          });
        }
      },

      // 根据ID获取函数行为
      getBehaviorById: (id: string) => {
        const state = get();
        return state.behaviors.find((behavior) => behavior.id === id) || null;
      },

      // 根据分类获取函数行为
      getBehaviorsByCategory: (category: string) => {
        const state = get();
        return state.behaviors.filter((behavior) => behavior.category === category);
      },

      // 搜索函数行为
      searchBehaviors: (query: string) => {
        const state = get();
        if (!query.trim()) return state.behaviors;

        const searchTerm = query.toLowerCase();
        return state.behaviors.filter(
          (behavior) =>
            behavior.name.toLowerCase().includes(searchTerm) ||
            behavior.description.toLowerCase().includes(searchTerm) ||
            behavior.category?.toLowerCase().includes(searchTerm) ||
            behavior.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
      },

      // 获取所有分类
      getCategories: () => {
        const state = get();
        return state.categories;
      },

      // 强制刷新
      refreshBehaviors: async () => {
        set((state) => {
          state.lastLoaded = null; // 清除缓存时间戳
        });
        await get().loadBehaviors();
      },

      // 清除错误
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    })),
    {
      name: 'behavior-store',
    }
  )
);

// 导出Store hooks
export const useBehaviorStore = () => useBehaviorStoreBase();

// 导出状态 hooks
export const useBehaviorList = () =>
  useBehaviorStoreBase(
    useShallow((state) => ({
      behaviors: state.behaviors,
      categories: state.categories,
      loading: state.loading,
      error: state.error,
      lastLoaded: state.lastLoaded,
    }))
  );

// 导出操作 hooks
export const useBehaviorActions = () =>
  useBehaviorStoreBase(
    useShallow((state) => ({
      loadBehaviors: state.loadBehaviors,
      getBehaviorById: state.getBehaviorById,
      getBehaviorsByCategory: state.getBehaviorsByCategory,
      searchBehaviors: state.searchBehaviors,
      getCategories: state.getCategories,
      refreshBehaviors: state.refreshBehaviors,
      clearError: state.clearError,
    }))
  );

// 导出单独的状态选择器
export const useBehaviorLoading = () => useBehaviorStoreBase((state) => state.loading);

export const useBehaviorError = () => useBehaviorStoreBase((state) => state.error);

export const useBehaviorCategories = () => useBehaviorStoreBase((state) => state.categories);
