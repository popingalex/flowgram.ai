import React from 'react';

import {
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
  Field,
  FieldArray,
} from '@flowgram.ai/free-layout-editor';
import { Select, Input, Button, Space, Typography, Card } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete, IconCode } from '@douyinfe/semi-icons';

import { FlowNodeJSON } from '../../typings';
import { FormHeader, FormContent, FormItem } from '../../form-components';

const { Text } = Typography;

// 模拟的函数列表数据
const mockFunctions = [
  {
    id: 'moveEntities',
    name: '移动实体',
    description: '移动多个实体到指定位置',
    parameters: [
      { name: 'entities', type: 'EntitySet', description: '要移动的实体集合' },
      { name: 'targetPosition', type: 'Vector3', description: '目标位置' },
      { name: 'speed', type: 'number', description: '移动速度' },
    ],
  },
  {
    id: 'executeTask',
    name: '执行任务',
    description: '为实体集合分配并执行任务',
    parameters: [
      { name: 'workers', type: 'EntitySet', description: '工作实体集合' },
      { name: 'taskType', type: 'string', description: '任务类型' },
      { name: 'priority', type: 'number', description: '任务优先级' },
    ],
  },
  {
    id: 'interactEntities',
    name: '实体交互',
    description: '两个实体集合之间的交互行为',
    parameters: [
      { name: 'sourceEntities', type: 'EntitySet', description: '源实体集合' },
      { name: 'targetEntities', type: 'EntitySet', description: '目标实体集合' },
      { name: 'interactionType', type: 'string', description: '交互类型' },
    ],
  },
];

const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => (
  <>
    <FormHeader />
    <FormContent>
      <div className="system-action-form" style={{ padding: '16px' }}>
        <FormItem name="选择函数" type="string" required>
          <Field name="selectedFunction">
            {({ field }) => {
              const selectedFunc = mockFunctions.find((f) => f.id === (field.value as string));

              return (
                <div>
                  <Select
                    placeholder="选择要执行的系统函数"
                    value={field.value as string}
                    onChange={field.onChange}
                    style={{ width: '100%', marginBottom: 16 }}
                  >
                    {mockFunctions.map((func) => (
                      <Select.Option key={func.id} value={func.id}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <IconCode style={{ marginRight: 8 }} />
                          <div>
                            <div>{func.name}</div>
                            <Text type="tertiary" size="small">
                              {func.description}
                            </Text>
                          </div>
                        </div>
                      </Select.Option>
                    ))}
                  </Select>

                  {selectedFunc && (
                    <Card
                      title="函数信息"
                      style={{ marginBottom: 16 }}
                      bodyStyle={{ padding: '12px' }}
                    >
                      <Text strong>{selectedFunc.name}</Text>
                      <br />
                      <Text type="tertiary">{selectedFunc.description}</Text>
                      <div style={{ marginTop: 8 }}>
                        <Text strong>参数列表：</Text>
                        {selectedFunc.parameters.map((param, index) => (
                          <div key={index} style={{ marginLeft: 16, marginTop: 4 }}>
                            <Text code>{param.name}</Text>
                            <Text type="secondary"> ({param.type})</Text>
                            <Text type="tertiary"> - {param.description}</Text>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </div>
              );
            }}
          </Field>
        </FormItem>

        <FormItem name="输入端口映射" type="array">
          <FieldArray name="inputPorts">
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
                  <Text type="tertiary">配置函数参数的输入端口</Text>
                  <Button
                    icon={<IconPlus />}
                    size="small"
                    type="tertiary"
                    onClick={() =>
                      field.append({ portId: '', parameterName: '', sourceType: 'entitySet' })
                    }
                  >
                    添加端口
                  </Button>
                </div>

                {field.map((child: any, index: number) => (
                  <Field key={child.name} name={child.name}>
                    {({ field: childField }) => {
                      const currentValue = childField.value || {};
                      return (
                        <Card style={{ marginBottom: 8 }} bodyStyle={{ padding: '12px' }}>
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Input
                                placeholder="端口ID"
                                value={(currentValue as any).portId || ''}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, portId: value })
                                }
                                style={{ width: 120 }}
                              />
                              <Input
                                placeholder="参数名称"
                                value={(currentValue as any).parameterName || ''}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, parameterName: value })
                                }
                                style={{ width: 120 }}
                              />
                              <Select
                                placeholder="数据类型"
                                value={(currentValue as any).sourceType || 'entitySet'}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, sourceType: value })
                                }
                                style={{ width: 120 }}
                              >
                                <Select.Option value="entitySet">实体集合</Select.Option>
                                <Select.Option value="value">常量值</Select.Option>
                                <Select.Option value="variable">变量</Select.Option>
                              </Select>
                              <Button
                                icon={<IconDelete />}
                                size="small"
                                type="danger"
                                onClick={() => field.delete(index)}
                              />
                            </div>

                            {(currentValue as any).sourceType === 'value' && (
                              <Input
                                placeholder="输入常量值"
                                value={(currentValue as any).constantValue || ''}
                                onChange={(value) =>
                                  childField.onChange({ ...currentValue, constantValue: value })
                                }
                              />
                            )}
                          </div>
                        </Card>
                      );
                    }}
                  </Field>
                ))}

                {(!field.value || field.value.length === 0) && (
                  <Text type="tertiary">暂无输入端口，请添加函数参数映射</Text>
                )}
              </div>
            )}
          </FieldArray>
        </FormItem>
      </div>
    </FormContent>
  </>
);

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : '标题不能为空'),
    selectedFunction: ({ value }: { value: any }) => (value ? undefined : '请选择要执行的函数'),
  },
};
