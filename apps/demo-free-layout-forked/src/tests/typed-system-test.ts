/**
 * 仿真平台类型系统测试
 * 对应Java后端的TypeTest测试用例
 */

import { TypedParser, Primitive as PrimitiveType } from '../typings/mas/typed';
import { SimulationTypeConverter } from '../typings/mas/type-converter';
import { AttributeParser } from '../typings/mas/attribute';

/**
 * 测试用例定义
 */
interface TestCase {
  name: string;
  input: string;
  expected: any;
}

/**
 * 类型系统测试类
 */
export class TypedSystemTest {
  /**
   * 测试简单类型解析
   */
  static testSimpleTypes() {
    console.log('=== 测试简单类型解析 ===');

    const testCases: TestCase[] = [
      { name: 'boolean', input: 'b', expected: PrimitiveType.BOOLEAN },
      { name: 'number', input: 'n', expected: PrimitiveType.NUMBER },
      { name: 'string', input: 's', expected: PrimitiveType.STRING },
      { name: 'unknown', input: 'u', expected: PrimitiveType.UNKNOWN },
    ];

    testCases.forEach((testCase) => {
      try {
        const result = TypedParser.fromString(testCase.input);
        const success = result.primitive === testCase.expected;
        console.log(
          `${testCase.name}: ${success ? '✓' : '✗'} (${testCase.input} -> ${result.primitive})`
        );
      } catch (error) {
        console.log(`${testCase.name}: ✗ Error: ${error}`);
      }
    });
  }

  /**
   * 测试带ID的简单字段
   */
  static testSimpleFields() {
    console.log('\n=== 测试带ID的简单字段 ===');

    const testCases: TestCase[] = [
      {
        name: 'bool field',
        input: 'bool:b',
        expected: { id: 'bool', primitive: PrimitiveType.BOOLEAN },
      },
      {
        name: 'number field',
        input: 'num:n',
        expected: { id: 'num', primitive: PrimitiveType.NUMBER },
      },
      {
        name: 'string field',
        input: 'str:s',
        expected: { id: 'str', primitive: PrimitiveType.STRING },
      },
      {
        name: 'unknown field',
        input: 'obj:u',
        expected: { id: 'obj', primitive: PrimitiveType.UNKNOWN },
      },
    ];

    testCases.forEach((testCase) => {
      try {
        const result = AttributeParser.fromString(testCase.input);
        const success =
          result.id === testCase.expected.id &&
          result.type.primitive === testCase.expected.primitive;
        console.log(`${testCase.name}: ${success ? '✓' : '✗'} (${testCase.input})`);
      } catch (error) {
        console.log(`${testCase.name}: ✗ Error: ${error}`);
      }
    });
  }

  /**
   * 测试数组类型
   */
  static testArrayTypes() {
    console.log('\n=== 测试数组类型 ===');

    const testCases: TestCase[] = [
      {
        name: '2D number array',
        input: 'n[2][3]',
        expected: { dimensions: [2, 3], primitive: PrimitiveType.NUMBER },
      },
      {
        name: 'dynamic 2D array',
        input: 'n[][]',
        expected: { dimensions: [-1, -1], primitive: PrimitiveType.NUMBER },
      },
      { name: 'field with array', input: 'kernel:n[2][3]', expected: { id: 'kernel' } },
      { name: 'dynamic field array', input: 'location:n[][]', expected: { id: 'location' } },
    ];

    testCases.forEach((testCase) => {
      try {
        if (testCase.input.includes(':')) {
          const result = AttributeParser.fromString(testCase.input);
          const success = result.id === testCase.expected.id;
          console.log(`${testCase.name}: ${success ? '✓' : '✗'} (${testCase.input})`);
        } else {
          const result = TypedParser.fromString(testCase.input);
          const success =
            JSON.stringify(result.dimensions) === JSON.stringify(testCase.expected.dimensions) &&
            result.primitive === testCase.expected.primitive;
          console.log(`${testCase.name}: ${success ? '✓' : '✗'} (${testCase.input})`);
        }
      } catch (error) {
        console.log(`${testCase.name}: ✗ Error: ${error}`);
      }
    });
  }

  /**
   * 测试复合类型
   */
  static testComplexTypes() {
    console.log('\n=== 测试复合类型 ===');

    const testCases: TestCase[] = [
      {
        name: 'simple complex',
        input: '(num:n, str:s)',
        expected: { attributeCount: 2 },
      },
      {
        name: 'nested complex',
        input: '(num:n, inner:(str:s, obj:u))',
        expected: { attributeCount: 2 },
      },
      {
        name: 'complex array',
        input: '(node:s,control:n[3][2])[]',
        expected: { dimensions: [-1], attributeCount: 2 },
      },
    ];

    testCases.forEach((testCase) => {
      try {
        const result = TypedParser.fromString(testCase.input);
        let success = false;

        if (testCase.expected.dimensions) {
          success =
            JSON.stringify(result.dimensions) === JSON.stringify(testCase.expected.dimensions) &&
            result.attributes.length === testCase.expected.attributeCount;
        } else {
          success = result.attributes.length === testCase.expected.attributeCount;
        }

        console.log(`${testCase.name}: ${success ? '✓' : '✗'} (${testCase.input})`);
      } catch (error) {
        console.log(`${testCase.name}: ✗ Error: ${error}`);
      }
    });
  }

