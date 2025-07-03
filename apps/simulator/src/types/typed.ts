/**
 * 仿真平台类型定义 - 与Java后端完全对应
 * 对应Java类: com.gsafety.simulation.domain.attribute.Typed
 */

/**
 * 原始类型枚举 - 对应Java Typed.Primitive
 */
export enum Primitive {
  BOOLEAN = 'BOOLEAN',
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  UNKNOWN = 'UNKNOWN',
}

/**
 * 类型定义接口 - 完全对应Java Typed类
 */
export interface Typed {
  /** 数组维度列表 */
  dimensions: number[]
  /** 属性列表 - 使用轻量级属性接口避免循环依赖 */
  attributes: TypedAttribute[]
  /** 原始类型 */
  primitive: Primitive | null
}

/**
 * 轻量级属性接口 - 用于类型定义中避免循环依赖
 */
export interface TypedAttribute {
  id: string
  type: Typed
}

/**
 * 类型解析器 - 对应Java Typed类的解析方法
 */
export class TypedParser {
  /**
   * 从字符串解析类型定义
   * 对应Java Typed.fromString方法
   */
  static fromString(typeString: string): Typed {
    if (!typeString || !typeString.trim()) {
      return {
        dimensions: [],
        attributes: [],
        primitive: Primitive.UNKNOWN,
      }
    }

    typeString = typeString.trim()

    // 处理数组类型 (如 "n[]" 或 "s[3]")
    const arrayMatch = typeString.match(/^(.+?)\[(\d*)\]$/)
    if (arrayMatch) {
      const [, baseType, dimStr] = arrayMatch
      const dimension = dimStr ? parseInt(dimStr) : -1 // -1表示动态数组
      const baseTyped = this.fromString(baseType)

      return {
        dimensions: [dimension, ...baseTyped.dimensions],
        attributes: baseTyped.attributes,
        primitive: baseTyped.primitive,
      }
    }

    // 处理复合类型 (如 "(x:n, y:n)")
    if (typeString.startsWith('(') && typeString.endsWith(')')) {
      const content = typeString.slice(1, -1).trim()
      if (!content) {
        return {
          dimensions: [],
          attributes: [],
          primitive: null,
        }
      }

      const attributes: TypedAttribute[] = []
      const parts = this.splitAttributeParts(content)

      for (const part of parts) {
        const colonIndex = part.indexOf(':')
        if (colonIndex !== -1) {
          const id = part.substring(0, colonIndex).trim()
          const typeStr = part.substring(colonIndex + 1).trim()

          attributes.push({
            id,
            type: this.fromString(typeStr),
          })
        }
      }

      return {
        dimensions: [],
        attributes,
        primitive: null,
      }
    }

    // 处理原始类型
    switch (typeString.toLowerCase()) {
      case 'b':
      case 'bool':
      case 'boolean':
        return {
          dimensions: [],
          attributes: [],
          primitive: Primitive.BOOLEAN,
        }
      case 'n':
      case 'num':
      case 'number':
        return {
          dimensions: [],
          attributes: [],
          primitive: Primitive.NUMBER,
        }
      case 's':
      case 'str':
      case 'string':
        return {
          dimensions: [],
          attributes: [],
          primitive: Primitive.STRING,
        }
      default:
        return {
          dimensions: [],
          attributes: [],
          primitive: Primitive.UNKNOWN,
        }
    }
  }

  /**
   * 将类型定义转换为字符串
   * 对应Java Typed.toString方法
   */
  static toString(typed: Typed): string {
    let result = ''

    // 处理原始类型
    if (typed.primitive !== null) {
      switch (typed.primitive) {
        case Primitive.BOOLEAN:
          result = 'b'
          break
        case Primitive.NUMBER:
          result = 'n'
          break
        case Primitive.STRING:
          result = 's'
          break
        default:
          result = 'unknown'
          break
      }
    }

    // 处理复合类型
    if (typed.attributes && typed.attributes.length > 0) {
      const attrStrings = typed.attributes.map((attr) => `${attr.id}:${this.toString(attr.type)}`)
      result = `(${attrStrings.join(', ')})`
    }

    // 处理数组维度
    for (const dim of typed.dimensions) {
      if (dim === -1) {
        result += '[]'
      } else {
        result += `[${dim}]`
      }
    }

    return result || 'unknown'
  }

  /**
   * 获取类型的大小（元素数量）
   */
  static getSize(typed: Typed): number {
    let dimProduct = typed.dimensions.reduce((acc, dim) => acc * Math.max(0, dim), 1)
    if (dimProduct === 0 && typed.dimensions.length > 0) {
      return 0
    }

    let baseStructureSize: number
    if (typed.primitive !== null) {
      baseStructureSize = 1
    } else if (typed.attributes.length > 0) {
      baseStructureSize = typed.attributes.length
    } else {
      baseStructureSize = 1
    }

    return dimProduct * baseStructureSize
  }

  /**
   * 分割属性部分，正确处理嵌套括号
   */
  private static splitAttributeParts(content: string): string[] {
    const parts: string[] = []
    let current = ''
    let depth = 0
    let inQuotes = false

    for (let i = 0; i < content.length; i++) {
      const char = content[i]

      if (char === '"' || char === "'") {
        inQuotes = !inQuotes
      }

      if (!inQuotes) {
        if (char === '(') {
          depth++
        } else if (char === ')') {
          depth--
        } else if (char === ',' && depth === 0) {
          parts.push(current.trim())
          current = ''
          continue
        }
      }

      current += char
    }

    if (current.trim()) {
      parts.push(current.trim())
    }

    return parts
  }

  /**
   * 创建类型的默认值
   */
  static createDefaultValue(typed: Typed): any {
    // 处理数组类型
    if (typed.dimensions.length > 0) {
      return []
    }

    // 处理原始类型
    if (typed.primitive !== null) {
      switch (typed.primitive) {
        case Primitive.BOOLEAN:
          return false
        case Primitive.NUMBER:
          return 0
        case Primitive.STRING:
          return ''
        default:
          return null
      }
    }

    // 处理复合类型
    if (typed.attributes && typed.attributes.length > 0) {
      const obj: any = {}
      for (const attr of typed.attributes) {
        obj[attr.id] = this.createDefaultValue(attr.type)
      }
      return obj
    }

    return null
  }

  /**
   * 比较两个类型是否相等
   */
  static equals(a: Typed, b: Typed): boolean {
    // 比较原始类型
    if (a.primitive !== b.primitive) {
      return false
    }

    // 比较维度
    if (a.dimensions.length !== b.dimensions.length) {
      return false
    }
    for (let i = 0; i < a.dimensions.length; i++) {
      if (a.dimensions[i] !== b.dimensions[i]) {
        return false
      }
    }

    // 比较属性
    if (a.attributes.length !== b.attributes.length) {
      return false
    }
    for (let i = 0; i < a.attributes.length; i++) {
      const attrA = a.attributes[i]
      const attrB = b.attributes[i]
      if (attrA.id !== attrB.id || !this.equals(attrA.type, attrB.type)) {
        return false
      }
    }

    return true
  }

  /**
   * 深度克隆类型定义
   */
  static clone(typed: Typed): Typed {
    return {
      dimensions: [...typed.dimensions],
      attributes: typed.attributes.map((attr) => ({
        ...attr,
        type: this.clone(attr.type),
      })),
      primitive: typed.primitive,
    }
  }
}
