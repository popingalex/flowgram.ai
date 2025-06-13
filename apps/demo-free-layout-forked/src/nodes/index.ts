import { FlowNodeRegistry } from '../typings';
import { StartNodeRegistry } from './start';
import { PhaseNodeRegistry } from './phase';
import { LoopNodeRegistry } from './loop';
import { LLMNodeRegistry } from './llm';
import { InvokeNodeRegistry } from './invoke';
import { EndNodeRegistry } from './end';
import { WorkflowNodeType } from './constants';
import { ConditionNodeRegistry } from './condition';
import { CommentNodeRegistry } from './comment';
export { WorkflowNodeType } from './constants';

export const nodeRegistries: FlowNodeRegistry[] = [
  ConditionNodeRegistry,
  StartNodeRegistry,
  EndNodeRegistry,
  LLMNodeRegistry,
  InvokeNodeRegistry,
  LoopNodeRegistry,
  PhaseNodeRegistry,
  CommentNodeRegistry,
];

export const visibleNodeRegistries = nodeRegistries.filter(
  (r) => r.type !== WorkflowNodeType.Comment
);
