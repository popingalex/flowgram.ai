import React, { useCallback } from 'react';

import { Input } from '@douyinfe/semi-ui';

import { useCurrentExpressionActions } from '../../../stores/current-expression.store';

interface ApiHeaderProps {
  apiName: string;
  selectedExpressionId?: string;
}

export const ApiHeader: React.FC<ApiHeaderProps> = ({ apiName, selectedExpressionId }) => {
  const currentExpressionActions = useCurrentExpressionActions();

  // 更新API字段
  const handleUpdateApiField = useCallback(
    (field: string, value: any) => {
      currentExpressionActions.updateProperty(field, value);
    },
    [currentExpressionActions]
  );

  return (
    <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--semi-color-border)' }}>
      <Input
        value={apiName}
        onChange={(value) => handleUpdateApiField('name', value)}
        style={{ fontSize: '18px', fontWeight: 'bold', border: 'none' }}
        placeholder="API名称"
      />
    </div>
  );
};
