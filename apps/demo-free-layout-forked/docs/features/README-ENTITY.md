# 多智能体实体属性编辑器

## 功能概述

已成功为 Flowgram 工作流引擎扩展了多智能体实体属性编辑功能。现在 Start 节点具备完整的实体属性管理能力。

## 主要功能

### 1. 实体基础属性
- **ID**: 实体唯一标识符
- **名称**: 实体显示名称
- **标签**: 实体分类标签（支持多个，逗号分隔）
- **描述**: 实体详细描述

### 2. LLM工作流参数
- **模型选择**: 支持 GPT-4、GPT-3.5、Claude 3 等主流模型
- **Temperature**: 控制生成内容的随机性 (0-2)
- **最大Token数**: 限制生成内容的长度 (1-8192)
- **系统提示词**: 定义 AI 角色和行为规范

### 3. 扩展性
- 支持自定义属性扩展
- 可作为多智能体系统的行为树节点
- 与现有工作流系统完全兼容

## 使用方法

1. **启动项目**
   ```bash
   rush dev:demo-free-layout-forked
   ```

2. **编辑实体属性**
   - 在工作流画布中选择 Start 节点
   - 在右侧属性面板中编辑实体属性
   - 实时预览和保存更改

3. **配置 LLM 参数**
   - 选择适合的模型
   - 调整温度和Token限制
   - 编写系统提示词

## 技术实现

### 新增文件结构
```
src/
├── typings/
│   └── entity.ts              # 实体类型定义
├── form-components/
│   ├── entity-attributes-form.tsx  # 实体属性表单组件
│   └── entity-attributes-form.css  # 样式文件
└── nodes/start/
    └── form-meta.tsx          # 修改后的 Start 节点表单
```

### 核心接口
```typescript
interface EntityAttributes {
  id: string;
  name: string;
  tags: string[];
  description: string;
  llmConfig?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  };
  customAttributes?: Record<string, any>;
}
```

## 项目访问

- **本地地址**: http://localhost:3001
- **功能入口**: Start 节点属性面板

## 下一步扩展

1. **多实体管理**: 支持创建和管理多个智能体实体
2. **行为树编辑**: 为每个实体定义复杂的行为逻辑
3. **实体间通信**: 实现智能体之间的消息传递
4. **运行时监控**: 实时监控实体状态和行为执行
5. **模板系统**: 提供常用实体类型模板

## 特性亮点

- ✅ 表单式直观编辑
- ✅ 实时数据同步
- ✅ 类型安全的数据结构
- ✅ 响应式 UI 设计
- ✅ 可扩展的架构设计
- ✅ 与现有系统无缝集成
