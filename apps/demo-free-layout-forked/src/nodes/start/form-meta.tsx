import React, { useEffect } from 'react';

import { FormMeta, ValidateTrigger, Field, FormRenderProps } from '@flowgram.ai/free-layout-editor';
import { Input, TextArea, Typography, InputNumber } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import { useCurrentBehavior, useCurrentBehaviorActions } from '../../stores/current-workflow';
import { FormHeader, FormContent, FormItem, FormOutputs } from '../../form-components';

const renderForm = ({ form }: FormRenderProps<FlowNodeJSON>) => {
  // 🔑 获取当前行为信息，start节点从WorkflowGraph读取属性
  const { editingBehavior } = useCurrentBehavior();
  const { updateBehavior } = useCurrentBehaviorActions();

  // 生成基础的输出配置，不依赖外部状态
  const generateBasicOutputs = () => {
    const properties: Record<string, any> = {};

    // 添加基础的上下文属性
    properties['$context'] = {
      type: 'object',
      title: '上下文',
      description: '工作流执行上下文',
      properties: {
        entityId: {
          type: 'string',
          title: '实体ID',
          description: '当前实体的ID',
        },
        timestamp: {
          type: 'string',
          title: '时间戳',
          description: '工作流执行时间',
        },
        executionId: {
          type: 'string',
          title: '执行ID',
          description: '当前执行的唯一标识',
        },
      },
    };

    // 添加一些常用的输出属性示例
    properties['result'] = {
      type: 'string',
      title: '结果',
      description: '节点执行结果',
    };

    properties['status'] = {
      type: 'string',
      title: '状态',
      description: '执行状态',
      enum: ['success', 'error', 'pending'],
    };

    return {
      type: 'object',
      properties,
    };
  };

  const outputs = generateBasicOutputs();

  // 自动更新表单的outputs字段
  useEffect(() => {
    if (form.setValueIn && outputs) {
      form.setValueIn('outputs', outputs);
    }
  }, [outputs, form.setValueIn]);

  // 🔑 处理行为属性变化，直接更新WorkflowGraph
  const handleBehaviorChange = (field: string, value: any) => {
    if (updateBehavior) {
      updateBehavior({ [field]: value });
    }
  };

  return (
    <>
      <FormHeader />
      <FormContent>
        <FormItem name="ID" type="string" required>
          <Input
            value={editingBehavior?.id || ''}
            onChange={(value) => handleBehaviorChange('id', value)}
            placeholder="系统唯一标识符"
            style={{ width: '100%' }}
          />
        </FormItem>

        <FormItem name="名称" type="string">
          <Input
            value={editingBehavior?.name || ''}
            onChange={(value) => handleBehaviorChange('name', value)}
            placeholder="行为名称"
            style={{ width: '100%' }}
          />
        </FormItem>

        <FormItem name="描述" type="string">
          <TextArea
            value={editingBehavior?.desc || ''}
            onChange={(value) => handleBehaviorChange('desc', value)}
            placeholder="行为描述"
            style={{ width: '100%' }}
            rows={3}
          />
        </FormItem>
      </FormContent>
    </>
  );
};

export const formMeta: FormMeta<FlowNodeJSON> = {
  render: renderForm,
  validateTrigger: ValidateTrigger.onChange,
  validate: {
    title: ({ value }: { value: string }) => (value ? undefined : '标题不能为空'),
    id: ({ value }: { value: string }) => (value ? undefined : 'ID不能为空'),
  },
};
