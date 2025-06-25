import React from 'react';

import { Button, Badge, Popover, List } from '@douyinfe/semi-ui';
import { IconSave } from '@douyinfe/semi-icons';

interface SaveButtonWithValidationProps {
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  isValid: boolean;
  errors: string[];
  size?: 'small' | 'default' | 'large';
  type?: 'primary' | 'secondary' | 'tertiary' | 'warning' | 'danger';
}

export const SaveButtonWithValidation: React.FC<SaveButtonWithValidationProps> = ({
  onClick,
  loading = false,
  disabled = false,
  isValid,
  errors,
  size = 'small',
  type = 'primary',
}) => {
  // 如果有错误，显示错误详情的弹窗
  const errorPopover = (
    <div style={{ maxWidth: '300px' }}>
      <div style={{ fontWeight: 600, marginBottom: '8px' }}>发现 {errors.length} 个问题：</div>
      <List
        size="small"
        dataSource={errors}
        renderItem={(error) => (
          <List.Item style={{ padding: '4px 0' }}>
            <span style={{ color: 'var(--semi-color-danger)' }}>• {error}</span>
          </List.Item>
        )}
      />
    </div>
  );

  const button = (
    <Button
      icon={<IconSave />}
      type={type}
      size={size}
      onClick={onClick}
      loading={loading}
      disabled={disabled || loading || !isValid}
    >
      保存
    </Button>
  );

  // 如果数据无效，用Badge包装按钮并添加Popover
  if (!isValid && errors.length > 0) {
    return (
      <Popover content={errorPopover} trigger="hover" position="bottom" showArrow>
        <Badge count={errors.length} type="danger">
          {button}
        </Badge>
      </Popover>
    );
  }

  return button;
};
