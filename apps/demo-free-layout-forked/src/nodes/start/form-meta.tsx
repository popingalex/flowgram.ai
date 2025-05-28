import {
  Field,
  FieldRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
} from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { FlowNodeJSON } from '../../typings';
import { useIsSidebar } from '../../hooks';
import { FormHeader, FormContent, FormOutputs, EntityForm } from '../../form-components';
import { EnumStoreProvider } from '../../components/ext/entity-property-type-selector/enum-store';
import { EntityPropertiesEditor } from '../../components/ext/entity-properties-editor';

export const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  const isSidebar = useIsSidebar();
  if (isSidebar) {
    return (
      <EnumStoreProvider>
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
              render={({ field: { value, onChange } }: FieldRenderProps<IJsonSchema>) => (
                <EntityPropertiesEditor
                  value={value as any}
                  onChange={(value: any) => onChange(value as IJsonSchema)}
                />
              )}
            />
          </div>
        </FormContent>
      </EnumStoreProvider>
    );
  }
  return (
    <EnumStoreProvider>
      <FormHeader />
      <FormContent>
        <EntityForm name="data.entityDefinition" />
        <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '16px', marginTop: '16px' }}>
          <FormOutputs />
        </div>
      </FormContent>
    </EnumStoreProvider>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : 'Title is required'),
  },
};
