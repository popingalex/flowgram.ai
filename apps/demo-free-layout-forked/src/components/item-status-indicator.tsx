import React from 'react';

import { Tag, Spin } from '@douyinfe/semi-ui';
import { IconSave, IconEdit, IconPlus } from '@douyinfe/semi-icons';

import { ItemStatus } from '../services/types';

interface ItemStatusIndicatorProps {
  status?: ItemStatus;
  size?: 'small' | 'default' | 'large';
}

// 通用数据项状态指示器 - 可用于实体、模块、属性、行为树等
export const ItemStatusIndicator: React.FC<ItemStatusIndicatorProps> = ({
  status = 'saved',
  size = 'small',
}) => {
  switch (status) {
    case 'new':
      return (
        <Tag color="blue" size={size} prefixIcon={<IconPlus />}>
          新增
        </Tag>
      );

    case 'dirty':
      return (
        <Tag color="orange" size={size} prefixIcon={<IconEdit />}>
          已修改
        </Tag>
      );

    case 'saving':
      return (
        <Tag color="green" size={size} prefixIcon={<Spin size="small" />}>
          保存中
        </Tag>
      );

    case 'saved':
    default:
      return (
        <Tag color="grey" size={size} prefixIcon={<IconSave />}>
          已保存
        </Tag>
      );
  }
};

// 向后兼容的别名
export const EntityStatusIndicator = ItemStatusIndicator;
