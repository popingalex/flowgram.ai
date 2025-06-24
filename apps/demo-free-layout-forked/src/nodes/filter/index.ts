import { nanoid } from 'nanoid';

import { FlowNodeRegistry } from '../../typings';
import iconFilter from '../../assets/icon-start.jpg'; // 临时使用start的图标
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

export const FilterNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Filter,
  meta: {
    defaultPorts: [{ type: 'input' }, { type: 'output' }],
    size: {
      width: 450,
      height: 380,
    },
    disableSideBar: true,
  },
  info: {
    icon: iconFilter,
    description: '条件过滤节点，支持条件判断和模块过滤',
  },
  formMeta,
  onAdd() {
    return {
      id: `filter_${nanoid(5)}`,
      type: 'filter',
      data: {
        title: 'Filter',
        moduleFilters: [],
        propertyFilters: [],
      },
    };
  },
};
