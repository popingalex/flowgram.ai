// 新的ECS System风格的行为数据类型

import { ConditionRowValueType } from '../components/ext/condition-row-ext/types';
import { EditableIndexed, ItemStatus } from './types';

// 参数过滤条件 - 类似filter节点的过滤条件
export interface ParameterFilter {
  // 模块过滤 (黑白名单)
  moduleFilter?: {
    whitelist: string[]; // 包含的模块ID数组
    blacklist: string[]; // 排除的模块ID数组
  };
  // 属性过滤条件 (来自FilterConditionInputs)
  propertyFilters?: Array<{
    key: string;
    value?: ConditionRowValueType;
  }>;
}

// 行为参数定义
export interface BehaviorParameter extends EditableIndexed {
  name: string; // 参数名，可编辑
  description?: string; // 参数描述（可选）
  filter: ParameterFilter; // 过滤条件
}

// 代码类型枚举
export enum CodeType {
  REMOTE = 'remote', // 远程服务
  LOCAL = 'local', // 本地函数
  CUSTOM = 'custom', // 自定义代码
}

// 代码语言枚举
export enum CodeLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
}

// 代码配置
export interface CodeConfig {
  type: CodeType;
  // 兼容旧的属性名
  functionName?: string; // 函数名或服务地址
  code?: string; // 自定义代码内容
  language?: CodeLanguage; // 代码语言
  // 新的结构化属性
  functionId?: string; // 当type为remote或local时，存储选中的函数ID
  customCode?: {
    language: CodeLanguage;
    content: string;
  }; // 当type为custom时，存储自定义代码
  // 参数映射配置
  parameterMapping?: Record<
    string,
    {
      type: 'parameter' | 'constant';
      value: any;
    }
  >;
}

// ECS System风格的行为定义
export interface SystemBehavior extends EditableIndexed {
  id: string; // 行为ID
  name?: string; // 行为名称
  description?: string; // 行为描述
  parameters: BehaviorParameter[]; // 参数（参与者）列表
  codeConfig: CodeConfig; // 代码配置
  // 元数据
  deprecated?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Store状态
export interface SystemBehaviorStoreState {
  behaviors: SystemBehavior[];
  loading: boolean;
  error: string | null;
  // 编辑状态
  editingBehavior: SystemBehavior | null;
  originalBehavior: SystemBehavior | null;
  isDirty: boolean;
  isSaving: boolean;
}

// Store操作
export interface SystemBehaviorActions {
  // 基础CRUD
  loadBehaviors: () => Promise<void>;
  createBehavior: (behavior: Omit<SystemBehavior, '_indexId' | '_status'>) => Promise<void>;
  updateBehavior: (id: string, updates: Partial<SystemBehavior>) => Promise<void>;
  deleteBehavior: (id: string) => Promise<void>;
  getBehaviorById: (id: string) => SystemBehavior | null;

  // 编辑操作
  startEdit: (behavior: SystemBehavior) => void;
  stopEdit: () => void;
  updateEditingBehavior: (updates: Partial<SystemBehavior>) => void;
  saveChanges: () => Promise<void>;
  resetChanges: () => void;

  // 参数操作
  addParameter: (parameter: Omit<BehaviorParameter, '_indexId' | '_status'>) => void;
  updateParameter: (parameterId: string, updates: Partial<BehaviorParameter>) => void;
  deleteParameter: (parameterId: string) => void;

  // 代码配置操作
  updateCodeConfig: (codeConfig: CodeConfig) => void;

  // 工具方法
  clearError: () => void;
  refreshBehaviors: () => Promise<void>;
}
