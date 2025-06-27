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

// 组合Store类型
type SystemBehaviorStore = SystemBehaviorStoreState & SystemBehaviorActions;

// 模拟API - 暂时使用localStorage存储
const STORAGE_KEY = 'system-behaviors';

const getStoredBehaviors = (): SystemBehavior[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('读取存储的行为数据失败:', error);
    return [];
  }
};

const storeBehaviors = (behaviors: SystemBehavior[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(behaviors));
  } catch (error) {
    console.error('存储行为数据失败:', error);
  }
};

// 创建初始行为数据（用于演示）
const createInitialBehaviors = (): SystemBehavior[] => {
  const initialBehaviors: SystemBehavior[] = [
    {
      _indexId: nanoid(),
      _status: 'saved',
      id: 'rain_simulation',
      name: '雨天模拟',
      description: '模拟雨天环境对实体的影响',
      parameters: [
        {
          _indexId: nanoid(),
          _status: 'saved',
          name: 'weatherEntities',
          description: '受天气影响的实体',
          filter: {
            moduleFilter: {
              whitelist: ['weather'],
              blacklist: [],
            },
            propertyFilters: [],
          },
        },
      ],
      codeConfig: {
        type: CodeType.LOCAL,
        functionId: 'drain_device.simulate',
        functionName: 'drain_device.simulate',
      },
      deprecated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _indexId: nanoid(),
      _status: 'saved',
      id: 'traffic_control',
      name: '交通管制',
      description: '控制交通实体的行为',
      parameters: [
        {
          _indexId: nanoid(),
          _status: 'saved',
          name: 'vehicles',
          description: '需要管制的车辆',
          filter: {
            moduleFilter: {
              whitelist: ['vehicle', 'mobile'],
              blacklist: [],
            },
            propertyFilters: [],
          },
        },
      ],
      codeConfig: {
        type: CodeType.CUSTOM,
        code: `// 交通管制逻辑
function controlTraffic(vehicles) {
  // 实现交通管制逻辑
  vehicles.forEach(vehicle => {
    if (vehicle.speed > 60) {
      vehicle.speed = 60; // 限速
    }
  });
  return vehicles;
}`,
        language: CodeLanguage.JAVASCRIPT,
      },
      deprecated: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  // 🎯 强制使用新的初始数据，不检查localStorage
  storeBehaviors(initialBehaviors);
  return initialBehaviors;
};

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
          // 模拟API延迟
          await new Promise((resolve) => setTimeout(resolve, 300));

          const behaviors = createInitialBehaviors();

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

          // 更新存储
          storeBehaviors(get().behaviors);

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

          // 更新存储
          storeBehaviors(get().behaviors);

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

          // 更新存储
          storeBehaviors(get().behaviors);

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
        set((state) => {
          state.editingBehavior = cloneDeep(behavior);
          state.originalBehavior = cloneDeep(behavior);
          state.isDirty = false;
        });

        console.log('📝 [SystemBehaviorStore] 开始编辑行为:', behavior.id);
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
