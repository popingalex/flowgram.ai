import { type FlowNodeRegistry } from '../typings';
import { TryCatchNodeRegistry } from './trycatch';
import { StartNodeRegistry } from './start';
import { LoopNodeRegistry } from './loop';
import { LLMNodeRegistry } from './llm';
import { EndNodeRegistry } from './end';
import { ConditionNodeRegistry } from './condition';
import { CatchBlockNodeRegistry } from './catch-block';
import { CaseNodeRegistry } from './case';

export const FlowNodeRegistries: FlowNodeRegistry[] = [
  StartNodeRegistry,
  EndNodeRegistry,
  ConditionNodeRegistry,
  LLMNodeRegistry,
  LoopNodeRegistry,
  CaseNodeRegistry,
  TryCatchNodeRegistry,
  CatchBlockNodeRegistry,
];
