import React, { ReactNode } from 'react';

import { Typography, Button, Space, Popconfirm, Empty, Card } from '@douyinfe/semi-ui';
import { IconSave, IconUndo, IconDelete } from '@douyinfe/semi-icons';

const { Title, Text } = Typography;

interface DetailPanelProps {
  // 数据
  selectedItem?: any;

  // 状态
  isDirty?: boolean;
  isSaving?: boolean;
  canSave?: boolean;

  // 操作
  onSave?: () => void;
  onUndo?: () => void;
  onDelete?: () => void;

  // 渲染
  renderContent?: (item: any) => ReactNode;

  // 文本
  emptyText?: string;
  saveButtonText?: string;
  undoButtonText?: string;
  deleteButtonText?: string;
  deleteConfirmTitle?: string;
  deleteConfirmContent?: string;

  // 样式
  style?: React.CSSProperties;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({
  selectedItem,
  isDirty = false,
  isSaving = false,
  canSave = false,
  onSave,
  onUndo,
  onDelete,
  renderContent,
  emptyText = '请选择左侧项目查看详情',
  saveButtonText = '保存',
  undoButtonText = '撤销',
  deleteButtonText = '删除',
  deleteConfirmTitle = '确定删除吗？',
  deleteConfirmContent = '删除后将无法恢复',
  style,
}) => {
  if (!selectedItem) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...style,
        }}
      >
        <Empty title="未选择项目" description={emptyText} />
      </div>
    );
  }

  // 操作按钮组
  const actionButtons = (onSave || onUndo || onDelete) && (
    <Space>
      {onSave && (
        <Button
          icon={<IconSave />}
          onClick={onSave}
          disabled={!canSave || !isDirty}
          loading={isSaving}
          type="primary"
          size="small"
        >
          {saveButtonText}
        </Button>
      )}

      {onUndo && (
        <Button icon={<IconUndo />} onClick={onUndo} disabled={!isDirty} size="small">
          {undoButtonText}
        </Button>
      )}

      {onDelete && (
        <Popconfirm title={deleteConfirmTitle} content={deleteConfirmContent} onConfirm={onDelete}>
          <Button icon={<IconDelete />} type="danger" theme="borderless" size="small">
            {deleteButtonText}
          </Button>
        </Popconfirm>
      )}
    </Space>
  );

  return (
    <Card
      style={{ height: '100%', ...style }}
      headerStyle={{
        padding: '16px 24px',
        backgroundColor: 'var(--semi-color-bg-1)',
      }}
      bodyStyle={{
        padding: 0,
        height: 'calc(100% - 60px)',
        overflow: 'hidden',
      }}
      header={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
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
          </div>
          {actionButtons}
        </div>
      }
    >
      {renderContent ? (
        renderContent(selectedItem)
      ) : (
        <div style={{ padding: '24px' }}>
          <Text>请实现 renderContent 函数</Text>
        </div>
      )}
    </Card>
  );
};
