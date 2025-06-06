import { Field } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';

import { TypeTag } from '../type-tag';
import { useIsSidebar } from '../../hooks';
import { FormOutputsContainer } from './styles';

export function FormOutputs() {
  const isSidebar = useIsSidebar();
  if (isSidebar) {
    return null;
  }
  return (
    <Field<IJsonSchema> name={'outputs'}>
      {({ field }) => {
        const properties = field.value?.properties;
        if (properties) {
          const content = Object.keys(properties).map((key) => {
            const property = properties[key];
            return <TypeTag key={key} name={key} type={property.type as string} />;
          });
          return <FormOutputsContainer>{content}</FormOutputsContainer>;
        }
        return <></>;
      }}
    </Field>
  );
}
