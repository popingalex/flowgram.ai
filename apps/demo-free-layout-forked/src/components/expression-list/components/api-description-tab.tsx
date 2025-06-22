import React, { useCallback, useState } from 'react';

import { nanoid } from 'nanoid';
import { TextArea } from '@douyinfe/semi-ui';

interface ApiDescriptionTabProps {
  currentEditingApi: any;
  onFieldChange?: (field: string, value: any) => void;
}

export const ApiDescriptionTab: React.FC<ApiDescriptionTabProps> = ({
  currentEditingApi,
  onFieldChange,
}) => {
  // 🔑 为TextArea生成稳定的key
  const [componentKey] = useState(() => nanoid());

  // 更新API字段
  const handleUpdateApiField = useCallback(
    (field: string, value: any) => {
      if (onFieldChange) {
        onFieldChange(field, value);
      }
    },
    [onFieldChange]
  );

  return (
    <div style={{ padding: '16px 24px' }}>
      <TextArea
        key={componentKey}
        value={currentEditingApi.description || ''}
        onChange={(value) => handleUpdateApiField('description', value)}
        placeholder="请输入API描述"
        rows={10}
      />
    </div>
  );
};
