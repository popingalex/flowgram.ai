import { useState, useEffect, useCallback } from 'react';

import { useClientContext, getNodeForm, FlowNodeEntity } from '@flowgram.ai/free-layout-editor';
import { Button, Badge, Toast, Popover, List } from '@douyinfe/semi-ui';

import { useGraphActions } from '../../stores/workflow-list';
import { useCurrentBehavior, useCurrentBehaviorActions } from '../../stores/current-workflow';

export function Save(props: { disabled: boolean }) {
  const [errorCount, setErrorCount] = useState(0);
  const [errorDetails, setErrorDetails] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const clientContext = useClientContext();

  // 获取当前行为状态和操作
  const { editingBehavior } = useCurrentBehavior();
  const { updateWorkflowData } = useCurrentBehaviorActions();
  const { saveGraph } = useGraphActions();

  const updateValidateData = useCallback(() => {
    const allForms = clientContext.document.getAllNodes().map((node) => getNodeForm(node));
    const invalidForms = allForms.filter((form) => form?.state.invalid);
    const count = invalidForms.length;

    // 收集错误详情
    const errors = invalidForms.map((form, index) => {
      const node = clientContext.document.getAllNodes().find((n) => getNodeForm(n) === form);
      const nodeName = (node as any)?.data?.title || (node as any)?.name || `节点${index + 1}`;
      return `${nodeName}: 表单验证失败`;
    });

    setErrorCount(count);
    setErrorDetails(errors);
  }, [clientContext]);

  /**
   * Validate all node and Save
   */
  const onSave = useCallback(async () => {
    if (!editingBehavior?.id) {
      Toast.error('无法保存：缺少行为ID');
      return;
    }

    // 验证所有节点
    const allForms = clientContext.document.getAllNodes().map((node) => getNodeForm(node));
    await Promise.all(allForms.map(async (form) => form?.validate()));

    // 检查是否有验证错误
    const hasErrors = allForms.some((form) => form?.state.invalid);
    if (hasErrors) {
      Toast.error('请先修复所有验证错误再保存');
      return;
    }

    setSaving(true);
    try {
      // 获取当前工作流数据
      const workflowData = clientContext.document.toJSON();
      console.log('💾 保存工作流数据:', { behaviorId: editingBehavior.id, workflowData });

      // 构造图形数据结构 - 使用spread先展开，再覆盖必要字段
      const graphData = {
        ...editingBehavior, // 使用当前编辑的行为数据
        ...workflowData, // 覆盖工作流数据
        id: editingBehavior.id, // 确保ID正确
      };

      // 保存到后台 - 使用类型断言，因为运行时数据结构是兼容的
      await saveGraph(graphData as any);

      // 更新本地状态
      updateWorkflowData(workflowData);

      Toast.success('工作流保存成功');
    } catch (error) {
      console.error('❌ 工作流保存失败:', error);
      Toast.error('工作流保存失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  }, [clientContext, editingBehavior, saveGraph, updateWorkflowData]);

  /**
   * Listen single node validate
   */
  useEffect(() => {
    const listenSingleNodeValidate = (node: FlowNodeEntity) => {
      const form = getNodeForm(node);
      if (form) {
        const formValidateDispose = form.onValidate(() => updateValidateData());
        node.onDispose(() => formValidateDispose.dispose());
      }
    };
    clientContext.document.getAllNodes().map((node) => listenSingleNodeValidate(node));
    const dispose = clientContext.document.onNodeCreate(({ node }) =>
      listenSingleNodeValidate(node)
    );
    return () => dispose.dispose();
  }, [clientContext]);

  // 错误详情弹窗
  const errorPopover = (
    <div style={{ maxWidth: '300px' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>发现 {errorCount} 个问题：</div>
      <List
        size="small"
        dataSource={errorDetails}
        renderItem={(error) => (
          <List.Item style={{ padding: '4px 0' }}>
            <span style={{ color: 'var(--semi-color-danger)' }}>• {error}</span>
          </List.Item>
        )}
      />
    </div>
  );

  const saveButton = (
    <Button
      disabled={props.disabled || saving || errorCount > 0}
      loading={saving}
      onClick={onSave}
      type={errorCount > 0 ? 'danger' : 'primary'}
      style={{
        backgroundColor: errorCount > 0 ? 'rgba(255, 179, 171, 0.3)' : 'rgba(171,181,255,0.3)',
        borderRadius: '8px',
      }}
    >
      {saving ? '保存中...' : 'Save'}
    </Button>
  );

  if (errorCount === 0) {
    return saveButton;
  }

  return (
    <Popover content={errorPopover} trigger="hover" position="bottom" showArrow>
      <Badge count={errorCount} position="rightTop" type="danger">
        {saveButton}
      </Badge>
    </Popover>
  );
}
