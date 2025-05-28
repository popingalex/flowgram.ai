import React from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { Input, Space } from '@douyinfe/semi-ui';

interface EntityFormProps {
  name: string;
}

interface EntityData {
  id?: string;
  name?: string;
  description?: string;
}

export function EntityForm({ name }: EntityFormProps) {
  return (
    <Field name={name}>
      {({ field }) => {
        const entityData: EntityData = field.value || {};

        const handleChange = (key: keyof EntityData, value: string) => {
          field.onChange({
            ...entityData,
            [key]: value,
          });
        };

        return (
          <div style={{ padding: '0' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 'var(--semi-color-text-1)',
                  }}
                >
                  实体ID
                </label>
                <Input
                  size="small"
                  placeholder="请输入实体ID"
                  value={entityData.id || ''}
                  onChange={(value) => handleChange('id', value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 'var(--semi-color-text-1)',
                  }}
                >
                  实体名称
                </label>
                <Input
                  size="small"
                  placeholder="请输入实体名称"
                  value={entityData.name || ''}
                  onChange={(value) => handleChange('name', value)}
                  style={{ fontSize: '12px' }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '12px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    color: 'var(--semi-color-text-1)',
                  }}
                >
                  实体描述
                </label>
                <Input
                  size="small"
                  placeholder="请输入实体描述"
                  value={entityData.description || ''}
                  onChange={(value) => handleChange('description', value)}
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
        );
      }}
    </Field>
  );
}
