import React from 'react';

import {
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
  Field,
  FieldArray,
} from '@flowgram.ai/free-layout-editor';
import { Select, Input, Button, Space, Typography } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';

import { FlowNodeJSON } from '../../typings';
import { useModuleStore } from '../../stores/module.store';
import { FormHeader, FormContent, FormItem } from '../../form-components';

const { Text } = Typography;

const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  const { modules } = useModuleStore();

  return (
    <>
      <FormHeader />
      <FormContent>
        <div className="entity-filter-form" style={{ padding: '16px' }}>
          <FormItem name="必需模块" type="array" required>
            <Field name="moduleIds">
              {({ field }) => (
                <Select
                  multiple
                  placeholder="选择实体必须包含的模块"
                  value={field.value || []}
                  onChange={field.onChange}
                  style={{ width: '100%' }}
                >
                  {modules.map((module: any) => (
                    <Select.Option key={module._indexId} value={module._indexId}>
                      {module.name} ({module.id})
                    </Select.Option>
                  ))}
                </Select>
              )}
            </Field>
          </FormItem>

          <FormItem name="属性过滤条件" type="array">
            <FieldArray name="attributeFilters">
              {({ field }) => (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <Text type="tertiary">添加属性过滤条件</Text>
                    <Button
                      icon={<IconPlus />}
                      size="small"
                      type="tertiary"
                      onClick={() =>
                        field.append({ attributeId: '', operator: 'equals', value: '' })
                      }
                    >
                      添加条件
                    </Button>
                  </div>

                  {field.map((child: any, index: number) => (
                    <Field key={child.name} name={child.name}>
                      {({ field: childField }) => {
                        const currentValue = childField.value || {};
                        return (
                          <div
                            style={{
                              marginBottom: 8,
                              padding: 8,
                              border: '1px solid var(--semi-color-border)',
                              borderRadius: 4,
                            }}
                          >
                            <Space>
                              <Input
                                placeholder="属性ID"
                                value={(currentValue as any).attributeId || ''}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, attributeId: value })
                                }
                                style={{ width: 120 }}
                              />
                              <Select
                                value={(currentValue as any).operator || 'equals'}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, operator: value })
                                }
                                style={{ width: 100 }}
                              >
                                <Select.Option value="equals">等于</Select.Option>
                                <Select.Option value="notEquals">不等于</Select.Option>
                                <Select.Option value="contains">包含</Select.Option>
                                <Select.Option value="exists">存在</Select.Option>
                              </Select>
                              <Input
                                placeholder="值"
                                value={(currentValue as any).value || ''}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, value })
                                }
                                style={{ width: 100 }}
                              />
                              <Button
                                icon={<IconDelete />}
                                size="small"
                                type="danger"
                                onClick={() => field.delete(index)}
                              />
                            </Space>
                          </div>
                        );
                      }}
                    </Field>
                  ))}

                  {(!field.value || field.value.length === 0) && (
                    <Text type="tertiary">暂无过滤条件，将返回包含所选模块的所有实体</Text>
                  )}
                </div>
              )}
            </FieldArray>
          </FormItem>
        </div>
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : '标题不能为空'),
    moduleIds: ({ value }: { value: any }) => (value?.length > 0 ? undefined : '至少选择一个模块'),
  },
};
