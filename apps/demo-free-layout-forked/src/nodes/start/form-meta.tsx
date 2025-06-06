import React, { useContext } from 'react';

import { FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { Typography } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import {
  FormHeader,
  FormContent,
  FormOutputs,
  FormEntityMetas,
  FormModuleOutputs,
} from '../../form-components';

export const renderForm = () => (
  <>
    <FormHeader />
    <FormContent>
      <FormEntityMetas />
      <Typography.Title heading={6}>实体属性</Typography.Title>
      <FormOutputs />
      <Typography.Title heading={6} style={{ marginTop: '20px' }}>
        实体模块
      </Typography.Title>
      <FormModuleOutputs />
    </FormContent>
  </>
);

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
  },
};
