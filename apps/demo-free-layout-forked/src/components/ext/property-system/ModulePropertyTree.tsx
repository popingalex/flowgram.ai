import React from 'react';

import { Tree, Typography } from '@douyinfe/semi-ui';

import { PropertyData, ModulePropertyGroup } from '../../../utils/property-data-manager';

export interface ModulePropertyTreeProps {
  moduleGroups: ModulePropertyGroup[];
  editable?: boolean;
  onEdit?: (property: PropertyData) => void;
}

export const ModulePropertyTree: React.FC<ModulePropertyTreeProps> = ({
  moduleGroups,
  editable = false,
  onEdit,
}) => {
  const { Text } = Typography;

  // 转换为Tree组件需要的数据格式
  const treeData = moduleGroups.map((group) => ({
    label: (
      <div className="module-tree-node">
        <Text strong>{group.moduleName}</Text>
        <Text type="tertiary" size="small">
          ({group.properties.length})
        </Text>
      </div>
    ),
    value: group.moduleId,
    key: group.moduleId,
    children: group.properties.map((prop) => ({
      label: (
        <div className="property-tree-node">
          <Text>{prop.name}</Text>
          <Text type="tertiary" size="small">
            {prop.type}
          </Text>
        </div>
      ),
      value: prop.key,
      key: prop.key,
      isLeaf: true,
    })),
  }));

  if (moduleGroups.length === 0) {
    return null;
  }

  return (
    <div className="module-property-tree">
      <div className="module-property-tree-title">
        <Text strong>模块属性</Text>
      </div>
      <Tree treeData={treeData} defaultExpandAll showLine style={{ fontSize: '13px' }} />
    </div>
  );
};
