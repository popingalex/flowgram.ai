import { FlowNodeRegistry } from '../../typings';
import iconStart from '../../assets/icon-start.jpg';
import { formMeta } from './form-meta';
import { WorkflowNodeType } from '../constants';

export const StartNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Start,
  meta: {
    isStart: true,
    deleteDisable: true,
    copyDisable: true,
    disableSideBar: true,
    defaultPorts: [{ type: 'output' }],
    size: {
      width: 360,
      height: 211,
    },
  },
  info: {
    icon: iconStart,
    description:
      'The starting node of the workflow, used to set the information needed to initiate the workflow.',
  },
  /**
   * Render node via formMeta
   */
  formMeta,
  /**
   * Start Node cannot be added
   */
  canAdd() {
    return false;
  },
  /**
   * Initialize start node with basic outputs
   */
  onAdd() {
    return {
      id: 'start',
      type: 'start',
      data: {
        // 🔑 移除title字段，让节点显示name字段
        id: '',
        description: '',
        outputs: {
          type: 'object',
          properties: {
            // 初始为空，将在表单中动态生成
          },
        },
      },
    };
  },
};
