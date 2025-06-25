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
  moduleId: string;
  operator: 'contains' | 'notContains';
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
  const { modules } = useModuleStore();
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);

  return (
    <div style={{ padding: '16px' }}>
      {/* 模块过滤条件 */}
      <ModuleFilterGroup>
        <FieldArray name="moduleFilters">
          {({ field }) => {
            // 监听字段变化，更新选中的模块ID
            useEffect(() => {
              const moduleIds = (field.value || [])
                .filter((filter: any) => filter?.moduleId)
                .map((filter: any) => filter.moduleId as string);

              console.log('[过滤器] 模块ID更新:', {
                fieldValue: field.value,
                extractedModuleIds: moduleIds,
              });

              setSelectedModuleIds(moduleIds);
            }, [field.value]);

            return (
              <>
                {field.map((child: any, index: number) => (
                  <Field<ModuleFilterValue> key={child.name} name={child.name}>
                    {({ field: childField, fieldState: childState }) => (
                      <FormItem name="moduleFilter" type="object" required={false} labelWidth={0}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '8px',
                            padding: '8px',
                            border: '1px solid var(--semi-color-border)',
                            borderRadius: '4px',
                            backgroundColor: '#fafafa',
                          }}
                        >
                          <Space style={{ flex: 1 }}>
                            <Select
                              placeholder="选择模块"
                              value={childField.value?.moduleId || ''}
                              onChange={(value) => {
                                childField.onChange({
                                  ...childField.value,
                                  moduleId: value as string,
                                });
                              }}
                              style={{ width: 180 }}
                              disabled={readonly}
                            >
                              {modules.map((module: any) => (
                                <Select.Option key={module._indexId} value={module.id}>
                                  {module.name} ({module.id})
                                </Select.Option>
                              ))}
                            </Select>
                            <Select
                              value={childField.value?.operator || 'contains'}
                              onChange={(value) =>
                                childField.onChange({
                                  ...childField.value,
                                  operator: value as 'contains' | 'notContains',
                                })
                              }
                              style={{ width: 100 }}
                              disabled={readonly}
                            >
                              <Select.Option value="contains">包含</Select.Option>
                              <Select.Option value="notContains">不包含</Select.Option>
                            </Select>
                          </Space>

                          {!readonly && (
                            <Button
                              theme="borderless"
                              icon={<IconDelete />}
                              onClick={() => field.delete(index)}
                              style={{ marginLeft: '8px' }}
                              size="small"
                              type="danger"
                            />
                          )}
                        </div>

                        <Feedback errors={childState?.errors} invalid={childState?.invalid} />
                      </FormItem>
                    )}
                  </Field>
                ))}

                {!readonly && (
                  <div style={{ marginTop: '8px' }}>
                    <Button
                      theme="borderless"
                      icon={<IconPlus />}
                      onClick={() =>
                        field.append({
                          moduleId: '',
                          operator: 'contains',
                        })
                      }
                      size="small"
                    >
                      添加模块条件
                    </Button>
                  </div>
                )}

                {(!field.value || field.value.length === 0) && (
                  <div>
                    <Text
                      type="tertiary"
                      style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}
                    >
                      暂无模块过滤条件
                    </Text>
                    {!readonly && (
                      <Button
                        theme="light"
                        icon={<IconPlus />}
                        onClick={() =>
                          field.append({
                            moduleId: '',
                            operator: 'contains',
                          })
                        }
                        size="small"
                        style={{ marginTop: '4px' }}
                      >
                        添加默认模块条件
                      </Button>
                    )}
                  </div>
                )}
              </>
            );
          }}
        </FieldArray>
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

              {(!field.value || field.value.length === 0) && (
                <div>
                  <Text
                    type="tertiary"
                    style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}
                  >
                    暂无属性过滤条件
                  </Text>
                  {!readonly && (
                    <Button
                      theme="light"
                      icon={<IconPlus />}
                      onClick={() =>
                        field.append({
                          key: `property_${nanoid(6)}`,
                          value: { type: 'expression', content: '' },
                        })
                      }
                      size="small"
                      style={{ marginTop: '4px' }}
                    >
                      添加默认属性条件
                    </Button>
                  )}
                </div>
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
