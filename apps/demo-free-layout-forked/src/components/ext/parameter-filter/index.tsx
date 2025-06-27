import React from 'react';

import { nanoid } from 'nanoid';
import { Button, Divider, Typography, Select, Space, Input, Card } from '@douyinfe/semi-ui';
import { IconPlus, IconDelete } from '@douyinfe/semi-icons';

import { EnhancedConditionRow } from '../condition-row-ext';
import { ParameterFilter, BehaviorParameter } from '../../../typings/behavior';
import { useModuleStore } from '../../../stores/module-list';

const { Text } = Typography;

interface ParameterFilterEditorProps {
  value: ParameterFilter;
  onChange: (filter: ParameterFilter) => void;
  readonly?: boolean;
}

// 模块过滤组件
const ModuleFilterEditor: React.FC<{
  value?: { whitelist: string[]; blacklist: string[] };
  onChange: (value: { whitelist: string[]; blacklist: string[] }) => void;
  readonly?: boolean;
}> = ({ value = { whitelist: [], blacklist: [] }, onChange, readonly }) => {
  const { modules } = useModuleStore();

  return (
    <div style={{ marginBottom: '16px' }}>
      <Divider
        margin="12px"
        align="left"
        style={{
          borderColor: '#52c41a',
          borderWidth: '1px',
        }}
      >
        <Text
          strong
          style={{
            color: '#52c41a',
            fontSize: '13px',
            padding: '2px 8px',
            backgroundColor: '#f6ffed',
            borderRadius: '4px',
            border: '1px solid #b7eb8f',
          }}
        >
          模块过滤条件
        </Text>
      </Divider>

      <div style={{ paddingLeft: '8px' }}>
        {/* 白名单选择 */}
        <div style={{ marginBottom: '12px' }}>
          <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
            ✅ 白名单（包含模块）
          </Text>
          <Select
            multiple
            placeholder="选择要包含的模块"
            value={value.whitelist}
            onChange={(whitelist) => {
              onChange({
                ...value,
                whitelist: whitelist as string[],
              });
            }}
            style={{ width: '100%' }}
            disabled={readonly}
            showClear
            maxTagCount={3}
          >
            {modules.map((module) => (
              <Select.Option key={module._indexId} value={module.id}>
                {module.id} ({module.name})
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* 黑名单选择 */}
        <div style={{ marginBottom: '12px' }}>
          <Text strong style={{ fontSize: '13px', marginBottom: '8px', display: 'block' }}>
            ❌ 黑名单（排除模块）
          </Text>
          <Select
            multiple
            placeholder="选择要排除的模块"
            value={value.blacklist}
            onChange={(blacklist) => {
              onChange({
                ...value,
                blacklist: blacklist as string[],
              });
            }}
            style={{ width: '100%' }}
            disabled={readonly}
            showClear
            maxTagCount={3}
          >
            {modules.map((module) => (
              <Select.Option key={module._indexId} value={module.id}>
                {module.id} ({module.name})
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>
    </div>
  );
};

// 属性过滤组件
const PropertyFilterEditor: React.FC<{
  value?: Array<{
    key: string;
    value?: any;
  }>;
  onChange: (value: Array<{ key: string; value?: any }>) => void;
  selectedModuleIds: string[];
  readonly?: boolean;
}> = ({ value = [], onChange, selectedModuleIds, readonly }) => {
  const addPropertyFilter = () => {
    const newFilter = {
      key: `property_${nanoid(6)}`,
      value: { type: 'expression', content: '' },
    };
    onChange([...value, newFilter]);
  };

  const updatePropertyFilter = (index: number, updatedValue: any) => {
    const newFilters = [...value];
    newFilters[index] = {
      ...newFilters[index],
      value: updatedValue,
    };
    onChange(newFilters);
  };

  const deletePropertyFilter = (index: number) => {
    const newFilters = value.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  return (
    <div style={{ marginBottom: '16px' }}>
      <Divider
        margin="12px"
        align="left"
        style={{
          borderColor: '#1890ff',
          borderWidth: '1px',
        }}
      >
        <Text
          strong
          style={{
            color: '#1890ff',
            fontSize: '13px',
            padding: '2px 8px',
            backgroundColor: '#f0f8ff',
            borderRadius: '4px',
            border: '1px solid #d6e4ff',
          }}
        >
          属性过滤条件
        </Text>
      </Divider>

      <div style={{ paddingLeft: '8px' }}>
        {/* 属性过滤条件列表 */}
        {value.map((filter, index) => (
          <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
            <EnhancedConditionRow
              readonly={readonly}
              style={{ flexGrow: 1 }}
              value={filter.value}
              onChange={(v) => updatePropertyFilter(index, v)}
              selectedModuleIds={selectedModuleIds}
            />

            {!readonly && (
              <Button
                theme="borderless"
                icon={<IconDelete />}
                onClick={() => deletePropertyFilter(index)}
                style={{ marginLeft: '8px' }}
                size="small"
              />
            )}
          </div>
        ))}

        {/* 添加按钮 */}
        {!readonly && (
          <div style={{ marginTop: '8px' }}>
            <Button theme="borderless" icon={<IconPlus />} onClick={addPropertyFilter} size="small">
              添加属性条件
            </Button>
          </div>
        )}

        {/* 空状态提示 */}
        {value.length === 0 && (
          <Text type="tertiary" style={{ fontSize: '12px', marginBottom: '8px', display: 'block' }}>
            暂无属性过滤条件
          </Text>
        )}

        {/* 提示信息 */}
        {selectedModuleIds.length > 0 && (
          <div
            style={{
              marginTop: '8px',
              padding: '8px',
              backgroundColor: '#f0f8ff',
              borderRadius: '4px',
              border: '1px solid #d6e4ff',
            }}
          >
            <Text type="tertiary" style={{ fontSize: '12px' }}>
              💡 提示：已选择 {selectedModuleIds.length} 个模块，变量选择器中会显示对应模块的属性
            </Text>
          </div>
        )}
      </div>
    </div>
  );
};

// 参数过滤编辑器
export const ParameterFilterEditor: React.FC<ParameterFilterEditorProps> = ({
  value,
  onChange,
  readonly = false,
}) => {
  // 获取选中的模块ID（白名单 + 黑名单）
  const selectedModuleIds = [
    ...(value.moduleFilter?.whitelist || []),
    ...(value.moduleFilter?.blacklist || []),
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* 模块过滤 */}
      <ModuleFilterEditor
        value={value.moduleFilter}
        onChange={(moduleFilter) => onChange({ ...value, moduleFilter })}
        readonly={readonly}
      />

      {/* 属性过滤 */}
      <PropertyFilterEditor
        value={value.propertyFilters}
        onChange={(propertyFilters) => onChange({ ...value, propertyFilters })}
        selectedModuleIds={selectedModuleIds}
        readonly={readonly}
      />
    </div>
  );
};

// 参数编辑器组件
interface BehaviorParameterEditorProps {
  parameter: BehaviorParameter;
  onChange: (updates: Partial<BehaviorParameter>) => void;
  onDelete: () => void;
}

export const BehaviorParameterEditor: React.FC<BehaviorParameterEditorProps> = ({
  parameter,
  onChange,
  onDelete,
}) => (
  <Card
    style={{ marginBottom: '12px' }}
    headerStyle={{ padding: '12px 16px' }}
    bodyStyle={{ padding: '16px' }}
    title={
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>参数: {parameter.name}</Text>
        <Button
          type="danger"
          theme="borderless"
          icon={<IconDelete />}
          size="small"
          onClick={onDelete}
        />
      </div>
    }
  >
    <Space vertical style={{ width: '100%' }}>
      <div>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
          参数名称
        </Text>
        <Input
          value={parameter.name}
          onChange={(value) => onChange({ name: value })}
          placeholder="请输入参数名称"
        />
      </div>

      <div>
        <Text strong style={{ display: 'block', marginBottom: '8px' }}>
          参数描述
        </Text>
        <Input
          value={parameter.description || ''}
          onChange={(value) => onChange({ description: value })}
          placeholder="请输入参数描述（可选）"
        />
      </div>

      <div>
        <Text type="tertiary" style={{ fontSize: '12px' }}>
          💡 提示：参数用于过滤参与计算的实体子集。具体的过滤条件配置功能待完善。
        </Text>
      </div>
    </Space>
  </Card>
);
