import { nanoid } from 'nanoid';
import { FlowNodeSplitType } from '@flowgram.ai/fixed-layout-editor';

import { defaultFormMeta } from '../default-form-meta';
import { FlowNodeRegistry } from '../../typings';
import iconCondition from '../../assets/icon-condition.svg';

export const ConditionNodeRegistry: FlowNodeRegistry = {
  extend: FlowNodeSplitType.DYNAMIC_SPLIT,
  type: 'condition',
  info: {
    icon: iconCondition,
    description:
      'Connect multiple downstream branches. Only the corresponding branch will be executed if the set conditions are met.',
  },
  meta: {
    expandable: false, // disable expanded
  },
  formMeta: defaultFormMeta,
  onAdd() {
    return {
      id: `condition_${nanoid(5)}`,
      type: 'condition',
      data: {
        title: 'Condition',
      },
      blocks: [
        {
          id: nanoid(5),
          type: 'block',
          data: {
            title: 'If_0',
            inputsValues: {
              condition: { type: 'constant', content: '' },
            },
            inputs: {
              type: 'object',
              required: ['condition'],
              properties: {
                condition: {
                  type: 'boolean',
                },
              },
            },
          },
          blocks: [],
        },
        {
          id: nanoid(5),
          type: 'block',
          data: {
            title: 'If_1',
            inputsValues: {
              condition: { type: 'constant', content: '' },
            },
            inputs: {
              type: 'object',
              required: ['condition'],
              properties: {
                condition: {
                  type: 'boolean',
                },
              },
            },
          },
        },
      ],
    };
  },
};
