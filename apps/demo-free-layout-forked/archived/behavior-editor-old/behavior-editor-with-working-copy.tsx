import React, { useEffect, useMemo } from 'react';

import {
  Button,
  Input,
  TextArea,
  InputNumber,
  Typography,
  Space,
  Divider,
} from '@douyinfe/semi-ui';
import { IconSave, IconRefresh, IconEdit } from '@douyinfe/semi-icons';

import { useGraphActions, useGraphList } from '../../stores/workflow-list';
import { WorkflowGraph } from '../../stores/workflow-list';
import {
  useWorkingCopy,
  commonValidator,
  commonCleanForComparison,
} from '../../hooks/use-working-copy';

const { Title, Text } = Typography;

interface BehaviorEditorWithWorkingCopyProps {
  behaviorId: string | null;
  onBehaviorChange?: (behavior: WorkflowGraph | null) => void;
}

/**
 * 使用working copy hook的行为编辑器示例
 * 展示了如何用通用hook替代复杂的Store逻辑
 */
export const BehaviorEditorWithWorkingCopy: React.FC<BehaviorEditorWithWorkingCopyProps> = ({
  behaviorId,
  onBehaviorChange,
}) => {
  // Graph Store操作
  const { getGraphById, saveGraph, createGraph } = useGraphActions();
  const { graphs } = useGraphList();

  // 🔑 使用通用working copy hook管理数据
  const workingCopy = useWorkingCopy<WorkflowGraph>({
    debugName: 'BehaviorEditor',
    defaultValidator: commonValidator,
    cleanForComparison: commonCleanForComparison,
  });

  // 当选择的行为改变时，加载到working copy
  useEffect(() => {
    if (behaviorId) {
      const behavior = getGraphById(behaviorId);
      if (behavior) {
        workingCopy.setOriginal(behavior);
        console.log('🔄 [BehaviorEditorWithWorkingCopy] 加载行为到working copy:', behaviorId);
      }
    } else {
      workingCopy.setOriginal(null);
    }
  }, [behaviorId, getGraphById, workingCopy]);

  // 通知父组件行为变化
  useEffect(() => {
    if (onBehaviorChange) {
      onBehaviorChange(workingCopy.current);
    }
  }, [workingCopy.current, onBehaviorChange]);

  // 保存函数
  const handleSave = async () => {
    if (!workingCopy.current) return;

    try {
      const saveFunction = async (behavior: WorkflowGraph) => {
        if ((behavior as any).isNew) {
          // 新建行为
          const { isNew, ...behaviorToSave } = behavior as any;
          await createGraph(behaviorToSave);
        } else {
          // 更新现有行为
          await saveGraph(behavior);
        }
      };

      await workingCopy.save(saveFunction);
      console.log('✅ [BehaviorEditorWithWorkingCopy] 保存成功');
    } catch (error) {
      console.error('❌ [BehaviorEditorWithWorkingCopy] 保存失败:', error);
    }
  };

  // 验证当前数据
  const validation = useMemo(() => workingCopy.validate(), [workingCopy.current]);

  // 如果没有选择行为
  if (!workingCopy.current) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Text type="secondary">请选择一个行为进行编辑</Text>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      {/* 标题和状态 */}
      <div style={{ marginBottom: '20px' }}>
        <Title heading={4}>
          行为编辑器 (Working Copy Hook)
          {workingCopy.isDirty && <Text type="warning"> • 已修改</Text>}
          {workingCopy.isSaving && <Text type="secondary"> • 保存中...</Text>}
        </Title>

        {workingCopy.error && (
          <Text type="danger" style={{ display: 'block', marginTop: '8px' }}>
            错误: {workingCopy.error}
          </Text>
        )}
      </div>

      {/* 基本信息编辑 */}
      <Space vertical style={{ width: '100%' }} spacing={20}>
        {/* ID */}
        <div>
          <Text strong>行为ID *</Text>
          <Input
            value={workingCopy.current.id || ''}
            onChange={(value) => workingCopy.updateCurrent({ id: value })}
            placeholder="输入行为ID"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={workingCopy.isSaving}
          />
        </div>

        {/* 名称 */}
        <div>
          <Text strong>行为名称 *</Text>
          <Input
            value={workingCopy.current.name || ''}
            onChange={(value) => workingCopy.updateCurrent({ name: value })}
            placeholder="输入行为名称"
            style={{ width: '100%', marginTop: '8px' }}
            disabled={workingCopy.isSaving}
          />
        </div>

        {/* 描述 */}
        <div>
          <Text strong>行为描述</Text>
          <TextArea
            value={workingCopy.current.desc || ''}
            onChange={(value) => workingCopy.updateCurrent({ desc: value })}
            placeholder="输入行为描述"
            style={{ width: '100%', marginTop: '8px' }}
            rows={3}
            disabled={workingCopy.isSaving}
          />
        </div>

        {/* 优先级 */}
        <div>
          <Text strong>优先级</Text>
          <InputNumber
            value={workingCopy.current.priority || 0}
            onChange={(value) => workingCopy.updateCurrent({ priority: Number(value) || 0 })}
            style={{ width: '100%', marginTop: '8px' }}
            disabled={workingCopy.isSaving}
            min={0}
          />
        </div>

        <Divider />

        {/* 工作流信息 */}
        <div>
          <Text strong>工作流信息</Text>
          <div style={{ marginTop: '8px', color: 'var(--semi-color-text-2)' }}>
            <div>节点数量: {workingCopy.current.nodes?.length || 0}</div>
            <div>连线数量: {workingCopy.current.edges?.length || 0}</div>
          </div>
        </div>

        {/* 验证信息 */}
        {!validation.isValid && (
          <div>
            <Text type="danger" strong>
              验证错误:
            </Text>
            <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
              {validation.errors.map((error: string, index: number) => (
                <li key={index}>
                  <Text type="danger">{error}</Text>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 操作按钮 */}
        <Space>
          <Button
            type="primary"
            icon={<IconSave />}
            onClick={handleSave}
            disabled={!workingCopy.isDirty || !validation.isValid || workingCopy.isSaving}
            loading={workingCopy.isSaving}
          >
            保存变化
          </Button>

          <Button
            icon={<IconRefresh />}
            onClick={workingCopy.reset}
            disabled={!workingCopy.isDirty || workingCopy.isSaving}
          >
            重置
          </Button>

          <Button
            type="tertiary"
            onClick={() => workingCopy.setError(null)}
            disabled={!workingCopy.error}
          >
            清除错误
          </Button>
        </Space>
      </Space>

      {/* 调试信息 */}
      <Divider />
      <details style={{ marginTop: '20px' }}>
        <summary>
          <Text type="secondary">调试信息</Text>
        </summary>
        <div style={{ marginTop: '10px', fontSize: '12px', color: 'var(--semi-color-text-2)' }}>
          <div>isDirty: {workingCopy.isDirty.toString()}</div>
          <div>isSaving: {workingCopy.isSaving.toString()}</div>
          <div>hasError: {(!!workingCopy.error).toString()}</div>
          <div>isValid: {validation.isValid.toString()}</div>
        </div>
      </details>
    </div>
  );
};

// 🔑 使用示例：在父组件中如何使用
export const BehaviorEditorExample: React.FC = () => {
  const [selectedBehaviorId, setSelectedBehaviorId] = React.useState<string | null>(null);
  const [currentBehavior, setCurrentBehavior] = React.useState<WorkflowGraph | null>(null);

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* 左侧：行为列表 */}
      <div style={{ width: '300px', borderRight: '1px solid var(--semi-color-border)' }}>
        <BehaviorList selectedId={selectedBehaviorId} onSelect={setSelectedBehaviorId} />
      </div>

      {/* 右侧：行为编辑器 */}
      <div style={{ flex: 1 }}>
        <BehaviorEditorWithWorkingCopy
          behaviorId={selectedBehaviorId}
          onBehaviorChange={setCurrentBehavior}
        />
      </div>
    </div>
  );
};

// 简化的行为列表组件
const BehaviorList: React.FC<{
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}> = ({ selectedId, onSelect }) => {
  const { graphs } = useGraphList();
  const behaviors = graphs.filter((g) => g.type === 'behavior');

  return (
    <div style={{ padding: '10px' }}>
      <Title heading={5}>行为列表</Title>
      {behaviors.map((behavior) => (
        <div
          key={behavior._indexId || behavior.id}
          style={{
            padding: '10px',
            margin: '5px 0',
            backgroundColor:
              selectedId === behavior.id ? 'var(--semi-color-primary-light-default)' : undefined,
            cursor: 'pointer',
            borderRadius: '4px',
          }}
          onClick={() => onSelect(behavior.id)}
        >
          <div style={{ fontWeight: 'bold' }}>{behavior.name}</div>
          <div style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>{behavior.id}</div>
        </div>
      ))}
    </div>
  );
};
