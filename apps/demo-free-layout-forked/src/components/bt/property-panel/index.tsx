import React, { useState, useMemo } from 'react';

import { Typography } from '@douyinfe/semi-ui';
import { IconChevronDown, IconChevronRight } from '@douyinfe/semi-icons';

import { UniversalPropertyTable } from '../universal-property-table';
import {
  SidebarTree as ModulePropertyTreeTable,
  NodeDisplay as NodeModuleDisplay,
  NodeModuleData,
} from '../property-tree-bt';
import { useModuleStore } from '../../../stores/module.store';
import { useCurrentEntity } from '../../../stores';

export interface PropertyPanelProps {
  // 显示模式
  mode?: 'node' | 'sidebar';
  // 显示配置
  showEntityProperties?: boolean;
  showModuleProperties?: boolean;
  // 功能控制
  editable?: boolean;
  readonly?: boolean;
  // 标题配置
  entityTitle?: string;
  moduleTitle?: string;
}

export const PropertyPanel: React.FC<PropertyPanelProps> = ({
  mode = 'sidebar',
  showEntityProperties = true,
  showModuleProperties = true,
  editable,
  readonly = false,
  entityTitle = '实体属性',
  moduleTitle = '实体模块',
}) => {
  const [entityExpanded, setEntityExpanded] = useState(true);
  const [moduleExpanded, setModuleExpanded] = useState(true);

  const { editingEntity } = useCurrentEntity();

  const isReadonly = readonly || mode === 'node';
  const isEditable = editable !== undefined ? editable : !isReadonly;

  // 准备节点模块数据
  const nodeModuleData: NodeModuleData[] = useMemo(() => {
    if (!editingEntity?.bundles) return [];

    const { modules } = useModuleStore.getState();

    const matchedModules = modules.filter((module) => {
      const isMatched =
        editingEntity.bundles.includes(module._indexId || '') ||
        editingEntity.bundles.includes(module.id);
      return isMatched;
    });

    return matchedModules.map((module) => ({
      key: `module-${module._indexId || module.id}`,
      id: module.id,
      name: module.name,
      attributeCount: module.attributes?.length || 0,
      attributes:
        module.attributes?.map((attr: any) => ({
          id: attr.id,
          name: attr.name,
          type: attr.type,
        })) || [],
    }));
  }, [editingEntity]);

  return (
    <div style={{ width: '100%' }}>
      {/* 实体属性部分 */}
      {showEntityProperties && (
        <div style={{ marginBottom: showModuleProperties ? 16 : 0 }}>
          <UniversalPropertyTable mode={mode} editable={isEditable} readonly={isReadonly} />
        </div>
      )}

      {/* 模块属性部分 */}
      {showModuleProperties && (
        <div>
          <div
            className="property-table-title"
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginBottom: '0px',
            }}
            onClick={() => setModuleExpanded(!moduleExpanded)}
          >
            {moduleExpanded ? <IconChevronDown size="small" /> : <IconChevronRight size="small" />}
            <Typography.Text strong>{moduleTitle}</Typography.Text>
          </div>

          {moduleExpanded && (
            <div style={{ marginTop: 8 }}>
              {mode === 'sidebar' ? (
                <ModulePropertyTreeTable />
              ) : (
                <NodeModuleDisplay modules={nodeModuleData} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PropertyPanel;
