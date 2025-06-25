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
  BehaviorParameter,
} from '../services/types';
import { behaviorApi, expressionApi } from '../services/api-service';

// 扩展的参数类型，支持编辑状态
export interface EditableBehaviorParameter extends BehaviorParameter {
  _indexId: string; // 稳定的索引ID
  _status?: 'saved' | 'new' | 'dirty' | 'saving';
  [key: string]: any; // 添加索引签名支持动态字段访问
}

// 扩展的表达式项，支持编辑状态
export interface EditableExpressionItem extends Omit<ExpressionItem, 'parameters'> {
  parameters: EditableBehaviorParameter[];
  _isEditing?: boolean;
  _originalData?: ExpressionItem; // 保存原始数据用于撤销
  [key: string]: any; // 添加索引签名支持动态字段访问
}

// 编辑状态
export interface ExpressionEditState {
  editingExpressions: Record<string, EditableExpressionItem>; // 正在编辑的表达式缓存
  editingParameters: Record<string, EditableBehaviorParameter>; // 正在编辑的参数缓存
}

// Store状态
export interface ExpressionStoreState extends ExpressionEditState {
  behaviors: BehaviorDef[];
  expressions: ExpressionDef[];
  allItems: ExpressionItem[]; // 合并后的所有表达式项
  categories: string[];
  loading: boolean;
  error: string | null;
  lastLoaded: number | null;
  callResults: Record<string, ExpressionCallResult>; // 调用结果缓存
  localEdits: Record<string, any>; // 本地编辑状态
}

// 编辑操作
export interface ExpressionEditActions {
  // 开始编辑表达式
  startEditExpression: (expressionId: string) => void;
  // 停止编辑表达式
  stopEditExpression: (expressionId: string) => void;
  // 更新表达式字段
  updateExpressionField: (expressionId: string, field: string, value: any) => void;
  // 更新参数字段
  updateParameterField: (
    expressionId: string,
    parameterIndexId: string,
    field: string,
    value: any
  ) => void;
  // 添加参数
  addParameter: (expressionId: string) => void;
  // 删除参数
  deleteParameter: (expressionId: string, parameterIndexId: string) => void;
  // 保存表达式
  saveExpression: (expressionId: string) => Promise<void>;
  // 撤销表达式修改
  revertExpression: (expressionId: string) => void;
  // 获取编辑中的表达式
  getEditingExpression: (expressionId: string) => EditableExpressionItem | null;
  // 检查表达式是否有修改
  isExpressionDirty: (expressionId: string) => boolean;
  // 添加新表达式
  addNewExpression: (expressionData: any) => void;
  // 删除表达式
  deleteExpression: (expressionId: string) => void;
}

// Store操作
export interface ExpressionActions extends ExpressionEditActions {
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
  // 本地编辑相关方法
  updateLocalEdits: (expressionId: string, edits: any) => void;
  applyLocalEdits: (expressionId: string) => void;
  clearLocalEdits: (expressionId: string) => void;
}

export type ExpressionStore = ExpressionStoreState & ExpressionActions;

// 辅助函数：解析函数名和命名空间
const parseExpressionId = (id: string) => {
  const lastDotIndex = id.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return { namespace: '', functionId: id };
  }
  return {
    namespace: id.substring(0, lastDotIndex),
    functionId: id.substring(lastDotIndex + 1),
  };
};

// 辅助函数：将参数转换为可编辑格式
const convertParametersToEditable = (
  parameters: BehaviorParameter[]
): EditableBehaviorParameter[] =>
  parameters.map((param, index) => ({
    ...param,
    _indexId: nanoid(),
    _status: 'saved' as const,
  }));

