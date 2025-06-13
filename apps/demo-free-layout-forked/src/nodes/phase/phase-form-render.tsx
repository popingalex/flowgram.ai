import { FormRenderProps, FlowNodeJSON, Field } from '@flowgram.ai/free-layout-editor';
import { SubCanvasRender } from '@flowgram.ai/free-container-plugin';
import { Typography, Select } from '@douyinfe/semi-ui';

import { useIsSidebar, useNodeRenderContext } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, FormItem, Feedback } from '../../form-components';

interface PhaseNodeJSON extends FlowNodeJSON {
  data: {
    phaseType: 'sequence' | 'fallback' | 'parallel';
    phase?: string;
    order?: number;
  };
}

const phaseTypeOptions = [
  { label: 'Sequence (按顺序执行)', value: 'sequence' },
  { label: 'Fallback (失败后执行)', value: 'fallback' },
  { label: 'Parallel (并行执行)', value: 'parallel' },
];

export const PhaseFormRender = ({ form }: FormRenderProps<PhaseNodeJSON>) => {
  const isSidebar = useIsSidebar();
  const { readonly } = useNodeRenderContext();

  const phaseTypeSelector = (
    <Field<string> name={`phaseType`}>
      {({ field, fieldState }) => (
        <FormItem name={'phaseType'} type={'string'} required>
          <Typography.Text strong>Phase Type:</Typography.Text>
          <Select
            style={{ width: '100%', marginTop: 8 }}
            value={field.value || 'sequence'}
            onChange={(value) => field.onChange(value as string)}
            disabled={readonly}
            optionList={phaseTypeOptions}
          />
          <Feedback errors={fieldState?.errors} />
        </FormItem>
      )}
    </Field>
  );

  if (isSidebar) {
    return (
      <>
        <FormHeader />
        <FormContent>
          {phaseTypeSelector}
          <FormOutputs />
        </FormContent>
      </>
    );
  }
  return (
    <>
      <FormHeader />
      <FormContent>
        {phaseTypeSelector}
        <SubCanvasRender />
        <FormOutputs />
      </FormContent>
    </>
  );
};
