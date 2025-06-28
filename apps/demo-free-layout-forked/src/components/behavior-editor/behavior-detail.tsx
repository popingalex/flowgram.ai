import React, { useCallback, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Typography, Input, Button, Space, Spin, Card, Form } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';

import { ParameterFilterEditor } from '../ext/parameter-filter';
import { CodeConfigEditor } from '../ext/code-config-editor';
import { SystemBehavior, BehaviorParameter } from '../../typings/behavior';
import { useSystemBehaviorEdit, useSystemBehaviorActions } from '../../stores/system-behavior';

const { Title, Text } = Typography;

interface BehaviorDetailProps {
  selectedBehavior: SystemBehavior | null;
}

export const BehaviorDetail: React.FC<BehaviorDetailProps> = ({ selectedBehavior }) => {
  const { editingBehavior, isDirty } = useSystemBehaviorEdit();
  const {
    startEdit,
    updateEditingBehavior,
    saveChanges,
    resetChanges,
    addParameter,
    updateParameter,
    deleteParameter,
  } = useSystemBehaviorActions();

  // 确保有正在编辑的行为
  useEffect(() => {
    console.log('🔍 [BehaviorDetail] useEffect触发:', {
      selectedBehavior: selectedBehavior
        ? { id: selectedBehavior.id, name: selectedBehavior.name }
        : null,
      editingBehavior: editingBehavior?.id,
    });

    if (selectedBehavior && (!editingBehavior || editingBehavior.id !== selectedBehavior.id)) {
      console.log('🔄 开始编辑行为:', selectedBehavior.id);
      startEdit(selectedBehavior);
    }
  }, [selectedBehavior, editingBehavior, startEdit]);

  // 字段更新处理
  const updateField = useCallback(
    (field: keyof SystemBehavior, value: any) => {
      if (editingBehavior) {
        updateEditingBehavior({ [field]: value });
      }
    },
    [editingBehavior, updateEditingBehavior]
  );

  // 保存处理
  const handleSave = useCallback(() => {
    saveChanges();
  }, [saveChanges]);

  // 撤销处理
  const handleRevert = useCallback(() => {
    resetChanges();
  }, [resetChanges]);

  // 处理代码配置变更
  const handleCodeConfigChange = useCallback(
    (codeConfig: any) => {
      updateField('codeConfig', codeConfig);
    },
    [updateField]
  );

  // 添加参数
  const handleAddParameter = useCallback(() => {
    const newParameter: Omit<BehaviorParameter, '_indexId' | '_status'> = {
      name: `参数${(editingBehavior?.parameters?.length || 0) + 1}`,
      description: '',
      filter: {
        moduleFilter: { whitelist: [], blacklist: [] },
        propertyFilters: [],
      },
    };
    addParameter(newParameter);
  }, [editingBehavior?.parameters?.length, addParameter]);

  // 更新参数
  const handleUpdateParameter = useCallback(
    (parameterId: string, updates: Partial<BehaviorParameter>) => {
      updateParameter(parameterId, updates);
    },
    [updateParameter]
  );

  // 删除参数
  const handleDeleteParameter = useCallback(
    (parameterId: string) => {
      deleteParameter(parameterId);
    },
    [deleteParameter]
  );

  if (!selectedBehavior) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text type="tertiary">请选择左侧行为查看详情</Text>
      </div>
    );
  }

  if (!editingBehavior) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text type="tertiary">加载行为数据...</Text>
        </div>
      </div>
    );
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 标题和操作按钮 */}
      <div style={{ padding: '16px', borderBottom: '1px solid #e0e0e0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title heading={4} style={{ margin: 0 }}>
            行为详情
          </Title>
          <Space>
            <Button onClick={handleRevert} disabled={!isDirty}>
              撤销
            </Button>
            <Button type="primary" onClick={handleSave} disabled={!isDirty}>
              保存
            </Button>
          </Space>
        </div>
      </div>

      {/* 主要内容 */}
      <div style={{ flex: 1, padding: '16px', overflow: 'auto' }}>
        {/* 基本信息 */}
        <Card title="基本信息" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Form.Label text="行为" required width={80} align="right" />
              <Input
                value={editingBehavior.id}
                onChange={(value) => updateField('id', value)}
                placeholder="行为ID"
                style={{ flex: 1, marginLeft: '12px' }}
                data-testid="behavior-id-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Form.Label text="名称" width={80} align="right" />
              <Input
                value={editingBehavior.name}
                onChange={(value) => updateField('name', value)}
                placeholder="行为名称"
                style={{ flex: 1, marginLeft: '12px' }}
                data-testid="behavior-name-input"
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Form.Label text="描述" width={80} align="right" />
              <Input
                value={editingBehavior.description || ''}
                onChange={(value) => updateField('description', value)}
                placeholder="行为描述"
                style={{ flex: 1, marginLeft: '12px' }}
                data-testid="behavior-description-input"
              />
            </div>
          </div>
        </Card>

        {/* 参数管理 */}
        <Card
          title={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>参数管理</span>
              <Button
                theme="borderless"
                icon={<IconPlus />}
                size="small"
                onClick={handleAddParameter}
              >
                添加参数
              </Button>
            </div>
          }
          style={{ marginBottom: '16px' }}
        >
          {editingBehavior.parameters && editingBehavior.parameters.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {editingBehavior.parameters.map((parameter) => (
                <Card
                  key={parameter._indexId}
                  title={
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Text strong>{parameter.name}</Text>
                      <Button
                        theme="borderless"
                        type="danger"
                        icon={<IconDelete />}
                        size="small"
                        onClick={() => handleDeleteParameter(parameter._indexId!)}
                      />
                    </div>
                  }
                  style={{ border: '1px solid #e0e0e0' }}
                >
                  {/* 参数基本信息 */}
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <Text
                          strong
                          style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}
                        >
                          参数名称
                        </Text>
                        <Input
                          value={parameter.name}
                          onChange={(value) =>
                            handleUpdateParameter(parameter._indexId!, { name: value })
                          }
                          placeholder="参数名称"
                          size="small"
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <Text
                          strong
                          style={{ display: 'block', marginBottom: '4px', fontSize: '13px' }}
                        >
                          参数描述
                        </Text>
                        <Input
                          value={parameter.description || ''}
                          onChange={(value) =>
                            handleUpdateParameter(parameter._indexId!, { description: value })
                          }
                          placeholder="参数描述（可选）"
                          size="small"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 模块和属性过滤 */}
                  <div>
                    <Text
                      strong
                      style={{ display: 'block', marginBottom: '8px', fontSize: '13px' }}
                    >
                      过滤条件
                    </Text>
                    <ParameterFilterEditor
                      value={parameter.filter}
                      onChange={(filter) => handleUpdateParameter(parameter._indexId!, { filter })}
                    />
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <Text type="tertiary">暂无参数，点击上方&ldquo;添加参数&rdquo;按钮创建参数</Text>
            </div>
          )}
        </Card>

        {/* 执行配置 */}
        <Card title="执行配置" style={{ marginBottom: '16px' }}>
          <CodeConfigEditor
            config={
              editingBehavior.codeConfig || { type: 'local', functionId: '', functionName: '' }
            }
            onChange={handleCodeConfigChange}
            behaviorParams={editingBehavior.parameters || []}
          />
        </Card>
      </div>
    </div>
  );
};
