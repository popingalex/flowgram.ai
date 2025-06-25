import React, { useCallback, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';
import { Table, Input, Button, Space, Checkbox, Typography, Dropdown } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconMore } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { useCurrentExpression, useCurrentExpressionActions } from '../../../stores/current-api';

const { Title, Text } = Typography;

interface ApiParametersTabProps {
  currentEditingApi: any;
  onParameterChange?: (parameterIndexId: string, field: string, value: any) => void;
  onAddParameter?: (scope: 'query' | 'header' | 'path') => void; // 🔧 修复类型定义大小写
  onDeleteParameter?: (parameterIndexId: string) => void;
}

export const ApiParametersTab: React.FC<ApiParametersTabProps> = ({
  currentEditingApi,
  onParameterChange,
  onAddParameter,
  onDeleteParameter,
}) => {
  // 🔧 在组件顶层调用hooks
  const { editingExpression } = useCurrentExpression();
  const { updateParameterProperty } = useCurrentExpressionActions();

  // 添加新参数
  const handleAddParameter = useCallback(
    (scope: string) => {
      console.log('➕ [ApiParametersTab] 添加新参数:', { scope });

      if (onAddParameter) {
        onAddParameter(scope as 'query' | 'header' | 'path'); // 🔧 修复大小写
      }
    },
    [onAddParameter]
  );

  // 🎯 修复：使用parameterIndexId删除参数
  const handleDeleteParameter = useCallback(
    (parameterIndexId: string) => {
      console.log('🗑️ [ApiParametersTab] 删除参数:', { parameterIndexId });

      if (onDeleteParameter) {
        onDeleteParameter(parameterIndexId);
      }
    },
    [onDeleteParameter]
  );

  // 构建树形数据
  const treeData = useMemo(() => {
    console.log('🔍 [ApiParametersTab] 构建TreeData:', {
      hasCurrentEditingApi: !!currentEditingApi,
      hasParameters: !!currentEditingApi?.parameters,
      parametersLength: currentEditingApi?.parameters?.length || 0,
      parameters: currentEditingApi?.parameters,
      currentEditingApi: currentEditingApi, // 完整的API对象
    });

    // 🔧 修复：使用inputs字段而不是parameters
    const parameters = currentEditingApi?.inputs || [];

    if (parameters.length === 0) {
      console.log('🔍 [ApiParametersTab] 没有参数数据，返回空数组');
      return [];
    }

    const paramsByScope = parameters.reduce((acc: any, param: any) => {
      const scope = param.scope || 'query'; // 🔧 修复默认值大小写
      if (!acc[scope]) {
        acc[scope] = [];
      }
      acc[scope].push(param);
      return acc;
    }, {} as Record<string, any[]>);

    const scopeOrder = ['query', 'header', 'path']; // 🔧 修复大小写问题
    const result: any[] = [];

    scopeOrder.forEach((scope) => {
      if (paramsByScope[scope] && paramsByScope[scope].length > 0) {
        // 添加分组节点
        result.push({
          key: `group-${scope}`,
          name: `${scope.charAt(0).toUpperCase() + scope.slice(1)}参数`, // 🔧 首字母大写显示
          type: scope,
          description: `${paramsByScope[scope].length}个参数`,
          required: false,
          defaultValue: '',
          scope: scope,
          _isGroup: true,
          children: paramsByScope[scope].map((param: any) => {
            // 🔑 确保使用稳定的_indexId
            if (!param._indexId) {
              console.error('[API参数TreeData] 参数缺少_indexId:', param);
              // 🔧 使用稳定的fallback ID，不包含时间戳，只使用英文ID
              param._indexId = `fallback_${param.id || 'unknown'}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
            }
            const stableIndexId = param._indexId;

            return {
              key: stableIndexId, // 🔧 使用稳定的_indexId作为key
              id: param.id,
              name: param.name,
              type: param.type,
              description: param.desc || param.description, // 🔧 使用desc字段
              required: param.required,
              value: param.value, // 🔧 使用value字段作为默认值
              scope: param.scope,
              _indexId: stableIndexId, // 🔧 传递稳定的_indexId
              _isGroup: false,
            };
          }),
        });
      } else {
        // 添加空分组节点
        result.push({
          key: `group-${scope}`,
          name: `${scope.charAt(0).toUpperCase() + scope.slice(1)}参数`, // 🔧 首字母大写显示
          type: scope,
          description: '0个参数',
          required: false,
          defaultValue: '',
          scope: scope,
          _isGroup: true,
          children: [],
        });
      }
    });

    return result;
  }, [currentEditingApi?.inputs]);

  // 表格列定义
  const columns = [
    // 第一列：展开按钮
    // 第二列：参数ID
    {
      title: '参数ID',
      dataIndex: 'id',
      key: 'id',
      width: 180,
      render: (id: string, record: any) => {
        if (record._isGroup) {
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Text strong>{record.name}</Text>
              <Text type="secondary">({record.description})</Text>
            </div>
          );
        }

        // 找到当前参数数据
        const currentParam = editingExpression?.inputs?.find(
          (param: any) => param._indexId === record._indexId
        );

        return (
          <Input
            key={record._indexId}
            value={currentParam?.id || ''}
            onChange={(value) => {
              updateParameterProperty(record._indexId, 'id', value);
            }}
            onClick={(e) => e.stopPropagation()}
            size="small"
            placeholder="参数ID"
            style={{ fontSize: '13px' }}
          />
        );
      },
    },
    // 第三列：类型
    {
      dataIndex: 'type',
      key: 'type',
      width: 40,
      render: (type: string, record: any) => {
        if (record._isGroup) return null;

        // 找到当前参数数据
        const currentParam = editingExpression?.inputs?.find(
          (param: any) => param._indexId === record._indexId
        );

        return (
          <EntityPropertyTypeSelector
            key={record._indexId}
            value={{ type: currentParam?.type || 'string' }}
            onChange={(newValue) => {
              updateParameterProperty(record._indexId, 'type', newValue.type);
            }}
            disabled={false}
          />
        );
      },
    },
    // 第三列：参数名称
    // {
    //   title: '参数名称',
    //   dataIndex: 'name',
    //   key: 'name',
    //   width: 150,
    //   render: (name: string, record: any) => {
    //     if (record._isGroup) return null;

    //     // 找到当前参数数据
    //     const currentParam = editingExpression?.inputs?.find(
    //       (param: any) => param._indexId === record._indexId
    //     );

    //     return (
    //       <Input
    //         key={record._indexId}
    //         value={currentParam?.name || ''}
    //         onChange={(value) => {
    //           updateParameterProperty(record._indexId, 'name', value);
    //         }}
    //         onClick={(e) => e.stopPropagation()}
    //         size="small"
    //         placeholder="参数名称"
    //         style={{ fontSize: '13px' }}
    //       />
    //     );
    //   },
    // },
    // 第四列：描述
    // 第六列：默认值
    {
      title: '默认值',
      dataIndex: 'value',
      key: 'value',
      width: 320,
      render: (value: any, record: any) => {
        if (record._isGroup) return null;

        // 找到当前参数数据
        const currentParam = editingExpression?.inputs?.find(
          (param: any) => param._indexId === record._indexId
        );

        // 处理复杂类型的默认值显示
        const displayValue = currentParam?.value;
        const valueStr =
          typeof displayValue === 'object'
            ? JSON.stringify(displayValue)
            : String(displayValue || '');

        return (
          <Input
            key={record._indexId}
            value={valueStr}
            onChange={(newValue) => {
              // 尝试解析JSON，如果失败则作为字符串处理
              let parsedValue = newValue;
              try {
                if (newValue.startsWith('{') || newValue.startsWith('[')) {
                  parsedValue = JSON.parse(newValue);
                }
              } catch (e) {
                // 保持原始字符串值
              }
              updateParameterProperty(record._indexId, 'value', parsedValue);
            }}
            onClick={(e) => e.stopPropagation()}
            size="small"
            placeholder="默认值"
            style={{ fontSize: '13px' }}
          />
        );
      },
    },
    // 第六列：操作
    {
      title: '',
      key: 'actions',
      render: (_: any, record: any) => {
        if (record._isGroup) {
          return (
            <Button
              size="small"
              icon={<IconPlus />}
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                handleAddParameter(record.scope);
              }}
            >
              添加
            </Button>
          );
        }

        return (
          <Space>
            <Checkbox
              checked={record.required}
              onChange={(checked) => onParameterChange?.(record._indexId, 'required', checked)}
            />
            <Button
              size="small"
              type="danger"
              icon={<IconDelete />}
              onClick={(e) => {
                e.stopPropagation(); // 阻止事件冒泡
                handleDeleteParameter(record._indexId);
              }}
            />
          </Space>
        );
      },
    },
  ];

  return (
    <div style={{ padding: '16px' }}>
      {currentEditingApi ? (
        <Table
          dataSource={treeData}
          columns={columns}
          pagination={false}
          size="small"
          childrenRecordName="children"
          expandRowByClick={true}
          hideExpandedColumn={false}
          indentSize={0}
          defaultExpandAllRows={true}
          className="api-parameters-table"
        />
      ) : (
        <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
          <Text type="secondary">请选择左侧API查看参数</Text>
        </div>
      )}
    </div>
  );
};
