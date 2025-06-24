# Start节点备份

## 备份时间
2025-01-24

## 备份原因
ECS架构重构：从实体关联的start节点改为模块关联的start节点

## 备份内容
- `entity-based-start/`: 原有的实体关联start节点实现
  - `index.ts`: 节点注册配置
  - `form-meta.tsx`: 表单元数据，包含实体相关的表单组件

## 原有架构
- Start节点直接关联实体
- 通过FormEntityMetas组件处理实体元数据
- 工作流图以实体ID命名，一对一关联

## 新架构
- Start节点关联模块（Component）
- 支持多个模块参与同一个系统
- 工作流图独立命名，可关联多个模块

## 恢复方法
如需恢复原有实现，将`entity-based-start/`目录内容复制回`src/nodes/start/`
