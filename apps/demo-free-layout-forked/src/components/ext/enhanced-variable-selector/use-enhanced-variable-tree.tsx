import React, { useCallback } from 'react';

import { useScopeAvailable, ASTMatch, BaseVariableField } from '@flowgram.ai/free-layout-editor';
import { ArrayIcons, VariableTypeIcons } from '@flowgram.ai/form-materials';
import { JsonSchemaUtils } from '@flowgram.ai/form-materials';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { Icon } from '@douyinfe/semi-ui';

type VariableField = BaseVariableField<{ icon?: string | JSX.Element; title?: string }>;

export function useEnhancedVariableTree(params: {
  includeSchema?: IJsonSchema | IJsonSchema[];
  excludeSchema?: IJsonSchema | IJsonSchema[];
}): TreeNodeData[] {
  const { includeSchema, excludeSchema } = params;

  const available = useScopeAvailable();

  const getVariableTypeIcon = useCallback((variable: VariableField) => {
    if (variable.meta?.icon) {
      if (typeof variable.meta.icon === 'string') {
        return <img style={{ marginRight: 8 }} width={12} height={12} src={variable.meta.icon} />;
      }

      return variable.meta.icon;
    }

    const _type = variable.type;

    if (ASTMatch.isArray(_type)) {
      return (
        <Icon
          size="small"
          svg={ArrayIcons[_type.items?.kind.toLowerCase()] || VariableTypeIcons.array}
        />
      );
    }

    if (ASTMatch.isCustomType(_type)) {
      const typeName = _type.typeName;
      if (typeName && typeof typeName === 'string') {
        return <Icon size="small" svg={VariableTypeIcons[typeName.toLowerCase()]} />;
      }
      // 如果typeName无效，返回默认图标
      return <Icon size="small" svg={VariableTypeIcons.object} />;
    }

    return <Icon size="small" svg={VariableTypeIcons[variable.type?.kind.toLowerCase()]} />;
  }, []);

  const renderVariable = (
    variable: VariableField,
    parentFields: VariableField[] = []
  ): TreeNodeData | null => {
    let type = variable?.type;

    if (!type) {
      return null;
    }

    let children: TreeNodeData[] | undefined;

    if (ASTMatch.isObject(type)) {
      // 🎯 特殊处理$start节点，按模块分组显示
      if (variable.key === '$start' && parentFields.length === 0) {
        const properties = type.properties || [];
        const entityProperties: VariableField[] = [];
        const moduleGroups: Record<string, VariableField[]> = {};
        const contextProperties: VariableField[] = [];

        // 分类属性
        properties.forEach((_property) => {
          const prop = _property as VariableField;
          const propMeta = prop.meta as any;

          if (propMeta?.isContextProperty) {
            // 上下文属性
            contextProperties.push(prop);
          } else if (propMeta?.isModuleProperty && propMeta?.moduleId) {
            // 模块属性
            if (!moduleGroups[propMeta.moduleId]) {
              moduleGroups[propMeta.moduleId] = [];
            }
            moduleGroups[propMeta.moduleId].push(prop);
          } else {
            // 实体属性
            entityProperties.push(prop);
          }
        });

        children = [];

        // 添加实体属性
        entityProperties.forEach((prop) => {
          const rendered = renderVariable(prop, [...parentFields, variable]);
          if (rendered && children) children.push(rendered);
        });

        // 添加模块分组
        Object.entries(moduleGroups).forEach(([moduleId, moduleProps]) => {
          if (moduleProps.length > 0) {
            const moduleName = (moduleProps[0].meta as any)?.moduleName || moduleId;

            // 创建模块分组节点
            const moduleGroupNode: TreeNodeData = {
              key: `${variable.key}.${moduleId}`,
              label: `${moduleId} (${moduleName})`,
              value: `${variable.key}.${moduleId}`,
              keyPath: [variable.key, moduleId],
              icon: <Icon size="small" svg={VariableTypeIcons.object} />,
              disabled: true, // 分组节点不可选中
              children: moduleProps
                .map((prop) => {
                  const rendered = renderVariable(prop, [...parentFields, variable]);
                  return rendered;
                })
                .filter(Boolean) as TreeNodeData[],
            };

            if (children) children.push(moduleGroupNode);
          }
        });

        // 添加上下文属性
        contextProperties.forEach((prop) => {
          const rendered = renderVariable(prop, [...parentFields, variable]);
          if (rendered && children) children.push(rendered);
        });
      } else {
        // 普通object节点的处理
        children = (type.properties || [])
          .map((_property) =>
            renderVariable(_property as VariableField, [...parentFields, variable])
          )
          .filter(Boolean) as TreeNodeData[];
      }

      if (!children?.length) {
        return null;
      }
    }

    const keyPath = [...parentFields.map((_field) => _field.key), variable.key];
    const key = keyPath.join('.');

    const isSchemaInclude = includeSchema
      ? JsonSchemaUtils.isASTMatchSchema(type, includeSchema)
      : true;
    const isSchemaExclude = excludeSchema
      ? JsonSchemaUtils.isASTMatchSchema(type, excludeSchema)
      : false;
    const isSchemaMatch = isSchemaInclude && !isSchemaExclude;

    // 🎯 检查是否为对象容器（Context、模块等）或$start节点
    const variableMeta = variable.meta as any;
    const isObjectContainer =
      variableMeta?.isObjectContainer ||
      variableMeta?.isContextProperty ||
      variableMeta?.isModuleProperty;

    // 🎯 检查是否为$start节点（根节点）
    const isStartNode = variable.key === '$start' && parentFields.length === 0;

    // 🎯 如果不匹配schema且没有children则不显示
    if (!isSchemaMatch && !children?.length) {
      return null;
    }

    // 🎯 $start节点不可直接选中，只能展开
    const shouldDisable = !isSchemaMatch || (!!children?.length && isStartNode);

    // 🎯 构建左右布局的label - 显示ID和中文名
    const labelElement = variable.meta?.title ? (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
        }}
      >
        <span>{variable.key}</span>
        <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
          {variable.meta.title}
        </span>
      </div>
    ) : (
      variable.key
    );

    return {
      key: key,
      label: labelElement,
      value: key,
      keyPath,
      icon: getVariableTypeIcon(variable),
      children,
      disabled: shouldDisable,
      rootMeta: parentFields[0]?.meta,
    };
  };

  return [...available.variables.slice(0).reverse()]
    .map((_variable) => renderVariable(_variable as VariableField))
    .filter(Boolean) as TreeNodeData[];
}
