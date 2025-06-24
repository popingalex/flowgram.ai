import { FlowNodeRegistry } from '../typings';
import { StartNodeRegistry } from './start';
import { PhaseNodeRegistry } from './phase';
import { LoopNodeRegistry } from './loop';
import { LLMNodeRegistry } from './llm';
import { FilterNodeRegistry } from './filter';
import { EndNodeRegistry } from './end';
import { WorkflowNodeType } from './constants';
import { ConditionNodeRegistry } from './condition';
import { CommentNodeRegistry } from './comment';
import { ActionNodeRegistry } from './action';
export { WorkflowNodeType } from './constants';

export const nodeRegistries: FlowNodeRegistry[] = [
  ConditionNodeRegistry,
  FilterNodeRegistry,
  StartNodeRegistry,
  EndNodeRegistry,
  LLMNodeRegistry,
  ActionNodeRegistry,
  LoopNodeRegistry,
  PhaseNodeRegistry,
  CommentNodeRegistry,
];

export const visibleNodeRegistries = nodeRegistries.filter(
  (r) => r.type !== WorkflowNodeType.Comment
);
