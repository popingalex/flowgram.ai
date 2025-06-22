import { EditableIndexed } from './base';

// 基础属性类型
export interface Attribute extends EditableIndexed {
  id: string;
  name: string;
  type: string;
  description?: string;
  enumClassId?: string;
  enum?: any;
  displayId?: string; // 显示用的简化ID
}

// 实体类型
export interface Entity extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  attributes: Attribute[];
  bundles?: string[]; // 关联的模块ID（业务ID）
  deprecated?: boolean;
}

// 模块类型
export interface Module extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  category?: string;
  attributes: Attribute[];
}

// 表达式类型
export interface Expression extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  type?: string;
}

// 枚举类型
export interface EnumClass extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
  values: EnumValue[];
}

export interface EnumValue extends EditableIndexed {
  id: string;
  name: string;
  description?: string;
}
