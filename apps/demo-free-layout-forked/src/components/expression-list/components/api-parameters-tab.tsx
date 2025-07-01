import React, { useCallback, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';
import { Button, Input, Checkbox } from '@douyinfe/semi-ui';
import { IconSearch, IconPlus } from '@douyinfe/semi-icons';

import { createColumn } from '../../ext/universal-table/column-configs';
import { UniversalTable } from '../../ext/universal-table';
import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { useCurrentExpression, useCurrentExpressionActions } from '../../../stores/current-api';

interface ApiParametersTabProps {
  currentEditingApi: any;
  onParameterChange?: (parameterIndexId: string, field: string, value: any) => void;
  onAddParameter?: (scope: 'query' | 'header' | 'path') => void;
  onDeleteParameter?: (parameterIndexId: string) => void;
}

export const ApiParametersTab: React.FC<ApiParametersTabProps> = ({ currentEditingApi }) => {
  const { editingExpression } = useCurrentExpression();
  const { updateParameterProperty, addParameter, removeParameter } = useCurrentExpressionActions();

  // 搜索状态
  const [searchText, setSearchText] = useState('');

  // 获取参数数据
  const parameters = useMemo(() => {
    const params = currentEditingApi?.inputs || [];
    console.log('🔍 [ApiParametersTab] 参数数据:', {
      hasCurrentEditingApi: !!currentEditingApi,
      parametersLength: params.length,
      parameters: params,
    });

    // 确保每个参数都有 _indexId
    return params.map((param: any) => ({
      ...param,
      _indexId: param._indexId || nanoid(),
    }));
  }, [currentEditingApi?.inputs]);

  // 添加参数
  const handleAddParameter = useCallback(() => {
    const newParameter = {
      _indexId: nanoid(),
      id: `param${parameters.length + 1}`,
      name: `参数${parameters.length + 1}`,
      type: 's',
      desc: '',
      required: false,
      value: '',
      scope: 'body',
      _status: 'new',
    };

    console.log('➕ [ApiParametersTab] 添加新参数:', newParameter);
    addParameter(newParameter);
  }, [parameters.length, addParameter]);

  // 删除参数
  const handleDeleteParameter = useCallback(
    (parameterIndexId: string) => {
      console.log('🗑️ [ApiParametersTab] 删除参数:', parameterIndexId);
      removeParameter(parameterIndexId);
    },
    [removeParameter]
  );

  // 字段更新
  const handleFieldChange = useCallback(
    (parameterIndexId: string, field: string, value: any) => {
      console.log('🔍 [ApiParametersTab] 更新参数字段:', { parameterIndexId, field, value });
      updateParameterProperty(parameterIndexId, field, value);
    },
    [updateParameterProperty]
  );

  // 类型变更
  const handleTypeChange = useCallback(
    (parameterIndexId: string, typeInfo: any) => {
      console.log('🔍 [ApiParametersTab] 类型变更:', { parameterIndexId, typeInfo });
      updateParameterProperty(parameterIndexId, 'type', typeInfo.type);
    },
    [updateParameterProperty]
  );

  return (
    <div style={{ padding: '16px' }}>
      <div style={{ marginBottom: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Input
          prefix={<IconSearch />}
          placeholder="搜索参数ID、名称或类型..."
          value={searchText}
          onChange={setSearchText}
          showClear
          style={{ flex: 1 }}
        />
        <Button icon={<IconPlus />} onClick={handleAddParameter} type="primary" size="small">
          添加参数
        </Button>
      </div>

      <UniversalTable
        dataSource={parameters}
        searchText={searchText}
        columns={[
          createColumn('id', 'ID', 'id', {
            width: 200,
            searchable: true,
            editable: true,
          }),
          createColumn('type', '', 'type', {
            width: 120,
            searchable: true,
            render: (value: any, record: any) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <EntityPropertyTypeSelector
                  value={{ type: record.type || 'string' }}
                  onChange={(typeInfo: any) => {
                    handleTypeChange(record._indexId, typeInfo);
                  }}
                  disabled={false}
                />
                <Checkbox
                  checked={record.required || false}
                  onChange={(e) => {
                    handleFieldChange(record._indexId, 'required', e.target.checked);
                  }}
                />
              </div>
            ),
          }),
          createColumn('value', '默认值', 'value', {
            width: 200,
            searchable: true,
            editable: true,
          }),
          createColumn('name', '名称', 'name', {
            searchable: true,
            editable: true,
          }),
        ]}
        rowKey="_indexId"
        editable={true}
        deletable={true}
        addable={false}
        size="small"
        emptyText="暂无参数，点击添加参数开始配置"
        onEdit={handleFieldChange}
        onDelete={handleDeleteParameter}
      />
    </div>
  );
};
