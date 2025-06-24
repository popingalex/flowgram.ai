import React, { useEffect } from 'react';

import { FormMeta, ValidateTrigger, Field, FormRenderProps } from '@flowgram.ai/free-layout-editor';
import { Input, TextArea, Typography } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import { FormHeader, FormContent, FormItem, FormOutputs } from '../../form-components';
import { generateStartNodeOutputs } from './generate-outputs';

const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  // 动态生成outputs配置
  const outputs = generateStartNodeOutputs();

  // 自动更新表单的outputs字段
  useEffect(() => {
    if (form.setValueIn && outputs) {
      form.setValueIn('outputs', outputs);
    }
  }, [outputs, form.setValueIn]);

  return (
    <>
      <FormHeader />
      <FormContent>
        <FormItem name="ID" type="string" required>
          <Field name="id">
            {({ field }) => (
              <Input
                value={(field.value as string) || ''}
                onChange={field.onChange}
                placeholder="系统唯一标识符"
                style={{ width: '100%' }}
              />
            )}
          </Field>
        </FormItem>

        <FormItem name="描述" type="string">
          <Field name="description">
            {({ field }) => (
              <TextArea
                value={(field.value as string) || ''}
                onChange={field.onChange}
                placeholder="描述系统的功能和用途"
                rows={3}
                style={{ width: '100%' }}
              />
            )}
          </Field>
        </FormItem>

        <Typography.Title heading={6} style={{ marginTop: '20px' }}>
          输出变量
        </Typography.Title>
        <FormOutputs />
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : '标题不能为空'),
    id: ({ value }: { value: string }) => (value ? undefined : 'ID不能为空'),
  },
};
