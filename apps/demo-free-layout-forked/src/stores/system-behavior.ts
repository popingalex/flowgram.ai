import { useShallow } from 'zustand/react/shallow';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { cloneDeep } from 'lodash-es';

import {
  SystemBehavior,
  BehaviorParameter,
  CodeConfig,
  CodeType,
  CodeLanguage,
  SystemBehaviorStoreState,
  SystemBehaviorActions,
} from '../typings/behavior';
import { expressionManagementApi } from '../services/api-service';

// 组合Store类型
type SystemBehaviorStore = SystemBehaviorStoreState & SystemBehaviorActions;

// 创建Store
const useSystemBehaviorStoreBase = create<SystemBehaviorStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      behaviors: [],
      loading: false,
      error: null,
      editingBehavior: null,
      originalBehavior: null,
      isDirty: false,
      isSaving: false,

      // 加载行为数据
      loadBehaviors: async () => {
        set((state) => {
          state.loading = true;
          state.error = null;
        });

        try {
          // 🔧 使用behaviorApi.getAll()获取数据，与其他Store保持一致
          const behaviorData = await expressionManagementApi.getAllBehaviors();

          console.log('🔍 [SystemBehaviorStore] API返回的原始数据:', {
            isArray: Array.isArray(behaviorData),
            length: behaviorData?.length,
            firstItem: behaviorData?.[0],
          });

          const behaviors: SystemBehavior[] = behaviorData.map((behavior: any) => {
            console.log('🔍 [SystemBehaviorStore] 转换行为数据:', {
              原始数据: behavior,
              id: behavior.id,
              name: behavior.name,
              exp: behavior.exp,
              所有字段: Object.keys(behavior),
            });

            const converted = {
              _indexId: behavior._indexId || nanoid(),
              _status: 'saved' as const,
              id: behavior.id,
              name: behavior.name,
              description: behavior.desc || '',
              exp: behavior.exp || '', // 🎯 保留Expression的exp字段
              parameters: [], // 行为参数需要单独配置
              codeConfig: {
                type: CodeType.LOCAL, // 默认为本地函数
                functionId: behavior.id,
                functionName: behavior.name,
              },
              deprecated: behavior.deprecated || false,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            console.log('🔍 [SystemBehaviorStore] 转换结果:', {
              id: converted.id,
              name: converted.name,
              description: converted.description,
              exp: converted.exp,
            });

            return converted;
          });

          set((state) => {
            state.behaviors = behaviors;
            state.loading = false;
          });

          console.log('✅ [SystemBehaviorStore] 行为数据加载成功:', behaviors.length);
        } catch (error) {
          console.error('❌ [SystemBehaviorStore] 加载行为数据失败:', error);
          set((state) => {
            state.loading = false;
            state.error = error instanceof Error ? error.message : '加载失败';
          });
        }
      },

      // 创建行为
      createBehavior: async (behaviorData) => {
        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          const newBehavior: SystemBehavior = {
            ...behaviorData,
            _indexId: nanoid(),
            _status: 'saved',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          // 模拟API延迟
          await new Promise((resolve) => setTimeout(resolve, 500));

          set((state) => {
            state.behaviors.push(newBehavior);
            state.isSaving = false;
          });

          // 🔧 不再使用localStorage存储，数据通过API管理

          console.log('✅ [SystemBehaviorStore] 行为创建成功:', newBehavior.id);
        } catch (error) {
          console.error('❌ [SystemBehaviorStore] 创建行为失败:', error);
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : '创建失败';
          });
        }
      },

      // 更新行为
      updateBehavior: async (id, updates) => {
        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // 模拟API延迟
          await new Promise((resolve) => setTimeout(resolve, 500));

          set((state) => {
            const index = state.behaviors.findIndex((b) => b.id === id);
            if (index !== -1) {
              state.behaviors[index] = {
                ...state.behaviors[index],
                ...updates,
                updatedAt: new Date().toISOString(),
              };
            }
            state.isSaving = false;
          });

          // 🔧 不再使用localStorage存储，数据通过API管理

          console.log('✅ [SystemBehaviorStore] 行为更新成功:', id);
        } catch (error) {
          console.error('❌ [SystemBehaviorStore] 更新行为失败:', error);
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : '更新失败';
          });
        }
      },

      // 删除行为
      deleteBehavior: async (id) => {
        set((state) => {
          state.isSaving = true;
          state.error = null;
        });

        try {
          // 模拟API延迟
          await new Promise((resolve) => setTimeout(resolve, 300));

          set((state) => {
            state.behaviors = state.behaviors.filter((b) => b.id !== id);
            state.isSaving = false;
          });

          // 🔧 不再使用localStorage存储，数据通过API管理

          console.log('✅ [SystemBehaviorStore] 行为删除成功:', id);
        } catch (error) {
          console.error('❌ [SystemBehaviorStore] 删除行为失败:', error);
          set((state) => {
            state.isSaving = false;
            state.error = error instanceof Error ? error.message : '删除失败';
          });
        }
      },

      // 根据ID获取行为
      getBehaviorById: (id) => {
        const state = get();
        return state.behaviors.find((b) => b.id === id) || null;
      },

      // 开始编辑
      startEdit: (behavior) => {
        console.log('📝 [SystemBehaviorStore] 开始编辑行为 - 输入数据:', {
          id: behavior.id,
          name: behavior.name,
          description: behavior.description,
          完整对象: behavior,
        });

        set((state) => {
          state.editingBehavior = cloneDeep(behavior);
          state.originalBehavior = cloneDeep(behavior);
          state.isDirty = false;
        });

        const editingBehavior = get().editingBehavior;
        console.log('📝 [SystemBehaviorStore] 编辑状态设置完成:', {
          id: editingBehavior?.id,
          name: editingBehavior?.name,
          description: editingBehavior?.description,
        });
      },

      // 停止编辑
      stopEdit: () => {
        set((state) => {
          state.editingBehavior = null;
          state.originalBehavior = null;
          state.isDirty = false;
        });

        console.log('🔄 [SystemBehaviorStore] 停止编辑');
      },

      // 更新编辑中的行为
      updateEditingBehavior: (updates) => {
        set((state) => {
          if (state.editingBehavior) {
            state.editingBehavior = {
              ...state.editingBehavior,
              ...updates,
            };
            state.isDirty = true;
            console.log('🔄 [SystemBehaviorStore] 状态已更新 isDirty:', state.isDirty);
          }
        });
      },

      // 保存编辑变更
      saveChanges: async () => {
        const state = get();
        if (!state.editingBehavior) return;

        try {
          if (state.editingBehavior._status === 'new') {
            // 新建行为
            await get().createBehavior(state.editingBehavior);
          } else {
            // 更新现有行为
            await get().updateBehavior(state.editingBehavior.id, state.editingBehavior);
          }

          // 保存成功后停止编辑
          get().stopEdit();
        } catch (error) {
          console.error('❌ [SystemBehaviorStore] 保存变更失败:', error);
          throw error;
        }
      },

      // 重置编辑变更
      resetChanges: () => {
        set((state) => {
          if (state.originalBehavior) {
            state.editingBehavior = cloneDeep(state.originalBehavior);
            state.isDirty = false;
          }
        });

        console.log('🔄 [SystemBehaviorStore] 重置编辑变更');
      },

      // 添加参数
      addParameter: (parameterData) => {
        set((state) => {
          if (state.editingBehavior) {
            const newParameter: BehaviorParameter = {
              ...parameterData,
              _indexId: nanoid(),
              _status: 'new',
            };
            state.editingBehavior.parameters.push(newParameter);
            state.isDirty = true;
          }
        });
      },

      // 更新参数
      updateParameter: (parameterId, updates) => {
        set((state) => {
          if (state.editingBehavior) {
            const index = state.editingBehavior.parameters.findIndex(
              (p) => p._indexId === parameterId
            );
            if (index !== -1) {
              state.editingBehavior.parameters[index] = {
                ...state.editingBehavior.parameters[index],
                ...updates,
              };
              state.isDirty = true;
            }
          }
        });
      },

      // 删除参数
      deleteParameter: (parameterId) => {
        set((state) => {
          if (state.editingBehavior) {
            state.editingBehavior.parameters = state.editingBehavior.parameters.filter(
              (p) => p._indexId !== parameterId
            );
            state.isDirty = true;
          }
        });
      },

      // 更新代码配置
      updateCodeConfig: (codeConfig) => {
        set((state) => {
          if (state.editingBehavior) {
            state.editingBehavior.codeConfig = codeConfig;
            state.isDirty = true;
          }
        });
      },

      // 清除错误
      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      // 刷新行为数据
      refreshBehaviors: async () => {
        await get().loadBehaviors();
      },
    })),
    {
      name: 'system-behavior-store',
    }
  )
);

