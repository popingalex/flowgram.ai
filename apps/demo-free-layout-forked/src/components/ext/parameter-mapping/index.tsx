import React, { useCallback, useMemo } from 'react';

import { Table, Button, Input, Space, Tooltip, Tag, Typography, Select } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconEdit, IconArticle } from '@douyinfe/semi-icons';

import { BaseAttribute } from '../../../typings/types';
import { BehaviorParameter } from '../../../typings/behavior';

const { Text } = Typography;

// 扩展的参数类型，支持标准化后的字段
interface NormalizedParameter extends BaseAttribute {
  _rowKey: string;
  name: string; // 确保有name字段
}

interface ParameterMappingProps {
  functionParams: BaseAttribute[]; // 函数定义的参数
  behaviorParams: BehaviorParameter[]; // 行为配置的参数
  parameterMapping?: Record<string, any>; // 参数映射关系
  onChange: (mapping: Record<string, any>) => void;
}

export const ParameterMapping: React.FC<ParameterMappingProps> = ({
  functionParams,
  behaviorParams,
  parameterMapping = {},
  onChange,
}) => {
  // 构建行为参数选项
  const behaviorParamOptions = useMemo(
    () =>
      behaviorParams.map((param) => ({
        value: param._indexId,
        label: `${param.name} (${param.description || '无描述'})`,
      })),
    [behaviorParams]
  );

  // 🎯 标准化函数参数数据，确保兼容本地函数和远程服务
  const normalizedParams = useMemo((): NormalizedParameter[] => {
    console.log('🔍 [ParameterMapping] 原始函数参数:', functionParams);

    return functionParams.map((param, index) => {
      // 本地函数：{id: "context", desc: "Context", type: "u", required: false}
      // 远程服务：{_indexId: "...", id: "param1", name: "参数1", type: "s", ...}

      const normalized: NormalizedParameter = {
        ...param,
        // 确保有name字段：优先使用name，fallback到desc，再fallback到id
        name: param.name || param.desc || param.id || `param_${index}`,
        // 确保有rowKey：优先使用id，fallback到name
        _rowKey: param.id || param.name || `param_${index}`,
      };

      console.log('🔍 [ParameterMapping] 标准化参数:', { original: param, normalized });
      return normalized;
    });
  }, [functionParams]);

  // 处理映射值变更 - 使用_rowKey作为映射键
  const handleMappingChange = useCallback(
    (paramKey: string, value: any, type: 'parameter' | 'constant') => {
      const newMapping = {
        ...parameterMapping,
        [paramKey]: {
          type,
          value,
        },
      };
      onChange(newMapping);
    },
    [parameterMapping, onChange]
  );

  // 🎯 直接复制AttributeIdInput的实现
  const AttributeIdInput = React.memo(({ record }: { record: NormalizedParameter }) => {
    const value = record.id || record.name || '';

    return (
      <Input
        value={value}
        size="small"
        readOnly
        placeholder="参数ID"
        style={{
          fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
          fontSize: '12px',
        }}
        data-testid="property-id-input"
      />
    );
  });
  AttributeIdInput.displayName = 'AttributeIdInput';

  // 🎯 直接复制AttributeNameInput的实现
  const AttributeNameInput = React.memo(({ record }: { record: NormalizedParameter }) => {
    // 优先使用name，fallback到desc，再fallback到id
    const value = record.name || record.desc || record.id || '';

    return (
      <Input
        value={value}
        size="small"
        readOnly
        placeholder="参数名称"
        style={{
          fontSize: '13px',
        }}
        data-testid="property-name-input"
      />
    );
  });
  AttributeNameInput.displayName = 'AttributeNameInput';

  // 🎯 直接复制columns的实现，只修改第三列
  const columns = React.useMemo(
    () => [
      {
        title: 'ID',
        key: 'id',
        width: 100,
        render: (_: any, record: NormalizedParameter) => <AttributeIdInput record={record} />,
      },
      {
        title: '名称',
        key: 'name',
        width: 150,
        render: (_: any, record: NormalizedParameter) => (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <AttributeNameInput record={record} />
            {record.required && (
              <Tag
                size="small"
                color="red"
                style={{
                  fontSize: '11px',
                  height: '18px',
                  lineHeight: '16px',
                  padding: '1px 6px',
                }}
              >
                必填
              </Tag>
            )}
          </div>
        ),
      },
      {
        title: () => <span>映射配置</span>,
        key: 'controls',
        width: 40,
        render: (_: any, record: NormalizedParameter) => {
          // 使用_rowKey作为映射键
          const paramKey = record._rowKey;
          const currentMapping = parameterMapping[paramKey];
          const mappingType = currentMapping?.type || 'parameter';

          return (
            <Space>
              {/* 类型选择器 */}
              <Select
                value={mappingType}
                onChange={(value) => {
                  if (value === 'parameter') {
                    handleMappingChange(paramKey, '', 'parameter');
                  } else {
                    handleMappingChange(paramKey, '', 'constant');
                  }
                }}
                style={{ width: '100px' }}
                size="small"
                optionList={[
                  { value: 'parameter', label: '参数映射' },
                  { value: 'constant', label: '常量值' },
                ]}
              />

              {/* 映射值配置 */}
              {mappingType === 'parameter' ? (
                <Select
                  value={currentMapping?.value || ''}
                  onChange={(value) => handleMappingChange(paramKey, value, 'parameter')}
                  placeholder="选择行为参数"
                  style={{ width: '180px' }}
                  size="small"
                  optionList={behaviorParamOptions}
                  showClear
                />
              ) : (
                <Input
                  value={currentMapping?.value || ''}
                  onChange={(value) => handleMappingChange(paramKey, value, 'constant')}
                  placeholder="输入常量值"
                  style={{ width: '180px' }}
                  size="small"
                />
              )}
            </Space>
          );
        },
      },
    ],
    [parameterMapping, behaviorParamOptions, handleMappingChange]
  );

  console.log('🔍 [ParameterMapping] 渲染状态:', {
    functionParamsCount: functionParams?.length || 0,
    normalizedParamsCount: normalizedParams?.length || 0,
    behaviorParamsCount: behaviorParams?.length || 0,
    parameterMapping,
  });

  if (!functionParams || functionParams.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Text type="tertiary">暂无函数参数</Text>
      </div>
    );
  }

  // 🎯 直接复制Table的渲染方式，使用标准化后的数据
  return (
    <div style={{ width: '100%' }}>
      <Table
        dataSource={normalizedParams}
        columns={columns}
        pagination={false}
        size="small"
        rowKey="_rowKey"
        style={{
          border: '1px solid var(--semi-color-border)',
          borderRadius: '6px',
        }}
      />
    </div>
  );
};
