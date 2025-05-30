import { useContext, useEffect } from 'react';

import {
  Field,
  FieldRenderProps,
  FormRenderProps,
  FormMeta,
  ValidateTrigger,
} from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Toast } from '@douyinfe/semi-ui';

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

  // 导航到模块管理页面的回调
  const handleNavigateToModule = (moduleId: string) => {
    // 触发关联模块弹窗，并聚焦到指定模块
    // 这需要与EntityPropertiesEditor组件通信，让它打开模块选择器并聚焦到指定模块
    // 我们通过设置一个状态来实现这个功能

    // 由于这个函数在EntityPropertiesEditor内部被调用，
    // 我们需要让EntityPropertiesEditor自己处理这个逻辑
    console.log(`Request to focus on module: ${moduleId}`);
  };

  return (
    <EntityPropertiesEditor
      value={value}
      onChange={onChange}
      currentEntityId={selectedEntityId || undefined}
      onNavigateToModule={handleNavigateToModule}
      hideModuleGrouping={false}
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
