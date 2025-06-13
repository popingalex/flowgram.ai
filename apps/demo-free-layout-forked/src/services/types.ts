// 核心数据结构类型定义

// 模块属性接口
export interface ModuleAttribute {
  _indexId?: string; // Add stable index for UI
  id: string;
  type: string;
  name: string;
  description?: string;
  enumClassId?: string;
  displayId?: string; // 去掉模块前缀的属性ID，用于显示
}

// 模块接口
export interface Module {
  _indexId?: string; // Add stable index for UI
  id: string;
  name: string;
  description?: string;
  attributes: ModuleAttribute[];
  deprecated?: boolean;
}

// 实体属性接口
export interface Attribute {
  id: string;
  name: string; // 改为必须，与表格组件一致
  type: string; // 改为必须，与表格组件一致
  description?: string;
  enumClassId?: string;
  _indexId: string; // 改为必须，确保所有属性都有稳定的索引ID
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
}

// 枚举类接口
export interface EnumClass {
  id: string;
  name: string;
  description: string;
  values: string[];
  createdAt?: string;
  updatedAt?: string;
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
}
