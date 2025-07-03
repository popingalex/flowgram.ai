/**
 * 仿真平台类型系统转换器
 * 负责在仿真类型系统和其他类型系统之间进行转换
 */

import type { Typed, TypedAttribute } from './typed'
import { TypedParser, Primitive } from './typed'

/**
 * JSON Schema 类型定义
 */
export interface JSONSchemaType {
  type: 'boolean' | 'number' | 'string' | 'array' | 'object' | 'unknown'
  items?: JSONSchemaType
  properties?: Record<string, JSONSchemaType>
  required?: string[]
  default?: any
  description?: string
}

/**
 * 仿真平台类型系统转换器
 */
export class SimulationTypeConverter {
  /**
   * 将 Typed 转换为 JSON Schema
   */
  static typedToJSONSchema(typed: Typed): JSONSchemaType {
    // 处理数组类型
    if (typed.dimensions.length > 0) {
      let baseType = this.getBaseJSONSchemaType(typed)

      // 从最内层开始构建数组类型
      for (let i = typed.dimensions.length - 1; i >= 0; i--) {
        baseType = {
          type: 'array',
          items: baseType,
        }
      }

      return baseType
    }

    // 处理复合类型
    if (typed.attributes.length > 0) {
      const properties: Record<string, JSONSchemaType> = {}
      const required: string[] = []

      typed.attributes.forEach((attr) => {
        properties[attr.id] = this.typedToJSONSchema(attr.type)
        required.push(attr.id) // 默认所有属性都是必需的
      })

      return {
        type: 'object',
        properties,
        required,
      }
    }

    // 处理基础类型
    return this.getBaseJSONSchemaType(typed)
  }

  /**
   * 将 JSON Schema 转换为 Typed
   */
  static jsonSchemaToTyped(schema: JSONSchemaType): Typed {
    switch (schema.type) {
      case 'boolean':
        return { dimensions: [], attributes: [], primitive: Primitive.BOOLEAN }
      case 'number':
        return { dimensions: [], attributes: [], primitive: Primitive.NUMBER }
      case 'string':
        return { dimensions: [], attributes: [], primitive: Primitive.STRING }
      case 'unknown':
        return { dimensions: [], attributes: [], primitive: Primitive.UNKNOWN }
      case 'array':
        if (schema.items) {
          const itemType = this.jsonSchemaToTyped(schema.items)
          return {
            dimensions: [-1, ...itemType.dimensions],
            attributes: itemType.attributes,
            primitive: itemType.primitive,
          }
        }
        return { dimensions: [-1], attributes: [], primitive: Primitive.UNKNOWN }
      case 'object':
        if (schema.properties) {
          const attributes: TypedAttribute[] = Object.entries(schema.properties).map(
            ([key, prop]) => ({
              id: key,
              type: this.jsonSchemaToTyped(prop),
            })
          )
          return { dimensions: [], attributes, primitive: null }
        }
        return { dimensions: [], attributes: [], primitive: Primitive.UNKNOWN }
      default:
        return { dimensions: [], attributes: [], primitive: Primitive.UNKNOWN }
    }
  }

  /**
   * 从字符串解析创建 JSON Schema
   */
  static parseFromString(typeString: string): JSONSchemaType {
    try {
      const typed = TypedParser.fromString(typeString)
      return this.typedToJSONSchema(typed)
    } catch (error) {
      console.warn('Failed to parse type string:', typeString, error)
      return { type: 'object' }
    }
  }

  /**
   * 验证值是否符合 Typed 定义
   */
  static validateValue(value: any, typed: Typed): boolean {
    try {
      // 处理数组类型
      if (typed.dimensions.length > 0) {
        if (!Array.isArray(value)) return false

        // 检查固定维度
        const firstDim = typed.dimensions[0]
        if (firstDim > 0 && value.length !== firstDim) return false

        // 递归检查元素类型
        const elementType: Typed = {
          dimensions: typed.dimensions.slice(1),
          attributes: typed.attributes,
          primitive: typed.primitive
        }

        return value.every((item) => this.validateValue(item, elementType))
      }

      // 处理原始类型
      if (typed.primitive !== null) {
        switch (typed.primitive) {
          case Primitive.BOOLEAN:
            return typeof value === 'boolean'
          case Primitive.NUMBER:
            return typeof value === 'number' && !isNaN(value)
          case Primitive.STRING:
            return typeof value === 'string'
          case Primitive.UNKNOWN:
            return true // unknown类型接受任何值
          default:
            return false
        }
      }

      // 处理复合类型
      if (typed.attributes.length > 0) {
        if (typeof value !== 'object' || value === null || Array.isArray(value)) {
          return false
        }

        return typed.attributes.every((attr) => {
          if (!(attr.id in value)) return false
          return this.validateValue(value[attr.id], attr.type)
        })
      }

      return true
    } catch (error) {
      console.warn('Validation error:', error)
      return false
    }
  }

