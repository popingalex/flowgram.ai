import { nanoid } from 'nanoid';

import type {
  Indexed,
  EditableIndexed,
  EditStatus,
  IndexPath,
  FieldUpdater,
} from '../typings/types';

// 🎯 通用Store操作接口
export interface UniversalStoreOperations<T extends EditableIndexed> {
  // 基础查询
  getAll(): T[];
  getById(indexId: string): T | undefined;
  getByPath(path: IndexPath): any;

  // 增删改查
  create(data: Partial<T>): T;
  update(indexId: string, updates: Partial<T>): void;
  delete(indexId: string): void;

  // 字段更新
  updateField: FieldUpdater;

  // 状态管理
  setEditStatus(indexId: string, status: EditStatus): void;
  resetChanges(indexId: string): Promise<void>;
  saveChanges(indexId: string): Promise<void>;

  // 批量操作
  batchUpdate(updates: { indexId: string; data: Partial<T> }[]): void;
  batchDelete(indexIds: string[]): void;
}

// 🎯 基础Store实现类
export abstract class UniversalStoreBase<T extends EditableIndexed> {
  protected data: T[] = [];

  protected originalData: Map<string, T> = new Map(); // 用于撤销

  constructor() {
    this.updateField = this.updateField.bind(this);
  }

  // 🔍 查询方法
  getAll(): T[] {
    return this.data;
  }

  getById(indexId: string): T | undefined {
    return this.data.find((item) => item._indexId === indexId);
  }

  getByPath(path: IndexPath): any {
    let current: any = { children: this.data };

    for (const segment of path) {
      if (current.children) {
        current = current.children.find((item: any) => item._indexId === segment);
      } else if (current[segment]) {
        current = current[segment];
      } else {
        return undefined;
      }
    }

    return current;
  }

  // ✏️ 统一的字段更新方法
  updateField: FieldUpdater = (indexPath: IndexPath, field: string, value: any) => {
    console.log(`🔄 更新字段: ${indexPath.join('.')} -> ${field} = ${value}`);

    if (indexPath.length === 1) {
      // 顶级对象字段更新
      const item = this.getById(indexPath[0]);
      if (item) {
        this.markAsModified(item);
        (item as any)[field] = value;
        this.notifyChange();
      }
    } else {
      // 嵌套对象字段更新
      this.updateNestedField(indexPath, field, value);
    }
  };

  // 🎯 创建新项
  create(data: Partial<T>): T {
    const newItem = {
      ...data,
      _indexId: nanoid(),
      _status: 'new' as EditStatus,
      _editStatus: 'idle' as const,
    } as T;

    this.data.push(newItem);
    this.notifyChange();

    console.log(`✨ 创建新项: ${newItem._indexId}`);
    return newItem;
  }

  // ✏️ 更新项
  update(indexId: string, updates: Partial<T>): void {
    const item = this.getById(indexId);
    if (item) {
      // 保存原始数据用于撤销
      if (!this.originalData.has(indexId)) {
        this.originalData.set(indexId, { ...item });
      }

      Object.assign(item, updates);
      this.markAsModified(item);
      this.notifyChange();

      console.log(`🔄 更新项: ${indexId}`, updates);
    }
  }

  // 🗑️ 删除项
  delete(indexId: string): void {
    const index = this.data.findIndex((item) => item._indexId === indexId);
    if (index !== -1) {
      const deletedItem = this.data.splice(index, 1)[0];
      this.originalData.delete(indexId);
      this.notifyChange();

      console.log(`🗑️ 删除项: ${indexId}`);
    }
  }

  // 📋 设置编辑状态
  setEditStatus(indexId: string, status: EditStatus): void {
    const item = this.getById(indexId);
    if (item) {
      item._status = status;
      this.notifyChange();
    }
  }

  // 🔄 撤销更改
  async resetChanges(indexId: string): Promise<void> {
    const item = this.getById(indexId);
    if (!item) return;

    if (item._status === 'new') {
      // 新创建的项直接删除
      this.delete(indexId);
    } else {
      // 已有项恢复到原始状态
      const original = this.originalData.get(indexId);
      if (original) {
        const index = this.data.findIndex((i) => i._indexId === indexId);
        if (index !== -1) {
          this.data[index] = { ...original };
          this.originalData.delete(indexId);
          this.notifyChange();
        }
      } else {
        // 从后台重新加载
        await this.reloadFromBackend(indexId);
      }
    }

    console.log(`🔄 撤销更改: ${indexId}`);
  }

  // 💾 保存更改
  async saveChanges(indexId: string): Promise<void> {
    const item = this.getById(indexId);
    if (!item) return;

    try {
      item._editStatus = 'saving';
      this.notifyChange();

      // 调用具体的保存逻辑
      await this.performSave(item);

      item._status = 'saved';
      item._editStatus = 'idle';
      this.originalData.delete(indexId);
      this.notifyChange();

      console.log(`💾 保存成功: ${indexId}`);
    } catch (error) {
      item._status = 'error';
      item._editStatus = 'idle';
      this.notifyChange();

      console.error(`❌ 保存失败: ${indexId}`, error);
      throw error;
    }
  }

  // 📦 批量更新
  batchUpdate(updates: { indexId: string; data: Partial<T> }[]): void {
    updates.forEach(({ indexId, data }) => {
      this.update(indexId, data);
    });
  }

  // 🗑️ 批量删除
  batchDelete(indexIds: string[]): void {
    indexIds.forEach((indexId) => {
      this.delete(indexId);
    });
  }

  // 🏷️ 标记为已修改
  protected markAsModified(item: T): void {
    if (item._status === 'saved') {
      item._status = 'modified';
    }
  }

  // 🔄 更新嵌套字段（子类实现）
  protected abstract updateNestedField(indexPath: IndexPath, field: string, value: any): void;

  // 💾 执行保存（子类实现）
  protected abstract performSave(item: T): Promise<void>;

  // 🔄 从后台重新加载（子类实现）
  protected abstract reloadFromBackend(indexId: string): Promise<void>;

  // 📢 通知变更（子类实现）
  protected abstract notifyChange(): void;
}

// 🎯 通用的字段更新Hooks
export const createUniversalFieldUpdater = <T extends EditableIndexed>(
  store: UniversalStoreOperations<T>
): FieldUpdater => store.updateField;

// 🎯 通用的编辑操作Hooks
export interface UniversalEditActions<T extends EditableIndexed> {
  create: (data: Partial<T>) => T;
  update: (indexId: string, updates: Partial<T>) => void;
  delete: (indexId: string) => void;
  resetChanges: (indexId: string) => Promise<void>;
  saveChanges: (indexId: string) => Promise<void>;
  updateField: FieldUpdater;
}

export const createUniversalEditActions = <T extends EditableIndexed>(
  store: UniversalStoreOperations<T>
): UniversalEditActions<T> => ({
  create: store.create.bind(store),
  update: store.update.bind(store),
  delete: store.delete.bind(store),
  resetChanges: store.resetChanges.bind(store),
  saveChanges: store.saveChanges.bind(store),
  updateField: store.updateField,
});
