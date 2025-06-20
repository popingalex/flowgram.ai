import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';

import type {
  BehaviorDef,
  ExpressionDef,
  ExpressionItem,
  ExpressionCallResult,
} from '../services/types';
import { behaviorApi, expressionApi } from '../services/api-service';

// Store状态
export interface ExpressionStoreState {
  behaviors: BehaviorDef[];
  expressions: ExpressionDef[];
  allItems: ExpressionItem[]; // 合并后的所有表达式项
  categories: string[];
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
  callResults: Record<string, ExpressionCallResult>; // 调用结果缓存
}

// Store操作
export interface ExpressionActions {
  loadAll: () => Promise<void>;
  loadBehaviors: () => Promise<void>;
  loadExpressions: () => Promise<void>;
  getItemById: (id: string) => ExpressionItem | null;
  getItemsByCategory: (category: string) => ExpressionItem[];
  getItemsByType: (type: 'behavior' | 'expression') => ExpressionItem[];
  searchItems: (query: string) => ExpressionItem[];
  getCategories: () => string[];
  refreshAll: () => Promise<void>;
  clearError: () => void;
  callExpression: (id: string, parameters: Record<string, any>) => Promise<ExpressionCallResult>;
  getCallResult: (id: string) => ExpressionCallResult | null;
  clearCallResults: () => void;
}

export type ExpressionStore = ExpressionStoreState & ExpressionActions;

// 创建Store
const useExpressionStoreBase = create<ExpressionStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      behaviors: [],
      expressions: [],
      allItems: [],
      categories: [],
      loading: false,
      error: null,
      lastLoaded: null,
      callResults: {},

      // 加载所有表达式数据
      loadAll: async () => {
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
          // 并行加载行为函数和远程服务
          const [behaviors, expressions] = await Promise.all([
            behaviorApi.getAll(),
            expressionApi.getAll(),
          ]);

          console.log('🔍 [ExpressionStore] API返回的数据:', {
            behaviorsCount: behaviors.length,
            expressionsCount: expressions.length,
            firstBehavior: behaviors[0],
            firstExpression: expressions[0],
          });

          // 为数据添加稳定的索引ID和类型标记
          const behaviorsWithType: ExpressionItem[] = behaviors.map((behavior) => ({
            ...behavior,
            type: 'behavior' as const,
            _indexId: behavior._indexId || nanoid(),
          }));

          const expressionsWithType: ExpressionItem[] = expressions.map((expression) => ({
            ...expression,
            type: 'expression' as const,
            _indexId: expression._indexId || nanoid(),
          }));

          // 合并所有项目
          const allItems = [...behaviorsWithType, ...expressionsWithType];

          // 提取分类
          const categories = Array.from(
            new Set(allItems.map((item) => item.category).filter((c): c is string => Boolean(c)))
          ).sort();

          console.log('🔍 [ExpressionStore] 处理后的数据:', {
            allItemsCount: allItems.length,
            categories,
            behaviorCategories: behaviorsWithType.map((b) => b.category).filter(Boolean),
            expressionCategories: expressionsWithType.map((e) => e.category).filter(Boolean),
          });

          set((state) => {
            state.behaviors = behaviors;
            state.expressions = expressions;
            state.allItems = allItems;
            state.categories = categories;
            state.loading = false;
            state.lastLoaded = Date.now();
          });

          console.log('🔍 [ExpressionStore] 数据已保存到store');
        } catch (error) {
          console.error('[ExpressionStore] 加载失败:', error);
          set((state) => {
            state.loading = false;
            state.error = error instanceof Error ? error.message : '加载表达式数据失败';
          });
        }
      },

      // 单独加载行为函数
      loadBehaviors: async () => {
        try {
          const behaviors = await behaviorApi.getAll();
          set((state) => {
            state.behaviors = behaviors;
            // 重新合并allItems
            const behaviorsWithType: ExpressionItem[] = behaviors.map((behavior) => ({
              ...behavior,
              type: 'behavior' as const,
              _indexId: behavior._indexId || nanoid(),
            }));
            const expressionsWithType: ExpressionItem[] = state.expressions.map((expression) => ({
              ...expression,
              type: 'expression' as const,
              _indexId: expression._indexId || nanoid(),
            }));
            state.allItems = [...behaviorsWithType, ...expressionsWithType];
          });
        } catch (error) {
          console.error('[ExpressionStore] 加载行为函数失败:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : '加载行为函数失败';
          });
        }
      },

      // 单独加载远程服务
      loadExpressions: async () => {
        try {
          const expressions = await expressionApi.getAll();
          set((state) => {
            state.expressions = expressions;
            // 重新合并allItems
            const behaviorsWithType: ExpressionItem[] = state.behaviors.map((behavior) => ({
              ...behavior,
              type: 'behavior' as const,
              _indexId: behavior._indexId || nanoid(),
            }));
            const expressionsWithType: ExpressionItem[] = expressions.map((expression) => ({
              ...expression,
              type: 'expression' as const,
              _indexId: expression._indexId || nanoid(),
            }));
            state.allItems = [...behaviorsWithType, ...expressionsWithType];
          });
        } catch (error) {
          console.error('[ExpressionStore] 加载远程服务失败:', error);
          set((state) => {
            state.error = error instanceof Error ? error.message : '加载远程服务失败';
          });
        }
      },

      // 根据ID获取表达式项
      getItemById: (id: string) => {
        const state = get();
        return state.allItems.find((item) => item.id === id) || null;
      },

      // 根据分类获取表达式项
      getItemsByCategory: (category: string) => {
        const state = get();
        return state.allItems.filter((item) => item.category === category);
      },

      // 根据类型获取表达式项
      getItemsByType: (type: 'behavior' | 'expression') => {
        const state = get();
        return state.allItems.filter((item) => item.type === type);
      },

      // 搜索表达式项
      searchItems: (query: string) => {
        const state = get();
        if (!query.trim()) return state.allItems;

        const searchTerm = query.toLowerCase();
        return state.allItems.filter(
          (item) =>
            (item.name || '').toLowerCase().includes(searchTerm) ||
            (item.description || '').toLowerCase().includes(searchTerm) ||
            (item.category || '').toLowerCase().includes(searchTerm) ||
            (item.tags || []).some((tag) => tag.toLowerCase().includes(searchTerm)) ||
            (item.type === 'expression' &&
              ((item as ExpressionDef).url || '').toLowerCase().includes(searchTerm)) ||
            (item.type === 'expression' &&
              ((item as ExpressionDef).method || '').toLowerCase().includes(searchTerm))
        );
      },

      // 获取所有分类
      getCategories: () => {
        const state = get();
        return state.categories;
      },

      // 强制刷新
      refreshAll: async () => {
        set((state) => {
          state.lastLoaded = null; // 清除缓存时间戳
        });
        await get().loadAll();
      },

      // 清除错误
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // 调用远程服务
      callExpression: async (id: string, parameters: Record<string, any>) => {
        const item = get().getItemById(id);

        if (!item) {
          const errorResult: ExpressionCallResult = {
            success: false,
            error: `表达式 ${id} 不存在`,
            duration: 0,
            timestamp: Date.now(),
          };

          set((state) => {
            state.callResults[id] = errorResult;
          });

          return errorResult;
        }

        if (item.type !== 'expression') {
          const errorResult: ExpressionCallResult = {
            success: false,
            error: `${id} 不是远程服务，无法调用`,
            duration: 0,
            timestamp: Date.now(),
          };

          set((state) => {
            state.callResults[id] = errorResult;
          });

          return errorResult;
        }

        try {
          const result = await expressionApi.call(id, parameters);

          set((state) => {
            state.callResults[id] = result;
          });

          return result;
        } catch (error) {
          const errorResult: ExpressionCallResult = {
            success: false,
            error: error instanceof Error ? error.message : '调用失败',
            duration: 0,
            timestamp: Date.now(),
          };

          set((state) => {
            state.callResults[id] = errorResult;
          });

          return errorResult;
        }
      },

      // 获取调用结果
      getCallResult: (id: string) => {
        const state = get();
        return state.callResults[id] || null;
      },

      // 清除调用结果
      clearCallResults: () => {
        set((state) => {
          state.callResults = {};
        });
      },
    })),
    {
      name: 'expression-store',
    }
  )
);

