/**
 * 仿真平台属性定义 - 与Java后端完全对应
 * 对应Java类: com.gsafety.simulation.domain.attribute.Attribute
 */

import { Typed, Primitive, TypedParser } from './typed';

/**
 * 阶段接口 - 对应Java Stage类
 */
export interface Stage {
  index: string;
}

/**
 * 操作类型枚举 - 对应Java Operator枚举
 */
export enum Operator {
  SET = 'SET',
}

/**
 * 变更记录接口 - 对应Java Change类
 */
export interface Change {
  value: any;
  operator: Operator;
  segments: string[];
}

/**
 * 提交记录接口 - 对应Java Commit类
 */
export interface Commit {
  /** 提交索引 */
  index: string;
  /** 目标值 */
  target: any;
  /** 变更列表 */
  changes?: Change[];
}

/**
 * 属性接口 - 完全对应Java Attribute类
 */
export interface Attribute {
  /** 属性ID */
  id: string;
  /** 属性类型 */
  type: Typed;
  /** 属性名称 */
  name?: string;
  /** 属性描述 */
  desc?: string;
  /** 属性值 */
  value?: any;
  /** 当前游标 (对应@JsonIgnore字段，不参与序列化) */
  cursor?: Stage;
  /** 历史记录 */
  history: Commit[];
}

/**
 * 属性解析器 - 对应Java Attribute.fromString方法
 */
export class AttributeParser {
  /**
   * 从字符串解析属性
   * 对应Java Attribute.fromString方法
   */
  static fromString(raw: string): Attribute {
    if (!raw || !raw.trim()) {
      throw new Error('Attribute string cannot be empty');
    }

    raw = raw.replace(/\n/g, '');

    // 解析ID部分
    const colonIndex = raw.indexOf(':');
    let id: string | undefined;
    let typeString = raw;

    if (colonIndex !== -1) {
      id = raw.substring(0, colonIndex).trim();
      typeString = raw.substring(colonIndex + 1).trim();
    }

    // 解析类型
    const type = TypedParser.fromString(typeString);

    return {
      id: id || '',
      type,
      name: undefined,
      desc: undefined,
      value: undefined,
      history: [],
    };
  }

  /**
   * 将属性转换为字符串
   * 对应Java Attribute.toString方法
   */
  static toString(attr: Attribute): string {
    // 如果没有name和value，使用简化格式
    if (!attr.name && attr.value === undefined) {
      const parts: string[] = [];
      if (attr.id) parts.push(attr.id);
      if (attr.type) parts.push(TypedParser.toString(attr.type));
      return parts.join(':');
    }

    // 使用详细格式
    const parts: string[] = [];
    if (attr.id) parts.push(`id: ${attr.id}`);
    if (attr.name) parts.push(`name: ${attr.name}`);
    if (attr.value !== undefined) parts.push(`value: ${attr.value}`);

    return `Attr(${parts.join(', ')})`;
  }

  /**
   * 创建值对象属性
   * 对应Java Attribute.vo方法
   */
  static vo(id: string, value: any): Attribute {
    return {
      id,
      type: {
        dimensions: [],
        attributes: [],
        primitive: Primitive.UNKNOWN,
      },
      value,
      history: [],
    };
  }

  /**
   * 创建带默认值的属性
   */
  static withDefaultValue(id: string, type: Typed, name?: string, desc?: string): Attribute {
    return {
      id,
      type,
      name,
      desc,
      value: TypedParser.createDefaultValue(type),
      history: [],
    };
  }

  /**
   * 克隆属性
   */
  static clone(attr: Attribute): Attribute {
    return {
      ...attr,
      type: { ...attr.type, attributes: [...attr.type.attributes] },
      history: [...attr.history],
    };
  }

  /**
   * 比较两个属性是否相等
   */
  static equals(a: Attribute, b: Attribute): boolean {
    return (
      a.id === b.id &&
      TypedParser.equals(a.type, b.type) &&
      a.name === b.name &&
      a.desc === b.desc &&
      JSON.stringify(a.value) === JSON.stringify(b.value)
    );
  }
}

/**
 * 属性列表工具类 - 对应Java IList<Attribute>
 */
export class AttributeList {
  private attributes: Attribute[] = [];

  constructor(attributes: Attribute[] = []) {
    this.attributes = [...attributes];
  }

  /**
   * 添加属性
   */
  add(attribute: Attribute): void {
    this.attributes.push(attribute);
  }

  /**
   * 根据ID获取属性
   */
  get(id: string): Attribute | undefined {
    return this.attributes.find((attr) => attr.id === id);
  }

  /**
   * 检查是否包含指定ID的属性
   */
  contains(id: string): boolean {
    return this.attributes.some((attr) => attr.id === id);
  }

  /**
   * 如果不存在则添加属性
   */
  computeIfAbsent(id: string, creator: (id: string) => Attribute): Attribute {
    let attr = this.get(id);
    if (!attr) {
      attr = creator(id);
      this.add(attr);
    }
    return attr;
  }

  /**
   * 遍历所有属性
   */
  forEach(callback: (attr: Attribute) => void): void {
    this.attributes.forEach(callback);
  }

  /**
   * 获取所有属性
   */
  toArray(): Attribute[] {
    return [...this.attributes];
  }

  /**
   * 获取属性数量
   */
  get length(): number {
    return this.attributes.length;
  }

  /**
   * 转换为JSON数组
   */
  toJSON(): Attribute[] {
    return this.attributes;
  }

  /**
   * 从JSON数组创建
   */
  static fromJSON(data: Attribute[]): AttributeList {
    return new AttributeList(data);
  }
}
