import { PositionSchema } from '@flowgram.ai/utils';
import { WorkflowNodeEntity } from '@flowgram.ai/free-layout-core';
import { FlowNodeRegistry, FlowNodeBaseType, FlowNodeTransformData } from '@flowgram.ai/document';

export const GroupNodeRegistry: FlowNodeRegistry = {
  type: FlowNodeBaseType.GROUP,
  meta: {
    renderKey: FlowNodeBaseType.GROUP,
    defaultPorts: [],
    isContainer: true,
    disableSideBar: true,
    size: {
      width: 560,
      height: 400,
    },
    padding: () => ({
      top: 80,
      bottom: 40,
      left: 65,
      right: 65,
    }),
    selectable(node: WorkflowNodeEntity, mousePos?: PositionSchema): boolean {
      if (!mousePos) {
        return true;
      }
      const transform = node.getData<FlowNodeTransformData>(FlowNodeTransformData);
      return !transform.bounds.contains(mousePos.x, mousePos.y);
    },
    expandable: false,
  },
  formMeta: {
    render: () => <></>,
  },
};
