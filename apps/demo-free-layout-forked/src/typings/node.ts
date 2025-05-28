import {
  WorkflowNodeJSON as FlowNodeJSONDefault,
  WorkflowNodeRegistry as FlowNodeRegistryDefault,
  FreeLayoutPluginContext,
  FlowNodeEntity,
  type WorkflowEdgeJSON,
  WorkflowNodeMeta,
} from '@flowgram.ai/free-layout-editor';
import { IFlowValue } from '@flowgram.ai/form-materials';
import { type IJsonSchema } from '@flowgram.ai/form-materials';

import { type EntityDefinition, type WorkflowEntityData } from './mas/entity';

/**
 * You can customize the data of the node, and here you can use JsonSchema to define the input and output of the node
 * 你可以自定义节点的 data 业务数据, 这里演示 通过 JsonSchema 来定义节点的输入/输出
 */
export interface FlowNodeJSON extends FlowNodeJSONDefault {
  data: {
    /**
     * Node title
     */
    title?: string;
    /**
     * Inputs data values
     */
    inputsValues?: Record<string, IFlowValue>;
    /**
     * Define the inputs data of the node by IJsonSchema
     */
    inputs?: IJsonSchema;
    /**
     * Define the outputs data of the node by IJsonSchema
     */
    outputs?: IJsonSchema;
    /**
     * Entity definition for multi-agent system
     */
    entityDefinition?: EntityDefinition;
    /**
     * Workflow entity data for display
     */
    workflowEntityData?: WorkflowEntityData;
    /**
     * Rest properties
     */
    [key: string]: any;
  };
}

/**
 * You can customize your own node meta
 * 你可以自定义节点的meta
 */
export interface FlowNodeMeta extends WorkflowNodeMeta {
  disableSideBar?: boolean;
}

/**
 * You can customize your own node registry
 * 你可以自定义节点的注册器
 */
export interface FlowNodeRegistry extends FlowNodeRegistryDefault {
  meta: FlowNodeMeta;
  info?: {
    icon: string;
    description: string;
  };
  canAdd?: (ctx: FreeLayoutPluginContext) => boolean;
  canDelete?: (ctx: FreeLayoutPluginContext, from: FlowNodeEntity) => boolean;
  onAdd?: (ctx: FreeLayoutPluginContext) => FlowNodeJSON;
}

export interface FlowDocumentJSON {
  nodes: FlowNodeJSON[];
  edges: WorkflowEdgeJSON[];
}
