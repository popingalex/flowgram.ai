import { WorkflowNodeType } from '../constants';
import { FlowNodeRegistry } from '../../typings';
import iconFilter from '../../assets/icon-start.jpg'; // 临时使用start的图标
import { formMeta } from './form-meta';

export const EntityFilterNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.EntityFilter,
  meta: {
    defaultPorts: [{ type: 'output' }],
    size: {
      width: 400,
      height: 280,
    },
  },
  info: {
    icon: iconFilter,
    description: '根据组件类型和属性条件过滤实体，返回实体集合',
  },
  formMeta,
};
