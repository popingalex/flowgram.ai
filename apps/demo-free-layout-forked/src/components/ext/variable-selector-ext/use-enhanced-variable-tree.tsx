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

                  // 🎯 关键修复：构建正确的keyPath格式，保持与原有扁平格式兼容
                  // 不使用分组路径，直接使用原始的模块属性路径
                  const fullKeyPath = [
                    ...parentFields.map((_field) => _field.key),
                    variable.key,
                    originalKey, // 保持原始的"模块名/属性名"格式
                  ];

                  // 🎯 构建简化的label，不再依赖meta.title
                  const simplifiedLabel = <span style={{ fontWeight: 400 }}>{simplifiedKey}</span>;

                  return {
                    key: fullKeyPath.join('.'),
                    label: simplifiedLabel,
                    value: fullKeyPath.join('.'),
                    keyPath: fullKeyPath, // 这里保持原始的路径格式，与现有的变量值兼容
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

    // 🎯 构建label - 显示key，如果有name则在右侧显示中文名
    const variableName = (variable as any).name;

    const labelElement = variableName ? (
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
          {variableName}
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

  const result = [...available.variables.slice(0).reverse()]
    .map((_variable) => renderVariable(_variable as VariableField))
    .filter(Boolean) as TreeNodeData[];

  // 只在开发环境且变量数量有变化时打印调试信息
  if (process.env.NODE_ENV === 'development') {
    const currentVariablesKey = available.variables.map((v) => v.key).join(',');
    if ((window as any).__lastVariablesKey !== currentVariablesKey) {
      // 🎯 收集所有可选择的叶子节点路径，用于调试
      const collectSelectablePaths = (nodes: TreeNodeData[], paths: string[] = []): string[] => {
        nodes.forEach((node) => {
          if (!node.disabled && (!node.children || node.children.length === 0)) {
            // 可选择的叶子节点
            paths.push(node.value || node.keyPath?.join('.') || '');
          }
          if (node.children) {
            collectSelectablePaths(node.children, paths);
          }
        });
        return paths;
      };

      const selectablePaths = collectSelectablePaths(result);

      console.log('[变量树] 变量数据更新:', {
        availableVariablesCount: available.variables.length,
        resultCount: result.length,
        variableKeys: available.variables.map((v) => v.key),
        selectablePathsCount: selectablePaths.length,
        selectablePaths: selectablePaths,
        // 特别关注模块属性的路径格式
        modulePropertyPaths: selectablePaths.filter((path) => path.includes('/')),
      });
      (window as any).__lastVariablesKey = currentVariablesKey;
    }
  }

  return result;
}
