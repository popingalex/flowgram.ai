import React, { useState, useEffect } from 'react';

import { FormRenderProps, FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { autoRenameRefEffect } from '@flowgram.ai/form-materials';
import { Typography } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import { useBehaviorStore } from '../../stores';
import { FormHeader, FormContent, FormInputs, FormOutputs } from '../../form-components';
import { InvokeFunctionSelector } from '../../components/ext/invoke-function-selector';

export const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  // 从表单数据中读取已选择的函数ID，并查找对应的_indexId
  const formValues = form.values;
  const functionId = formValues.data?.functionMeta?.id || '';

  // 需要从behavior store中查找对应的_indexId
  const { behaviors } = useBehaviorStore();
  const selectedBehavior = behaviors.find((b) => b.id === functionId);
  const behaviorIndexId = selectedBehavior?._indexId || '';

  const [selectedFunction, setSelectedFunction] = useState<string>(behaviorIndexId);

  // 当表单数据变化时，同步更新状态
  React.useEffect(() => {
    const newFunctionId = formValues.data?.functionMeta?.id || '';
    const newSelectedBehavior = behaviors.find((b) => b.id === newFunctionId);
    const newBehaviorIndexId = newSelectedBehavior?._indexId || '';
    setSelectedFunction(newBehaviorIndexId);
  }, [formValues.data?.functionMeta?.id, behaviors]);

  return (
    <>
      <FormHeader />
      <FormContent>
        <Typography.Title heading={6}>选择函数</Typography.Title>
        <InvokeFunctionSelector value={selectedFunction} onChange={setSelectedFunction} />
        <Typography.Title heading={6} style={{ marginTop: '20px' }}>
          输入参数
        </Typography.Title>
        <FormInputs />
        <Typography.Title heading={6} style={{ marginTop: '20px' }}>
          输出结果
        </Typography.Title>
        <FormOutputs />
      </FormContent>
    </>
  );
};

export const invokeFormMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }) => (value ? undefined : 'Title is required'),
    'inputsValues.*': ({ value, context, formValues, name }) => {
      const valuePropetyKey = name.replace(/^inputsValues\./, '');
      const required = formValues.inputs?.required || [];
      if (required.includes(valuePropetyKey) && (value === '' || value === undefined)) {
        return `${valuePropetyKey} is required`;
      }
      return undefined;
    },
  },
  effect: {
    inputsValues: autoRenameRefEffect,
  },
};
