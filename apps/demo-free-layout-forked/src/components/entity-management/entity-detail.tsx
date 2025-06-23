import React, { useCallback, useMemo, useRef } from 'react';

import { Button, Space, Typography, Input, Card, Popconfirm, Badge } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete, IconBranch } from '@douyinfe/semi-icons';

import { UniversalPropertyTable } from '../bt/universal-property-table';
import { useCurrentEntity, useCurrentEntityActions } from '../../stores';
import { useModuleStore, useGraphList } from '../../stores';
import { useRouter } from '../../hooks/use-router';

const { Text, Title } = Typography;

interface EntityDetailProps {
  selectedEntity: any;
  isDirty: boolean; // 保留接口兼容性，但内部使用CurrentEntityStore的状态
  isSaving: boolean; // 保留接口兼容性，但内部使用CurrentEntityStore的状态
  canSave: boolean;
  onSave: () => void;
  onUndo: () => void;
  onDelete: () => void;
}

export const EntityDetail: React.FC<EntityDetailProps> = ({
  selectedEntity,
  canSave,
  onSave,
  onUndo,
  onDelete,
}) => {
  // 🔑 使用CurrentEntityStore的数据和状态
  const { editingEntity, isDirty, isSaving } = useCurrentEntity();
  const { updateProperty, saveChanges, resetChanges } = useCurrentEntityActions();
  const { modules } = useModuleStore();
  const { graphs } = useGraphList();
  const { navigate } = useRouter();

  // 防抖时间戳
  const lastNavigationTime = useRef<number>(0);

  // 🔑 使用CurrentEntityStore的editingEntity作为数据源
  const currentEntity = editingEntity || selectedEntity;

  // 🔑 计算工作流统计信息
  const workflowStats = useMemo(() => {
    if (!currentEntity) return { hasWorkflow: false, nodeCount: 0 };

    // 使用稳定的原始业务ID查找对应的工作流图
    const stableBusinessId = currentEntity._originalId || currentEntity.id;
    const entityGraph = graphs.find(
      (graph: any) =>
        graph.id === stableBusinessId || graph.id.toLowerCase() === stableBusinessId.toLowerCase()
    );

    const nodeCount = entityGraph?.nodes?.length || 0;
    return {
      hasWorkflow: nodeCount > 0,
      nodeCount,
      showBadge: nodeCount > 1,
    };
  }, [currentEntity, graphs]);

  // 🔑 字段更新 - 直接使用CurrentEntityStore的updateProperty
  const handleFieldChange = useCallback(
    (field: string, value: any) => {
      console.log('🔍 更新实体字段:', field, value);
      updateProperty(field, value);
    },
    [updateProperty]
  );

  // 🔑 保存 - 使用CurrentEntityStore的saveChanges
  const handleSave = useCallback(async () => {
    try {
      await saveChanges();
      onSave(); // 通知父组件
    } catch (error) {
      console.error('保存失败:', error);
    }
  }, [saveChanges, onSave]);

  // 🔑 撤销 - 使用CurrentEntityStore的resetChanges
  const handleUndo = useCallback(() => {
    resetChanges();
    onUndo(); // 通知父组件
  }, [resetChanges, onUndo]);

  // 跳转到工作流页面
  const handleNavigateToWorkflow = useCallback(() => {
    if (currentEntity) {
      const entityId = currentEntity._originalId || currentEntity.id;
      console.log('🔍 [EntityDetail] 跳转到工作流页面:', {
        currentEntity,
        entityId,
        route: 'entity-workflow',
        timestamp: Date.now(),
      });
      navigate({ route: 'entity-workflow', entityId });
    }
  }, [currentEntity, navigate]);

  // 防抖版本的跳转函数
  const debouncedNavigateToWorkflow = useCallback(() => {
    // 简单的防抖：检查是否在很短时间内重复调用
    const now = Date.now();
    if (lastNavigationTime.current && now - lastNavigationTime.current < 1000) {
      console.log('🚫 [EntityDetail] 防抖：跳过重复调用');
      return;
    }
    lastNavigationTime.current = now;
    handleNavigateToWorkflow();
  }, [handleNavigateToWorkflow]);

  // 跳转到模块编辑页面
  const handleNavigateToModule = useCallback(
    (moduleId: string) => {
      const module = modules.find((m) => m.id === moduleId);
      if (module) {
        navigate({ route: 'modules', entityId: module.id });
      }
    },
    [modules, navigate]
  );

  return (
    <Card
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ padding: 0, flex: 1, overflow: 'hidden' }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* 基本信息表单 */}
        <div style={{ padding: '24px', borderBottom: '1px solid var(--semi-color-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <Title heading={5} style={{ margin: 0 }}>
              基本信息
            </Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isDirty && (
                <Text type="warning" size="small">
                  • 有未保存的修改
                </Text>
              )}
              {isSaving && (
                <Text type="secondary" size="small">
                  正在保存...
                </Text>
              )}
              <Space>
                <Button
                  icon={<IconSave />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSave();
                  }}
                  disabled={!canSave || !isDirty}
                  loading={isSaving}
                  type="primary"
                  size="small"
                >
                  保存
                </Button>
                <Button
                  icon={<IconUndo />}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUndo();
                  }}
                  disabled={!isDirty}
                  size="small"
                >
                  撤销
                </Button>
                {workflowStats.hasWorkflow && (
                  <Badge
                    count={workflowStats.showBadge ? workflowStats.nodeCount : 0}
                    type="primary"
                  >
                    <Button
                      icon={<IconBranch />}
                      onClick={(e) => {
                        e.stopPropagation();
                        debouncedNavigateToWorkflow();
                      }}
                      size="small"
                      theme="outline"
                    >
                      工作流
                    </Button>
                  </Badge>
                )}
                <Popconfirm
                  title="确定删除这个实体吗？"
                  content="删除后将无法恢复"
                  onConfirm={(e) => {
                    e?.stopPropagation?.();
                    onDelete();
                  }}
                >
                  <Button
                    icon={<IconDelete />}
                    type="danger"
                    theme="borderless"
                    size="small"
                    onClick={(e) => e.stopPropagation()}
                  >
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
              >
                实体ID *
              </div>
              <Input
                value={currentEntity.id || ''}
                onChange={(value) => handleFieldChange('id', value)}
                placeholder="实体ID（必填）"
                style={{
                  flex: 1,
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
              >
                实体名称
              </div>
              <Input
                value={currentEntity.name || ''}
                onChange={(value) => handleFieldChange('name', value)}
                placeholder="实体名称"
                style={{ flex: 1 }}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                style={{ width: '80px', textAlign: 'right', marginRight: '12px', fontSize: '14px' }}
              >
                描述
              </div>
              <Input
                value={currentEntity.description || ''}
                onChange={(value) => handleFieldChange('description', value)}
                placeholder="实体描述"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        </div>

        {/* 属性表格区域 */}
        <div style={{ flex: 1, overflow: 'hidden', padding: '16px' }}>
          {/* 实体属性表格 */}
          <UniversalPropertyTable
            mode="sidebar"
            editable={true}
            showEntityProperties={true}
            showModuleProperties={false}
            entityTitle="实体属性"
            moduleTitle="模块属性"
          />

          {/* 模块关联表格 - 使用checkbox方式关联模块 */}
          <div style={{ marginTop: '16px' }}>
            <UniversalPropertyTable
              mode="sidebar"
              editable={false}
              showEntityProperties={false}
              showModuleProperties={true}
              entityTitle="实体属性"
              moduleTitle="模块关联"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};
