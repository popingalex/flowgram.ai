import React, { useState } from 'react';

import { IFlowConstantRefValue } from '@flowgram.ai/form-materials';

import { EnhancedDynamicValueInput } from './index';

// 使用示例
export const DynamicValueInputExample: React.FC = () => {
  const [value, setValue] = useState<IFlowConstantRefValue | undefined>();

  return (
    <div style={{ padding: '20px' }}>
      <h3>Enhanced Dynamic Value Input 示例</h3>
      <div style={{ marginBottom: '20px' }}>
        <label>选择变量或输入常量值：</label>
        <EnhancedDynamicValueInput
          value={value}
          onChange={setValue}
          schema={{ type: 'string' }}
          style={{ width: '300px' }}
        />
      </div>

      <div>
        <h4>当前值：</h4>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </div>

      {/* 注释说明如何添加展开功能 */}
      <div
        style={{ marginTop: '20px', padding: '10px', background: '#f5f5f5', borderRadius: '4px' }}
      >
        <h4>如何添加父节点展开功能：</h4>
        <p>1. 在 EnhancedVariableSelector 中取消注释展开逻辑代码</p>
        <p>2. 实现 useVariableTree hook 或获取变量数据</p>
        <p>3. 应用 enhanceTreeData 函数来包装父节点</p>
        <p>4. 传递 expandedKeys 和 onExpand 给 TreeSelect</p>
        <p>5. 参考 function-selector 中的成功实现</p>
      </div>
    </div>
  );
};
