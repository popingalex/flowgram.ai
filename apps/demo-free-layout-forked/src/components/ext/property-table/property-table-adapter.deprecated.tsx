import React from 'react';

import { NodePropertyTable } from './node-property-table';

interface PropertyItem {
  id: string;
  name?: string;
  type: string;
  description?: string;
}

interface PropertyTableAdapterProps {
  title: string;
  properties: PropertyItem[];
  mode: 'node' | 'drawer' | 'sidebar';
}

export const PropertyTableAdapter: React.FC<PropertyTableAdapterProps> = ({
  title,
  properties,
  mode,
}) => {
  switch (mode) {
    case 'node':
      return <NodePropertyTable title={title} properties={properties} showDescription={false} />;
    case 'drawer':
      return <NodePropertyTable title={title} properties={properties} showDescription={true} />;
    case 'sidebar':
      // 侧边栏模式暂时使用相同的组件
      return <NodePropertyTable title={title} properties={properties} showDescription={true} />;
    default:
      return null;
  }
};
