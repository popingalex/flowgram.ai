// 实体属性相关的严格类型定义

// 基础JSONSchema接口
interface IJsonSchema {
  type: string;
  description?: string;
  items?: IJsonSchema;
  properties?: Record<string, IJsonSchema>;
  [key: string]: any;
}

// 基础属性类型
export interface BaseAttribute {
  id: string;
  name: string;
  type: string;
  description?: string;
  enumClassId?: string;
}

// 扩展的JSONSchema属性 - 用于编辑器
export interface ExtendedJsonSchemaProperty extends IJsonSchema {
  // 原始属性信息
  id: string; // 英文标识符，用作数据key
  title: string; // JSONSchema标准字段 - 显示名称（中文）

  // 索引信息
  _id: string; // nanoid索引ID - React key专用，永远不变

  // 分类标记
  isEntityProperty?: boolean; // 实体直接属性
  isModuleProperty?: boolean; // 模块属性
  moduleId?: string; // 所属模块ID（仅模块属性有）

  // meta属性（从原始Attribute保留）
  enumClassId?: string;
  description?: string; // 描述字段可选

  // 禁止重复的字段
  name?: never; // 禁止使用name字段，避免与title重复
}

// JSONSchema格式的属性集合
export interface EntityPropertiesSchema {
  type: 'object';
  properties: Record<string, ExtendedJsonSchemaProperty>; // key必须是nanoid
}

// 实体属性编辑器的2个核心数据结构类型定义

// 1. Store数据结构 (后台交互)
export interface StoreEntityData {
  id: string;
  name: string;
  bundles: string[]; // 完整关联的模块
  attributes: StoreAttribute[];
}

export interface StoreAttribute {
  id: string; // 英文标识符
  name: string; // 中文名称
  type: string; // 's' | 'n' | '[s]' | '[n]' 等
  enumClassId?: string;
  description?: string;
}

// 2. JSONSchema数据结构 (节点编辑器)
export interface JSONSchemaEntityData {
  type: 'object';
  properties: Record<string, JSONSchemaProperty>; // key是nanoid
}

export interface JSONSchemaProperty {
  // 原始标识信息
  id: string; // 原始英文标识符
  name: string; // 原始中文名称

  // JSONSchema标准字段
  type: string; // 'string' | 'number' | 'array' 等
  description?: string;
  items?: {
    type: string;
  };

  // 索引信息
  _id: string; // nanoid索引ID - 与properties的key相同

  // 分类标记
  isEntityProperty?: boolean; // 实体直接属性
  isModuleProperty?: boolean; // 模块属性
  moduleId?: string; // 所属模块ID（仅模块属性有）

  // meta属性保留
  enumClassId?: string;
}

// 类型验证函数
export function isStoreEntityData(data: any): data is StoreEntityData {
  return (
    typeof data === 'object' &&
    typeof data.id === 'string' &&
    typeof data.name === 'string' &&
    Array.isArray(data.bundles) &&
    Array.isArray(data.attributes)
  );
}

export function isJSONSchemaEntityData(data: any): data is JSONSchemaEntityData {
  return typeof data === 'object' && data.type === 'object' && typeof data.properties === 'object';
}

// 实体完整属性结构 - 包含两种格式
export interface EntityCompleteProperties {
  allProperties: JSONSchemaEntityData; // 用于节点显示
  editableProperties: JSONSchemaEntityData; // 用于抽屉编辑
}

// 类型守卫函数
export function isValidExtendedProperty(prop: any): prop is ExtendedJsonSchemaProperty {
  return (
    typeof prop === 'object' &&
    prop !== null &&
    typeof prop.id === 'string' &&
    typeof prop.title === 'string' &&
    typeof prop._id === 'string' &&
    typeof prop.type === 'string' &&
    !('name' in prop) // 确保没有name字段
  );
}

// 验证属性集合的类型守卫
export function isValidPropertiesSchema(schema: any): schema is EntityPropertiesSchema {
  if (typeof schema !== 'object' || schema === null || schema.type !== 'object') {
    return false;
  }

  if (!schema.properties || typeof schema.properties !== 'object') {
    return false;
  }

  // 验证每个属性
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (!isValidExtendedProperty(prop)) {
      console.error(`Invalid property at key ${key}:`, prop);
      return false;
    }

    // 验证key是nanoid格式（_id字段应该与key相同）
    if (prop._id !== key) {
      console.error(`Property key ${key} does not match _id ${prop._id}`);
      return false;
    }
  }

  return true;
}
