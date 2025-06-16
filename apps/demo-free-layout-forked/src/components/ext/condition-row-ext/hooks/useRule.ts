import { useMemo } from 'react';

import { useScopeAvailable } from '@flowgram.ai/free-layout-editor';
import { JsonSchemaUtils, IFlowRefValue, JsonSchemaBasicType } from '@flowgram.ai/form-materials';

import { rules } from '../constants';

export function useRule(left?: IFlowRefValue) {
  const available = useScopeAvailable();

  const variable = useMemo(() => {
    if (!left) return undefined;
    return available.getByKeyPath(left.content);
  }, [available, left]);

  const rule = useMemo(() => {
    if (!variable) return undefined;

    const schema = JsonSchemaUtils.astToSchema(variable.type, { drilldown: false });

    return rules[schema?.type as JsonSchemaBasicType];
  }, [variable]);

  return { rule };
}
