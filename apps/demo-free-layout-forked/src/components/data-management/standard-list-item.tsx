import React from 'react';
import { Typography, Tag, Space, Badge } from '@douyinfe/semi-ui';

const { Text } = Typography;

export interface StandardListItemProps {
  // 基础信息
  primaryText: string; // 主要ID/标识符
  secondaryText?: string; // 次要名称/描述
  
  // 状态
  isSelected?: boolean;
  isActive?: boolean;
  
  // 标签信息
  tags?: Array<{
    text: string;
    color?: string;
    count?: number;
  }>;
  
  // 右侧标识
  badge?: {
    text?: string;
    count?: number;
    type?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  };
  
  // 交互
  onClick?: () => void;
  onDoubleClick?: () => void;
  
  // 样式
  style?: React.CSSProperties;
  className?: string;
  testId?: string;
}

export const StandardListItem: React.FC<StandardListItemProps> = ({
  primaryText,
  secondaryText,
  isSelected = false,
  isActive = false,
  tags = [],
  badge,
  onClick,
  onDoubleClick,
  style,
  className,
  testId,
}) => {
  const baseStyle: React.CSSProperties = {
    padding: '12px 16px',
    borderBottom: '1px solid var(--semi-color-border)',
    cursor: onClick ? 'pointer' : 'default',
    backgroundColor: isSelected 
      ? 'var(--semi-color-primary-light-default)' 
      : 'transparent',
    borderLeft: isSelected 
      ? '3px solid var(--semi-color-primary)' 
      : '3px solid transparent',
    transition: 'all 0.2s ease',
    ...style,
  };

  const hoverStyle = onClick ? {
    ':hover': {
      backgroundColor: isSelected 
        ? 'var(--semi-color-primary-light-active)' 
        : 'var(--semi-color-fill-0)',
    }
  } : {};

  return (
    <div
      style={baseStyle}
      className={className}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      data-testid={testId}
      onMouseEnter={(e) => {
        if (onClick && !isSelected) {
          e.currentTarget.style.backgroundColor = 'var(--semi-color-fill-0)';
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* 左侧内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* 主要文本 */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: secondaryText ? '4px' : '0' }}>
            <Text
              strong
              style={{
                fontSize: '14px',
                color: isSelected ? 'var(--semi-color-primary)' : 'var(--semi-color-text-0)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              {primaryText}
            </Text>
            
            {/* 状态指示器 */}
            {isActive && (
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--semi-color-success)',
                  marginLeft: '8px',
                  flexShrink: 0,
                }}
              />
            )}
          </div>
          
          {/* 次要文本 */}
          {secondaryText && (
            <Text
              type="tertiary"
              size="small"
              style={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                marginBottom: tags.length > 0 ? '8px' : '0',
              }}
            >
              {secondaryText}
            </Text>
          )}
          
          {/* 标签列表 */}
          {tags.length > 0 && (
            <Space wrap spacing={4} style={{ marginTop: '4px' }}>
              {tags.map((tag, index) => (
                <Tag
                  key={index}
                  color={tag.color as any || 'blue'}
                  size="small"
                  style={{ fontSize: '11px' }}
                >
                  {tag.text}
                  {tag.count !== undefined && ` (${tag.count})`}
                </Tag>
              ))}
            </Space>
          )}
        </div>
        
        {/* 右侧徽章 */}
        {badge && (
          <div style={{ marginLeft: '12px', flexShrink: 0 }}>
            {badge.count !== undefined ? (
              <Badge
                count={badge.count}
                type={badge.type || 'primary'}
                style={{ fontSize: '11px' }}
              />
            ) : badge.text ? (
              <Tag
                color={badge.type === 'danger' ? 'red' : badge.type === 'success' ? 'green' : 'blue'}
                size="small"
              >
                {badge.text}
              </Tag>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
};

// 预设样式变体
export const EntityListItem: React.FC<{
  entity: {
    id: string;
    name?: string;
    description?: string;
    bundles?: string[];
    attributes?: any[];
  };
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ entity, isSelected, onClick }) => (
  <StandardListItem
    primaryText={entity.id}
    secondaryText={entity.name || entity.description}
    isSelected={isSelected}
    onClick={onClick}
    tags={[
      ...(entity.bundles?.map(bundle => ({ text: bundle, color: 'blue' })) || []),
    ]}
    // 实体不再支持属性，移除badge显示
    testId={`entity-item-${entity.id}`}
  />
);

export const ModuleListItem: React.FC<{
  module: {
    id: string;
    name?: string;
    description?: string;
    attributes?: any[];
    modules?: any[];
  };
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ module, isSelected, onClick }) => (
  <StandardListItem
    primaryText={module.id}
    secondaryText={module.name || module.description}
    isSelected={isSelected}
    onClick={onClick}
    tags={[
      { text: '属性', count: module.attributes?.length || 0, color: 'green' },
      { text: '模块', count: module.modules?.length || 0, color: 'orange' },
    ]}
    testId={`module-item-${module.id}`}
  />
);

export const BehaviorListItem: React.FC<{
  behavior: {
    id: string;
    name?: string;
    method?: string;
    url?: string;
    status?: 'active' | 'inactive' | 'error';
  };
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ behavior, isSelected, onClick }) => (
  <StandardListItem
    primaryText={behavior.id}
    secondaryText={behavior.name || behavior.url}
    isSelected={isSelected}
    isActive={behavior.status === 'active'}
    onClick={onClick}
    tags={[
      ...(behavior.method ? [{ text: behavior.method, color: 'red' }] : []),
    ]}
    badge={{
      text: behavior.status || 'unknown',
      type: behavior.status === 'active' ? 'success' : 
            behavior.status === 'error' ? 'danger' : 'secondary',
    }}
    testId={`behavior-item-${behavior.id}`}
  />
);

export const SystemListItem: React.FC<{
  system: {
    id: string;
    name?: string;
    type?: string;
    enabled?: boolean;
    inputs?: any[];
  };
  isSelected?: boolean;
  onClick?: () => void;
}> = ({ system, isSelected, onClick }) => (
  <StandardListItem
    primaryText={system.id}
    secondaryText={system.name}
    isSelected={isSelected}
    isActive={system.enabled}
    onClick={onClick}
    tags={[
      ...(system.type ? [{ text: system.type, color: 'purple' }] : []),
    ]}
    badge={{
      count: system.inputs?.length || 0,
      type: 'secondary',
    }}
    testId={`system-item-${system.id}`}
  />
); 