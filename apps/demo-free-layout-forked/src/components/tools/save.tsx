import { useState, useEffect, useCallback } from 'react';

import { useClientContext, getNodeForm, FlowNodeEntity } from '@flowgram.ai/free-layout-editor';
import { Button, Badge, Toast } from '@douyinfe/semi-ui';

import { useGraphActions } from '../../stores/graph.store';
import { useCurrentGraph, useCurrentGraphActions } from '../../stores/current-graph.store';

export function Save(props: { disabled: boolean }) {
  const [errorCount, setErrorCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const clientContext = useClientContext();

  // 获取当前图形状态和操作
  const { entityId, graphId } = useCurrentGraph();
  const { updateWorkflowData } = useCurrentGraphActions();
  const { saveGraph } = useGraphActions();

  const updateValidateData = useCallback(() => {
    const allForms = clientContext.document.getAllNodes().map((node) => getNodeForm(node));
    const count = allForms.filter((form) => form?.state.invalid).length;
    setErrorCount(count);
  }, [clientContext]);

  /**
   * Validate all node and Save
   */
  const onSave = useCallback(async () => {
    if (!entityId || !graphId) {
      Toast.error('无法保存：缺少实体ID或图形ID');
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
      console.log('💾 保存工作流数据:', { entityId, graphId, workflowData });

      // 构造图形数据结构 - 使用spread先展开，再覆盖必要字段
      const graphData = {
        ...workflowData, // 先展开所有工作流数据
        id: graphId, // 覆盖ID
        name: graphId, // 覆盖名称
        type: 'graph', // 确保类型正确
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
  }, [clientContext, entityId, graphId, saveGraph, updateWorkflowData]);

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

  if (errorCount === 0) {
    return (
      <Button
        disabled={props.disabled || saving}
        loading={saving}
        onClick={onSave}
        style={{ backgroundColor: 'rgba(171,181,255,0.3)', borderRadius: '8px' }}
      >
        {saving ? '保存中...' : 'Save'}
      </Button>
    );
  }
  return (
    <Badge count={errorCount} position="rightTop" type="danger">
      <Button
        type="danger"
        disabled={props.disabled || saving}
        loading={saving}
        onClick={onSave}
        style={{ backgroundColor: 'rgba(255, 179, 171, 0.3)', borderRadius: '8px' }}
      >
        {saving ? '保存中...' : 'Save'}
      </Button>
    </Badge>
  );
}
