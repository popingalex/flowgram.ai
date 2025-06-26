import React, { useState, useEffect } from 'react';

import { nanoid } from 'nanoid';
import { Field, FieldArray } from '@flowgram.ai/free-layout-editor';
import { ConditionRowValueType } from '@flowgram.ai/form-materials';
import { Button, Divider, Typography, Select, Space } from '@douyinfe/semi-ui';
import { IconPlus, IconCrossCircleStroked, IconDelete } from '@douyinfe/semi-icons';

import { EnhancedVariableSelector } from '../variable-selector-ext';
import { EnhancedConditionRow } from '../condition-row-ext';
import { useModuleStore } from '../../../stores/module-list';
import { useNodeRenderContext } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { Feedback } from '../../../form-components';

const { Text } = Typography;

interface ModuleFilterValue {
  whitelist: string[]; // 白名单：包含的模块ID数组
  blacklist: string[]; // 黑名单：排除的模块ID数组
}

interface PropertyFilterValue {
  key: string;
  value?: ConditionRowValueType;
}

// 模块过滤分组组件
function ModuleFilterGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Divider
        margin="12px"
        align="left"
        style={{
          borderColor: '#52c41a',
          borderWidth: '1px',
        }}
      >
        <Text
          strong
          style={{
            color: '#52c41a',
            fontSize: '13px',
            padding: '2px 8px',
            backgroundColor: '#f6ffed',
            borderRadius: '4px',
            border: '1px solid #b7eb8f',
          }}
        >
          模块过滤条件
        </Text>
      </Divider>
      <div style={{ paddingLeft: '8px' }}>{children}</div>
    </div>
  );
}

// 属性过滤分组组件
function PropertyFilterGroup({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <Divider
        margin="12px"
        align="left"
        style={{
          borderColor: '#1890ff',
          borderWidth: '1px',
        }}
      >
        <Text
          strong
          style={{
            color: '#1890ff',
            fontSize: '13px',
            padding: '2px 8px',
            backgroundColor: '#f0f8ff',
            borderRadius: '4px',
            border: '1px solid #d6e4ff',
          }}
        >
          属性过滤条件
        </Text>
      </Divider>
      <div style={{ paddingLeft: '8px' }}>{children}</div>
    </div>
  );
}

