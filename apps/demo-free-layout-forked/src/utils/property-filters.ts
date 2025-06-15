import type { Attribute } from '../services/types';

/**
 * 过滤实体扩展属性（排除模块属性和基础属性）
 * 用于 Start 节点展示实体专有的扩展属性
 */
export const filterEntityExtendedProperties = (attributes: Attribute[]): Attribute[] =>
  attributes.filter((attr) => !attr.isModuleProperty && !attr.isEntityProperty);

/**
 * 过滤模块属性
 * 用于侧边栏模块属性表展示
 */
export const filterModuleProperties = (attributes: Attribute[]): Attribute[] =>
  attributes.filter((attr) => attr.isModuleProperty);

/**
 * 过滤基础属性（meta属性）
 * 用于侧边栏基础属性表单展示
 */
export const filterMetaProperties = (attributes: Attribute[]): Attribute[] =>
  attributes.filter((attr) => attr.isEntityProperty);

/**
 * 按模块分组模块属性
 * 用于侧边栏按模块分组展示模块属性
 */
export const groupModuleProperties = (attributes: Attribute[]): Record<string, Attribute[]> => {
  const moduleProperties = filterModuleProperties(attributes);

  return moduleProperties.reduce((groups, attr) => {
    const moduleId = attr.moduleId || 'unknown';
    if (!groups[moduleId]) {
      groups[moduleId] = [];
    }
    groups[moduleId].push(attr);
    return groups;
  }, {} as Record<string, Attribute[]>);
};

/**
 * 获取属性统计信息
 * 用于调试和监控
 */
export const getPropertyStats = (attributes: Attribute[]) => {
  const metaProperties = filterMetaProperties(attributes);
  const extendedProperties = filterEntityExtendedProperties(attributes);
  const moduleProperties = filterModuleProperties(attributes);

  return {
    total: attributes.length,
    meta: metaProperties.length,
    extended: extendedProperties.length,
    module: moduleProperties.length,
    moduleGroups: Object.keys(groupModuleProperties(attributes)).length,
  };
};

/**
 * 验证属性分类的完整性
 * 确保所有属性都被正确分类
 */
export const validatePropertyClassification = (attributes: Attribute[]): boolean => {
  const stats = getPropertyStats(attributes);
  return stats.meta + stats.extended + stats.module === stats.total;
};
