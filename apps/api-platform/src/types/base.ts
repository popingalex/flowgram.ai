// 基础索引接口
export interface Indexed {
  _indexId: string; // nanoid索引，用于数组索引和React key
}

// 编辑状态
export type EditStatus = 'saved' | 'modified' | 'new' | 'saving' | 'error';

// 可编辑的索引对象
export interface EditableIndexed extends Indexed {
  _status?: EditStatus;
}

// 索引路径类型
export type IndexPath = string[]; // nanoid路径数组

// 字段更新函数类型
export type FieldUpdater = (indexPath: IndexPath, field: string, value: any) => void;