// 辅助函数：将表达式转换为可编辑格式
const convertToEditableExpression = (item: ExpressionItem): EditableExpressionItem => ({
  ...item,
  parameters: convertParametersToEditable(item.parameters),
  _isEditing: true,
  _originalData: item,
});

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
      editingExpressions: {},
      editingParameters: {},
      localEdits: {},

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

      // 开始编辑表达式
      startEditExpression: (expressionId: string) => {
        const state = get();
        const item = state.getItemById(expressionId);
        if (item) {
          set((state) => {
            state.editingExpressions[expressionId] = convertToEditableExpression(item);
          });
        }
      },

      // 停止编辑表达式
      stopEditExpression: (expressionId: string) => {
        set((state) => {
          delete state.editingExpressions[expressionId];
        });
      },

      // 更新表达式字段
      updateExpressionField: (expressionId: string, field: string, value: any) => {
        set((state) => {
          const item = state.editingExpressions[expressionId];
          if (item) {
            (item as any)[field] = value;
          }
        });
      },

      // 更新参数字段
      updateParameterField: (
        expressionId: string,
        parameterIndexId: string,
        field: string,
        value: any
      ) => {
        set((state) => {
          const item = state.editingExpressions[expressionId];
          if (item) {
            const parameter = item.parameters.find((p) => p._indexId === parameterIndexId);
            if (parameter) {
              (parameter as any)[field] = value;
              parameter._status = 'dirty';
            }
          }
        });
      },

      // 添加参数
      addParameter: (expressionId: string) => {
        set((state) => {
          const item = state.editingExpressions[expressionId];
          if (item) {
            item.parameters.push({
              _indexId: nanoid(),
              _status: 'new',
              name: '',
              type: 'string',
              description: '',
              required: false,
            });
          }
        });
      },

      // 删除参数
      deleteParameter: (expressionId: string, parameterIndexId: string) => {
        const state = get();
        const item = state.editingExpressions[expressionId];
        if (item) {
          set((state) => {
            item.parameters = item.parameters.filter((p) => p._indexId !== parameterIndexId);
          });
        }
      },

      // 保存表达式
      saveExpression: async (expressionId: string) => {
        const state = get();
        const item = state.editingExpressions[expressionId];
        if (item) {
          try {
            // TODO: 实现实际的保存API调用
            console.log('保存表达式:', expressionId, item);
            set((state) => {
              delete state.editingExpressions[expressionId];
            });
          } catch (error) {
            console.error('[ExpressionStore] 保存表达式失败:', error);
            set((state) => {
              state.error = error instanceof Error ? error.message : '保存表达式失败';
            });
          }
        }
      },

      // 撤销表达式修改
      revertExpression: (expressionId: string) => {
        set((state) => {
          const item = state.editingExpressions[expressionId];
          if (item && item._originalData) {
            state.editingExpressions[expressionId] = convertToEditableExpression(
              item._originalData
            );
          }
        });
      },

      // 获取编辑中的表达式
      getEditingExpression: (expressionId: string) => {
        const state = get();
        return state.editingExpressions[expressionId] || null;
      },

      // 检查表达式是否有修改
      isExpressionDirty: (expressionId: string) => {
        const state = get();
        const item = state.editingExpressions[expressionId];
        return Boolean(item && item._isEditing);
      },

      // 添加新表达式
      addNewExpression: (expressionData: any) => {
        set((state) => {
          // 确保有_indexId
          const newExpression = {
            ...expressionData,
            _indexId: expressionData._indexId || nanoid(),
            type: 'expression' as const,
          };

          // 添加到expressions和allItems
          state.expressions.push(newExpression);
          state.allItems.push(newExpression);

          console.log('🔍 [ExpressionStore] 添加新表达式:', newExpression);
        });
      },

      // 删除表达式
      deleteExpression: (expressionId: string) => {
        set((state) => {
          // 从expressions中删除
          state.expressions = state.expressions.filter((exp) => exp.id !== expressionId);

          // 从allItems中删除
          state.allItems = state.allItems.filter((item) => item.id !== expressionId);

          // 清理相关的编辑状态
          delete state.editingExpressions[expressionId];
          delete state.localEdits[expressionId];

          console.log('🔍 [ExpressionStore] 删除表达式:', expressionId);
        });
      },

      // 更新本地编辑状态
      updateLocalEdits: (expressionId: string, edits: any) => {
        set((state) => {
          state.localEdits[expressionId] = {
            ...state.localEdits[expressionId],
            ...edits,
          };
        });
      },

      // 应用本地编辑到全局状态
      applyLocalEdits: (expressionId: string) => {
        const state = get();
        const localEdit = state.localEdits[expressionId];
        if (localEdit) {
          set((state) => {
            // 找到对应的表达式并更新
            const expressionIndex = state.expressions.findIndex((exp) => exp.id === expressionId);
            if (expressionIndex !== -1) {
              state.expressions[expressionIndex] = {
                ...state.expressions[expressionIndex],
                ...localEdit,
              };
            }

            // 同时更新allItems
            const allItemIndex = state.allItems.findIndex((item) => item.id === expressionId);
            if (allItemIndex !== -1) {
              state.allItems[allItemIndex] = {
                ...state.allItems[allItemIndex],
                ...localEdit,
              };
            }

            // 清除本地编辑状态
            delete state.localEdits[expressionId];
          });
        }
      },

      // 清除本地编辑状态
      clearLocalEdits: (expressionId: string) => {
        set((state) => {
          delete state.localEdits[expressionId];
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
      startEditExpression: state.startEditExpression,
      stopEditExpression: state.stopEditExpression,
      updateExpressionField: state.updateExpressionField,
      updateParameterField: state.updateParameterField,
      addParameter: state.addParameter,
      deleteParameter: state.deleteParameter,
      saveExpression: state.saveExpression,
      revertExpression: state.revertExpression,
      getEditingExpression: state.getEditingExpression,
      isExpressionDirty: state.isExpressionDirty,
      updateLocalEdits: state.updateLocalEdits,
      applyLocalEdits: state.applyLocalEdits,
      clearLocalEdits: state.clearLocalEdits,
      addNewExpression: state.addNewExpression,
      deleteExpression: state.deleteExpression,
    }))
  );

// 导出单独的状态选择器
export const useExpressionLoading = () => useExpressionStoreBase((state) => state.loading);

export const useExpressionError = () => useExpressionStoreBase((state) => state.error);

export const useExpressionCategories = () => useExpressionStoreBase((state) => state.categories);

export const useExpressionCallResults = () => useExpressionStoreBase((state) => state.callResults);
