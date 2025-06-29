import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';
import {
  Typography,
  Input,
  Button,
  Spin,
  Form,
  Table,
  Select,
  Space,
  Tag,
  Tooltip,
  Modal,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconFilter, IconInfoCircle } from '@douyinfe/semi-icons';

import { UniversalTable } from '../ext/universal-table';
import { EntityPropertyTypeSelector } from '../ext/type-selector-ext';
import { SimpleConditionRow, SimpleConditionValue } from '../ext/simple-condition-row';
import { ParameterFilterEditor } from '../ext/parameter-filter';
import { FunctionSelector } from '../ext/function-selector';
import { CodeEditor } from '../ext/code-editor';
import { SystemBehavior, BehaviorParameter, CodeType, CodeLanguage } from '../../typings/behavior';
import { useSystemBehaviorEdit, useSystemBehaviorActions } from '../../stores/system-behavior';
import { useModuleStore } from '../../stores/module-list';
import { useBehaviorStore } from '../../stores/function-list';
import { useExpressionStore } from '../../stores/api-list';

const { Text } = Typography;

interface BehaviorDetailProps {
  selectedBehavior: SystemBehavior | null;
}

// 扩展的参数类型，包含过滤配置
interface ExtendedBehaviorParameter extends BehaviorParameter {
  _indexId: string;
  moduleFilter?: string[]; // 模块过滤
  propertyFilter?: string; // 属性过滤
  conditionFilter?: SimpleConditionValue; // 条件过滤
  constantValue?: any; // 常量值
}

