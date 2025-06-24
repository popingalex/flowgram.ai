export enum WorkflowNodeType {
  Start = 'start',
  End = 'end',
  LLM = 'llm',
  Action = 'action',
  Invoke = 'invoke',
  Condition = 'condition',
  Loop = 'loop',
  Comment = 'comment',
  Phase = 'phase',
  EntityFilter = 'entity-filter',
  SystemAction = 'system-action',
}
