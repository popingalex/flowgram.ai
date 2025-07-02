import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { nanoid } from 'nanoid';
import {
  Typography,
  Input,
  Button,
  Spin,
  Form,
  Select,
  Tooltip,
  Modal,
  TextArea,
  Badge,
} from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconInfoCircle } from '@douyinfe/semi-icons';

import { UniversalTable } from '../ext/universal-table';
import { EntityPropertyTypeSelector } from '../ext/type-selector-ext';
import { SimpleConditionRow, SimpleConditionValue } from '../ext/simple-condition-row';
import { FunctionSelector } from '../ext/function-selector';
import { CodeEditor } from '../ext/code-editor';
import { ItemStatus } from '../../typings/types';
import { SystemBehavior, BehaviorParameter, CodeType, CodeLanguage } from '../../typings/behavior';
import { useSystemBehaviorEdit, useSystemBehaviorActions } from '../../stores/system-behavior';
import { useModuleStore } from '../../stores/module-list';
import { useBehaviorStore } from '../../stores/function-list';
import { useExpressionStore } from '../../stores/api-list';

const { Text } = Typography;

interface BehaviorDetailProps {
  selectedBehavior: SystemBehavior | null;
  isSystemMode?: boolean;
  systemData?: any;
}

// 扩展的参数类型，包含过滤配置
interface ExtendedBehaviorParameter extends BehaviorParameter {
  // 扩展属性（用于表格显示）
  id?: string; // 函数参数ID
  key?: string; // React key
  editable?: boolean; // 是否可编辑
  source?: string; // 来源标识
  scope?: any; // 作用域
  required?: boolean; // 是否必需
  defaultValue?: any; // 默认值
  moduleFilter?: string[]; // 模块过滤
  propertyFilter?: string; // 属性过滤
  conditionFilter?: SimpleConditionValue; // 条件过滤
  constantValue?: any; // 常量值
  type?: string; // 参数类型（自定义参数）
}

