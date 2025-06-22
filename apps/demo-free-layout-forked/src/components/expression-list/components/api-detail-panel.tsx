import React, { useEffect, useCallback } from 'react';

import { Layout, Typography, Input, Button, Space, Popconfirm } from '@douyinfe/semi-ui';
import { IconUndo, IconSave, IconDelete } from '@douyinfe/semi-icons';

import { useExpressionStore } from '../../../stores/expression.store';
import {
  useCurrentExpression,
  useCurrentExpressionActions,
} from '../../../stores/current-expression.store';
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

  // 🎯 参考实体模式：当选择API变化时，更新当前编辑状态
  useEffect(() => {
    if (selectedExpressionId) {
      console.log('🔍 [ApiDetailPanel] 选择API变化:', selectedExpressionId);

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
  }, [selectedExpressionId, expressionStore.allItems, currentExpressionActions]);

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

  // 撤销更改
  const handleUndo = useCallback(() => {
    console.log('🔍 [ApiDetailPanel] 撤销更改');
    currentExpressionActions.resetChanges();
  }, [currentExpressionActions]);

  // 保存更改
  const handleSave = useCallback(async () => {
    console.log('🔍 [ApiDetailPanel] 保存更改');
    await currentExpressionActions.saveChanges();
  }, [currentExpressionActions]);

  // 删除API
  const handleDelete = useCallback(async () => {
    if (!selectedExpressionId) return;
    console.log('删除API:', selectedExpressionId);
    // TODO: 实现删除逻辑
  }, [selectedExpressionId]);

  return (
    <Content style={{ display: 'flex', flexDirection: 'column' }}>
      {editingApi ? (
        <>
          <div style={{ padding: '24px' }}>
            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
              <div style={{ width: '80px', fontWeight: 600, marginRight: '12px' }}>API ID</div>
              <Input
                value={editingApi.id || ''}
                onChange={(value) => handleFieldChange('id', value)}
                placeholder="API ID"
                style={{ fontFamily: 'monospace', flex: 1 }}
              />
            </div>

            <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center' }}>
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

            <div>
              <Space>
                <Button
                  icon={<IconUndo />}
                  onClick={handleUndo}
                  disabled={!currentExpression.isDirty}
                >
                  撤销
                </Button>
                <Button
                  type="primary"
                  icon={<IconSave />}
                  onClick={handleSave}
                  disabled={!currentExpression.isDirty}
                  loading={currentExpression.isSaving}
                >
                  保存
                </Button>
                <Popconfirm
                  title="确定删除这个API吗？"
                  content="删除后将无法恢复"
                  onConfirm={handleDelete}
                >
                  <Button type="danger" icon={<IconDelete />}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>

          {/* 标签页内容 */}
          <div style={{ flex: 1, borderTop: '1px solid var(--semi-color-border)' }}>
            <ApiTabs
              currentEditingApi={editingApi}
              onFieldChange={handleFieldChange}
              onParameterChange={handleParameterChange}
              onAddParameter={handleAddParameter}
              onDeleteParameter={handleDeleteParameter}
            />
          </div>
        </>
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
