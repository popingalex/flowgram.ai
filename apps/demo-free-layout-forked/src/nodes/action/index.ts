import { nanoid } from 'nanoid';

import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconInvoke from '../../assets/icon-invoke.jpg';
import { invokeFormMeta } from './form-meta';

let index = 0;

// Action节点注册（统一的动作节点）
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

// Invoke节点注册（向后兼容，指向Action）
export const InvokeNodeRegistry: FlowNodeRegistry = {
  ...ActionNodeRegistry,
  type: WorkflowNodeType.Invoke,
  onAdd() {
    return {
      id: `action_${nanoid(5)}`, // 统一使用action前缀
      type: 'action', // 统一使用action类型
      data: {
        title: `Action_${++index}`, // 统一使用Action标题
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
