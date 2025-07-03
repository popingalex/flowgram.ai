import {
  AttributeUtils,
  EntityUtils,
  ModuleUtils,
  BehaviorUtils,
  SystemUtils,
  ScenarioUtils
} from './types'
import { TypedParser } from './types/typed'

// 演示如何使用nanoid创建各种索引对象
console.log('=== nanoid 索引对象创建演示 ===')

// 1. 创建属性
const position = AttributeUtils.createAttribute(
  '位置',
  TypedParser.fromString('(x:n, y:n)'),
  { x: 100, y: 200 }
)
console.log('创建属性:', position)

const velocity = AttributeUtils.createAttribute(
  '速度',
  TypedParser.fromString('n[]'),
  [10, 20, 30]
)
console.log('创建速度属性:', velocity)

// 2. 创建实体
const helicopter = EntityUtils.createEntity('直升机', '救援直升机')
console.log('创建实体:', helicopter)

// 3. 创建模块
const mobileModule = ModuleUtils.createModule('移动模块', '提供移动能力')
console.log('创建模块:', mobileModule)

// 4. 创建行为
const flyBehavior = BehaviorUtils.createBehavior('飞行', 'builtin', {
  speed: 50,
  altitude: 1000
})
console.log('创建行为:', flyBehavior)

// 5. 创建系统
const movementSystem = SystemUtils.createSystem('移动系统', '处理所有移动相关逻辑')
console.log('创建系统:', movementSystem)

// 6. 创建场景
const rescueScenario = ScenarioUtils.createScenario('救援场景', '山区救援演习')
console.log('创建场景:', rescueScenario)

// 7. 展示nanoid的特点
console.log('\n=== nanoid 特点演示 ===')
console.log('属性 _indexId:', position._indexId, '(长度:', position._indexId.length, ')')
console.log('实体 _indexId:', helicopter._indexId, '(长度:', helicopter._indexId.length, ')')
console.log('模块 _indexId:', mobileModule._indexId, '(长度:', mobileModule._indexId.length, ')')

// 8. 验证每次生成的ID都不同
const entity1 = EntityUtils.createEntity('实体1')
const entity2 = EntityUtils.createEntity('实体2')
console.log('\n=== 唯一性验证 ===')
console.log('实体1 _indexId:', entity1._indexId)
console.log('实体2 _indexId:', entity2._indexId)
console.log('ID是否不同:', entity1._indexId !== entity2._indexId)

export {
  position,
  velocity,
  helicopter,
  mobileModule,
  flyBehavior,
  movementSystem,
  rescueScenario
}
