import React, { useState } from 'react';

import { IFlowConstantRefValue } from '@flowgram.ai/form-materials';
import { Card, Space, Typography, Divider, Button } from '@douyinfe/semi-ui';

import { EnhancedDynamicValueInput } from './index';

const { Title, Paragraph, Text } = Typography;

export const EnhancedDynamicValueInputDemo: React.FC = () => {
  const [stringValue, setStringValue] = useState<IFlowConstantRefValue | undefined>();
  const [numberValue, setNumberValue] = useState<IFlowConstantRefValue | undefined>();
  const [booleanValue, setBooleanValue] = useState<IFlowConstantRefValue | undefined>();

  const resetValues = () => {
    setStringValue(undefined);
    setNumberValue(undefined);
    setBooleanValue(undefined);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px' }}>
      <Title heading={2}>Enhanced Dynamic Value Input 演示</Title>

      <Paragraph>
        这是一个增强版的 DynamicValueInput 组件，支持父节点点击展开/收缩功能。
        目前提供的是基础版本，展开功能的实现代码已包含在组件中，可根据需要启用。
      </Paragraph>

      <Space vertical style={{ width: '100%' }} spacing={24}>
        {/* 字符串输入示例 */}
        <Card title="字符串类型输入" style={{ width: '100%' }}>
          <Space vertical style={{ width: '100%' }}>
            <Text>支持输入字符串常量或选择字符串类型的变量：</Text>
            <EnhancedDynamicValueInput
              value={stringValue}
              onChange={setStringValue}
              schema={{ type: 'string' }}
              style={{ width: '400px' }}
            />
            <div>
              <Text strong>当前值：</Text>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                }}
              >
                {JSON.stringify(stringValue, null, 2) || 'undefined'}
              </pre>
            </div>
          </Space>
        </Card>

        {/* 数字输入示例 */}
        <Card title="数字类型输入" style={{ width: '100%' }}>
          <Space vertical style={{ width: '100%' }}>
            <Text>支持输入数字常量或选择数字类型的变量：</Text>
            <EnhancedDynamicValueInput
              value={numberValue}
              onChange={setNumberValue}
              schema={{ type: 'number' }}
              style={{ width: '400px' }}
            />
            <div>
              <Text strong>当前值：</Text>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                }}
              >
                {JSON.stringify(numberValue, null, 2) || 'undefined'}
              </pre>
            </div>
          </Space>
        </Card>

        {/* 布尔输入示例 */}
        <Card title="布尔类型输入" style={{ width: '100%' }}>
          <Space vertical style={{ width: '100%' }}>
            <Text>支持选择布尔常量或布尔类型的变量：</Text>
            <EnhancedDynamicValueInput
              value={booleanValue}
              onChange={setBooleanValue}
              schema={{ type: 'boolean' }}
              style={{ width: '400px' }}
            />
            <div>
              <Text strong>当前值：</Text>
              <pre
                style={{
                  background: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                }}
              >
                {JSON.stringify(booleanValue, null, 2) || 'undefined'}
              </pre>
            </div>
          </Space>
        </Card>

        <Divider />

        {/* 控制按钮 */}
        <div>
          <Button onClick={resetValues} type="secondary">
            重置所有值
          </Button>
        </div>

        {/* 使用说明 */}
        <Card title="使用说明" style={{ width: '100%' }}>
          <Space vertical style={{ width: '100%' }}>
            <Paragraph>
              <Text strong>功能特性：</Text>
            </Paragraph>
            <ul>
              <li>✅ 完全兼容原始 DynamicValueInput 的所有功能</li>
              <li>✅ 支持常量和变量引用两种输入模式</li>
              <li>✅ 支持不同类型的约束（string, number, boolean 等）</li>
              <li>✅ 点击右侧设置按钮可以切换到变量选择模式</li>
              <li>🚧 父节点展开功能（代码已准备好，可按需启用）</li>
            </ul>

            <Paragraph>
              <Text strong>如何启用父节点展开功能：</Text>
            </Paragraph>
            <ol>
              <li>
                在 <Text code>enhanced-variable-selector.tsx</Text> 中取消注释展开逻辑代码
              </li>
              <li>实现变量数据获取逻辑（参考 function-selector 的实现）</li>
              <li>
                应用 <Text code>enhanceTreeData</Text> 函数来包装父节点
              </li>
              <li>
                传递 <Text code>expandedKeys</Text> 和 <Text code>onExpand</Text> 给 TreeSelect
              </li>
            </ol>

            <Paragraph>
              <Text strong>参考实现：</Text>
            </Paragraph>
            <ul>
              <li>
                <Text code>src/components/ext/function-selector/index.tsx</Text> - 成功的 TreeSelect
                展开实现
              </li>
              <li>
                <Text code>src/components/ext/invoke-function-selector/index.tsx</Text> -
                另一个展开功能示例
              </li>
            </ul>
          </Space>
        </Card>
      </Space>
    </div>
  );
};
