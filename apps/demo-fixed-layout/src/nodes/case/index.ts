import { nanoid } from 'nanoid';

import { FlowNodeRegistry } from '../../typings';
import iconIf from '../../assets/icon-if.png';
import { formMeta } from './form-meta';

let id = 2;
export const CaseNodeRegistry: FlowNodeRegistry = {
  type: 'case',
  /**
   * 分支节点需要继承自 block
   * Branch nodes need to inherit from 'block'
   */
  extend: 'block',
  meta: {
    copyDisable: true,
  },
  info: {
    icon: iconIf,
    description: 'Execute the branch when the condition is met.',
  },
  canAdd: () => false,
  canDelete: (ctx, node) => node.parent!.blocks.length >= 3,
  onAdd(ctx, from) {
    return {
      id: `if_${nanoid(5)}`,
      type: 'case',
      data: {
        title: `If_${id++}`,
        inputs: {
          type: 'object',
          required: ['condition'],
          inputsValues: {
            condition: '',
          },
          properties: {
            condition: {
              type: 'string',
            },
          },
        },
      },
    };
  },
  formMeta,
};
