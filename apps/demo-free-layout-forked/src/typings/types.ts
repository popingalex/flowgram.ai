// 基础索引接口
export interface Indexed {
  _indexId: string; // nanoid索引，用于React key和内部关联
}

// 编辑状态
export type EditStatus = 'saved' | 'modified' | 'new' | 'saving' | 'error';

// 可编辑的索引对象
export interface EditableIndexed extends Indexed {
  _status: EditStatus;
  _editStatus?: 'saving' | 'idle';
}

// 基础数据类型 - 直接定义具体需要的字段
export interface BaseAttribute extends EditableIndexed {
  id: string;
  name: string;
  type: string;
  description?: string;
  enumClassId?: string;
  enum?: any;
  // 表达式参数专用字段
  required?: boolean;
  scope?: 'query' | 'header' | 'path' | 'body';
  value?: any; // 默认值或示例值
  // 实体属性专用字段
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
  displayId?: string; // 去掉模块前缀的属性ID，用于显示
}

export interface BaseEntity extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  attributes: BaseAttribute[];
  moduleIds: string[]; // 关联的模块_indexId数组
  bundles?: string[]; // 完整关联的模块ID（业务ID，不是_indexId）
  deprecated?: boolean;
}

export interface BaseModule extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  category?: string;
  attributes: BaseAttribute[];
  deprecated?: boolean;
}

export interface BaseExpression extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  type?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url?: string;
  body?: any;
  group?: string;
  deprecated?: boolean;
  inputs: BaseAttribute[]; // 输入参数，类型为Attribute数组
  output: BaseAttribute; // 输出结果，类型为单个Attribute
  // 函数行为专用字段
  className?: string;
  fullClassName?: string;
  methodName?: string;
  category?: string;
  endpoint?: string;
  headers?: Record<string, string>;
  timeout?: number;
  retryCount?: number;
  tags?: string[];
  examples?: Array<{
    name: string;
    description: string;
    input: Record<string, any>;
    output: any;
  }>;
}

export interface BaseGraph extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  entityId?: string; // 关联的实体_indexId
  nodes?: any[]; // 图节点数据
  edges?: any[]; // 图边数据
}

// 枚举类接口
export interface BaseEnum extends EditableIndexed {
  id: string;
  name: string;
  description: string;
  values: string[];
  createdAt?: string;
  updatedAt?: string;
}

// 索引路径类型
export type IndexPath = string[]; // nanoid路径数组

// 字段更新函数类型
export type FieldUpdater = (indexPath: IndexPath, field: string, value: any) => void;

// 验证函数类型
export type ValidationFunction = (
  value: any,
  allData: any[],
  indexPath: IndexPath,
  field: string
) => string; // 返回错误信息，空字符串表示无错误

// 表达式调用结果
export interface ExpressionCallResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number; // 调用耗时（毫秒）
  timestamp: number; // 调用时间戳
}

// 类型别名 - 便于理解和向后兼容
export type ItemStatus = EditStatus;
export type EntityStatus = ItemStatus;
export type ModuleStatus = ItemStatus;
export type AttributeStatus = ItemStatus;
