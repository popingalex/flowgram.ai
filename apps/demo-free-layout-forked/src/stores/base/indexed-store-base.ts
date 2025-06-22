// 通用Store基类实现

import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { create } from 'zustand';

import {
  Indexed,
  IndexedStoreState,
  IndexedStoreActions,
  IndexedStoreConfig,
  IndexedStoreUtils,
} from './indexed-store';

// 🔑 通用Store基类
export function createIndexedStore<T extends Indexed>(
  config: IndexedStoreConfig<T>,
  storeName: string
) {
  type StoreType = IndexedStoreState<T> & IndexedStoreActions<T>;

  return create<StoreType>()(
    devtools(
      immer((set, get) => ({
        // 初始状态
        items: [],
        originalItems: new Map<string, T>(),
        loading: false,
        error: null,

        // 🔑 加载数据
        loadItems: async () => {
          set((state) => {
            state.loading = true;
            state.error = null;
          });

          try {
            const fetchedItems = await config.apiEndpoints.getAll();

            // 确保所有数据项都有稳定的索引ID
            const itemsWithIndex = fetchedItems.map((item) => {
              const processedItem = config.ensureIndexId(item);

              // 处理子属性（如果配置了）
              if (config.childrenConfig) {
                const { fieldName, ensureChildIndexId } = config.childrenConfig;
                const children = (processedItem as any)[fieldName] || [];
                (processedItem as any)[fieldName] = IndexedStoreUtils.ensureChildrenIndexId(
                  children,
                  ensureChildIndexId
                );
              }

              return processedItem;
            });

            // 按ID排序
            const sortedItems = itemsWithIndex.sort((a, b) => a.id.localeCompare(b.id));

            // 🔑 保存原始版本用于撤销
            const originalItems = new Map<string, T>();
            sortedItems.forEach((item) => {
              originalItems.set(item._indexId, IndexedStoreUtils.deepClone(item));
            });

            set((state) => {
              state.items = sortedItems as any;
              state.originalItems = originalItems as any;
              state.loading = false;
            });

            console.log(`✅ [${storeName}] 加载完成，共 ${sortedItems.length} 个数据项`);
          } catch (error) {
            console.error(`❌ [${storeName}] 加载失败:`, error);
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to load items';
              state.loading = false;
            });
          }
        },

        // 🔑 保存数据项
        saveItem: async (item: T) => {
          if (!config.validateItem(item)) {
            throw new Error('Invalid item data');
          }

          // 设置保存中状态
          set((state) => {
            const itemIndex = state.items.findIndex((i) => i._indexId === item._indexId);
            if (itemIndex !== -1) {
              state.items[itemIndex]._editStatus = 'saving';
            }
          });

          try {
            let savedItem: T;

            if (item._status === 'new') {
              console.log(`📝 [${storeName}] 创建新数据项:`, item.id);
              savedItem = await config.apiEndpoints.create(item);
            } else {
              // 🔑 关键：使用原始ID作为API参数，新ID在请求体中
              const originalId = IndexedStoreUtils.getOriginalId(item, get().originalItems);
              console.log(`📝 [${storeName}] 更新数据项:`, { originalId, newId: item.id });
              savedItem = await config.apiEndpoints.update(originalId, item);
            }

            // 更新为已保存状态
            set((state) => {
              const itemIndex = state.items.findIndex((i) => i._indexId === item._indexId);
              if (itemIndex !== -1) {
                state.items[itemIndex] = {
                  ...savedItem,
                  _indexId: item._indexId, // 保留稳定的索引ID
                  _status: 'saved',
                  _editStatus: undefined,
                } as any;

                // 🔑 更新原始版本映射
                state.originalItems.set(
                  item._indexId,
                  IndexedStoreUtils.deepClone(state.items[itemIndex])
                );
              }
            });

            console.log(`✅ [${storeName}] 保存成功:`, item.id);
          } catch (error) {
            console.error(`❌ [${storeName}] 保存失败:`, error);

            // 恢复原状态
            set((state) => {
              const itemIndex = state.items.findIndex((i) => i._indexId === item._indexId);
              if (itemIndex !== -1) {
                state.items[itemIndex]._editStatus = undefined;
              }
            });

            throw error;
          }
        },

        // 🔑 删除数据项
        deleteItem: async (indexId: string) => {
          const item = get().items.find((i) => i._indexId === indexId);
          if (!item) {
            console.warn(`⚠️ [${storeName}] 删除失败：找不到数据项`, indexId);
            return;
          }

          try {
            if (item._status === 'new') {
              // 新增状态的数据项，直接从本地删除
              console.log(`🗑️ [${storeName}] 删除新增数据项（仅本地）:`, item.id);
            } else {
              // 已保存的数据项需要调用API删除
              const originalId = IndexedStoreUtils.getOriginalId(item, get().originalItems);
              console.log(`🗑️ [${storeName}] 调用API删除:`, originalId);
              await config.apiEndpoints.delete(originalId);
            }

            set((state) => {
              state.items = state.items.filter((i) => i._indexId !== indexId);
              state.originalItems.delete(indexId);
            });

            console.log(`✅ [${storeName}] 删除成功:`, item.id);
          } catch (error) {
            console.error(`❌ [${storeName}] 删除失败:`, error);
            throw error;
          }
        },

        // 🔑 更新数据项字段
        updateItemField: (indexId: string, field: string, value: any) => {
          set((state) => {
            const itemIndex = state.items.findIndex((i) => i._indexId === indexId);
            if (itemIndex !== -1) {
              (state.items[itemIndex] as any)[field] = value;

              // 标记为dirty状态（除非是新增状态）
              if (state.items[itemIndex]._status !== 'new') {
                state.items[itemIndex]._status = 'dirty';
              }
            }
          });
        },

        // 🔑 重置数据项更改 - 核心撤销逻辑
        resetItemChanges: (indexId: string) => {
          const { items, originalItems } = get();
          const item = items.find((i) => i._indexId === indexId);

          if (!item) {
            console.warn(`⚠️ [${storeName}] 重置失败：找不到数据项`, indexId);
            return;
          }

          // 如果是新增状态的数据项，直接删除
          if (item._status === 'new') {
            set((state) => {
              state.items = state.items.filter((i) => i._indexId !== indexId);
            });
            console.log(`🔄 [${storeName}] 删除新增数据项:`, indexId);
            return;
          }

          // 🔑 关键：从原始版本恢复
          const originalItem = originalItems.get(indexId);
          if (!originalItem) {
            console.warn(`⚠️ [${storeName}] 重置失败：找不到原始数据项`, indexId);
            return;
          }

          // 直接从原始版本恢复
          set((state) => {
            const itemIndex = state.items.findIndex((i) => i._indexId === indexId);
            if (itemIndex !== -1) {
              state.items[itemIndex] = IndexedStoreUtils.deepClone(originalItem) as any;
            }
          });

          console.log(`🔄 [${storeName}] 从原始版本恢复:`, indexId);
        },

        // 状态管理
        setLoading: (loading: boolean) => {
          set((state) => {
            state.loading = loading;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },
      })),
      { name: `${storeName}-store` }
    )
  );
}
