// 通用数据结构抽象

import { nanoid } from 'nanoid';
import { cloneDeep } from 'lodash-es';

// 🔑 数据结构抽象：所有可索引的数据项都实现这个接口
export interface Indexed {
  id: string; // 可变的业务ID
  _indexId: string; // 稳定的索引ID (React key)
  _status?: 'saved' | 'new' | 'dirty' | 'saving';
  _editStatus?: 'editing' | 'saving';
}

// 🔑 带子属性的数据项接口
export interface IndexedWithChildren<T> extends Indexed {
  // 子属性数组，泛型T表示子属性的类型
  [childrenKey: string]: T[] | any;
}

// 🔑 通用Store状态接口
export interface IndexedStoreState<T extends Indexed> {
  items: T[]; // 主数据数组
  originalItems: Map<string, T>; // 原始版本映射 (key: _indexId)
  loading: boolean;
  error: string | null;
}

// 🔑 通用Store操作接口
export interface IndexedStoreActions<T extends Indexed> {
  // 基础操作
  loadItems: () => Promise<void>;
  saveItem: (item: T) => Promise<void>;
  deleteItem: (indexId: string) => Promise<void>;

  // 编辑操作
  updateItemField: (indexId: string, field: string, value: any) => void;
  resetItemChanges: (indexId: string) => void;

  // 状态管理
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

// 🔑 API配置接口 - 不同数据类型的差异化配置
export interface IndexedStoreConfig<T extends Indexed> {
  // API端点配置
  apiEndpoints: {
    getAll: () => Promise<T[]>;
    create: (item: T) => Promise<T>;
    update: (id: string, item: T) => Promise<T>;
    delete: (id: string) => Promise<void>;
  };

  // 数据处理配置
  ensureIndexId: (item: Partial<T>) => T;
  validateItem: (item: T) => boolean;

  // 子属性配置（如果有）
  childrenConfig?: {
    fieldName: string; // 子属性字段名 (attributes/parameters)
    ensureChildIndexId: (child: any) => any;
  };
}

// 🔑 通用工具函数
export const IndexedStoreUtils = {
  // 确保数据项有稳定的索引ID
  ensureIndexId<T extends Indexed>(item: Partial<T>): T {
    return {
      ...item,
      _indexId: item._indexId || nanoid(),
      _status: item._status || 'saved',
    } as T;
  },

  // 确保子属性有稳定的索引ID
  ensureChildrenIndexId<T>(children: T[], ensureChildIndexId: (child: T) => T): T[] {
    return children.map(ensureChildIndexId);
  },

  // 从原始版本获取稳定的业务ID
  getOriginalId<T extends Indexed>(currentItem: T, originalItems: Map<string, T>): string {
    if (currentItem._status === 'new') {
      return currentItem.id;
    }

    const originalItem = originalItems.get(currentItem._indexId);
    return originalItem?.id || currentItem.id;
  },

  // 深度克隆数据项
  deepClone<T>(item: T): T {
    return cloneDeep(item);
  },

  // 检查数据项是否真的有变化
  hasRealChanges<T extends Indexed>(currentItem: T, originalItem: T): boolean {
    // 排除内部状态字段，只比较业务数据
    const { _status, _editStatus, ...currentData } = currentItem;
    const { _status: _, _editStatus: __, ...originalData } = originalItem;

    return JSON.stringify(currentData) !== JSON.stringify(originalData);
  },
};
