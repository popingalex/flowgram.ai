# Simulator 类型系统

基于原始项目的类型定义，完全重新设计的数据结构管理系统，充分利用 TypeScript 进行类型管理。

## 🚀 v1.1.0 更新 - 类型系统清理整合

### 重要变更
- ✅ **移除冗余类型别名**：`UniqueId`, `Name`, `Description`, `Version`, `Tag`, `BaseValue` 等，直接使用 `string` 类型
- ✅ **移除未使用工具类型**：`DeepReadonly`, `DeepPartial`, `KeyValuePair`, `Optional`, `RequiredFields`
- ✅ **简化过度设计**：`Operator` 枚举简化为 `OPERATION_SET` 常量
- ✅ **保持兼容性**：所有业务逻辑功能完全保持不变

### 清理效果
- 📦 **更轻量**：类型定义文件减少约 30% 的代码量
- 🎯 **更专注**：只保留有实际业务价值的类型定义
- 🚀 **更高效**：减少不必要的类型转换和别名解析
- 🧹 **更清晰**：去除冗余，突出核心业务逻辑

## 核心特性

### 1. 基础索引数据对象
提供 `_indexId` 的基类，所有需要索引的数据对象都继承此接口：

```typescript
interface Indexed {
  _indexId: string // nanoid 索引，用于 React key 和内部关联
}
```

### 2. 可与字符串相互转换的类型（不需要索引）
支持类型定义的字符串表示和解析：

```typescript
// 创建类型
const personType = TypedFactory.object([
  { id: 'name', type: TypedFactory.string() },
  { id: 'age', type: TypedFactory.number() }
])

// 转换为字符串
const typeString = TypedParser.toString(personType) // "(name:s, age:n)"

// 从字符串解析
const parsedType = TypedParser.fromString("(name:s, age:n)")
```

### 3. 带类型和值的属性（需要索引）
属性系统支持类型定义、值存储和历史记录：

```typescript
// 创建属性
const nameAttr = AttributeFactory.string('name', '姓名', '张三')
const ageAttr = AttributeFactory.number('age', '年龄', 25)

// 更新属性值
const updatedAttr = AttributeParser.updateValue(nameAttr, '李四')
```

### 4. 带模块的实体（需要索引）
实体系统支持属性管理和模块关联：

```typescript
// 创建实体
const userEntity = EntityFactory.basic('user', '用户实体')

// 添加属性
const entityWithAttrs = EntityParser.addAttribute(userEntity, nameAttr)

// 添加模块关联
const entityWithModule = EntityParser.addModule(entityWithAttrs, moduleIndexId)
```

### 5. 带属性和嵌套模块的模块（需要索引）
模块系统支持层级结构和属性管理：

```typescript
// 创建模块
const authModule = ModuleFactory.core('auth', '认证模块')

// 添加子模块
const moduleWithSub = ModuleParser.addSubModule(authModule, subModuleIndexId)

// 检查循环依赖
const hasCycle = ModuleList.checkCircularDependency(moduleIndexId)
```

### 6. 与模块关联，包含行为的系统（需要索引）
ECS 风格的系统定义：

```typescript
// 创建系统
const authSystem = SystemFactory.highPriority('auth_system', '认证系统')

// 添加模块和行为
const systemWithBehavior = SystemParser.addBehavior(authSystem, behaviorIndexId)
```

### 7. 包含属性的三种行为（远程、内置、脚本）（需要索引）
支持三种类型的行为定义：

```typescript
// 远程服务行为
const apiCall = BehaviorFactory.httpGet('api_call', 'API调用', 'https://api.example.com/users')

// 脚本行为
const jsFunction = BehaviorFactory.javascript('process', '数据处理', 'function process(data) { return data }')

// 内置函数行为
const validator = BehaviorFactory.builtin('validator', '验证器', 'validateUserData')
```

## 主要组件

### 枚举和常量 (`enums.ts`)
- `Primitive`: 原始类型枚举（对应 Java 后端）
- `BehaviorCodeType`: 行为代码类型
- `EditStatus`: 编辑状态
- `SystemPriority`: 系统优先级
- `OPERATION_SET`: 操作常量（简化后）

### 基础类型 (`base.ts`, `indexed.ts`)
- 通用接口和必要的函数类型
- 索引对象基类和工具
- **已移除**：冗余的字符串类型别名

### 类型系统 (`typed.ts`)
- `Typed`: 类型定义接口
- `TypedParser`: 类型解析器
- `TypedFactory`: 类型工厂

### 属性系统 (`attribute.ts`)
- `Attribute`: 属性接口
- `AttributeParser`: 属性解析器
- `AttributeList`: 属性列表管理器
- `AttributeFactory`: 属性工厂

### 实体系统 (`entity.ts`)
- `Entity`: 实体接口
- `EntityParser`: 实体解析器
- `EntityList`: 实体列表管理器
- `EntityFactory`: 实体工厂

### 模块系统 (`module.ts`)
- `Module`: 模块接口
- `ModuleParser`: 模块解析器
- `ModuleList`: 模块列表管理器
- `ModuleFactory`: 模块工厂

