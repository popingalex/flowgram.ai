// 服务层类型定义 - 从统一类型文件导入基础类型
import {
  BaseAttribute,
  BaseEntity,
  BaseModule,
  BaseExpression,
  BaseEnum,
  BaseGraph,
  EditableIndexed,
  ItemStatus,
  EntityStatus,
  ModuleStatus,
  AttributeStatus,
  ExpressionCallResult,
} from '../typings/types';

// 服务层类型别名 - 保持向后兼容
export type Attribute = BaseAttribute;
export type Entity = BaseEntity;
export type Module = BaseModule;
export type EnumClass = BaseEnum;
export type ExpressionDef = BaseExpression;
export type BehaviorDef = BaseExpression; // 函数行为也使用BaseExpression

// 模块属性接口 (保持兼容性)
export interface ModuleAttribute extends BaseAttribute {
  displayId?: string; // 去掉模块前缀的属性ID，用于显示
}

// 导出状态类型
export { ItemStatus, EntityStatus, ModuleStatus, AttributeStatus, ExpressionCallResult };

// 函数参数接口 (向后兼容，实际使用BaseAttribute)
export interface BehaviorParameter extends BaseAttribute {
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  default?: any;
  enum?: string[];
  format?: string; // email, date, url等
  scope?: 'header' | 'path' | 'query'; // 参数作用域
}

// 函数返回值接口 (向后兼容，实际使用BaseAttribute)
export interface BehaviorReturn extends BaseAttribute {
  type: string;
  description?: string;
  properties?: Record<string, BehaviorParameter>;
}

// 表达式项联合类型 - 包含行为函数和远程服务
export type ExpressionItem =
  | (BaseExpression & { type: 'behavior' })
  | (BaseExpression & { type: 'expression' });

// 新的后端API数据结构
export interface BackendModule {
  id: string;
  name: string;
  deprecated: boolean;
  // 其他字段根据实际API返回添加
}

export interface BackendSystem {
  id: string;
  name: string;
  type: string;
  version: string;
  enabled: boolean;
  deprecated: boolean;
  // 其他字段根据实际API返回添加
}

export interface BackendRemoteBehavior {
  type: 'remote';
  id: string;
  name: string;
  url: string;
  deprecated: boolean;
  // 其他字段根据实际API返回添加
}

export interface BackendLocalBehavior {
  type: 'local';
  id: string;
  name: string;
  functionName: string;
  className?: string;
  modulePath?: string;
  deprecated: boolean;
  // 其他字段根据实际API返回添加
}

export interface BackendScriptBehavior {
  type: 'script';
  id: string;
  name: string;
  content: string;
  language: string;
  runtime?: string;
  deprecated: boolean;
  // 其他字段根据实际API返回添加
}
