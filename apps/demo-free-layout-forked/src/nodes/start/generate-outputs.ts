// 生成start节点的输出配置
import { useModuleStore } from '../../stores/module.store';
import { useCurrentEntity } from '../../stores';

export function generateStartNodeOutputs() {
  // 这个函数需要在React组件中调用，因为需要使用hooks
  const { editingEntity } = useCurrentEntity();
  const { modules } = useModuleStore();

  if (!editingEntity) {
    return {
      type: 'object',
      properties: {},
    };
  }

  const properties: Record<string, any> = {};

  // 添加实体属性
  editingEntity.attributes.forEach((attr) => {
    properties[attr.id] = {
      type: 'string', // 简化处理，都设为string
      title: attr.name,
      description: `实体属性: ${attr.name}`,
    };
  });

  // 添加完整关联的模块属性
  if (editingEntity.bundles) {
    editingEntity.bundles.forEach((bundleId) => {
      const module = modules.find((m) => m.id === bundleId);
      if (module) {
        module.attributes.forEach((attr) => {
          const propertyKey = `${module.id}/${attr.id}`;
          properties[propertyKey] = {
            type: 'string', // 简化处理
            title: attr.name,
            description: `模块属性: ${module.name}.${attr.name}`,
          };
        });
      }
    });
  }

  // 添加$context属性
  properties['$context'] = {
    type: 'object',
    title: '上下文',
    description: '工作流执行上下文',
    properties: {
      entityId: {
        type: 'string',
        title: '实体ID',
        description: '当前实体的ID',
      },
      timestamp: {
        type: 'string',
        title: '时间戳',
        description: '工作流执行时间',
      },
    },
  };

  return {
    type: 'object',
    properties,
  };
}