### 系统 (`system.ts`)
- `System`: 系统接口
- `SystemParser`: 系统解析器
- `SystemList`: 系统列表管理器
- `SystemFactory`: 系统工厂

### 行为系统 (`behavior.ts`)
- `Behavior`: 行为接口
- `BehaviorParser`: 行为解析器
- `BehaviorList`: 行为列表管理器
- `BehaviorFactory`: 行为工厂

### 转换器 (`converters.ts`)
- `TypeConverter`: 类型转换器
- `AttributeConverter`: 属性转换器
- `EntityConverter`: 实体转换器
- `DataConverter`: 通用数据转换器

### 验证器 (`validators.ts`)
- `TypeValidator`: 类型验证器
- `AttributeValidator`: 属性验证器
- `EntityValidator`: 实体验证器
- `ValidationFactory`: 验证函数工厂

## 使用示例

### 基础用法

```typescript
import {
  TypedFactory,
  AttributeFactory,
  EntityFactory,
  ModuleFactory,
  SystemFactory,
  BehaviorFactory
} from '@/types'

// 1. 创建类型
const userType = TypedFactory.object([
  { id: 'name', type: TypedFactory.string() },
  { id: 'email', type: TypedFactory.string() },
  { id: 'age', type: TypedFactory.number() }
])

// 2. 创建属性
const nameAttr = AttributeFactory.string('name', '用户名')
const emailAttr = AttributeFactory.string('email', '邮箱')
const ageAttr = AttributeFactory.number('age', '年龄')

// 3. 创建实体
const userEntity = EntityFactory.withAttributes(
  'user',
  '用户',
  [nameAttr, emailAttr, ageAttr]
)

// 4. 创建模块
const userModule = ModuleFactory.core('user_module', '用户模块')

// 5. 创建系统
const userSystem = SystemFactory.basic('user_system', '用户系统')

// 6. 创建行为
const getUserBehavior = BehaviorFactory.httpGet(
  'get_user',
  '获取用户',
  '/api/users/{id}'
)
```

### 高级用法

```typescript
// 类型转换
const jsonSchema = TypeConverter.typedToJsonSchemaProperty(userType)
const backToType = TypeConverter.jsonSchemaPropertyToTyped(jsonSchema)

// 属性验证
const validation = AttributeValidator.validateAttribute(nameAttr)
if (!validation.valid) {
  console.error('验证失败:', validation.errors)
}

// 实体管理
const entityList = new EntityList([userEntity])
entityList.add(anotherEntity)
const foundEntity = entityList.findById('user')

// 模块层级管理
const moduleList = new ModuleList([userModule])
const hasCircularDep = moduleList.checkCircularDependency('user_module')

// 系统优先级管理
const systemList = new SystemList([userSystem])
const sortedSystems = systemList.sortByPriority()

// 行为管理
const behaviorList = new BehaviorList([getUserBehavior])
const remoteBehaviors = behaviorList.filterByType(BehaviorCodeType.REMOTE)
```

## 测试和演示

运行完整的系统演示：

```bash
npx tsx src/types/demo.ts
```

或在代码中调用：

```typescript
import { runAllDemos } from '@/types/demo'
runAllDemos()
```

## 迁移指南

### 从旧版本迁移

如果您在使用旧版本的类型别名，请按以下方式更新：

```typescript
// ❌ 旧版本
import { UniqueId, Name, Description } from '@/types/base'
const id: UniqueId = 'user_123'
const name: Name = '用户名'
const desc: Description = '用户描述'

// ✅ 新版本
const id: string = 'user_123'
const name: string = '用户名'
const desc: string = '用户描述'
```

### 操作类型更新

```typescript
// ❌ 旧版本
import { Operator } from '@/types/enums'
AttributeParser.updateValue(attr, newValue, Operator.SET)

// ✅ 新版本
import { OPERATION_SET } from '@/types/enums'
AttributeParser.updateValue(attr, newValue, OPERATION_SET)
// 或者直接使用默认值
AttributeParser.updateValue(attr, newValue) // 默认使用 SET 操作
```

## 最佳实践

1. **类型安全**：充分利用 TypeScript 的类型检查
2. **不可变性**：使用解析器方法创建新对象而不是直接修改
3. **验证优先**：在数据处理前使用验证器
4. **工厂模式**：使用工厂类创建标准化对象
5. **索引管理**：合理使用 `_indexId` 进行对象关联

## 性能优化

1. **减少类型转换**：直接使用 string 而不是类型别名
2. **批量操作**：使用列表管理器进行批量处理
3. **懒加载验证**：仅在必要时进行数据验证
4. **缓存结果**：对频繁使用的转换结果进行缓存

## 注意事项

1. 所有修改操作都会返回新对象，保持数据不可变性
2. `_indexId` 用于 React key，确保组件稳定性
3. 类型字符串格式遵循简化规则：`s`(string), `n`(number), `b`(boolean)
4. 验证结果包含详细的错误和警告信息
5. 模块系统会自动检查循环依赖

## 版本历史

- **v1.1.0**: 类型系统清理整合，移除冗余类型别名
- **v1.0.0**: 初始版本，完整的类型系统实现 