import React, { ReactNode } from 'react';

import {
  Typography,
  Button,
  Space,
  Popconfirm,
  Empty,
  Card,
  Badge,
  Tooltip,
} from '@douyinfe/semi-ui';
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
  renderContent?: (item: any, actionButtons?: ReactNode, statusInfo?: ReactNode) => ReactNode;

  // 验证
  validationErrors?: string[]; // 验证错误列表

  // 文本
  emptyText?: string;
  saveButtonText?: string;
  undoButtonText?: string;
  deleteButtonText?: string;
  deleteConfirmTitle?: string;
  deleteConfirmContent?: string;

  // 样式和测试
  style?: React.CSSProperties;
  testId?: string; // 自定义测试ID前缀
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
  validationErrors = [],
  emptyText = '请选择左侧项目查看详情',
  saveButtonText = '保存',
  undoButtonText = '撤销',
  deleteButtonText = '删除',
  deleteConfirmTitle = '确定删除吗？',
  deleteConfirmContent = '删除后将无法恢复',
  style,
  testId = 'entity', // 默认值为entity，保持向后兼容
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
        data-testid="empty-state"
      >
        <Empty title="未选择项目" description={emptyText} />
      </div>
    );
  }

  // 操作按钮组
  const actionButtons = (onSave || onUndo || onDelete) && (
    <Space>
      {onSave &&
        (validationErrors.length > 0 ? (
          <Tooltip
            content={
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                  发现 {validationErrors.length} 个问题：
                </div>
                <ul style={{ margin: 0, paddingLeft: '16px' }}>
                  {validationErrors.map((error, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            }
            position="bottomLeft"
          >
            <Badge count={validationErrors.length} type="danger">
              <Button
                icon={<IconSave />}
                onClick={onSave}
                disabled={!canSave || !isDirty}
                loading={isSaving}
                type="primary"
                size="small"
                data-testid={`save-${testId}-btn`}
              >
                {saveButtonText}
              </Button>
            </Badge>
          </Tooltip>
        ) : (
          <Button
            icon={<IconSave />}
            onClick={onSave}
            disabled={!canSave || !isDirty}
            loading={isSaving}
            type="primary"
            size="small"
            data-testid={`save-${testId}-btn`}
          >
            {saveButtonText}
          </Button>
        ))}

      {onUndo && (
        <Button
          icon={<IconUndo />}
          onClick={onUndo}
          disabled={!isDirty}
          size="small"
          data-testid={`undo-${testId}-btn`}
        >
          {undoButtonText}
        </Button>
      )}

      {onDelete && (
        <Popconfirm title={deleteConfirmTitle} content={deleteConfirmContent} onConfirm={onDelete}>
          <Button
            icon={<IconDelete />}
            type="danger"
            theme="borderless"
            size="small"
            data-testid={`delete-${testId}-btn`}
          >
            {deleteButtonText}
          </Button>
        </Popconfirm>
      )}
    </Space>
  );

  // 状态信息
  const statusInfo = (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      {isSaving && (
        <Text type="secondary" size="small">
          正在保存...
        </Text>
      )}
    </div>
  );

  return (
    <Card
      style={{ height: '100%', ...style }}
      bodyStyle={{
        padding: 0,
        height: '100%',
        overflow: 'hidden',
      }}
      data-testid={`${testId}-detail-panel`}
    >
      {renderContent ? (
        renderContent(selectedItem, actionButtons, statusInfo)
      ) : (
        <div style={{ padding: '24px' }}>
          <Text>请实现 renderContent 函数</Text>
        </div>
      )}
    </Card>
  );
};
