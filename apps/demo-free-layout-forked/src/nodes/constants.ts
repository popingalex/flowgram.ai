export enum WorkflowNodeType {
  Start = 'start',
  End = 'end',
  LLM = 'llm',
  Action = 'action',
  Invoke = 'invoke',
  Condition = 'condition',
  Filter = 'filter',
  Loop = 'loop',
  Comment = 'comment',
  Phase = 'phase',
}
