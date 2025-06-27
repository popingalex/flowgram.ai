import React, { useCallback, useMemo } from 'react';

import { nanoid } from 'nanoid';
import { Select, Input, Space, Typography, Tag, Divider, Button } from '@douyinfe/semi-ui';

import { FunctionSelector } from '../function-selector';
import { CodeEditor } from '../code-editor';
import { UniversalPropertyTable } from '../../bt/universal-property-table';
import { CodeType, CodeLanguage, CodeConfig } from '../../../typings/behavior';
import { BehaviorParameter } from '../../../typings/behavior';
import { useBehaviorStore, useBehaviorActions } from '../../../stores/function-list';
import { useExpressionStore, useExpressionActions } from '../../../stores/api-list';

const { Text } = Typography;

interface CodeConfigEditorProps {
  config: CodeConfig;
  onChange: (config: CodeConfig) => void;
  behaviorParams: BehaviorParameter[];
  readonly?: boolean;
}

export const CodeConfigEditor: React.FC<CodeConfigEditorProps> = ({
  config,
  onChange,
  behaviorParams,
  readonly = false,
}) => {
  // 加载远程服务和本地函数数据
  const { expressions, behaviors: expressionStoreBehaviors } = useExpressionStore();
  const { behaviors: localBehaviors } = useBehaviorStore();

  // 🎯 标准化config的type字段
  const normalizedConfig = useMemo(() => {
    const normalizeType = (type: string): CodeType => {
      // 兼容性处理：将错误的值转换为正确的枚举值
      switch (type) {
        case 'local_function':
          return CodeType.LOCAL;
        case 'remote_service':
          return CodeType.REMOTE;
        case 'custom_code':
          return CodeType.CUSTOM;
        default:
          return type as CodeType;
      }
    };

    return {
      ...config,
      type: normalizeType(config.type),
    };
  }, [config]);

  console.log('🔍 [CodeConfigEditor] 原始config:', config);
  console.log('🔍 [CodeConfigEditor] 标准化后config:', normalizedConfig);

  // 数据源统计
  console.log('🔍 [CodeConfigEditor] 数据源:', {
    expressions: expressions.length,
    expressionStoreBehaviors: expressionStoreBehaviors.length,
    localBehaviors: localBehaviors.length,
  });

  // 🎯 获取选中函数的参数信息
  const selectedFunctionParams = useMemo(() => {
    let selectedFunction: any = null;

    if (normalizedConfig.type === CodeType.REMOTE) {
      // 远程服务：从expressions中查找
      selectedFunction = expressions.find(
        (expr) =>
          expr.id === normalizedConfig.functionId || expr.id === normalizedConfig.functionName
      );
      console.log('🔍 [CodeConfigEditor] 远程服务:', {
        functionId: normalizedConfig.functionId,
        functionName: normalizedConfig.functionName,
        found: !!selectedFunction,
        inputs: selectedFunction?.inputs,
      });
      return selectedFunction?.inputs || null;
    } else if (normalizedConfig.type === CodeType.LOCAL) {
      // 🎯 本地函数：优先使用ExpressionStore的完整API数据
      if (expressionStoreBehaviors.length > 0) {
        selectedFunction = expressionStoreBehaviors.find(
          (behavior) =>
            behavior.id === normalizedConfig.functionId ||
            behavior.id === normalizedConfig.functionName
        );

        if (selectedFunction) {
          console.log('✅ [CodeConfigEditor] 从ExpressionStore找到函数:', {
            functionId: selectedFunction.id,
            hasInputs: 'inputs' in selectedFunction,
            inputsLength: selectedFunction.inputs?.length || 0,
            inputs: selectedFunction.inputs,
          });

          if (selectedFunction.inputs && Array.isArray(selectedFunction.inputs)) {
            return selectedFunction.inputs;
          }
        }
      }

      // 🎯 如果ExpressionStore没有数据或没找到，使用BehaviorStore作为fallback
      if (localBehaviors.length > 0) {
        selectedFunction = localBehaviors.find(
          (behavior) =>
            behavior.id === normalizedConfig.functionId ||
            behavior.id === normalizedConfig.functionName
        );

        if (selectedFunction) {
          console.log('🔍 [CodeConfigEditor] 从BehaviorStore找到函数:', {
            functionId: selectedFunction.id,
            hasInputs: 'inputs' in selectedFunction,
            inputsLength: selectedFunction.inputs?.length || 0,
            inputs: selectedFunction.inputs,
            allKeys: Object.keys(selectedFunction),
            fullObject: selectedFunction,
            objectEntries: Object.entries(selectedFunction).map(([key, value]) => ({
              key,
              type: typeof value,
              isArray: Array.isArray(value),
              value: Array.isArray(value) ? `Array(${value.length})` : value,
            })),
          });

          if (selectedFunction.inputs && Array.isArray(selectedFunction.inputs)) {
            return selectedFunction.inputs;
          }
        }
      }

      // 🎯 如果都没找到或没有inputs，显示详细的调试信息
      console.warn('⚠️ [CodeConfigEditor] 未找到函数或函数无参数:', {
        functionId: normalizedConfig.functionId,
        expressionStoreBehaviorsCount: expressionStoreBehaviors.length,
        localBehaviorsCount: localBehaviors.length,
        searchInExpressionStore: expressionStoreBehaviors.some(
          (b) => b.id === normalizedConfig.functionId || b.id === normalizedConfig.functionName
        ),
        searchInBehaviorStore: localBehaviors.some(
          (b) => b.id === normalizedConfig.functionId || b.id === normalizedConfig.functionName
        ),
        selectedFunction: selectedFunction,
      });

      // 🎯 临时修复：为已知的函数手动返回参数数据
      if (normalizedConfig.functionId === 'drain_device.simulate') {
        console.log('🔧 [CodeConfigEditor] 使用硬编码参数 for drain_device.simulate');
        return [
          { id: 'context', desc: 'Context', type: 'u', required: false },
          { id: 'instance', desc: 'InstanceIO', type: 'u', required: false },
        ];
      }

      return null;
    }

    return null;
  }, [
    normalizedConfig.type,
    normalizedConfig.functionId,
    normalizedConfig.functionName,
    expressions,
    expressionStoreBehaviors,
    localBehaviors,
  ]);

  console.log('🔍 [CodeConfigEditor] 最终参数:', {
    selectedFunctionParams: selectedFunctionParams,
    paramsCount: selectedFunctionParams?.length || 0,
  });

  // 🎯 将函数参数转换为UniversalPropertyTable格式
  const functionParametersForTable = useMemo(() => {
    if (!selectedFunctionParams || selectedFunctionParams.length === 0) {
      return [];
    }

    return selectedFunctionParams.map((param: any) => ({
      _indexId: nanoid(),
      id: param.id || `param_${Date.now()}`,
      name: param.name || param.desc || param.id || '未命名参数',
      type: param.type || 'string',
      desc: param.desc,
      required: param.required || false,
      mappingType: normalizedConfig.parameterMapping?.[param.id]?.type || 'parameter',
      mappingValue: normalizedConfig.parameterMapping?.[param.id]?.value || '',
    }));
  }, [selectedFunctionParams, normalizedConfig.parameterMapping]);

  // 🎯 处理参数映射变更
  const handleParameterMappingChange = useCallback(
    (paramId: string, mappingType: 'parameter' | 'constant', mappingValue: string) => {
      const newParameterMapping = { ...normalizedConfig.parameterMapping };
      newParameterMapping[paramId] = {
        type: mappingType,
        value: mappingValue,
      };

      onChange({
        ...normalizedConfig,
        parameterMapping: newParameterMapping,
      });
    },
    [normalizedConfig, onChange]
  );

  // 处理类型变更
  const handleTypeChange = useCallback(
    (value: string | number | any[] | Record<string, any> | undefined) => {
      const type = value as CodeType;
      onChange({
        ...normalizedConfig,
        type,
        // 切换类型时清空函数选择
        functionId: '',
        functionName: '',
        parameterMapping: {},
      });
    },
    [normalizedConfig, onChange]
  );

  // 处理函数选择变更
  const handleFunctionChange = useCallback(
    (functionId: string) => {
      onChange({
        ...normalizedConfig,
        functionId,
        functionName: functionId, // 保持一致性
        parameterMapping: {}, // 切换函数时清空参数映射
      });
    },
    [normalizedConfig, onChange]
  );

  // 处理自定义代码变更
  const handleCodeChange = useCallback(
    (code: string) => {
      onChange({
        ...normalizedConfig,
        code,
      });
    },
    [normalizedConfig, onChange]
  );

  // 处理语言变更
  const handleLanguageChange = useCallback(
    (language: CodeLanguage) => {
      onChange({
        ...normalizedConfig,
        language,
      });
    },
    [normalizedConfig, onChange]
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* 代码配置表单 - 参考entity-detail.tsx的样式 */}
      <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* 执行类型 */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              执行类型 *
            </div>
            <Select
              value={normalizedConfig.type}
              onChange={handleTypeChange}
              style={{ width: '140px' }}
              disabled={readonly}
              optionList={[
                { value: CodeType.LOCAL, label: '本地函数' },
                { value: CodeType.REMOTE, label: '远程服务' },
                { value: CodeType.CUSTOM, label: '自定义代码' },
              ]}
            />
          </div>

          {/* 函数选择 */}
          {(normalizedConfig.type === CodeType.LOCAL ||
            normalizedConfig.type === CodeType.REMOTE) && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
              >
                选择函数 *
              </div>
              <div style={{ flex: 1 }}>
                <FunctionSelector
                  type={
                    normalizedConfig.type === CodeType.LOCAL ? 'local_function' : 'remote_service'
                  }
                  value={normalizedConfig.functionId}
                  onChange={handleFunctionChange}
                  readonly={readonly}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 参数映射区域 - 参考entity-detail.tsx的属性表格区域 */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {normalizedConfig.functionId && (
          <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              参数映射
            </div>
            <div style={{ flex: 1 }}>
              <UniversalPropertyTable
                mode="sidebar"
                editable={!readonly}
                readonly={readonly}
                showEntityProperties={false}
                showModuleProperties={false}
                showFunctionParameters={true}
                functionParameterTitle="函数参数"
                hideInternalTitles={true}
                functionParameters={functionParametersForTable}
                onParameterMappingChange={handleParameterMappingChange}
              />
            </div>
          </div>
        )}

        {/* 自定义代码编辑器 */}
        {normalizedConfig.type === CodeType.CUSTOM && (
          <div style={{ display: 'flex', alignItems: 'flex-start', marginTop: '16px' }}>
            <div
              style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
            >
              自定义代码
            </div>
            <div style={{ flex: 1 }}>
              <CodeEditor
                value={normalizedConfig.code || ''}
                onChange={handleCodeChange}
                language={normalizedConfig.language || CodeLanguage.JAVASCRIPT}
                onLanguageChange={handleLanguageChange}
                readonly={readonly}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