  /**
   * 为 Typed 创建默认值
   */
  static createDefaultValue(typed: Typed): any {
    return TypedParser.createDefaultValue(typed)
  }

  /**
   * 获取基础 JSON Schema 类型
   */
  private static getBaseJSONSchemaType(typed: Typed): JSONSchemaType {
    switch (typed.primitive) {
      case Primitive.BOOLEAN:
        return { type: 'boolean', default: false }
      case Primitive.NUMBER:
        return { type: 'number', default: 0 }
      case Primitive.STRING:
        return { type: 'string', default: '' }
      case Primitive.UNKNOWN:
        return { type: 'unknown' }
      default:
        return { type: 'object' }
    }
  }

  /**
   * 深度克隆值
   */
  private static cloneValue(value: any): any {
    if (value === null || typeof value !== 'object') {
      return value
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.cloneValue(item))
    }
    const cloned: Record<string, any> = {}
    Object.entries(value).forEach(([key, val]) => {
      cloned[key] = this.cloneValue(val)
    })
    return cloned
  }
}

/**
 * 类型转换工具类
 */
export class TypeConverter {
  /**
   * 将 Typed 转换为字符串
   */
  static toString(typed: Typed): string {
    return TypedParser.toString(typed)
  }

  /**
   * 从字符串解析 Typed
   */
  static fromString(str: string): Typed {
    return TypedParser.fromString(str)
  }

  /**
   * 将 Typed 转换为 JSON Schema
   */
  static toJSONSchema(typed: Typed): JSONSchemaType {
    return SimulationTypeConverter.typedToJSONSchema(typed)
  }

  /**
   * 从 JSON Schema 转换为 Typed
   */
  static fromJSONSchema(schema: JSONSchemaType): Typed {
    return SimulationTypeConverter.jsonSchemaToTyped(schema)
  }

  /**
   * 验证值是否符合类型定义
   */
  static validate(value: any, typed: Typed): boolean {
    return SimulationTypeConverter.validateValue(value, typed)
  }

  /**
   * 创建类型的默认值
   */
  static createDefault(typed: Typed): any {
    return SimulationTypeConverter.createDefaultValue(typed)
  }

  /**
   * 比较两个类型是否相等
   */
  static equals(a: Typed, b: Typed): boolean {
    return TypedParser.equals(a, b)
  }

  /**
   * 克隆类型定义
   */
  static clone(typed: Typed): Typed {
    return TypedParser.clone(typed)
  }
}

/**
 * 常用类型工厂
 */
export class TypeFactory {
  static boolean(): Typed {
    return { dimensions: [], attributes: [], primitive: Primitive.BOOLEAN }
  }

  static number(): Typed {
    return { dimensions: [], attributes: [], primitive: Primitive.NUMBER }
  }

  static string(): Typed {
    return { dimensions: [], attributes: [], primitive: Primitive.STRING }
  }

  static unknown(): Typed {
    return { dimensions: [], attributes: [], primitive: Primitive.UNKNOWN }
  }

  static array(elementType: Typed, size: number = -1): Typed {
    return {
      ...elementType,
      dimensions: [size, ...elementType.dimensions]
    }
  }

  static object(attributes: TypedAttribute[]): Typed {
    return { dimensions: [], attributes, primitive: null }
  }

  /**
   * 从类型字符串创建类型
   */
  static fromString(typeString: string): Typed {
    return TypedParser.fromString(typeString)
  }

  /**
   * 创建坐标类型 (x:n, y:n)
   */
  static coordinates(): Typed {
    return this.object([
      { id: 'x', type: this.number() },
      { id: 'y', type: this.number() }
    ])
  }

  /**
   * 创建3D坐标类型 (x:n, y:n, z:n)
   */
  static coordinates3D(): Typed {
    return this.object([
      { id: 'x', type: this.number() },
      { id: 'y', type: this.number() },
      { id: 'z', type: this.number() }
    ])
  }

  /**
   * 创建颜色类型 (r:n, g:n, b:n, a:n)
   */
  static color(): Typed {
    return this.object([
      { id: 'r', type: this.number() },
      { id: 'g', type: this.number() },
      { id: 'b', type: this.number() },
      { id: 'a', type: this.number() }
    ])
  }
}