export function FilterConditionInputs() {
  const { readonly } = useNodeRenderContext();
  const { modules, loadModules } = useModuleStore();
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  // 🔍 确保模块数据被加载
  useEffect(() => {
    if (modules.length === 0) {
      console.log('[FilterConditionInputs] 模块数据为空，开始加载...');
      loadModules();
    }
  }, [modules.length, loadModules]);

  // 🔍 调试日志
  console.log('[FilterConditionInputs] 组件状态:', {
    readonly,
    modulesCount: modules.length,
    selectedModuleIds,
    firstModule: modules[0],
  });

  return (
    <div style={{ padding: '16px' }}>
      {/* 模块过滤条件 */}
      <ModuleFilterGroup>
        <Field<ModuleFilterValue> name="moduleFilter">
          {({ field, fieldState }) => {
            // 监听字段变化，更新选中的模块ID
            useEffect(() => {
              const allSelectedIds = [
                ...(field.value?.whitelist || []),
                ...(field.value?.blacklist || []),
              ];

              console.log('[过滤器] 模块ID更新:', {
                whitelist: field.value?.whitelist,
                blacklist: field.value?.blacklist,
                allSelectedIds,
              });

              setSelectedModuleIds(allSelectedIds);
            }, [field.value]);

            return (
              <FormItem name="moduleFilter" type="object" required={false} labelWidth={0}>
                {/* 白名单选择 */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                    ✅ 白名单（包含模块）
                  </Text>
                  <Select
                    multiple
                    placeholder="选择要包含的模块"
                    value={field.value?.whitelist || []}
                    onChange={(value) => {
                      console.log('[FilterConditionInputs] 白名单选择:', value);
                      field.onChange({
                        ...field.value,
                        whitelist: value as string[],
                      });
                    }}
                    style={{ width: '100%' }}
                    disabled={readonly}
                    showClear
                    maxTagCount={3}
                  >
                    {modules.length === 0 ? (
                      <Select.Option value="" disabled>
                        暂无可用模块
                      </Select.Option>
                    ) : (
                      modules.map((module: any) => (
                        <Select.Option key={module._indexId || module.id} value={module.id}>
                          {module.id} ({module.name})
                        </Select.Option>
                      ))
                    )}
                  </Select>
                </div>

                {/* 黑名单选择 */}
                <div style={{ marginBottom: '12px' }}>
                  <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
                    ❌ 黑名单（排除模块）
                  </Text>
                  <Select
                    multiple
                    placeholder="选择要排除的模块"
                    value={field.value?.blacklist || []}
                    onChange={(value) => {
                      console.log('[FilterConditionInputs] 黑名单选择:', value);
                      field.onChange({
                        ...field.value,
                        blacklist: value as string[],
                      });
                    }}
                    style={{ width: '100%' }}
                    disabled={readonly}
                    showClear
                    maxTagCount={3}
                  >
                    {modules.length === 0 ? (
                      <Select.Option value="" disabled>
                        暂无可用模块
                      </Select.Option>
                    ) : (
                      modules.map((module: any) => (
                        <Select.Option key={module._indexId || module.id} value={module.id}>
                          {module.id} ({module.name})
                        </Select.Option>
                      ))
                    )}
                  </Select>
                </div>

                <Feedback errors={fieldState?.errors} invalid={fieldState?.invalid} />
              </FormItem>
            );
          }}
        </Field>
      </ModuleFilterGroup>

      {/* 属性过滤条件 */}
      <PropertyFilterGroup>
        <FieldArray name="propertyFilters">
          {({ field }) => (
            <>
              {field.map((child: any, index: number) => (
                <Field<PropertyFilterValue> key={child.name} name={child.name}>
                  {({ field: childField, fieldState: childState }) => (
                    <FormItem name="propertyFilter" type="boolean" required={false} labelWidth={0}>
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <EnhancedConditionRow
                          readonly={readonly}
                          style={{ flexGrow: 1 }}
                          value={childField.value.value}
                          onChange={(v) =>
                            childField.onChange({ value: v, key: childField.value.key })
                          }
                          selectedModuleIds={selectedModuleIds} // 传递选中的模块ID
                        />

                        {!readonly && (
                          <Button
                            theme="borderless"
                            icon={<IconCrossCircleStroked />}
                            onClick={() => field.delete(index)}
                            style={{ marginLeft: '8px' }}
                          />
                        )}
                      </div>

                      <Feedback errors={childState?.errors} invalid={childState?.invalid} />
                    </FormItem>
                  )}
                </Field>
              ))}

              {/* 统一的添加按钮 */}
              {!readonly && (
                <div style={{ marginTop: '8px' }}>
                  <Button
                    theme="borderless"
                    icon={<IconPlus />}
                    onClick={() =>
                      field.append({
                        key: `property_${nanoid(6)}`,
                        value: { type: 'expression', content: '' },
                      })
                    }
                    size="small"
                  >
                    添加属性条件
                  </Button>
                </div>
              )}

              {/* 空状态提示 */}
              {(!field.value || field.value.length === 0) && (
                <Text
                  type="tertiary"
                  style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}
                >
                  暂无属性过滤条件
                </Text>
              )}

              {selectedModuleIds.length > 0 && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '4px',
                    border: '1px solid #d6e4ff',
                  }}
                >
                  <Text type="tertiary" style={{ fontSize: '12px' }}>
                    💡 提示：已选择 {selectedModuleIds.length}{' '}
                    个模块，变量选择器中会显示对应模块的属性
                  </Text>
                </div>
              )}
            </>
          )}
        </FieldArray>
      </PropertyFilterGroup>
    </div>
  );
}
