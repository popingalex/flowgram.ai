import { nanoid } from 'nanoid';
import {
  WorkflowNodeEntity,
  PositionSchema,
  FlowNodeTransformData,
} from '@flowgram.ai/free-layout-editor';

import { defaultFormMeta } from '../default-form-meta';
import { FlowNodeRegistry } from '../../typings';
import iconLoop from '../../assets/icon-loop.jpg'; // 暂时复用loop图标
import { PhaseFormRender } from './phase-form-render';
import { WorkflowNodeType } from '../constants';

let index = 0;
export const PhaseNodeRegistry: FlowNodeRegistry = {
  type: WorkflowNodeType.Phase,
  info: {
    icon: iconLoop,
    description: 'Phase control node that groups multiple actions and conditions.',
  },
  meta: {
    /**
     * Mark as subcanvas
     * 子画布标记
     */
    isContainer: true,
    /**
     * The subcanvas default size setting
     * 子画布默认大小设置
     */
    size: {
      width: 800, // 增加宽度适应更多内容
      height: 600, // 增加高度
    },
    /**
     * The subcanvas padding setting
     * 子画布 padding 设置
     */
    padding: () => ({
      top: 125,
      bottom: 100,
      left: 100,
      right: 100,
    }),
    /**
     * Controls the node selection status within the subcanvas
     * 控制子画布内的节点选中状态
     */
    selectable(node: WorkflowNodeEntity, mousePos?: PositionSchema): boolean {
      if (!mousePos) {
        return true;
      }
      const transform = node.getData<FlowNodeTransformData>(FlowNodeTransformData);
      // 鼠标开始时所在位置不包括当前节点时才可选中
      return !transform.bounds.contains(mousePos.x, mousePos.y);
    },
    expandable: false, // disable expanded
  },
  onAdd() {
    return {
      id: `phase_${nanoid(5)}`,
      type: 'phase',
      data: {
        title: `Phase_${++index}`,
        phaseType: 'sequence', // 默认为sequence类型
      },
    };
  },
  formMeta: {
    ...defaultFormMeta,
    render: PhaseFormRender,
  },
  onCreate() {
    // NOTICE: 这个函数是为了避免触发固定布局 flowDocument.addBlocksAsChildren
  },
};
