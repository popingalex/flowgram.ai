import { nanoid } from 'nanoid';
import { Field, FieldArray } from '@flowgram.ai/free-layout-editor';
import { ConditionRowValueType, VariableSelector } from '@flowgram.ai/form-materials';
import { Button, Divider, Typography } from '@douyinfe/semi-ui';
import { IconPlus, IconCrossCircleStroked } from '@douyinfe/semi-icons';

import { useNodeRenderContext } from '../../../hooks';
import { FormItem } from '../../../form-components';
import { Feedback } from '../../../form-components';
import { EnhancedConditionRow } from '../../../components/ext/condition-row-ext';
import { ConditionPort } from './styles';

interface ConditionValue {
  key: string;
  value?: ConditionRowValueType;
}

// 状态分组组件
function StateGroup({ stateId, children }: { stateId: string; children: React.ReactNode }) {
  // 从状态ID中提取显示名称
  const getStateDisplayName = (stateId: string) => {
    if (stateId === '$out') return '默认输出';

    // 处理格式如 "Vehicle.dumperAction_state" -> "dumperAction"
    const parts = stateId.split('.');
    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      return lastPart
        .replace('_state', '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
    }

    return stateId;
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
        <Typography.Text
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
          状态: {getStateDisplayName(stateId)}
        </Typography.Text>
      </Divider>
      <div style={{ paddingLeft: '8px' }}>{children}</div>
    </div>
  );
}

export function ConditionInputs() {
  const { readonly } = useNodeRenderContext();

  return (
    <FieldArray name="conditions">
      {({ field }) => {
        // 先收集所有条件并按状态ID分组
        const conditionsByState: Record<string, Array<{ child: any; index: number }>> = {};

        field.map((child: any, index: number) => {
          const stateId = child.value?.key || '$out';
          if (!conditionsByState[stateId]) {
            conditionsByState[stateId] = [];
          }
          conditionsByState[stateId].push({ child, index });
          return null; // map需要返回值，但我们不使用返回的数组
        });

        return (
          <>
            {Object.entries(conditionsByState).map(([stateId, conditionItems]) => (
              <StateGroup key={stateId} stateId={stateId}>
                {conditionItems.map(({ child, index }) => (
                  <Field<ConditionValue> key={child.name} name={child.name}>
                    {({ field: childField, fieldState: childState }) => (
                      <FormItem name="if" type="boolean" required={true} labelWidth={40}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <EnhancedConditionRow
                            readonly={readonly}
                            style={{ flexGrow: 1 }}
                            value={childField.value.value}
                            onChange={(v) =>
                              childField.onChange({ value: v, key: childField.value.key })
                            }
                          />

                          <Button
                            theme="borderless"
                            icon={<IconCrossCircleStroked />}
                            onClick={() => field.delete(index)}
                            style={{ marginLeft: '8px' }}
                          />
                        </div>

                        <Feedback errors={childState?.errors} invalid={childState?.invalid} />
                        <ConditionPort
                          data-port-id={childField.value.key}
                          data-port-type="output"
                        />
                      </FormItem>
                    )}
                  </Field>
                ))}
              </StateGroup>
            ))}

            {!readonly && (
              <div style={{ marginTop: '16px' }}>
                <Button
                  theme="borderless"
                  icon={<IconPlus />}
                  onClick={() =>
                    field.append({
                      key: `if_${nanoid(6)}`,
                      value: { type: 'expression', content: '' },
                    })
                  }
                >
                  添加条件
                </Button>
              </div>
            )}
          </>
        );
      }}
    </FieldArray>
  );
}