// 导出Store hooks
export const useExpressionStore = () => useExpressionStoreBase();

// 导出状态 hooks
export const useExpressionList = () =>
  useExpressionStoreBase(
    useShallow((state) => ({
      behaviors: state.behaviors,
      expressions: state.expressions,
      allItems: state.allItems,
      categories: state.categories,
      loading: state.loading,
      error: state.error,
      lastLoaded: state.lastLoaded,
      callResults: state.callResults,
    }))
  );

// 导出操作 hooks
export const useExpressionActions = () =>
  useExpressionStoreBase(
    useShallow((state) => ({
      loadAll: state.loadAll,
      loadBehaviors: state.loadBehaviors,
      loadExpressions: state.loadExpressions,
      getItemById: state.getItemById,
      getItemsByCategory: state.getItemsByCategory,
      getItemsByType: state.getItemsByType,
      searchItems: state.searchItems,
      getCategories: state.getCategories,
      refreshAll: state.refreshAll,
      clearError: state.clearError,
      callExpression: state.callExpression,
      getCallResult: state.getCallResult,
      clearCallResults: state.clearCallResults,
    }))
  );

// 导出单独的状态选择器
export const useExpressionLoading = () => useExpressionStoreBase((state) => state.loading);

export const useExpressionError = () => useExpressionStoreBase((state) => state.error);

export const useExpressionCategories = () => useExpressionStoreBase((state) => state.categories);

export const useExpressionCallResults = () => useExpressionStoreBase((state) => state.callResults);
