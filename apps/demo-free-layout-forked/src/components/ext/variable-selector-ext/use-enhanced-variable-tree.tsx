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
    const type = variable?.type;
    if (!type) {
      return <Icon size="small" svg={VariableTypeIcons.string} />;
    }

    if (ASTMatch.isString(type)) {
      return <Icon size="small" svg={VariableTypeIcons.string} />;
    }

    if (ASTMatch.isNumber(type)) {
      return <Icon size="small" svg={VariableTypeIcons.number} />;
    }

    if (ASTMatch.isBoolean(type)) {
      return <Icon size="small" svg={VariableTypeIcons.boolean} />;
    }

    if (ASTMatch.isArray(type)) {
      return <Icon size="small" svg={ArrayIcons.array} />;
    }

    if (ASTMatch.isObject(type)) {
      return <Icon size="small" svg={VariableTypeIcons.object} />;
    }

    return <Icon size="small" svg={VariableTypeIcons.string} />;
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
          const propKey = prop.key;

          // 🎯 根据key格式判断属性类型，而不依赖meta信息
          if (propKey === '$context') {
            // $context属性
            contextProperties.push(prop);
          } else if (propKey.includes('/') && !propKey.startsWith('$')) {
            // 模块属性：格式为 "模块名/属性名"，如 "controlled/action_target"
            const [moduleId] = propKey.split('/');
            if (!moduleGroups[moduleId]) {
              moduleGroups[moduleId] = [];
            }
            moduleGroups[moduleId].push(prop);
          } else {
            // 实体属性：不包含"/"的普通属性
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
            // 🎯 使用moduleId作为显示名称，因为meta信息不可用
            const moduleName = moduleId;

            // 创建模块分组节点
            const moduleGroupNode: TreeNodeData = {
              key: `${variable.key}.module_group_${moduleId}`,
              label: (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: 'inherit',
                    fontWeight: 500,
                    fontSize: '13px',
                  }}
                >
                  {moduleName} ({moduleProps.length})
                </div>
              ),
              value: `${variable.key}.module_group_${moduleId}`,
              keyPath: [variable.key, `module_group_${moduleId}`],
              disabled: true, // 🎯 分组节点不可选中，但可以展开
              children: moduleProps
                .map((prop) => {
                  // 🎯 为模块内属性创建简化显示的节点
                  const originalKey = prop.key;

                  // 计算简化的显示名称（去掉模块前缀）
                  const simplifiedKey = originalKey.startsWith(`${moduleId}/`)
                    ? originalKey.replace(`${moduleId}/`, '')
                    : originalKey;

                  // 构建完整的keyPath（用于实际选择）
                  const fullKeyPath = [
                    ...parentFields.map((_field) => _field.key),
                    variable.key,
                    originalKey,
                  ];

                  // 🎯 构建简化的label，不再依赖meta.title
                  const simplifiedLabel = <span style={{ fontWeight: 400 }}>{simplifiedKey}</span>;

                  return {
                    key: fullKeyPath.join('.'),
                    label: simplifiedLabel,
                    value: fullKeyPath.join('.'),
                    keyPath: fullKeyPath,
                    icon: getVariableTypeIcon(prop),
                    disabled: false, // 🎯 模块内属性可以选中
                    rootMeta: variable.meta,
                  };
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

    // 🎯 检查是否为$context节点
    const isContextNode =
      variable.key === '$context' && parentFields.length === 1 && parentFields[0]?.key === '$start';

    // 🎯 检查是否为$start节点（根节点）
    const isStartNode = variable.key === '$start' && parentFields.length === 0;

    // 🎯 如果不匹配schema且没有children则不显示
    if (!isSchemaMatch && !children?.length) {
      return null;
    }

    // 🎯 禁用逻辑：
    // - $context节点：不可选中，但可以展开查看子节点
    // - $start节点：如果有子节点则不可选中，但可以展开
    // - 不匹配schema的节点：不可选中
    const shouldDisable = isContextNode || (!!children?.length && isStartNode) || !isSchemaMatch;

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
        <span
          style={{
            fontWeight: isContextNode ? 500 : 400,
            color: 'inherit',
          }}
        >
          {variable.key}
        </span>
        <span
          style={{
            color: '#666',
            fontSize: '12px',
            marginLeft: '8px',
            fontStyle: 'italic',
          }}
        >
          {variable.meta.title}
        </span>
      </div>
    ) : (
      <span
        style={{
          fontWeight: isContextNode ? 500 : 400,
          color: 'inherit',
        }}
      >
        {variable.key}
      </span>
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
