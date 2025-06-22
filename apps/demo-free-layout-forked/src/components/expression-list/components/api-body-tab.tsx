import React, { useCallback, useState } from 'react';

import { nanoid } from 'nanoid';
import { TextArea } from '@douyinfe/semi-ui';

interface ApiBodyTabProps {
  currentEditingApi: any;
  onFieldChange?: (field: string, value: any) => void;
}

export const ApiBodyTab: React.FC<ApiBodyTabProps> = ({ currentEditingApi, onFieldChange }) => {
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
    <div style={{ padding: '16px 24px', height: '100%' }}>
      <TextArea
        key={componentKey}
        value={currentEditingApi.body || ''}
        onChange={(value) => handleUpdateApiField('body', value)}
        placeholder="请输入请求Body内容（JSON格式）"
        rows={20}
        style={{ fontFamily: 'monospace' }}
      />
    </div>
  );
};
