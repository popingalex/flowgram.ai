import {
  Field,
  FieldRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
} from '@flowgram.ai/free-layout-editor';
import { JsonSchemaEditor } from '@flowgram.ai/form-materials';

import { FlowNodeJSON, JsonSchema } from '../../typings';
import { useIsSidebar } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, EntityForm } from '../../form-components';

export const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  const isSidebar = useIsSidebar();
  if (isSidebar) {
    return (
      <>
        <FormHeader />
        <FormContent>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>实体定义</h4>
            <EntityForm name="data.entityDefinition" />
          </div>
          <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600' }}>
              输出数据结构
            </h4>
            <Field
              name="outputs"
              render={({ field: { value, onChange } }: FieldRenderProps<JsonSchema>) => (
                <>
                  <JsonSchemaEditor
                    value={value}
                    onChange={(value) => onChange(value as JsonSchema)}
                  />
                </>
              )}
            />
          </div>
        </FormContent>
      </>
    );
  }
  return (
    <>
      <FormHeader />
      <FormContent>
        <EntityForm name="data.entityDefinition" />
        <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px', marginTop: '16px' }}>
          <FormOutputs />
        </div>
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
  },
};