export const BehaviorDetail: React.FC<BehaviorDetailProps> = ({
  selectedBehavior,
  isSystemMode,
  systemData,
}) => {
  const { editingBehavior } = useSystemBehaviorEdit();
  const { updateEditingBehavior, updateCodeConfig } = useSystemBehaviorActions();
  const { modules } = useModuleStore();

  // 🔑 修复：在系统管理模式下，使用selectedBehavior作为数据源
  const displayBehavior = editingBehavior || selectedBehavior;

  // 🔑 修复：所有Hooks必须在早期返回之前调用
  const [descriptionModalVisible, setDescriptionModalVisible] = useState(false);
  const [currentDescription, setCurrentDescription] = useState('');

  // 获取函数和API数据
  const { expressions, behaviors: expressionStoreBehaviors } = useExpressionStore();

  // 🐛 调试：检查expressions数据
  useEffect(() => {
    console.log('🔍 [BehaviorDetail] expressions数据检查:', {
      expressionsCount: expressions.length,
      expressionIds: expressions.map((e) => e.id),
      hasTargetFunction: expressions.some((e) => e.id === 'TIF_SUBTRACT'),
      targetFunction: expressions.find((e) => e.id === 'TIF_SUBTRACT'),
    });
  }, [expressions]);
  const { behaviors: localBehaviors } = useBehaviorStore();

  // 🔑 简化：移除startEdit逻辑，现在由BehaviorEditor统一处理同步
  useEffect(() => {
    console.log('🔍 [BehaviorDetail] 当前状态:', {
      selectedBehavior: selectedBehavior
        ? {
            id: selectedBehavior.id,
            name: selectedBehavior.name,
            description: selectedBehavior.description,
            _indexId: selectedBehavior._indexId,
          }
        : null,
      editingBehavior: editingBehavior
        ? {
            id: editingBehavior.id,
            name: editingBehavior.name,
            description: editingBehavior.description,
            _indexId: editingBehavior._indexId,
          }
        : null,
    });
  }, [selectedBehavior, editingBehavior]);

  // 字段更新处理
  const updateField = useCallback(
    (field: keyof SystemBehavior, value: any) => {
      if (editingBehavior) {
        updateEditingBehavior({ [field]: value });
      }
    },
    [editingBehavior, updateEditingBehavior]
  );

  // 🔑 智能判断行为类型（基于exp字段内容）
  const getInferredCodeType = useCallback((exp: string): CodeType => {
    if (!exp || exp.trim() === '') return CodeType.LOCAL;

    const expTrimmed = exp.trim();

    // API调用：以 api.call( 开头
    if (expTrimmed.startsWith('api.call(')) {
      return CodeType.REMOTE;
    }

    // 自定义脚本：以 function( 开头或包含多行代码
    if (expTrimmed.startsWith('function(') || expTrimmed.includes('\n')) {
      return CodeType.CUSTOM;
    }

    // 默认为本地函数（包括Java方法调用等其他情况）
    return CodeType.LOCAL;
  }, []);

  // 🔑 获取实际显示的代码类型（优先使用智能推断）
  const actualCodeType = useMemo(() => {
    if (!displayBehavior?.exp) return displayBehavior?.codeConfig?.type || CodeType.LOCAL;
    return getInferredCodeType(displayBehavior.exp);
  }, [displayBehavior?.exp, displayBehavior?.codeConfig?.type, getInferredCodeType]);

  // 🔑 计算是否为自定义代码模式
  const isCustomCode = actualCodeType === CodeType.CUSTOM;

  // 🎯 获取选中函数的参数信息
  const selectedFunctionParams = useMemo(() => {
    if (!displayBehavior?.codeConfig?.functionId) {
      console.log('🔍 [selectedFunctionParams] 没有选中函数ID');
      return [];
    }

    let selectedFunction: any = null;
    const config = displayBehavior.codeConfig;
    console.log('🔍 [selectedFunctionParams] 查找函数参数:', {
      functionId: config.functionId,
      type: config.type,
      expressionsCount: expressions.length,
      expressionStoreBehaviorsCount: expressionStoreBehaviors.length,
      localBehaviorsCount: localBehaviors.length,
    });

    if (config.type === CodeType.REMOTE) {
      // 远程服务：从expressions中查找
      selectedFunction = expressions.find(
        (expr) => expr.id === config.functionId || expr.id === config.functionName
      );
      console.log('🔍 [selectedFunctionParams] 远程服务查找结果:', {
        found: !!selectedFunction,
        inputs: selectedFunction?.inputs?.length || 0,
      });
      return selectedFunction?.inputs || [];
    } else if (config.type === CodeType.LOCAL) {
      // 本地函数：从ExpressionStore的完整API数据中查找
      if (expressionStoreBehaviors.length > 0) {
        selectedFunction = expressionStoreBehaviors.find(
          (behavior) => behavior.id === config.functionId || behavior.id === config.functionName
        );
        if (selectedFunction && selectedFunction.inputs) {
          console.log('🔍 [selectedFunctionParams] 本地函数查找结果(ExpressionStore):', {
            found: true,
            inputs: selectedFunction.inputs.length,
          });
          return selectedFunction.inputs;
        }
      }
      // 备选：从localBehaviors中查找
      selectedFunction = localBehaviors.find(
        (behavior) => behavior.id === config.functionId || behavior.id === config.functionName
      );
      console.log('🔍 [selectedFunctionParams] 本地函数查找结果(localBehaviors):', {
        found: !!selectedFunction,
        inputs: selectedFunction?.inputs?.length || 0,
        hasInputsProperty: selectedFunction ? 'inputs' in selectedFunction : false,
        inputsType: selectedFunction ? typeof selectedFunction.inputs : 'undefined',
        inputsValue: selectedFunction?.inputs,
        allKeys: selectedFunction ? Object.keys(selectedFunction) : [],
      });
      return selectedFunction?.inputs || [];
    }

    return [];
  }, [displayBehavior?.codeConfig, expressions, expressionStoreBehaviors, localBehaviors]);

  // 🎯 构建参数表格数据
  const parameterTableData = useMemo(() => {
    if (!displayBehavior) return [];

    const config = displayBehavior.codeConfig;

    if (isCustomCode) {
      // 自定义代码：使用用户定义的参数
      return (displayBehavior.parameters || []).map((param) => ({
        ...param,
        key: param._indexId,
        editable: true, // 可编辑
        source: 'custom',
        moduleFilter: (param as any).moduleFilter || [], // 确保有moduleFilter属性
      }));
    } else {
      // API/本地函数：使用函数定义的参数
      return selectedFunctionParams.map((funcParam: any) => {
        // 查找对应的行为参数（用于获取过滤器配置）
        const behaviorParam = displayBehavior.parameters?.find(
          (p) => p.name === funcParam.id || p.name === funcParam.name
        );

        return {
          _indexId: behaviorParam?._indexId || nanoid(),
          _status: (behaviorParam?._status || 'existing') as ItemStatus,
          name: funcParam.name || funcParam.id,
          description: funcParam.desc || funcParam.description || '',
          filter: behaviorParam?.filter || {
            moduleFilter: { whitelist: [], blacklist: [] },
            propertyFilters: [],
          },
          // 扩展属性
          id: funcParam.id,
          type: funcParam.type || 'any', // 添加type字段
          key: behaviorParam?._indexId || nanoid(),
          editable: false, // 不可编辑基本信息
          source: 'function',
          scope: funcParam.scope,
          required: funcParam.required,
          defaultValue: funcParam.value,
          moduleFilter: (behaviorParam as any)?.moduleFilter || [], // 确保有moduleFilter属性
          conditionFilter: (behaviorParam as any)?.conditionFilter,
          constantValue: (behaviorParam as any)?.constantValue,
        } as ExtendedBehaviorParameter;
      });
    }
  }, [displayBehavior, selectedFunctionParams, isCustomCode]);

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
      console.log('🔄 函数选择变更:', functionId);

      const newConfig = {
        ...editingBehavior?.codeConfig,
        type: editingBehavior?.codeConfig?.type || CodeType.LOCAL,
        functionId,
      };
      updateCodeConfig(newConfig);

      // 查找选中函数的参数信息
      let selectedFunction: any = null;
      let functionParams: any[] = [];

      if (newConfig.type === CodeType.REMOTE) {
        // 远程服务：从expressions中查找
        selectedFunction = expressions.find(
          (expr) => expr.id === functionId || expr.id === functionId
        );
        functionParams = selectedFunction?.inputs || [];
        console.log('📡 远程函数参数:', functionParams);
      } else if (newConfig.type === CodeType.LOCAL) {
        // 本地函数：从ExpressionStore的完整API数据中查找
        if (expressionStoreBehaviors.length > 0) {
          selectedFunction = expressionStoreBehaviors.find(
            (behavior) => behavior.id === functionId || behavior.id === functionId
          );
          functionParams = selectedFunction?.inputs || [];
          console.log('🏠 本地函数参数 (expressionStoreBehaviors):', functionParams);
        }

        // 如果还没找到，尝试从localBehaviors查找
        if (functionParams.length === 0 && localBehaviors.length > 0) {
          selectedFunction = localBehaviors.find(
            (behavior) => behavior.id === functionId || behavior.id === functionId
          );
          functionParams = selectedFunction?.inputs || [];
          console.log('🏠 本地函数参数 (localBehaviors):', functionParams);
        }
      }

      // 根据函数参数创建行为参数（只包含过滤器配置）
      const newParameters = functionParams.map((funcParam: any) => ({
        _indexId: nanoid(),
        name: funcParam.id,
        description: funcParam.desc || funcParam.description || '',
        filter: {
          moduleFilter: { whitelist: [], blacklist: [] },
          propertyFilters: [],
        },
        _status: 'new' as const,
      }));

      console.log('📝 创建的行为参数:', newParameters);
      updateField('parameters', newParameters);
    },
    [
      editingBehavior?.codeConfig,
      updateCodeConfig,
      updateField,
      expressions,
      expressionStoreBehaviors,
      localBehaviors,
    ]
  );

  // 🎯 获取包含固定update函数的代码
  const getCodeWithUpdateFunction = useCallback(() => {
    const userCode = editingBehavior?.codeConfig?.customCode?.content || '';
    const fixedFunction = `void update() {
  // 留着给参数用
}

`;
    return fixedFunction + userCode;
  }, [editingBehavior?.codeConfig?.customCode?.content]);

  // 🎯 处理自定义代码变更
  const handleCodeChange = useCallback(
    (content: string) => {
      // 移除固定的update函数部分，只保存用户编辑的代码
      const fixedFunctionLines = 4; // void update() {} 占用4行
      const lines = content.split('\n');
      const userCode = lines.slice(fixedFunctionLines).join('\n');

      const newConfig = {
        ...editingBehavior?.codeConfig,
        type: editingBehavior?.codeConfig?.type || CodeType.CUSTOM,
        customCode: {
          language: editingBehavior?.codeConfig?.customCode?.language || CodeLanguage.JAVASCRIPT,
          content: userCode,
        },
      };
      updateCodeConfig(newConfig);
    },
    [editingBehavior?.codeConfig, updateCodeConfig]
  );

  // 🎯 自定义参数操作
  const handleAddCustomParameter = useCallback(() => {
    const newParam: ExtendedBehaviorParameter = {
      _indexId: nanoid(),
      _status: 'new',
      name: '',
      description: '',
      filter: {
        moduleFilter: { whitelist: [], blacklist: [] },
        propertyFilters: [],
      },
      type: 'string',
      moduleFilter: [],
    };
    const currentParams = editingBehavior?.parameters || [];
    updateField('parameters', [...currentParams, newParam]);
  }, [editingBehavior?.parameters, updateField]);

  const handleUpdateCustomParameter = useCallback(
    (paramIndexId: string, field: string, value: any) => {
      const currentParams = editingBehavior?.parameters || [];
      const updatedParams = currentParams.map((param) =>
        param._indexId === paramIndexId ? { ...param, [field]: value } : param
      );
      updateField('parameters', updatedParams);
    },
    [editingBehavior?.parameters, updateField]
  );

  const handleDeleteCustomParameter = useCallback(
    (paramIndexId: string) => {
      const currentParams = editingBehavior?.parameters || [];
      const updatedParams = currentParams.filter((param) => param._indexId !== paramIndexId);
      updateField('parameters', updatedParams);
    },
    [editingBehavior?.parameters, updateField]
  );

  // 🎯 模块选项
  const moduleOptions = useMemo(
    () =>
      modules.map((module) => ({
        label: module.name,
        value: module.id,
      })),
    [modules]
  );

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
        width: 120,
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
    ];

    // 添加类型列（所有模式下都显示）
    baseColumns.push({
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
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
        } else {
          // 非自定义代码模式下显示只读的类型选择器
          return <EntityPropertyTypeSelector value={{ type: value || 'any' }} disabled={true} />;
        }
      },
    });

    // 继续添加其他列
    baseColumns.push(
      {
        title: '',
        dataIndex: 'description',
        key: 'description',
        width: 60,
        render: (value: any, record: any) => {
          if (!value) return <span></span>;
          return (
            <Tooltip content={value}>
              <Button
                icon={<IconInfoCircle />}
                size="small"
                theme="borderless"
                onClick={() => {
                  setCurrentDescription(value);
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
            showClear
          />
        ),
      },
      {
        title: '条件过滤',
        dataIndex: 'conditionFilter',
        key: 'conditionFilter',
        width: 400,
        render: (value: any, record: any) => {
          const propertyOptions = getPropertyOptions(record.moduleFilter || []);
          const hasModuleFilter = record.moduleFilter && record.moduleFilter.length > 0;

          // 如果设置了常量值，显示常量值输入框
          if (
            record.constantValue !== undefined &&
            record.constantValue !== null &&
            record.constantValue !== ''
          ) {
            return (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Text type="tertiary" size="small">
                  常量:
                </Text>
                <Input
                  size="small"
                  placeholder="常量值"
                  value={record.constantValue}
                  onChange={(v) => handleUpdateCustomParameter(record._indexId, 'constantValue', v)}
                  style={{ width: '120px' }}
                />
                <Button
                  size="small"
                  theme="borderless"
                  type="tertiary"
                  onClick={() => handleUpdateCustomParameter(record._indexId, 'constantValue', '')}
                >
                  改为条件
                </Button>
              </div>
            );
          }

          // 否则显示条件过滤组件
          return (
            <SimpleConditionRow
              value={value}
              onChange={(v) => handleUpdateCustomParameter(record._indexId, 'conditionFilter', v)}
              propertyOptions={propertyOptions}
              readonly={!hasModuleFilter}
              style={{ flex: 1 }}
            />
          );
        },
      }
    );

    // 自定义代码模式下添加操作列
    if (isCustomCode) {
      baseColumns.push({
        title: '操作',
        dataIndex: 'actions',
        key: 'actions',
        width: 80,
        render: (_: any, record: any) => (
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

  if (!displayBehavior) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>
          <Text type="tertiary">加载数据...</Text>
        </div>
      </div>
    );
  }

  const hasFunction = displayBehavior?.codeConfig?.functionId;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 行为配置表单 */}
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
          <Form.Label text="行为" required width={80} align="right" />
          <Input
            value={displayBehavior.id}
            onChange={(value) => updateField('id', value)}
            placeholder="行为ID"
            style={{ flex: 1, marginLeft: '12px' }}
            data-testid="behavior-id-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label text="名称" width={80} align="right" />
          <Input
            value={displayBehavior.name}
            onChange={(value) => updateField('name', value)}
            placeholder="行为名称"
            style={{ flex: 1, marginLeft: '12px' }}
            data-testid="behavior-name-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label text="描述" width={80} align="right" />
          <Input
            value={displayBehavior.description || ''}
            onChange={(value) => updateField('description', value)}
            placeholder="行为描述"
            style={{ flex: 1, marginLeft: '12px' }}
            data-testid="behavior-description-input"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Form.Label text="执行类型" width={80} align="right" />
          <div style={{ flex: 1, marginLeft: '12px' }}>
            <Select
              value={actualCodeType}
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

        {(actualCodeType === CodeType.LOCAL || actualCodeType === CodeType.REMOTE) && (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Form.Label text="选择函数" width={80} align="right" />
            <div
              style={{
                flex: 1,
                marginLeft: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ flex: 1 }}>
                <FunctionSelector
                  type={actualCodeType === CodeType.LOCAL ? 'local_function' : 'remote_service'}
                  value={displayBehavior.codeConfig?.functionId || ''}
                  onChange={handleFunctionChange}
                />
              </div>
              {displayBehavior.codeConfig?.functionId && (
                <Text
                  link={{ href: `/expressions/${displayBehavior.codeConfig.functionId}/` }}
                  size="small"
                >
                  查看详情
                </Text>
              )}
            </div>
          </div>
        )}

        {/* 系统参与者信息 - 仅在系统管理模式下显示 */}
        {isSystemMode && systemData?.participants && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Form.Label text="系统参与者" width={80} align="right" />
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <Text type="secondary" size="small">
                  该系统关联的ECS组件（基于源码分析）
                </Text>
              </div>
              <div
                style={{
                  border: '1px solid var(--semi-color-border)',
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ backgroundColor: 'var(--semi-color-fill-0)' }}>
                    <tr>
                      <th
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--semi-color-border)',
                        }}
                      >
                        组件ID
                      </th>
                      <th
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--semi-color-border)',
                        }}
                      >
                        组件名称
                      </th>
                      <th
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--semi-color-border)',
                        }}
                      >
                        参与类型
                      </th>
                      <th
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          borderBottom: '1px solid var(--semi-color-border)',
                        }}
                      >
                        描述
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {systemData.participants.map((participant: any, index: number) => (
                      <tr
                        key={participant.id}
                        style={{
                          backgroundColor:
                            index % 2 === 0 ? 'transparent' : 'var(--semi-color-fill-0)',
                        }}
                      >
                        <td
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--semi-color-border)',
                          }}
                        >
                          <Text code size="small">
                            {participant.id}
                          </Text>
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--semi-color-border)',
                          }}
                        >
                          <Text>{participant.name}</Text>
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--semi-color-border)',
                          }}
                        >
                          <Badge
                            count={participant.type}
                            type={
                              participant.type === 'required'
                                ? 'danger'
                                : participant.type === 'optional'
                                ? 'warning'
                                : 'secondary'
                            }
                            size="small"
                          />
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid var(--semi-color-border)',
                          }}
                        >
                          <Text type="tertiary" size="small">
                            {participant.description}
                          </Text>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

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

            {hasFunction || isCustomCode ? (
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
            ) : (
              <div
                style={{
                  padding: '40px',
                  textAlign: 'center',
                  border: '1px dashed var(--semi-color-border)',
                  borderRadius: '4px',
                  backgroundColor: 'var(--semi-color-fill-0)',
                }}
              >
                <Text type="tertiary">请先选择函数或切换到自定义代码模式</Text>
              </div>
            )}
          </div>
        </div>

        {isCustomCode && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <Form.Label text="代码编辑" width={80} align="right" />
            <div style={{ flex: 1, marginLeft: '12px' }}>
              <Text type="secondary" size="small" style={{ display: 'block', marginBottom: '8px' }}>
                系统会自动添加 void update() 函数供参数使用，请勿重复定义
              </Text>
              <CodeEditor
                value={getCodeWithUpdateFunction()}
                onChange={handleCodeChange}
                language={displayBehavior.codeConfig?.language || CodeLanguage.JAVASCRIPT}
                onLanguageChange={(language) => {
                  const newConfig = {
                    ...displayBehavior.codeConfig,
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
