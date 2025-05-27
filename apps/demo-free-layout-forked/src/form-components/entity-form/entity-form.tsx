import React, { useCallback } from 'react';

import { Field, FieldRenderProps } from '@flowgram.ai/free-layout-editor';

import { FormItem } from '../form-item';
import { Feedback } from '../feedback';
import { EntityDefinition } from '../../typings';
import { useNodeRenderContext } from '../../hooks';

interface EntityFormProps {
  name: string;
}

export const EntityForm: React.FC<EntityFormProps> = ({ name }) => {
  const { readonly } = useNodeRenderContext();

  return (
    <Field
      name={name}
      render={({ field: { value, onChange }, fieldState }: FieldRenderProps<EntityDefinition>) => {
        const entity = value || {
          id: '',
          name: '新实体',
          version: '1.0.0',
          tags: [],
          description: '',
          properties: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const updateField = useCallback(
          (fieldName: keyof EntityDefinition, newValue: any) => {
            const updated = {
              ...entity,
              [fieldName]: newValue,
              updatedAt: new Date().toISOString(),
            };
            onChange(updated);
          },
          [entity, onChange]
        );

        const updateTags = useCallback(
          (tagsString: string) => {
            const tags = tagsString
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag);
            updateField('tags', tags);
          },
          [updateField]
        );

        return (
          <div>
            <FormItem name="id" type="string" required>
              <input
                type="text"
                value={entity.id}
                onChange={(e) => updateField('id', e.target.value)}
                placeholder="输入实体唯一标识"
                readOnly={readonly}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
              <Feedback />
            </FormItem>

            <FormItem name="name" type="string" required>
              <input
                type="text"
                value={entity.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="输入实体名称"
                readOnly={readonly}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
              <Feedback />
            </FormItem>

            <FormItem name="version" type="string">
              <input
                type="text"
                value={entity.version}
                readOnly
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                }}
              />
              <Feedback />
            </FormItem>

            <FormItem name="tags" type="string">
              <input
                type="text"
                value={entity.tags.join(', ')}
                onChange={(e) => updateTags(e.target.value)}
                placeholder="输入标签，用逗号分隔"
                readOnly={readonly}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                }}
              />
              <Feedback />
            </FormItem>

            <FormItem name="description" type="string">
              <textarea
                value={entity.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="输入实体描述"
                readOnly={readonly}
                rows={3}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
              />
              <Feedback />
            </FormItem>

            {fieldState.errors && fieldState.errors.length > 0 && (
              <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                {fieldState.errors.map((error, index) => (
                  <div key={index}>{error.message}</div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    />
  );
};