// 导出Store hooks
export const useSystemBehaviorStore = () => useSystemBehaviorStoreBase();

// 导出状态 hooks
export const useSystemBehaviorList = () =>
  useSystemBehaviorStoreBase(
    useShallow((state) => ({
      behaviors: state.behaviors,
      loading: state.loading,
      error: state.error,
    }))
  );

// 导出编辑状态 hooks
export const useSystemBehaviorEdit = () =>
  useSystemBehaviorStoreBase(
    useShallow((state) => ({
      editingBehavior: state.editingBehavior,
      originalBehavior: state.originalBehavior,
      isDirty: state.isDirty,
      isSaving: state.isSaving,
    }))
  );

// 导出操作 hooks
export const useSystemBehaviorActions = () =>
  useSystemBehaviorStoreBase(
    useShallow((state) => ({
      loadBehaviors: state.loadBehaviors,
      createBehavior: state.createBehavior,
      updateBehavior: state.updateBehavior,
      deleteBehavior: state.deleteBehavior,
      getBehaviorById: state.getBehaviorById,
      startEdit: state.startEdit,
      stopEdit: state.stopEdit,
      updateEditingBehavior: state.updateEditingBehavior,
      saveChanges: state.saveChanges,
      resetChanges: state.resetChanges,
      addParameter: state.addParameter,
      updateParameter: state.updateParameter,
      deleteParameter: state.deleteParameter,
      updateCodeConfig: state.updateCodeConfig,
      clearError: state.clearError,
      refreshBehaviors: state.refreshBehaviors,
    }))
  );
