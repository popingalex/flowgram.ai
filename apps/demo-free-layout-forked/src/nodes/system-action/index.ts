import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconAction from '../../assets/icon-start.jpg'; // 临时使用start的图标
import { formMeta } from './form-meta';

export const SystemActionNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.SystemAction,
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: {
      width: 450,
      height: 320,
    },
  },
  info: {
    icon: iconAction,
    description: 'ECS系统节点，执行多个实体集合参与的行为函数',
  },
  formMeta,
};
