import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep } from 'lodash-es';

import type { BaseExpression } from '../typings/types';

// 扩展的参数类型，支持编辑状态
export interface EditableParameter {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
  scope?: 'query' | 'header' | 'path'; // 🔧 修复类型定义大小写
  _indexId: string; // 稳定的索引ID
  _status?: 'saved' | 'new' | 'dirty' | 'saving';
  [key: string]: any;
}

// 扩展的表达式项，支持编辑状态
export interface EditableExpressionItem extends BaseExpression {
  [key: string]: any;
}

// 当前表达式编辑状态
export interface CurrentExpressionState {
  // 选择状态
  selectedExpressionId: string | null;

  // 编辑状态
  originalExpression: EditableExpressionItem | null;
  editingExpression: EditableExpressionItem | null;

  // 状态标记
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

// 当前表达式编辑操作
export interface CurrentExpressionActions {
  // 选择表达式（创建编辑副本）
  selectExpression: (expression: BaseExpression | null) => void;

  // 编辑操作
  updateProperty: (path: string, value: any) => void;
  updateExpression: (updates: Partial<BaseExpression>) => void;

  // 单个参数更新（使用Immer，安全的直接修改）
  updateParameterProperty: (parameterIndexId: string, field: string, value: any) => void;
  addParameter: (parameter: any) => void;
  removeParameter: (parameterIndexId: string) => void;

  // 保存/重置
  saveChanges: () => Promise<void>;
  resetChanges: () => void;

  // 状态管理
  setError: (error: string | null) => void;
  setSaving: (saving: boolean) => void;
}

type CurrentExpressionStore = CurrentExpressionState & CurrentExpressionActions;

// 辅助函数：确保参数有_indexId（只在首次加载时生成，避免重复生成）
const ensureParametersHaveIndexId = (parameters: any[]): EditableParameter[] =>
  parameters.map((param) => {
    // 🔧 如果参数已经有_indexId，直接使用，避免重新生成导致React组件重新挂载
    if (param._indexId) {
      return {
        ...param,
        _status: param._status || 'saved',
      };
    }

    // 只有在没有_indexId时才生成新的，这种情况应该很少见
    console.warn(
      '[ensureParametersHaveIndexId] 参数缺少_indexId，生成新的:',
      param.name || param.id
    );
    return {
      ...param,
      _indexId: nanoid(),
      _status: param._status || 'saved',
    };
  });

// 创建当前表达式编辑store，使用Immer中间件
export const useCurrentExpressionStore = create<CurrentExpressionStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      selectedExpressionId: null,
      originalExpression: null,
      editingExpression: null,
      isDirty: false,
      isSaving: false,
      error: null,

      // 选择表达式（创建编辑副本）
      selectExpression: (expression) => {
        set((state) => {
          if (!expression) {
            state.selectedExpressionId = null;
            state.originalExpression = null;
            state.editingExpression = null;
            state.isDirty = false;
            state.error = null;
            return;
          }

          // 创建副本，避免修改外部对象
          const expressionCopy = cloneDeep(expression) as EditableExpressionItem;

          // 🔑 表达式应该在加载时就有_indexId，这里不应该重新生成
          if (!expressionCopy._indexId) {
            console.error('[CurrentExpression] 表达式缺少_indexId，这不应该发生！', expressionCopy);
            expressionCopy._indexId = nanoid(); // 仅作为后备方案
          }

          // 确保所有参数都有_indexId
          if (expressionCopy.inputs) {
            expressionCopy.inputs = ensureParametersHaveIndexId(expressionCopy.inputs);
          }

          state.selectedExpressionId = expressionCopy._indexId;
          state.originalExpression = cloneDeep(expressionCopy);
          state.editingExpression = cloneDeep(expressionCopy);
          state.isDirty = false;
          state.error = null;

          console.log('🔍 [CurrentExpression] 选择表达式:', {
            id: expressionCopy.id,
            _indexId: expressionCopy._indexId,
            inputsCount: expressionCopy.inputs?.length || 0,
            inputs: expressionCopy.inputs?.map((p: any) => ({
              name: p.name,
              _indexId: p._indexId,
            })),
          });
        });
      },

      // 更新属性（支持深度路径）
      updateProperty: (path, value) => {
        set((state) => {
          if (!state.editingExpression || !state.originalExpression) return;

          // 简单路径处理，支持 "id", "name", "url" 等
          if (path.includes('.')) {
            // 复杂路径暂时不支持
            console.warn('Complex path not supported yet:', path);
            return;
          }

          (state.editingExpression as any)[path] = value;

          // 检查是否有变化
          state.isDirty =
            JSON.stringify(state.editingExpression) !== JSON.stringify(state.originalExpression);
          state.error = null;
        });
      },

      // 更新整个表达式的部分字段
      updateExpression: (updates) => {
        set((state) => {
          if (!state.editingExpression || !state.originalExpression) return;

          Object.assign(state.editingExpression, updates);

          state.isDirty =
            JSON.stringify(state.editingExpression) !== JSON.stringify(state.originalExpression);
          state.error = null;
        });
      },

