import { useContext, useEffect } from 'react';

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
import { SidebarContext } from '../../context';
import { EntityPropertiesEditor } from '../../components/ext/entity-properties-editor';

// 包装组件，确保EntityPropertiesEditor能够访问Store
const EntityPropertiesEditorWrapper: React.FC<{
  value: any;
  onChange: (value: any) => void;
}> = ({ value, onChange }) => {
  const { selectedEntityId } = useContext(SidebarContext);

  return (
    <EntityPropertiesEditor
      value={value}
      onChange={onChange}
      currentEntityId={selectedEntityId || undefined}
    />
  );
};

export const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  const isSidebar = useIsSidebar();
  const { selectedEntityId } = useContext(SidebarContext);

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
            <Field
              name="outputs"
              render={({ field: { value, onChange } }: FieldRenderProps<IJsonSchema>) => (
                <EntityPropertiesEditorWrapper
                  value={value as any}
                  onChange={(value: any) => onChange(value as IJsonSchema)}
                />
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
