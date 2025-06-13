import React, { useState } from 'react';

import { EnhancedDynamicValueInput } from './index';

export const TestEnhancedDynamicValueInput: React.FC = () => {
  const [value, setValue] = useState<any>();

  return (
    <div style={{ padding: 20, maxWidth: 400 }}>
      <h3>测试增强版 DynamicValueInput</h3>

      <div style={{ marginBottom: 20 }}>
        <label>当前值: {JSON.stringify(value)}</label>
      </div>

      <EnhancedDynamicValueInput
        value={value}
        onChange={setValue}
        schema={{
          type: 'string',
          title: '测试字段',
        }}
      />

      <div style={{ marginTop: 20 }}>
        <p>功能说明：</p>
        <ul>
          <li>✅ 支持常量和变量引用切换</li>
          <li>🎯 支持父节点点击展开/收缩</li>
          <li>✅ 显示 $id, $name, $desc 系统属性</li>
          <li>✅ 显示实体扩展属性（使用语义化ID）</li>
        </ul>
      </div>
    </div>
  );
};
