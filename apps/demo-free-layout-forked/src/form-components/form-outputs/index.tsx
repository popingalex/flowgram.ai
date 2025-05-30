import React, { useState, useMemo, useContext } from 'react';

import { Field } from '@flowgram.ai/free-layout-editor';
import { IJsonSchema } from '@flowgram.ai/form-materials';
import { Typography, Tag, Collapsible } from '@douyinfe/semi-ui';
import { IconChevronDown, IconChevronRight } from '@douyinfe/semi-icons';

import { TypeTag } from '../type-tag';
import { useIsSidebar } from '../../hooks';
import { SidebarContext } from '../../context';
import { useModuleStore } from '../../components/ext/entity-property-type-selector/module-store';
import { useEntityStore } from '../../components/ext/entity-property-type-selector/entity-store';
import { FormOutputsContainer } from './styles';

const { Text } = Typography;

// 属性项组件
const PropertyItem: React.FC<{
  name: string;
  property: any;
  isModuleProperty?: boolean;
  moduleName?: string;
}> = ({ name, property, isModuleProperty, moduleName }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      padding: '6px 8px',
      backgroundColor: isModuleProperty ? 'var(--semi-color-fill-0)' : 'transparent',
      borderRadius: '4px',
      marginBottom: '2px',
      border: isModuleProperty ? '1px solid var(--semi-color-border)' : 'none',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', flex: 1, gap: '8px' }}>
      <TypeTag type={property.type as string} />
      <Text style={{ fontSize: '12px', flex: 1 }}>{name}</Text>
    </div>
  </div>
);

// 模块组件
const ModuleGroup: React.FC<{
  moduleId: string;
  moduleName: string;
  properties: Array<{ name: string; property: any }>;
  defaultCollapsed?: boolean;
}> = ({ moduleId, moduleName, properties, defaultCollapsed = true }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div
      style={{
        marginBottom: '8px',
        border: '1px solid var(--semi-color-border)',
        borderRadius: '6px',
        overflow: 'hidden',
      }}
    >
      {/* 模块标题栏 */}
      <div
        style={{
          padding: '8px 12px',
          backgroundColor: 'var(--semi-color-fill-0)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: collapsed ? 'none' : '1px solid var(--semi-color-border)',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {collapsed ? <IconChevronRight size="small" /> : <IconChevronDown size="small" />}
          <Text strong style={{ fontSize: '13px', color: 'var(--semi-color-primary)' }}>
            {moduleName} ({moduleId})
          </Text>
          <Tag size="small" color="blue">
            {properties.length} 属性
          </Tag>
        </div>
      </div>

      {/* 模块属性内容 */}
      {!collapsed && (
        <div style={{ padding: '8px' }}>
          {properties.map(({ name, property }) => (
            <PropertyItem
              key={name}
              name={name}
              property={property}
              isModuleProperty={true}
              moduleName={moduleName}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export function FormOutputs() {
  const isSidebar = useIsSidebar();
  const { selectedEntityId } = useContext(SidebarContext);
  const { getEntity } = useEntityStore();
  const { getModulesByIds } = useModuleStore();

  if (isSidebar) {
    return null;
  }

  return (
    <Field<IJsonSchema> name={'outputs'}>
      {({ field }) => {
        const properties = field.value?.properties;
        if (!properties || Object.keys(properties).length === 0) {
          return (
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Text type="tertiary" style={{ fontSize: '12px' }}>
                暂无输出属性
              </Text>
            </div>
          );
        }

        // 获取当前实体信息
        const currentEntity = selectedEntityId ? getEntity(selectedEntityId) : null;

        // 分类属性
        const entityDirectProperties: Array<{ name: string; property: any }> = [];
        const moduleGroups: Record<string, Array<{ name: string; property: any }>> = {};
        const userCustomProperties: Array<{ name: string; property: any }> = [];

        Object.entries(properties).forEach(([name, property]) => {
          if (!currentEntity) {
            // 如果没有实体，全部归为用户自定义属性
            userCustomProperties.push({ name, property });
            return;
          }

          // 检查是否为实体直接属性
          const isDirectProperty = currentEntity.attributes.some((attr) => attr.id === name);
          if (isDirectProperty) {
            entityDirectProperties.push({ name, property });
            return;
          }

          // 检查是否为模块属性
          let isModuleProperty = false;
          if (currentEntity.bundles) {
            const modules = getModulesByIds(currentEntity.bundles);
            for (const module of modules) {
              const moduleAttr = module.attributes.find((attr) => attr.id === name);
              if (moduleAttr) {
                if (!moduleGroups[module.id]) {
                  moduleGroups[module.id] = [];
                }
                moduleGroups[module.id].push({ name, property });
                isModuleProperty = true;
                break;
              }
            }
          }

          // 如果不是实体属性也不是模块属性，归为用户自定义属性
          if (!isModuleProperty) {
            userCustomProperties.push({ name, property });
          }
        });

        return (
          <div style={{ padding: '8px 0', width: '100%' }}>
            {/* 实体直接属性 */}
            {entityDirectProperties.length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Text
                  strong
                  style={{
                    fontSize: '12px',
                    color: 'var(--semi-color-text-1)',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  实体属性
                </Text>
                <div style={{ paddingLeft: '4px' }}>
                  {entityDirectProperties.map(({ name, property }) => (
                    <PropertyItem key={name} name={name} property={property} />
                  ))}
                </div>
              </div>
            )}

            {/* 模块属性分组 */}
            {Object.keys(moduleGroups).length > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <Text
                  strong
                  style={{
                    fontSize: '12px',
                    color: 'var(--semi-color-text-1)',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  模块
                </Text>
                {Object.entries(moduleGroups).map(([moduleId, moduleProperties]) => {
                  const modules = getModulesByIds([moduleId]);
                  const module = modules[0];
                  const moduleName = module?.name || moduleId;

                  return (
                    <ModuleGroup
                      key={moduleId}
                      moduleId={moduleId}
                      moduleName={moduleName}
                      properties={moduleProperties}
                      defaultCollapsed={true}
                    />
                  );
                })}
              </div>
            )}

            {/* 用户自定义属性 */}
            {userCustomProperties.length > 0 && (
              <div>
                <Text
                  strong
                  style={{
                    fontSize: '12px',
                    color: 'var(--semi-color-text-1)',
                    marginBottom: '6px',
                    display: 'block',
                  }}
                >
                  自定义属性
                </Text>
                <div style={{ paddingLeft: '4px' }}>
                  {userCustomProperties.map(({ name, property }) => (
                    <PropertyItem key={name} name={name} property={property} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }}
    </Field>
  );
}