export const BehaviorDetail: React.FC<BehaviorDetailProps> = ({ selectedBehavior }) => {
  const { editingBehavior, isDirty } = useSystemBehaviorEdit();
  const { startEdit, updateEditingBehavior, updateCodeConfig } = useSystemBehaviorActions();
  // 暂时注释掉，因为BehaviorStore中没有functions属性
  // const { functions } = useBehaviorStore();
  const { modules } = useModuleStore();

  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [currentDescription, setCurrentDescription] = useState('');
  const [editingParameterId, setEditingParameterId] = useState<string | null>(null);

  // 获取函数和API数据
  const { expressions, behaviors: expressionStoreBehaviors } = useExpressionStore();
  const { behaviors: localBehaviors } = useBehaviorStore();

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

  // 🎯 获取选中函数的参数信息
  const selectedFunctionParams = useMemo(() => {
    if (!editingBehavior?.codeConfig?.functionId) return [];

    let selectedFunction: any = null;
    const config = editingBehavior.codeConfig;

    if (config.type === CodeType.REMOTE) {
      // 远程服务：从expressions中查找
      selectedFunction = expressions.find(
        (expr) => expr.id === config.functionId || expr.id === config.functionName
      );
      return selectedFunction?.inputs || [];
    } else if (config.type === CodeType.LOCAL) {
      // 本地函数：从ExpressionStore的完整API数据中查找
      if (expressionStoreBehaviors.length > 0) {
        selectedFunction = expressionStoreBehaviors.find(
          (behavior) => behavior.id === config.functionId || behavior.id === config.functionName
        );
        if (selectedFunction && selectedFunction.inputs) {
          return selectedFunction.inputs;
        }
      }
      // 备选：从localBehaviors中查找
      selectedFunction = localBehaviors.find(
        (behavior) => behavior.id === config.functionId || behavior.id === config.functionName
      );
      return selectedFunction?.inputs || [];
    }

    return [];
  }, [editingBehavior?.codeConfig, expressions, expressionStoreBehaviors, localBehaviors]);

  // 🎯 构建参数表格数据
  const parameterTableData = useMemo(() => {
    if (!editingBehavior) return [];

    const config = editingBehavior.codeConfig;
    const isCustomCode = config?.type === CodeType.CUSTOM;

    if (isCustomCode) {
      // 自定义代码：使用用户定义的参数
      return (editingBehavior.parameters || []).map((param) => ({
        ...param,
        key: param._indexId,
        editable: true, // 可编辑
        source: 'custom',
      }));
    } else {
      // API/本地函数：使用函数定义的参数
      return selectedFunctionParams.map((funcParam: any) => {
        // 查找对应的行为参数（用于获取过滤器配置）
        const behaviorParam = editingBehavior.parameters?.find(
          (p) => p.name === funcParam.id || p.name === funcParam.name
        );

        return {
          _indexId: behaviorParam?._indexId || nanoid(),
          id: funcParam.id,
          name: funcParam.name || funcParam.id,
          type: funcParam.type,
          description: funcParam.desc || funcParam.description || '',
          filter: behaviorParam?.filter || {
            moduleFilter: { whitelist: [], blacklist: [] },
            propertyFilters: [],
          },
          key: behaviorParam?._indexId || nanoid(),
          editable: false, // 不可编辑基本信息
          source: 'function',
          scope: funcParam.scope,
          required: funcParam.required,
          defaultValue: funcParam.value,
        };
      });
    }
  }, [editingBehavior, selectedFunctionParams]);

  // 🎯 处理函数类型变更
  const handleCodeTypeChange = useCallback(
    (type: CodeType) => {
      const newConfig = {
        ...editingBehavior?.codeConfig,
        type,
        content: '',
        language: type === CodeType.CUSTOM ? CodeLanguage.JAVASCRIPT : undefined,
        functionId: undefined,
      };
      updateCodeConfig(newConfig);

      // 清空参数列表
      updateField('parameters', []);
    },
    [editingBehavior?.codeConfig, updateCodeConfig, updateField]
  );

  // 🎯 处理函数选择变更
  const handleFunctionChange = useCallback(
    (functionId: string) => {
      const newConfig = {
        ...editingBehavior?.codeConfig,
        type: editingBehavior?.codeConfig?.type || CodeType.LOCAL,
        functionId,
      };
      updateCodeConfig(newConfig);

      // 根据函数参数创建行为参数（只包含过滤器配置）
      const newParameters = selectedFunctionParams.map((funcParam: any) => ({
        _indexId: nanoid(),
        name: funcParam.id,
        description: funcParam.desc || funcParam.description || '',
        filter: {
          moduleFilter: { whitelist: [], blacklist: [] },
          propertyFilters: [],
        },
        _status: 'new' as const,
      }));
      updateField('parameters', newParameters);
    },
    [editingBehavior?.codeConfig, updateCodeConfig, updateField, selectedFunctionParams]
  );

  // 🎯 处理自定义代码变更
  const handleCodeChange = useCallback(
    (content: string) => {
      const newConfig = {
        ...editingBehavior?.codeConfig,
        type: editingBehavior?.codeConfig?.type || CodeType.CUSTOM,
        customCode: {
          language: editingBehavior?.codeConfig?.customCode?.language || CodeLanguage.JAVASCRIPT,
          content,
        },
      };
      updateCodeConfig(newConfig);
    },
    [editingBehavior?.codeConfig, updateCodeConfig]
  );

  // 🎯 处理参数过滤器变更
  const handleParameterFilterChange = useCallback(
    (parameterIndexId: string, filter: any) => {
      const updatedParameters = (editingBehavior?.parameters || []).map((param) =>
        param._indexId === parameterIndexId ? { ...param, filter } : param
      );
      updateField('parameters', updatedParameters);
    },
    [editingBehavior?.parameters, updateField]
  );

  // 🎯 添加自定义参数（仅在自定义代码模式下）
  const handleAddCustomParameter = useCallback(() => {
    const currentParams = editingBehavior?.parameters || [];
    const newParameter: ExtendedBehaviorParameter = {
      _indexId: nanoid(),
      name: '新参数',
      description: '',
      filter: {
        moduleFilter: { whitelist: [], blacklist: [] },
        propertyFilters: [],
      },
      _status: 'new',
      moduleFilter: [],
      propertyFilter: undefined,
      conditionFilter: undefined,
      constantValue: undefined,
    };
    updateField('parameters', [...currentParams, newParameter]);
  }, [editingBehavior, updateField]);

  // 🎯 删除自定义参数（仅在自定义代码模式下）
  const handleDeleteCustomParameter = useCallback(
    (parameterIndexId: string) => {
      if (editingBehavior?.codeConfig?.type !== CodeType.CUSTOM) return;

      const updatedParameters = (editingBehavior?.parameters || []).filter(
        (param) => param._indexId !== parameterIndexId
      );
      updateField('parameters', updatedParameters);
    },
    [editingBehavior, updateField]
  );

  // 🎯 更新自定义参数基本信息（仅在自定义代码模式下）
  const handleUpdateCustomParameter = useCallback(
    (parameterIndexId: string, field: string, value: any) => {
      if (editingBehavior?.codeConfig?.type !== CodeType.CUSTOM) return;

      const updatedParameters = (editingBehavior?.parameters || []).map((param) =>
        param._indexId === parameterIndexId ? { ...param, [field]: value } : param
      );
      updateField('parameters', updatedParameters);
    },
    [editingBehavior, updateField]
  );

  // 🎯 获取模块选项
  const moduleOptions = useMemo(
    () =>
      modules.map((module) => ({
        label: module.name,
        value: module.id,
      })),
    [modules]
  );

  // 🎯 判断是否为自定义代码模式
  const isCustomCode = editingBehavior?.codeConfig?.type === CodeType.CUSTOM;

  // 🎯 获取属性选项（基于选中的模块）
  const getPropertyOptions = useCallback(
    (moduleIds: string[]) => {
      const allProperties: Array<{ label: string; value: string; type: string }> = [];

      moduleIds.forEach((moduleId) => {
        const module = modules.find((m) => m.id === moduleId);
        if (module?.attributes) {
          module.attributes.forEach((attr) => {
            allProperties.push({
              label: `${attr.name} (${attr.id})`,
              value: `${moduleId}.${attr.id}`,
              type: attr.type,
            });
          });
        }
      });

      return allProperties;
    },
    [modules]
  );

  // 🎯 参数表格列定义
  const columns = useMemo(() => {
    const baseColumns = [
      {
        title: '参数名',
        dataIndex: 'name',
        key: 'name',
        width: 150,
        render: (value: any, record: any) => {
          if (isCustomCode) {
            return (
              <Input
                size="small"
                value={value}
                onChange={(v) => handleUpdateCustomParameter(record._indexId, 'name', v)}
                placeholder="参数名"
              />
            );
          }
          // 优先显示ID，中文名作为次要信息
          const displayText = record.id || value;
          const secondaryText = record.id && record.id !== value ? value : null;
          return (
            <div>
              <Text style={{ fontFamily: 'monospace', fontWeight: 500 }}>{displayText}</Text>
              {secondaryText && (
                <div>
                  <Text type="tertiary" size="small">
                    {secondaryText}
                  </Text>
                </div>
              )}
            </div>
          );
        },
      },
      {
        title: '类型',
        dataIndex: 'type',
        key: 'type',
        width: 120,
        render: (value: any, record: any) => {
          if (isCustomCode) {
            return (
              <EntityPropertyTypeSelector
                value={{ type: value || 'string' }}
                onChange={(typeInfo: any) => {
                  handleUpdateCustomParameter(record._indexId, 'type', typeInfo.type);
                }}
              />
            );
          }
          // 非自定义模式也使用组件显示
          return (
            <EntityPropertyTypeSelector
              value={{ type: value || 'string' }}
              onChange={() => {}} // 只读
              disabled
            />
          );
        },
      },
      {
        title: '描述',
        dataIndex: 'description',
        key: 'description',
        width: 60,
        render: (value: any, record: any) => {
          if (!value) return null;
          return (
            <Tooltip content={value}>
              <Button
                icon={<IconInfoCircle />}
                size="small"
                theme="borderless"
                onClick={() => {
                  setCurrentDescription(value);
                  setEditingParameterId(record._indexId);
                  setDescriptionModalVisible(true);
                }}
              />
            </Tooltip>
          );
        },
      },
      {
        title: '模块过滤',
        dataIndex: 'moduleFilter',
        key: 'moduleFilter',
        width: 180,
        render: (value: any, record: any) => (
          <Select
            multiple
            size="small"
            style={{ width: '100%' }}
            placeholder="选择模块"
            value={value || []}
            optionList={moduleOptions}
            onChange={(v) => handleUpdateCustomParameter(record._indexId, 'moduleFilter', v)}
            maxTagCount={2}
          />
        ),
      },
      {
        title: '属性过滤',
        dataIndex: 'propertyFilter',
        key: 'propertyFilter',
        width: 180,
        render: (value: any, record: any) => {
          const propertyOptions = getPropertyOptions(record.moduleFilter || []);
          return (
            <Select
              size="small"
              style={{ width: '100%' }}
              placeholder="选择属性"
              value={value}
              optionList={propertyOptions}
              onChange={(v) => handleUpdateCustomParameter(record._indexId, 'propertyFilter', v)}
              disabled={!record.moduleFilter || record.moduleFilter.length === 0}
            />
          );
        },
      },
      {
        title: '条件过滤',
        dataIndex: 'conditionFilter',
        key: 'conditionFilter',
        width: 350,
        render: (value: any, record: any) => {
          const propertyOptions = getPropertyOptions(record.moduleFilter || []);
          return (
            <SimpleConditionRow
              value={value}
              onChange={(v) => handleUpdateCustomParameter(record._indexId, 'conditionFilter', v)}
              propertyOptions={propertyOptions}
              readonly={!record.moduleFilter || record.moduleFilter.length === 0}
            />
          );
        },
      },
      {
        title: '常量',
        dataIndex: 'constantValue',
        key: 'constantValue',
        width: 120,
        render: (value: any, record: any) => (
          <Input
            size="small"
            placeholder="常量值"
            value={value}
            onChange={(v) => handleUpdateCustomParameter(record._indexId, 'constantValue', v)}
          />
        ),
      },
    ];

    // 自定义代码模式下添加操作列
    if (isCustomCode) {
      baseColumns.push({
        title: '操作',
        dataIndex: 'actions',
        key: 'actions',
        width: 80,
        render: (_, record: any) => (
          <Button
            type="danger"
            theme="borderless"
            icon={<IconDelete />}
            size="small"
            onClick={() => handleDeleteCustomParameter(record._indexId)}
          />
        ),
      });
    }

    return baseColumns;
  }, [
    isCustomCode,
    moduleOptions,
    getPropertyOptions,
    handleUpdateCustomParameter,
    handleDeleteCustomParameter,
  ]);

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

  const hasFunction = editingBehavior?.codeConfig?.functionId;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 行为配置表单 */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
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
      </div>

      {/* 主要内容 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {/* 执行类型和函数选择 */}
        <div style={{ padding: '16px', borderBottom: '1px solid var(--semi-color-border)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 执行类型选择 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Form.Label text="执行类型" width={80} align="right" />
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <Select
                  value={editingBehavior.codeConfig?.type || CodeType.LOCAL}
                  onChange={(value) => handleCodeTypeChange(value as CodeType)}
                  style={{ width: '160px' }}
                  optionList={[
                    { value: CodeType.LOCAL, label: '本地函数' },
                    { value: CodeType.REMOTE, label: 'API调用' },
                    { value: CodeType.CUSTOM, label: '在线编辑脚本' },
                  ]}
                />
              </div>
            </div>

            {/* 函数选择 */}
            {(editingBehavior.codeConfig?.type === CodeType.LOCAL ||
              editingBehavior.codeConfig?.type === CodeType.REMOTE) && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Form.Label text="选择函数" width={80} align="right" />
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <FunctionSelector
                    type={
                      editingBehavior.codeConfig?.type === CodeType.LOCAL
                        ? 'local_function'
                        : 'remote_service'
                    }
                    value={editingBehavior.codeConfig?.functionId || ''}
                    onChange={handleFunctionChange}
                  />
                </div>
              </div>
            )}

            {/* 自定义代码编辑器 */}
            {isCustomCode && (
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <Form.Label text="代码编辑" width={80} align="right" />
                <div style={{ flex: 1, marginLeft: '12px' }}>
                  <CodeEditor
                    value={editingBehavior.codeConfig?.customCode?.content || ''}
                    onChange={handleCodeChange}
                    language={editingBehavior.codeConfig?.language || CodeLanguage.JAVASCRIPT}
                    onLanguageChange={(language) => {
                      const newConfig = {
                        ...editingBehavior.codeConfig,
                        language,
                      };
                      updateField('codeConfig', newConfig);
                    }}
                    height={300}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 参数配置 */}
        {(hasFunction || isCustomCode) && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <Form.Label text="参数配置" width={80} align="right" />
              <div style={{ flex: 1, marginLeft: '12px' }}>
                <div
                  style={{
                    marginBottom: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Text type="secondary" size="small">
                    {isCustomCode
                      ? '自定义参数，可编辑参数名称和类型，并配置过滤器'
                      : '函数参数，参数信息来自后台，只能配置过滤器'}
                  </Text>
                  {isCustomCode && (
                    <Button
                      theme="borderless"
                      icon={<IconPlus />}
                      size="small"
                      onClick={handleAddCustomParameter}
                    >
                      添加参数
                    </Button>
                  )}
                </div>

                <UniversalTable
                  dataSource={parameterTableData}
                  columns={columns.map((col) => ({
                    key: col.key,
                    title: col.title,
                    dataIndex: col.dataIndex,
                    width: col.width,
                    render: col.render,
                  }))}
                  onAdd={isCustomCode ? handleAddCustomParameter : undefined}
                  onDelete={
                    isCustomCode
                      ? (record: any) => handleDeleteCustomParameter(record._indexId)
                      : undefined
                  }
                  rowKey="_indexId"
                  size="small"
                  showPagination={false}
                  showActions={isCustomCode}
                  addButtonText="添加参数"
                  emptyText={isCustomCode ? '暂无参数，点击"添加参数"创建' : '该函数暂无参数'}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 描述查看弹窗 */}
      <Modal
        title="参数描述"
        visible={descriptionModalVisible}
        onCancel={() => setDescriptionModalVisible(false)}
        footer={null}
        width={500}
      >
        <Text>{currentDescription}</Text>
      </Modal>
    </div>
  );
};

export default BehaviorDetail;
