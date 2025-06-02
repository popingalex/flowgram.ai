import React, { useContext } from 'react';

import {
  Field,
  FieldRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
} from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Toast, Typography, Divider, Form, Input } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import { useIsSidebar } from '../../hooks';
import {
  FormHeader,
  FormContent,
  FormOutputs,
  FormInputs,
  EntityForm,
} from '../../form-components';
import { SidebarContext } from '../../context';
import { PropertyTableAdapter } from '../../components/ext/property-table/property-table-adapter';
import { useEntityStore } from '../../components/ext/entity-store';

const { Text } = Typography;

// 扩展IJsonSchema类型以包含我们需要的字段
interface ExtendedJsonSchema extends IJsonSchema {
  id?: string;
  _id?: string;
  title?: string;
}

export const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  const isSidebar = useIsSidebar();
  const { selectedEntityId } = useContext(SidebarContext);
  const { getEntity, updateEntity } = useEntityStore();

  const currentEntity = selectedEntityId ? getEntity(selectedEntityId) : null;

  // 处理实体信息变化
  const handleEntityChange = (field: string, value: string) => {
    if (!currentEntity) return;

    updateEntity(currentEntity.id, { [field]: value });
  };

  return (
    <>
      <FormHeader />
      <FormContent>
        <FormInputs />
        {isSidebar ? (
          <>
            {/* 抽屉模式下的实体Meta信息 - 可编辑 */}
            {currentEntity && (
              <>
                <div style={{ padding: '8px 0', marginBottom: '8px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
                    实体信息
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>ID</div>
                      <Input value={currentEntity.id} readonly size="small" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        名称
                      </div>
                      <Input value={currentEntity.name} readonly size="small" />
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                        描述
                      </div>
                      <Input
                        value={currentEntity.description || ''}
                        readonly
                        size="small"
                        placeholder="请输入实体描述"
                      />
                    </div>
                  </div>
                </div>
                <Divider margin="8px" />
              </>
            )}
            <Field name="data.outputs">
              {({ field: { value, onChange } }: FieldRenderProps<IJsonSchema>) => (
                <PropertyTableAdapter
                  value={value}
                  onChange={onChange}
                  currentEntityId={selectedEntityId ?? undefined}
                  isEditMode={true} // 抽屉模式，可编辑
                  compact={false} // 非紧凑模式
                />
              )}
            </Field>
          </>
        ) : (
          <FormOutputs />
        )}
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
