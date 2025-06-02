// 核心数据结构类型定义

// 模块属性接口
export interface ModuleAttribute {
  id: string;
  type: string;
  name: string;
  description?: string;
  enumClassId?: string;
}

// 模块接口
export interface Module {
  id: string;
  name: string;
  description?: string;
  deprecated: boolean;
  attributes: ModuleAttribute[];
}

// 实体属性接口
export interface Attribute {
  id: string;
  name?: string;
  type?: string;
  description?: string;
  enumClassId?: string;
}

// 实体接口
export interface Entity {
  id: string;
  name: string;
  description?: string;
  deprecated: boolean;
  attributes: Attribute[];
  bundles: string[];
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
