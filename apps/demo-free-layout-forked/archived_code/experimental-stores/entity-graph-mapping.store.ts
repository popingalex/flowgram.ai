import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

// 映射关系数据结构
export interface EntityGraphMapping {
  entityBusinessId: string; // 实体业务ID（可变）
  entityIndexId: string; // 实体稳定索引ID
  graphBusinessId: string; // 行为树业务ID（可变）
  graphIndexId: string; // 行为树稳定索引ID
}

// Store状态
export interface EntityGraphMappingState {
  mappings: EntityGraphMapping[];
  isInitialized: boolean;
}

// Store操作
export interface EntityGraphMappingActions {
  // 初始化映射关系
  initializeMappings: (entities: any[], graphs: any[]) => void;

  // 根据实体indexId查找行为树
  findGraphByEntityIndexId: (
    entityIndexId: string
  ) => { graphBusinessId: string; graphIndexId: string } | null;

  // 根据实体业务ID查找行为树
  findGraphByEntityBusinessId: (
    entityBusinessId: string
  ) => { graphBusinessId: string; graphIndexId: string } | null;

  // 更新实体业务ID（保持映射关系）
  updateEntityBusinessId: (entityIndexId: string, newBusinessId: string) => void;

  // 更新行为树业务ID（保持映射关系）
  updateGraphBusinessId: (graphIndexId: string, newBusinessId: string) => void;

  // 获取所有映射关系
  getAllMappings: () => EntityGraphMapping[];

  // 清除映射关系
  clearMappings: () => void;
}

export type EntityGraphMappingStore = EntityGraphMappingState & EntityGraphMappingActions;

// 创建Store
const useEntityGraphMappingStoreBase = create<EntityGraphMappingStore>()(
  devtools(
    immer((set, get) => ({
      // 初始状态
      mappings: [],
      isInitialized: false,

      // 初始化映射关系
      initializeMappings: (entities, graphs) => {
        set((state) => {
          console.log('🔗 [EntityGraphMapping] 初始化映射关系:', {
            entitiesCount: entities.length,
            graphsCount: graphs.length,
          });

          const newMappings: EntityGraphMapping[] = [];

          // 为每个实体查找对应的行为树
          const foundEntities: string[] = [];
          const notFoundEntities: string[] = [];

          entities.forEach((entity) => {
            if (!entity._indexId) {
              console.warn('🔗 实体缺少_indexId:', entity);
              return;
            }

            // 查找对应的行为树（通过业务ID匹配）
            const graph = graphs.find(
              (g) => g.id === entity.id || g.id.toLowerCase() === entity.id.toLowerCase()
            );

            if (graph) {
              if (!graph._indexId) {
                console.warn('🔗 行为树缺少_indexId:', graph);
                return;
              }

              const mapping: EntityGraphMapping = {
                entityBusinessId: entity.id,
                entityIndexId: entity._indexId,
                graphBusinessId: graph.id,
                graphIndexId: graph._indexId,
              };

              newMappings.push(mapping);
              foundEntities.push(entity.id);
            } else {
              notFoundEntities.push(entity.id);
            }
          });

          // 统一输出结果，避免重复日志
          if (foundEntities.length > 0) {
            console.log('🔗 成功建立映射:', foundEntities.length, '项');
          }
          if (notFoundEntities.length > 0) {
            console.log('🔗 未找到对应行为树:', notFoundEntities.length, '项', notFoundEntities);
          }

          state.mappings = newMappings;
          state.isInitialized = true;

          console.log('🔗 [EntityGraphMapping] 映射初始化完成:', {
            mappingsCount: newMappings.length,
            mappings: newMappings,
          });
        });
      },

      // 根据实体indexId查找行为树
      findGraphByEntityIndexId: (entityIndexId) => {
        const state = get();
        const mapping = state.mappings.find((m) => m.entityIndexId === entityIndexId);

        if (mapping) {
          return {
            graphBusinessId: mapping.graphBusinessId,
            graphIndexId: mapping.graphIndexId,
          };
        }

        return null;
      },

      // 根据实体业务ID查找行为树
      findGraphByEntityBusinessId: (entityBusinessId) => {
        const state = get();
        const mapping = state.mappings.find(
          (m) =>
            m.entityBusinessId === entityBusinessId ||
            m.entityBusinessId.toLowerCase() === entityBusinessId.toLowerCase()
        );

        if (mapping) {
          return {
            graphBusinessId: mapping.graphBusinessId,
            graphIndexId: mapping.graphIndexId,
          };
        }

        return null;
      },

      // 更新实体业务ID（保持映射关系）
      updateEntityBusinessId: (entityIndexId, newBusinessId) => {
        set((state) => {
          const mapping = state.mappings.find((m) => m.entityIndexId === entityIndexId);
          if (mapping) {
            console.log('🔗 更新实体业务ID:', {
              indexId: entityIndexId,
              oldId: mapping.entityBusinessId,
              newId: newBusinessId,
            });
            mapping.entityBusinessId = newBusinessId;
          }
        });
      },

      // 更新行为树业务ID（保持映射关系）
      updateGraphBusinessId: (graphIndexId, newBusinessId) => {
        set((state) => {
          const mapping = state.mappings.find((m) => m.graphIndexId === graphIndexId);
          if (mapping) {
            console.log('🔗 更新行为树业务ID:', {
              indexId: graphIndexId,
              oldId: mapping.graphBusinessId,
              newId: newBusinessId,
            });
            mapping.graphBusinessId = newBusinessId;
          }
        });
      },

      // 获取所有映射关系
      getAllMappings: () => get().mappings,

      // 清除映射关系
      clearMappings: () => {
        set((state) => {
          state.mappings = [];
          state.isInitialized = false;
        });
      },
    })),
    { name: 'entity-graph-mapping-store' }
  )
);

// 导出hooks
export const useEntityGraphMappingStore = () => useEntityGraphMappingStoreBase();

export const useEntityGraphMapping = () =>
  useEntityGraphMappingStoreBase((state) => ({
    mappings: state.mappings,
    isInitialized: state.isInitialized,
  }));

// 修复：使用稳定的选择器，避免每次返回新对象
export const useEntityGraphMappingActions = () => {
  const initializeMappings = useEntityGraphMappingStoreBase((state) => state.initializeMappings);
  const findGraphByEntityIndexId = useEntityGraphMappingStoreBase(
    (state) => state.findGraphByEntityIndexId
  );
  const findGraphByEntityBusinessId = useEntityGraphMappingStoreBase(
    (state) => state.findGraphByEntityBusinessId
  );
  const updateEntityBusinessId = useEntityGraphMappingStoreBase(
    (state) => state.updateEntityBusinessId
  );
  const updateGraphBusinessId = useEntityGraphMappingStoreBase(
    (state) => state.updateGraphBusinessId
  );
  const getAllMappings = useEntityGraphMappingStoreBase((state) => state.getAllMappings);
  const clearMappings = useEntityGraphMappingStoreBase((state) => state.clearMappings);

  return {
    initializeMappings,
    findGraphByEntityIndexId,
    findGraphByEntityBusinessId,
    updateEntityBusinessId,
    updateGraphBusinessId,
    getAllMappings,
    clearMappings,
  };
};
