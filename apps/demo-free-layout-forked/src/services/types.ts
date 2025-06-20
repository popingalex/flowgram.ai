// 核心数据结构类型定义

// 通用数据项状态枚举 - 适用于实体、模块、属性、行为树等所有数据项
export type ItemStatus = 'saved' | 'new' | 'dirty' | 'saving';

// 类型别名 - 便于理解和向后兼容
export type EntityStatus = ItemStatus;
export type ModuleStatus = ItemStatus;

// 模块属性接口
export interface ModuleAttribute {
  _indexId?: string; // Add stable index for UI
  id: string;
  type: string;
  name: string;
  description?: string;
  enumClassId?: string;
  displayId?: string; // 去掉模块前缀的属性ID，用于显示
  _status?: ModuleStatus; // 属性状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
}

// 模块接口
export interface Module {
  _indexId?: string; // Add stable index for UI
  id: string;
  name: string;
  description?: string;
  attributes: ModuleAttribute[];
  deprecated?: boolean;
  _status?: ModuleStatus; // 模块状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
  _editStatus?: 'editing' | 'saving'; // 编辑状态：编辑中 | 保存中
}

export type AttributeStatus = ItemStatus;

// 实体属性接口
export interface Attribute {
  id: string;
  name: string; // 改为必须，与表格组件一致
  type: string; // 改为必须，与表格组件一致
  description?: string;
  enumClassId?: string;
  _indexId: string; // 改为必须，确保所有属性都有稳定的索引ID
  _status?: AttributeStatus; // 属性状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
  // 属性分类信息（运行时添加）
  isEntityProperty?: boolean;
  isModuleProperty?: boolean;
  moduleId?: string;
}

// 实体接口
export interface Entity {
  id: string;
  name: string;
  description?: string;
  deprecated: boolean;
  attributes: Attribute[];
  bundles: string[];
  _indexId?: string; // 稳定的索引ID，用作React key
  _status?: EntityStatus; // 实体状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
  _editStatus?: 'editing' | 'saving'; // 编辑状态：编辑中 | 保存中
}

// 枚举类接口
export interface EnumClass {
  id: string;
  name: string;
  description: string;
  values: string[];
  createdAt?: string;
  updatedAt?: string;
  _indexId?: string; // 稳定的索引ID，用作React key
  _status?: ItemStatus; // 状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
}

// 函数参数接口
export interface BehaviorParameter {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  format?: string; // email, date, url等
}

// 函数返回值接口
export interface BehaviorReturn {
  type: string;
  description?: string;
  properties?: Record<string, BehaviorParameter>;
}

// 后台函数行为定义接口 (对应 /hub/behaviors/ API)
export interface BehaviorDef {
  id: string; // 全限定函数ID
  name: string; // 方法名
  description: string;
  className?: string; // 类名
  fullClassName?: string; // 完整类名
  methodName?: string; // 方法名
  category?: string;
  endpoint?: string; // 可选，Java函数没有HTTP端点
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // 可选，Java函数没有HTTP方法
  headers?: Record<string, string>;
  parameters: BehaviorParameter[];
  returns: BehaviorReturn;
  timeout?: number;
  retryCount?: number;
  deprecated?: boolean;
  tags?: string[];
  examples?: Array<{
    name: string;
    description: string;
    input: Record<string, any>;
    output: any;
  }>;
  _indexId?: string; // 稳定的索引ID，用作React key
  _status?: ItemStatus; // 状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
}

// 远程服务定义接口 (对应 /hub/expressions/ API)
export interface ExpressionDef {
  id: string; // 服务ID
  name: string; // 服务名称
  description: string;
  url: string; // 服务URL
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // 必须的HTTP方法
  headers?: Record<string, string>;
  parameters: BehaviorParameter[];
  returns: BehaviorReturn;
  timeout?: number;
  retryCount?: number;
  deprecated?: boolean;
  tags?: string[];
  category?: string;
  examples?: Array<{
    name: string;
    description: string;
    input: Record<string, any>;
    output: any;
  }>;
  _indexId?: string; // 稳定的索引ID，用作React key
  _status?: ItemStatus; // 状态：saved(已保存) | new(新增) | dirty(已修改) | saving(保存中)
}

// 表达式项联合类型 - 包含行为函数和远程服务
export type ExpressionItem =
  | (BehaviorDef & { type: 'behavior' })
  | (ExpressionDef & { type: 'expression' });

// 表达式调用结果
export interface ExpressionCallResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number; // 调用耗时（毫秒）
  timestamp: number; // 调用时间戳
}
