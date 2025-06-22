import { nanoid } from 'nanoid';

import { Indexed, EditableIndexed, HasAttributes, EditStatus, IndexPath } from '../typings/types';

// 基础索引Store状态
export interface BaseIndexedStoreState<T extends EditableIndexed> {
  items: T[];
  loading: boolean;
  error: string | null;
}

// 基础索引Store动作
export interface BaseIndexedStoreActions<T extends EditableIndexed> {
  // 基础CRUD
  loadItems: () => Promise<void>;
  addItem: (item: Omit<T, '_indexId' | '_status'>) => void;
  updateItem: (indexId: string, updates: Partial<T>) => void;
  deleteItem: (indexId: string) => void;

  // 字段更新
  updateField: (indexPath: IndexPath, field: keyof T, value: any) => void;

  // 状态管理
  setItemStatus: (indexId: string, status: EditStatus) => void;
  resetItem: (indexId: string) => void;
  saveItem: (indexId: string) => Promise<void>;

  // 查询
  getItem: (indexId: string) => T | undefined;
  getItemByPath: (indexPath: IndexPath) => any;
  isItemDirty: (indexId: string) => boolean;
  canSaveItem: (indexId: string) => boolean;

  // 子数据操作（如attributes）
  addSubItem?: (parentIndexId: string, subItem: any) => void;
  updateSubItem?: (parentIndexId: string, subIndexId: string, updates: any) => void;
  deleteSubItem?: (parentIndexId: string, subIndexId: string) => void;

  // 关联操作（如模块关联）
  linkItems?: (sourceIndexId: string, targetIndexIds: string[]) => void;
  unlinkItem?: (sourceIndexId: string, targetIndexId: string) => void;
}

// 工具函数：为数据添加索引
export function addIndexToItem<T extends Omit<EditableIndexed, '_indexId'>>(
  item: T
): T & EditableIndexed {
  return {
    ...item,
    _indexId: nanoid(),
    _status: 'saved' as EditStatus,
  };
}

// 工具函数：为数组数据添加索引
export function addIndexToItems<T extends Omit<EditableIndexed, '_indexId'>>(
  items: T[]
): (T & EditableIndexed)[] {
  return items.map(addIndexToItem);
}

// 工具函数：为具有属性的对象添加索引
export function addIndexToItemWithAttributes<
  T extends Omit<HasAttributes, '_indexId' | 'attributes'> & {
    attributes: Omit<EditableIndexed, '_indexId'>[];
  }
>(item: T): T & HasAttributes {
  return {
    ...item,
    _indexId: nanoid(),
    _status: 'saved' as EditStatus,
    attributes: addIndexToItems(item.attributes),
  };
}

// 工具函数：深度查找对象
export function findByPath<T extends EditableIndexed>(items: T[], indexPath: IndexPath): any {
  if (indexPath.length === 0) return null;

  let current: any = items.find((item) => item._indexId === indexPath[0]);
  if (!current) return null;

  for (let i = 1; i < indexPath.length; i++) {
    if (!current.attributes) return null;
    current = current.attributes.find((attr: any) => attr._indexId === indexPath[i]);
    if (!current) return null;
  }

  return current;
}

// 工具函数：更新嵌套对象字段
export function updateNestedField<T extends EditableIndexed>(
  items: T[],
  indexPath: IndexPath,
  field: string,
  value: any
): T[] {
  if (indexPath.length === 0) return items;

  return items.map((item) => {
    if (item._indexId !== indexPath[0]) return item;

    if (indexPath.length === 1) {
      // 更新顶级对象
      return {
        ...item,
        [field]: value,
        _status: item._status === 'new' ? 'new' : 'modified',
      } as T;
    } else {
      // 更新嵌套对象
      const updatedAttributes = updateNestedFieldInArray(
        (item as any).attributes || [],
        indexPath.slice(1),
        field,
        value
      );

      return {
        ...item,
        attributes: updatedAttributes,
        _status: item._status === 'new' ? 'new' : 'modified',
      } as T;
    }
  });
}

// 工具函数：更新数组中的嵌套字段
function updateNestedFieldInArray(
  array: any[],
  indexPath: IndexPath,
  field: string,
  value: any
): any[] {
  if (indexPath.length === 0) return array;

  return array.map((item) => {
    if (item._indexId !== indexPath[0]) return item;

    if (indexPath.length === 1) {
      return {
        ...item,
        [field]: value,
        _status: item._status === 'new' ? 'new' : 'modified',
      };
    } else {
      const updatedAttributes = updateNestedFieldInArray(
        item.attributes || [],
        indexPath.slice(1),
        field,
        value
      );

      return {
        ...item,
        attributes: updatedAttributes,
        _status: item._status === 'new' ? 'new' : 'modified',
      };
    }
  });
}

// 工具函数：检查对象是否脏数据
export function isItemDirty<T extends EditableIndexed>(item: T): boolean {
  if (item._status === 'modified' || item._status === 'new') return true;

  // 检查属性是否有脏数据
  if ('attributes' in item && Array.isArray((item as any).attributes)) {
    return (item as any).attributes.some((attr: EditableIndexed) => isItemDirty(attr));
  }

  return false;
}

// 工具函数：检查对象是否可保存
export function canSaveItem<T extends EditableIndexed>(item: T): boolean {
  // 基础检查：必须有id和name
  if (!(item as any).id || !(item as any).name) return false;

  // 检查属性是否都有效
  if ('attributes' in item && Array.isArray((item as any).attributes)) {
    const attributes = (item as any).attributes;
    for (const attr of attributes) {
      if (!attr.id || !attr.name) return false;
    }
  }

  return true;
}
