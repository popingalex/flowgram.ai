import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconInvoke from '../../assets/icon-invoke.jpg';
import { invokeFormMeta } from './form-meta';

let index = 0;

// Action节点注册（新名称）
export const ActionNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Action,
  info: {
    icon: iconInvoke,
    description: '执行动作或调用函数，支持参数映射和结果输出到工作流。',
  },
  meta: {
    size: {
      width: 400,
      height: 350,
    },
  },
  formMeta: invokeFormMeta,
  onAdd() {
    return {
      id: `action_${nanoid(5)}`,
      type: 'action',
      data: {
        title: `Action_${++index}`,
        inputsValues: {},
        inputs: {
          type: 'object',
          required: [],
          properties: {},
        },
        outputs: {
          type: 'object',
          properties: {},
        },
        functionMeta: null,
      },
    };
  },
};

// Invoke节点注册（保持向后兼容）
export const InvokeNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Invoke,
  info: {
    icon: iconInvoke,
    description: '调用函数或远程API，支持参数映射和结果输出到工作流。',
  },
  meta: {
    size: {
      width: 400,
      height: 350,
    },
  },
  formMeta: invokeFormMeta,
  onAdd() {
    return {
      id: `invoke_${nanoid(5)}`,
      type: 'invoke',
      data: {
        title: `Invoke_${++index}`,
        inputsValues: {},
        inputs: {
          type: 'object',
          required: [],
          properties: {},
        },
        outputs: {
          type: 'object',
          properties: {},
        },
        functionMeta: null,
      },
    };
  },
};
