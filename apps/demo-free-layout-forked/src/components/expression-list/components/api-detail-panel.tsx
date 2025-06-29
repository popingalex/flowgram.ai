import React, { useEffect, useCallback, useMemo } from 'react';

import { nanoid } from 'nanoid';
import { Layout, Typography, Input } from '@douyinfe/semi-ui';

import { useCurrentExpression, useCurrentExpressionActions } from '../../../stores/current-api';
import { useExpressionStore } from '../../../stores/api-list';
import { useRouter } from '../../../hooks/use-router';
import { ApiUrlToolbar } from './api-url-toolbar';
import { ApiTabs } from './api-tabs';

const { Content } = Layout;
const { Text } = Typography;

interface ApiDetailPanelProps {
  selectedExpressionId?: string;
}

export const ApiDetailPanel: React.FC<ApiDetailPanelProps> = ({ selectedExpressionId }) => {
  const expressionStore = useExpressionStore();
  const currentExpression = useCurrentExpression();
  const currentExpressionActions = useCurrentExpressionActions();
  const { routeState } = useRouter();

  // 🎯 创建新API的默认数据
  const newApiTemplate = useMemo(() => {
    const isLocalMode = routeState.route === 'exp-local';

    if (!isLocalMode) {
      // 远程API模式
      return {
        _indexId: nanoid(),
        id: '',
        name: '',
        desc: '',
        deprecated: false,
        method: 'GET' as const,
        url: '',
        body: null,
        group: 'remote/user',
        type: 'expression' as const,
        _status: 'new' as const,
        output: {
          _indexId: nanoid(),
          id: 'result',
          type: 'u',
          name: '返回结果',
          desc: 'API调用返回的结果',
          required: false,
          _status: 'new' as const,
        },
        inputs: [],
      };
    } else {
      // 本地函数模式
      return {
        _indexId: nanoid(),
        id: '',
        name: '',
        desc: '',
        deprecated: false,
        type: 'behavior' as const,
        _status: 'new' as const,
        output: {
          _indexId: nanoid(),
          id: 'result',
          type: 'u',
          name: '返回结果',
          desc: '函数返回的结果',
          required: false,
          _status: 'new' as const,
        },
        inputs: [],
      };
    }
  }, [routeState.route]);

  // 🎯 参考实体模式：当选择API变化时，更新当前编辑状态
  useEffect(() => {
    if (selectedExpressionId) {
      console.log('🔍 [ApiDetailPanel] 选择API变化:', selectedExpressionId);

      // 处理新建模式
      if (selectedExpressionId === 'new') {
        console.log('🔍 [ApiDetailPanel] 进入新建模式');
        currentExpressionActions.selectExpression(newApiTemplate);
        return;
      }

      // 从原始数据中获取API信息
      const originalApi = expressionStore.allItems.find((item) => item.id === selectedExpressionId);
      if (originalApi) {
        console.log('🔍 [ApiDetailPanel] 设置当前编辑表达式:', selectedExpressionId);
        currentExpressionActions.selectExpression(originalApi);
      }
    } else {
      // 清空选择
      currentExpressionActions.selectExpression(null);
    }
  }, [selectedExpressionId, expressionStore.allItems, currentExpressionActions, newApiTemplate]);

  // 🎯 获取当前编辑的表达式 - 简单直接
  const editingApi = currentExpression.editingExpression;

  console.log('🔍 [ApiDetailPanel] 当前编辑状态:', {
    selectedExpressionId,
    hasEditingApi: !!editingApi,
    isDirty: currentExpression.isDirty,
    editingApi: editingApi, // 完整的编辑API对象
    inputsCount: editingApi?.inputs?.length || 0,
  });

  // 🎯 字段更新处理 - 直接调用store方法
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      console.log('🔍 [ApiDetailPanel] 更新字段:', field, value);
      currentExpressionActions.updateProperty(field, value);
    },
    [currentExpressionActions]
  );

  // 🎯 参数更新处理 - 直接调用store方法
  const handleParameterChange = useCallback(
    (parameterIndexId: string, field: string, value: any) => {
      console.log('🔍 [ApiDetailPanel] 更新参数:', parameterIndexId, field, value);
      currentExpressionActions.updateParameterProperty(parameterIndexId, field, value);
    },
    [currentExpressionActions]
  );

  // 🎯 参数添加处理
  const handleAddParameter = useCallback(
    (scope: 'query' | 'header' | 'path') => {
      // 🔧 修复大小写
      console.log('🔍 [ApiDetailPanel] 添加参数:', scope);
      const newParameter = {
        id: `param${(editingApi?.inputs?.length || 0) + 1}`, // ✅ 添加id字段
        name: `参数${(editingApi?.inputs?.length || 0) + 1}`, // ✅ 中文名称
        type: 's', // ✅ 使用简化类型
        desc: '', // ✅ 使用desc字段
        required: false,
        value: '', // ✅ 使用value字段
        scope,
      };
      currentExpressionActions.addParameter(newParameter);
    },
    [currentExpressionActions, editingApi?.inputs?.length]
  );

  // 🎯 参数删除处理
  const handleDeleteParameter = useCallback(
    (parameterIndexId: string) => {
      console.log('🔍 [ApiDetailPanel] 删除参数:', parameterIndexId);
      currentExpressionActions.removeParameter(parameterIndexId);
    },
    [currentExpressionActions]
  );

  return (
    <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {editingApi ? (
        <div
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            overflow: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '80px', fontWeight: 600, marginRight: '12px' }}>API ID</div>
            <Input
              value={editingApi.id || ''}
              onChange={(value) => handleFieldChange('id', value)}
              placeholder="API ID"
              style={{ fontFamily: 'monospace', flex: 1 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ width: '80px', fontWeight: 600, marginRight: '12px' }}>URL</div>
            <div style={{ flex: 1 }}>
              <ApiUrlToolbar
                currentEditingApi={editingApi}
                hasUnsavedChanges={currentExpression.isDirty}
                onFieldChange={handleFieldChange}
                hideActionButtons={true}
              />
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <ApiTabs
              currentEditingApi={editingApi}
              onFieldChange={handleFieldChange}
              onParameterChange={handleParameterChange}
              onAddParameter={handleAddParameter}
              onDeleteParameter={handleDeleteParameter}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          <Text type="secondary">请选择左侧API查看详情</Text>
        </div>
      )}
    </Content>
  );
};
