import React, { useState } from 'react';

import { Input, Button, Select, TreeSelect } from '@douyinfe/semi-ui';
import { IconSetting } from '@douyinfe/semi-icons';

interface ParameterMappingInputProps {
  value?: string;
  mappingType?: 'constant' | 'parameter';
  onChange?: (type: 'constant' | 'parameter', value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

// 简单的变量树结构
const variableTreeData = [
  {
    key: '$start',
    label: '$start',
    value: '$start',
    children: [
      {
        key: '$start.context',
        label: 'context',
        value: '$start.context',
        children: [
          {
            key: '$start.context.entityId',
            label: 'entityId',
            value: '$start.context.entityId',
          },
          {
            key: '$start.context.taskId',
            label: 'taskId',
            value: '$start.context.taskId',
          },
          {
            key: '$start.context.instanceId',
            label: 'instanceId',
            value: '$start.context.instanceId',
          },
        ],
      },
      {
        key: '$start.input',
        label: 'input',
        value: '$start.input',
        children: [
          {
            key: '$start.input.params',
            label: 'params',
            value: '$start.input.params',
          },
        ],
      },
    ],
  },
];

export const ParameterMappingInput: React.FC<ParameterMappingInputProps> = ({
  value = '',
  mappingType = 'constant',
  onChange,
  disabled = false,
  placeholder = '输入参数值',
}) => {
  const [showVariableSelector, setShowVariableSelector] = useState(false);

  const handleInputChange = (newValue: string) => {
    onChange?.('constant', newValue);
  };

  const handleVariableSelect = (selectedValue: string) => {
    onChange?.('parameter', selectedValue);
    setShowVariableSelector(false);
  };

  const handleClearVariable = () => {
    onChange?.('constant', '');
  };

  const isVariableMode = mappingType === 'parameter' && value;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', position: 'relative' }}>
      {/* 主输入区域：输入框或选择框 */}
      {isVariableMode ? (
        // 变量模式：显示为选择框，展示选中的变量标签
        <Select
          size="small"
          value={value}
          disabled={disabled}
          style={{ flex: 1 }}
          placeholder="已选择变量"
          showClear
          onClear={handleClearVariable}
          optionList={[{ value: value, label: value }]}
          // 禁用下拉，只显示当前选中项
          dropdownClassName="hidden"
        />
      ) : (
        // 常量模式：普通输入框
        <Input
          size="small"
          value={value}
          onChange={handleInputChange}
          disabled={disabled}
          placeholder="输入常量值或点击右侧按钮选择变量"
          style={{ flex: 1 }}
        />
      )}

      {/* 变量选择按钮和下拉菜单 */}
      <div style={{ position: 'relative' }}>
        <Button
          size="small"
          icon={<IconSetting />}
          disabled={disabled}
          onClick={() => setShowVariableSelector(!showVariableSelector)}
          style={{
            minWidth: '28px',
          }}
        />

        {showVariableSelector && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              zIndex: 1000,
              marginTop: '4px',
              width: '280px',
              backgroundColor: 'white',
              border: '1px solid var(--semi-color-border)',
              borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
          >
            <TreeSelect
              style={{ width: '100%' }}
              treeData={variableTreeData}
              placeholder="选择变量..."
              searchPlaceholder="搜索变量..."
              dropdownStyle={{ position: 'static', boxShadow: 'none', border: 'none' }}
              onChange={(val) => handleVariableSelect(val as string)}
              expandAction="click"
              filterTreeNode
              onBlur={() => setShowVariableSelector(false)}
            />
          </div>
        )}
      </div>

      {/* 点击外部关闭下拉菜单 */}
      {showVariableSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onClick={() => setShowVariableSelector(false)}
        />
      )}
    </div>
  );
};
