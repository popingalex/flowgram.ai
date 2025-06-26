import React, { useEffect } from 'react';

import {
  FormMeta,
  ValidateTrigger,
  Field,
  FormRenderProps,
  createEffectFromVariableProvider,
  ASTFactory,
} from '@flowgram.ai/free-layout-editor';
import { Input, TextArea, Typography, InputNumber } from '@douyinfe/semi-ui';

import { FlowNodeJSON } from '../../typings';
import { useModuleStore } from '../../stores/module-list';
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
  // 🎯 关键修复：配置变量输出能力
  effect: {
    // 将outputs字段转换为变量输出
    outputs: createEffectFromVariableProvider({
      parse: (outputs: any, ctx) => {
        if (!outputs || !outputs.properties) {
          return [];
        }

        // 🔍 调试：打印outputs数据
        console.log('[Start节点] 变量输出解析:', {
          nodeId: ctx.node.id,
          outputs,
          propertiesCount: Object.keys(outputs.properties).length,
          propertyKeys: Object.keys(outputs.properties),
        });

        // 创建一个根变量，包含所有属性
        return [
          ASTFactory.createVariableDeclaration({
            key: `$start`, // 🎯 关键：使用$start作为变量key
            meta: {
              title: '开始节点输出',
              icon: ctx.node.getNodeRegistry?.()?.info?.icon,
            },
            type: ASTFactory.createObject({
              properties: Object.entries(outputs.properties).map(
                ([key, property]: [string, any]) => {
                  // 🔍 调试：打印每个属性
                  console.log('[Start节点] 处理属性:', { key, property });

                  return ASTFactory.createProperty({
                    key: key,
                    meta: {
                      title: property.name || property.title || key,
                      description: property.description,
                      isEntityProperty: property.isEntityProperty,
                      isModuleProperty: property.isModuleProperty,
                      isContextProperty: property.isContextProperty,
                      moduleId: property.moduleId,
                    },
                    type: convertPropertyTypeToAST(property),
                  });
                }
              ),
            }),
          }),
        ];
      },
    }),
  },
};

// 🔧 辅助函数：将属性类型转换为AST类型
function convertPropertyTypeToAST(property: any): any {
  switch (property.type) {
    case 'string':
      return ASTFactory.createString();
    case 'number':
      return ASTFactory.createNumber();
    case 'boolean':
      return ASTFactory.createBoolean();
    case 'array':
      return ASTFactory.createArray({
        items: property.items
          ? convertPropertyTypeToAST(property.items)
          : ASTFactory.createString(),
      });
    case 'object':
      if (property.properties && typeof property.properties === 'object') {
        return ASTFactory.createObject({
          properties: Object.entries(property.properties).map(([key, subProperty]: [string, any]) =>
            ASTFactory.createProperty({
              key: key,
              type: convertPropertyTypeToAST(subProperty),
            })
          ),
        });
      }
      return ASTFactory.createObject({ properties: [] });
    default:
      return ASTFactory.createString();
  }
}
