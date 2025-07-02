import React, { useEffect, useCallback, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';
import {
  Layout,
  Typography,
  Input,
  Form,
  Divider,
  Button,
  Card,
  Spin,
  Tag,
  Tooltip,
  Toast,
} from '@douyinfe/semi-ui';
import { IconSend, IconRefresh, IconEyeOpened, IconSync } from '@douyinfe/semi-icons';

import { EntityPropertyTypeSelector } from '../../ext/type-selector-ext';
import { EndpointHealthStatus } from '../../ext/endpoint-health-status';
import { useRemoteApiRequestStore } from '../../../stores/remote-api-request';
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

  // 远程API请求store
  const remoteApiRequest = useRemoteApiRequestStore();

  // 本地状态
  const [requestParameters, setRequestParameters] = useState<Record<string, any>>({});

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

        // 确保参数和输出都有 _indexId
        const processedApi = {
          ...originalApi,
          inputs: (originalApi.inputs || []).map((input) => ({
            ...input,
            _indexId: input._indexId || nanoid(),
          })),
          output: originalApi.output
            ? {
                ...originalApi.output,
                _indexId: originalApi.output._indexId || nanoid(),
              }
            : {
                // 提供默认的output，确保符合BaseAttribute类型
                _indexId: nanoid(),
                id: 'result',
                name: '返回结果',
                type: 'u',
                desc: 'API调用返回的结果',
                required: false,
                _status: 'saved' as const,
              },
        };

        currentExpressionActions.selectExpression(processedApi);
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
        _indexId: nanoid(), // 添加 _indexId
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

  // 🎯 收集参数值
  const collectParameters = useCallback(() => {
    if (!editingApi?.inputs) return {};

    const params: Record<string, any> = {};
    editingApi.inputs.forEach((input) => {
      if (input.value !== undefined && input.value !== '') {
        params[input.id] = input.value;
      }
    });

    // 合并手动设置的参数
    return { ...params, ...requestParameters };
  }, [editingApi?.inputs, requestParameters]);

  // 🎯 发送API请求
  const handleSendRequest = useCallback(async () => {
    if (!editingApi?.id) {
      console.warn('没有选择API');
      return;
    }

    try {
      const parameters = collectParameters();
      console.log('🚀 [ApiDetailPanel] 发送请求:', { apiId: editingApi.id, parameters });

      await remoteApiRequest.sendRequest(editingApi.id, parameters);
    } catch (error) {
      console.error('发送请求失败:', error);
    }
  }, [editingApi?.id, collectParameters, remoteApiRequest]);

  // 🎯 测试连接
  const handleTestConnection = useCallback(async () => {
    if (!editingApi?.id) {
      console.warn('没有选择API');
      return;
    }

    try {
      console.log('🔗 [ApiDetailPanel] 测试连接:', editingApi.id);
      await remoteApiRequest.testConnection(editingApi.id);
    } catch (error) {
      console.error('连接测试失败:', error);
    }
  }, [editingApi?.id, remoteApiRequest]);

  // 🎯 获取endpoint信息
  const endpoint = useMemo(() => {
    if (!editingApi?.url) return undefined;

    try {
      const url = new URL(editingApi.url);
      const port = url.port || (url.protocol === 'https:' ? '443' : '80');
      return `${url.hostname}:${port}`;
    } catch {
      return undefined;
    }
  }, [editingApi?.url]);

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
            <Form.Label text="接口" width={80} align="right" />
            <Input
              value={editingApi.id || ''}
              onChange={(value) => handleFieldChange('id', value)}
              placeholder="ID"
              style={{ fontFamily: 'monospace', flex: 1, marginLeft: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="名称" width={80} align="right" />
            <Input
              value={editingApi.name || ''}
              onChange={(value) => handleFieldChange('name', value)}
              placeholder="API名称"
              style={{ flex: 1, marginLeft: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="URL" width={80} align="right" />
            <div style={{ flex: 1, marginLeft: '12px' }}>
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

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="返回类型" width={80} align="right" />
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <EntityPropertyTypeSelector
                value={{
                  type: editingApi.output?.type || 'u',
                  ...(editingApi.output?.enumClassId && {
                    enumClassId: editingApi.output.enumClassId,
                  }),
                }}
                onChange={(typeInfo: any) => {
                  console.log('🔍 [ApiDetailPanel] 返回类型变更:', typeInfo);
                  // 使用通用的 updateProperty 方法更新 output 对象
                  const updatedOutput = {
                    ...editingApi.output,
                    type: typeInfo.type,
                    ...(typeInfo.enumClassId
                      ? { enumClassId: typeInfo.enumClassId }
                      : { enumClassId: undefined }),
                  };
                  handleFieldChange('output', updatedOutput);
                }}
                disabled={false}
              />
            </div>
          </div>

          <Divider margin="16px" />

          {/* 请求发送区域 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Form.Label text="API测试" width={80} align="right" />
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Button
                icon={<IconSend />}
                onClick={handleSendRequest}
                loading={remoteApiRequest.loading}
                disabled={!editingApi.url}
                type="primary"
              >
                发送请求
              </Button>

              <Button
                icon={<IconRefresh />}
                onClick={handleTestConnection}
                loading={remoteApiRequest.loading}
                disabled={!editingApi.url}
              >
                测试连接
              </Button>

              {/* 端点健康状况 */}
              <EndpointHealthStatus endpoint={endpoint} mode="full" showRefresh={true} />
            </div>
          </div>

          {/* 响应结果展示 */}
          <div style={{ padding: '16px', borderBottom: '1px solid var(--semi-color-border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Form.Label text="响应结果" width={80} align="right" />
              <div style={{ flex: 1, marginLeft: '12px' }}>
                {remoteApiRequest.currentResponse ? (
                  <div>
                    <div style={{ marginBottom: '8px', fontSize: '12px', color: '#666' }}>
                      状态: {remoteApiRequest.currentResponse.statusCode}{' '}
                      {remoteApiRequest.currentResponse.statusText} | 耗时:{' '}
                      {remoteApiRequest.currentResponse.responseTimeMs}ms | 时间:{' '}
                      {new Date(remoteApiRequest.currentResponse.requestTime).toLocaleString()}
                    </div>
                    <pre
                      style={{
                        background: '#f6f8fa',
                        padding: '12px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        maxHeight: '300px',
                        overflow: 'auto',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {JSON.stringify(remoteApiRequest.currentResponse.body, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div style={{ color: '#999', fontStyle: 'italic' }}>点击发送请求按钮测试API</div>
                )}
              </div>
            </div>
          </div>

          {/* 错误信息显示 */}
          {remoteApiRequest.error && (
            <Card title="错误信息" style={{ marginTop: '16px', borderColor: '#ff4d4f' }}>
              <Text type="danger">{remoteApiRequest.error}</Text>
            </Card>
          )}
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