  /**
   * 测试复合字段
   */
  static testComplexFields() {
    console.log('\n=== 测试复合字段 ===');

    const testCases: TestCase[] = [
      {
        name: 'coordinates field',
        input: 'coordinates:(lons:n, lats:n)',
        expected: { id: 'coordinates', attributeCount: 2 },
      },
      {
        name: 'nested instance field',
        input: 'instance:(id:s, index:n, coordinates:(lons:n, lats:n))',
        expected: { id: 'instance', attributeCount: 3 },
      },
    ];

    testCases.forEach((testCase) => {
      try {
        const result = AttributeParser.fromString(testCase.input);
        const success =
          result.id === testCase.expected.id &&
          result.type.attributes.length === testCase.expected.attributeCount;
        console.log(`${testCase.name}: ${success ? '✓' : '✗'} (${testCase.input})`);
      } catch (error) {
        console.log(`${testCase.name}: ✗ Error: ${error}`);
      }
    });
  }

  /**
   * 测试类型转换
   */
  static testTypeConversion() {
    console.log('\n=== 测试类型转换 ===');

    const testCases = [
      'num:n',
      'coordinates:(x:n, y:n)',
      'matrix:n[3][3]',
      'agents:(id:s, position:(x:n, y:n))[]',
    ];

    testCases.forEach((input) => {
      try {
        // 解析为仿真类型
        const attr = AttributeParser.fromString(input);

        // 转换为工作流类型
        const entityProperty = SimulationTypeConverter.typedToEntityProperty(attr.type);

        // 再转换回仿真类型
        const backToTyped = SimulationTypeConverter.entityPropertyToTyped(entityProperty);

        // 检查是否一致
        const isEqual = TypedParser.equals(attr.type, backToTyped);

        console.log(`${input}: ${isEqual ? '✓' : '✗'} (双向转换)`);
      } catch (error) {
        console.log(`${input}: ✗ Error: ${error}`);
      }
    });
  }

  /**
   * 测试基本仿真实体创建
   */
  static testSimulationEntityCreation() {
    console.log('\n=== 测试仿真实体创建 ===');

    try {
      // 创建基本智能体
      const basicAgent = {
        id: 'agent001',
        attributes: [
          {
            id: 'a1',
            type: 'string',
            name: 'name',
            desc: '智能体名称',
            value: 'Agent001',
            history: [],
          },
          { id: 'a2', type: 'number', name: 'x', desc: 'X坐标', value: 100, history: [] },
          { id: 'a3', type: 'number', name: 'y', desc: 'Y坐标', value: 200, history: [] },
        ],
        bundles: [],
      };
      console.log(`基础智能体创建: ✓ (${basicAgent.attributes.length} 属性)`);
    } catch (error) {
      console.log(`仿真实体创建测试: ✗ Error: ${error}`);
    }
  }

  /**
   * 运行所有测试
   */
  static runAllTests() {
    console.log('开始运行仿真平台类型系统测试...\n');

    this.testSimpleTypes();
    this.testSimpleFields();
    this.testArrayTypes();
    this.testComplexTypes();
    this.testComplexFields();
    this.testTypeConversion();
    this.testSimulationEntityCreation();

    console.log('\n测试完成！');
  }
}

/**
 * 使用示例
 */
export class TypedSystemExamples {
  /**
   * 基本使用示例
   */
  static basicUsageExample() {
    console.log('\n=== 基本使用示例 ===');

    // 1. 解析简单类型
    const numberType = TypedParser.fromString('n');
    console.log('数值类型:', TypedParser.toString(numberType));

    // 2. 解析属性
    const positionAttr = AttributeParser.fromString('position:(x:n, y:n)');
    console.log('位置属性:', AttributeParser.toString(positionAttr));

    // 3. 解析数组类型
    const matrixType = TypedParser.fromString('n[3][3]');
    console.log('矩阵类型:', TypedParser.toString(matrixType));

    // 4. 创建默认值
    const defaultValue = TypedParser.createDefaultValue(positionAttr.type);
    console.log('位置属性默认值:', defaultValue);

    // 5. 类型转换
    const entityProperty = SimulationTypeConverter.typedToEntityProperty(positionAttr.type);
    console.log('转换为工作流类型:', entityProperty);
  }

  /**
   * 复杂使用示例
   */
  static complexUsageExample() {
    console.log('\n=== 复杂使用示例 ===');

    // 创建复杂类型示例
    const complexType = TypedParser.fromString('(id:s, position:(x:n, y:n), sensors:n[8])');
    console.log('复杂类型:', TypedParser.toString(complexType));
    console.log('属性数量:', complexType.attributes.length);

    // 获取默认属性值
    const defaultValues = TypedParser.createDefaultValue(complexType);
    console.log('复杂类型默认值:', defaultValues);
  }
}

// 如果在浏览器环境中，可以直接运行测试
if (typeof window !== 'undefined') {
  // TypedSystemTest.runAllTests();
  // TypedSystemExamples.basicUsageExample();
  // TypedSystemExamples.complexUsageExample();
}
