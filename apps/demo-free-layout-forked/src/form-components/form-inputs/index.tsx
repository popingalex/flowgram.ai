import { Field } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema as JsonSchema } from '@flowgram.ai/form-materials';

import { FormItem } from '../form-item';
import { Feedback } from '../feedback';
import { useNodeRenderContext } from '../../hooks';
import { EnhancedDynamicValueInput } from '../../components/ext/dynamic-value-input-ext/index';

export function FormInputs() {
  const { readonly } = useNodeRenderContext();
  return (
    <Field<JsonSchema> name="inputs">
      {({ field: inputsField }) => {
        const required = inputsField.value?.required || [];
        const properties = inputsField.value?.properties;
        if (!properties) {
          return <></>;
        }
        const content = Object.keys(properties).map((key) => {
          const property = properties[key];
          return (
            <Field key={key} name={`inputsValues.${key}`} defaultValue={property.default}>
              {({ field, fieldState }) => (
                <div onClick={(e) => e.stopPropagation()}>
                  <FormItem
                    name={key}
                    type={property.type as string}
                    required={required.includes(key)}
                  >
                    <EnhancedDynamicValueInput
                      value={field.value}
                      onChange={field.onChange}
                      readonly={readonly}
                      hasError={Object.keys(fieldState?.errors || {}).length > 0}
                      schema={property}
                    />
                    <Feedback errors={fieldState?.errors} />
                  </FormItem>
                </div>
              )}
            </Field>
          );
        });
        return <>{content}</>;
      }}
    </Field>
  );
}
