import React from 'react';

import { FormRenderProps, FormMeta, ValidateTrigger } from '@flowgram.ai/free-layout-editor';
import { Typography } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import { FilterConditionInputs } from '../../components/ext/filter-condition-inputs';

const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => (
  <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
    {/* 标题 */}
    <Typography.Title heading={4} style={{ margin: '16px 16px 8px 16px' }}>
      过滤器
    </Typography.Title>

    {/* 使用专门的 FilterConditionInputs 组件 */}
    <FilterConditionInputs />
  </div>
);

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : '标题不能为空'),
  },
};
