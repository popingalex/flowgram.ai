import { IJsonSchema } from '@flowgram.ai/form-materials';

/**
 * 扩展的JsonSchema，添加实体属性相关字段
 * 支持nanoid索引设计
 */
export interface ExtendedJsonSchema extends IJsonSchema {
  // 实体属性分类
  category?: 'meta' | 'entity' | 'module';

  // nanoid索引设计字段
  id?: string; // 原始属性ID（语义化标识符）
  name?: string; // 原始属性名称（显示名称）
  _indexId?: string; // 索引ID（nanoid，与properties的key相同）

  // 分类标记（兼容旧设计）
  isEntityProperty?: boolean; // 是否为实体属性
  isModuleProperty?: boolean; // 是否为模块属性

  // 原始属性信息（兼容旧设计）
  attributeId?: string; // 原始属性ID
  attributeName?: string; // 原始属性名称

  // 模块相关
  moduleId?: string; // 所属模块ID

  // 枚举相关
  enumClassId?: string; // 枚举类ID

  // 调试相关
  debugNanoid?: string; // 🔍 调试用：检测数据是否被重新生成

  // 其他扩展字段可以继续添加...
}
