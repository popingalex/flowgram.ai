import React, { useCallback } from 'react';

import { useScopeAvailable, ASTMatch, BaseVariableField } from '@flowgram.ai/free-layout-editor';
import { ArrayIcons, VariableTypeIcons } from '@flowgram.ai/form-materials';
import { JsonSchemaUtils } from '@flowgram.ai/form-materials';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import { Icon } from '@douyinfe/semi-ui';

import { useModuleStore } from '../../../stores/module-list';

type VariableField = BaseVariableField<{ icon?: string | JSX.Element; title?: string }>;

// 🔧 辅助函数：将属性类型转换为变量类型
function convertAttributeTypeToVariableType(attr: any): string {
  const typeMap: Record<string, string> = {
    s: 'string',
    i: 'number',
    f: 'number',
    b: 'boolean',
    o: 'object',
    a: 'array',
  };
  return typeMap[attr.type] || 'string';
}

// 🎯 创建扁平变量结构
function createFlatVariableStructure(selectedModuleIds: string[], modules: any[]): TreeNodeData[] {
  console.log('[变量树] 创建扁平结构:', { selectedModuleIds, modulesCount: modules.length });

  const result: TreeNodeData[] = [];

  // 1. 添加$context节点
  const contextNode: TreeNodeData = {
    key: '$context',
    label: <span style={{ fontWeight: 400 }}>$context</span>,
    value: '$context',
    keyPath: ['$context'],
    icon: <Icon size="small" svg={VariableTypeIcons.object} />,
    disabled: false,
  };
  result.push(contextNode);

  // 2. 为每个选中的模块创建第一级节点
  if (selectedModuleIds && selectedModuleIds.length > 0) {
    selectedModuleIds.forEach((moduleId) => {
      const module = modules.find((m) => m.id === moduleId || m._indexId === moduleId);
      if (module && module.attributes) {
        console.log('[变量树] 添加模块节点:', {
          moduleId,
          moduleName: module.name,
          attributeCount: module.attributes.length,
        });

        // 🎯 创建模块节点（第一级）
        const moduleNode: TreeNodeData = {
          key: moduleId,
          label: (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                width: '100%',
                paddingRight: '8px',
              }}
            >
              <span>{moduleId}</span>
              <span style={{ color: '#666', fontSize: '12px' }}>{module.name}</span>
            </div>
          ),
          value: moduleId,
          keyPath: [moduleId],
          disabled: true, // 模块节点不可选中，但可以展开
          children: module.attributes.map((attr: any) => ({
            key: `${moduleId}/${attr.id}`,
            label: attr.name ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  paddingRight: '8px',
                }}
              >
                <span>{attr.id}</span>
                <span style={{ color: '#666', fontSize: '12px' }}>{attr.name}</span>
              </div>
            ) : (
              <span>{attr.id}</span>
            ),
            value: `${moduleId}/${attr.id}`,
            keyPath: [`${moduleId}/${attr.id}`],
            icon: <Icon size="small" svg={VariableTypeIcons.string} />,
            disabled: false, // 属性可以选中
          })),
        };

        result.push(moduleNode);
      } else {
        console.warn('[变量树] 未找到模块:', moduleId);
      }
    });
  }

  console.log('[变量树] 扁平结构创建完成:', { resultCount: result.length });
  return result;
}

export function useEnhancedVariableTree(params: {
  includeSchema?: IJsonSchema | IJsonSchema[];
  excludeSchema?: IJsonSchema | IJsonSchema[];
  selectedModuleIds?: string[];
}): TreeNodeData[] {
  const { includeSchema, excludeSchema, selectedModuleIds } = params;
  const { modules } = useModuleStore();

  // 🔍 调试：打印传入的参数
  console.log('[变量树] useEnhancedVariableTree 参数:', {
    selectedModuleIds,
    hasSelectedModuleIds: !!selectedModuleIds,
    selectedModuleIdsLength: selectedModuleIds?.length || 0,
    modulesCount: modules.length,
    stackTrace: new Error().stack?.split('\n').slice(1, 4).join('\n'), // 显示调用栈
  });

  // 🎯 如果传入了selectedModuleIds，直接返回扁平结构，不使用原有逻辑
  if (selectedModuleIds !== undefined) {
    console.log('[变量树] 使用扁平结构模式');
    return createFlatVariableStructure(selectedModuleIds, modules);
  }

  const available = useScopeAvailable();

  // 🎯 调试变量数据
  console.log('[变量树] 可用变量数据:', {
    available,
    variablesCount: available?.variables?.length || 0,
    variables:
      available?.variables?.map((v) => {
        const properties = Array.isArray(v.type?.properties) ? v.type.properties : [];
        return {
          key: v.key,
          type: v.type,
          hasProperties: properties.length > 0,
          propertiesCount: properties.length,
          sampleProperties: properties.slice(0, 3).map((p: any) => p.key) || [],
        };
      }) || [],
    availableVariableKeys: available?.variableKeys || [],
  });

  // 🎯 额外调试：检查第一个变量的详细信息
  if (available?.variables?.length > 0) {
    const firstVariable = available.variables[0];
    const properties = Array.isArray(firstVariable.type?.properties)
      ? firstVariable.type.properties
      : [];
    console.log('[变量树] 第一个变量详细信息:', {
      key: firstVariable.key,
      type: firstVariable.type,
      properties: properties,
      propertiesPreview: properties.slice(0, 5).map((p: any) => ({
        key: p.key,
        type: p.type,
        name: p.name || '无名称',
      })),
    });
  }

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
      // 普通object节点的处理
      children = (type.properties || [])
        .map((_property) => renderVariable(_property as VariableField, [...parentFields, variable]))
        .filter(Boolean) as TreeNodeData[];

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
    .map((_variable) => {
      const variable = _variable as VariableField;

      // 🔍 调试：打印每个根变量
      console.log('[变量树] 处理根变量:', {
        key: variable.key,
        type: variable.type?.type,
        hasProperties: !!(
          Array.isArray(variable.type?.properties) && variable.type.properties.length > 0
        ),
        propertiesCount: Array.isArray(variable.type?.properties)
          ? variable.type.properties.length
          : 0,
        isStartNode: variable.key === '$start',
        parentFieldsLength: 0, // 这里是根变量，parentFields为空
        willEnterStartLogic: variable.key === '$start',
      });

      return renderVariable(variable);
    })
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
