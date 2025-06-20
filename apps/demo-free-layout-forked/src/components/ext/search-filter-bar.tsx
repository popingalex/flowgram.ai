import React from 'react';

import { Input, Button, Space } from '@douyinfe/semi-ui';
import { IconRefresh } from '@douyinfe/semi-icons';

interface SearchFilterBarProps {
  searchText: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  placeholder?: string;
  refreshText?: string;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  searchText,
  onSearchChange,
  onRefresh,
  loading = false,
  placeholder = '搜索...',
  refreshText = '刷新',
}) => (
  <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
    <Input
      placeholder={placeholder}
      value={searchText}
      onChange={onSearchChange}
      style={{ width: 300 }}
      prefix={null}
    />
    <Button icon={<IconRefresh />} onClick={onRefresh} loading={loading}>
      {refreshText}
    </Button>
  </div>
);