      // 🎯 优化：减少不必要的重新渲染，简化状态更新
      updateParameterProperty: (parameterIndexId, field, value) => {
        set((state) => {
          if (!state.editingExpression?.inputs) {
            return;
          }

          // 找到目标参数
          const targetParameter = state.editingExpression.inputs.find(
            (param: any) => param._indexId === parameterIndexId
          );

          if (targetParameter) {
            // 检查值是否真的改变了
            if ((targetParameter as any)[field] === value) {
              return; // 值没有变化，不需要更新
            }

            // 🎯 使用Immer，可以安全地直接修改
            (targetParameter as any)[field] = value;

            // 状态管理：如果不是新增状态，标记为已修改
            if (targetParameter._status !== 'new') {
              targetParameter._status = 'dirty';
            }

            // 🔧 优化：只在必要时设置isDirty，避免频繁的JSON比较
            if (!state.isDirty) {
              state.isDirty = true;
            }
            state.error = null;
          }
        });
      },

      // 添加新参数
      addParameter: (parameter) => {
        set((state) => {
          if (!state.editingExpression || !state.originalExpression) return;

          if (!state.editingExpression.inputs) {
            state.editingExpression.inputs = [];
          }

          // 确保新参数有正确的状态
          const newParameter: EditableParameter = {
            name: parameter.name || '',
            type: parameter.type || 'string',
            description: parameter.description || '',
            required: parameter.required || false,
            defaultValue: parameter.defaultValue || '',
            scope: parameter.scope || 'query', // 🔧 修复大小写，与数据一致
            _indexId: parameter._indexId || nanoid(),
            _status: 'new', // 默认为新增状态
          };

          // 🎯 修复1：新参数添加到顶部，保持新增在前的排序
          state.editingExpression.inputs.unshift(newParameter);
          state.isDirty = true;
          state.error = null;

          console.log('➕ [CurrentExpression] 添加参数:', newParameter);
        });
      },

      // 删除参数
      removeParameter: (parameterIndexId) => {
        set((state) => {
          console.log('🗑️ Store: 开始删除参数:', {
            parameterIndexId,
            hasEditingExpression: !!state.editingExpression,
            hasParameters: !!state.editingExpression?.parameters,
            parametersCount: state.editingExpression?.parameters?.length || 0,
          });

          if (!state.editingExpression || !state.originalExpression) {
            console.error('🗑️ Store: 没有正在编辑的表达式');
            return;
          }

          if (!state.editingExpression.inputs) {
            console.error('🗑️ Store: 表达式没有参数数组');
            state.editingExpression.inputs = [];
            return;
          }

          const index = state.editingExpression.inputs.findIndex(
            (param: any) => param._indexId === parameterIndexId
          );

          console.log('🗑️ Store: 查找结果:', {
            parameterIndexId,
            foundIndex: index,
            参数列表: state.editingExpression.inputs.map((param: any) => ({
              name: param.name,
              _indexId: param._indexId,
            })),
          });

          if (index !== -1) {
            const deletedParam = state.editingExpression.inputs[index];

            // 使用Immer的splice方法删除
            state.editingExpression.inputs.splice(index, 1);

            state.isDirty = true;
            state.error = null;

            console.log('🗑️ Store: 删除成功:', {
              deletedParam: {
                name: (deletedParam as any).name,
                _indexId: (deletedParam as any)._indexId,
              },
              remainingCount: state.editingExpression.inputs.length,
              isDirty: state.isDirty,
            });
          } else {
            console.warn('🗑️ Store: 未找到要删除的参数:', {
              searchingFor: parameterIndexId,
              availableIds: state.editingExpression.inputs.map((param: any) => param._indexId),
            });
          }
        });
      },

      // 重置更改
      resetChanges: () => {
        set((state) => {
          if (!state.originalExpression) return;

          state.editingExpression = cloneDeep(state.originalExpression);
          state.isDirty = false;
          state.error = null;
        });
      },

      // 保存更改（调用实际的API）
      saveChanges: async () => {
        const currentState = get();
        if (!currentState.editingExpression) return;

        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // TODO: 实现表达式保存逻辑
          console.log('💾 保存表达式:', currentState.editingExpression);

          set((state) => {
            state.originalExpression = cloneDeep(state.editingExpression);
            state.isDirty = false;
            state.isSaving = false;
          });

          console.log('✅ 表达式保存成功:', currentState.editingExpression.id);
        } catch (error) {
          console.error('❌ 表达式保存失败:', error);
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : 'Save failed';
          });
        }
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
    { name: 'current-expression-store' }
  )
);

// 便捷的选择器hooks - 使用useShallow避免无限重新渲染
export const useCurrentExpression = () =>
  useCurrentExpressionStore(
    useShallow((state) => ({
      selectedExpressionId: state.selectedExpressionId,
      originalExpression: state.originalExpression,
      editingExpression: state.editingExpression,
      isDirty: state.isDirty,
      isSaving: state.isSaving,
      error: state.error,
    }))
  );

export const useCurrentExpressionActions = () =>
  useCurrentExpressionStore(
    useShallow((state) => ({
      selectExpression: state.selectExpression,
      updateProperty: state.updateProperty,
      updateExpression: state.updateExpression,
      updateParameterProperty: state.updateParameterProperty,
      addParameter: state.addParameter,
      removeParameter: state.removeParameter,
      saveChanges: state.saveChanges,
      resetChanges: state.resetChanges,
      setError: state.setError,
      setSaving: state.setSaving,
    }))
  );
