import React, { useEffect } from 'react';

import {
  EditorRenderer,
  FreeLayoutEditorProvider,
  useClientContext,
  WorkflowDocument,
  useService,
  FlowNodeFormData,
  FormModelV2,
} from '@flowgram.ai/free-layout-editor';

import '@flowgram.ai/free-layout-editor/index.css';
import '../../styles/index.css';
import { DemoTools } from '../tools';
import { SidebarRenderer } from '../sidebar';
import { useModuleStore } from '../ext/entity-property-type-selector/module-store';
import { EnumStoreProvider } from '../ext/entity-property-type-selector/enum-store';
import { useEntityStore } from '../ext/entity-property-type-selector/entity-store';
import { nodeRegistries } from '../../nodes';
import { initialData } from '../../initial-data';
import { useEditorProps } from '../../hooks';

interface WorkflowEditorProps {
  selectedEntityId: string | null;
  style?: React.CSSProperties;
  className?: string;
}

// 实体属性同步组件 - 必须在FreeLayoutEditorProvider内部使用
const EntityPropertySyncer: React.FC<{ selectedEntityId: string | null }> = ({
  selectedEntityId,
}) => {
  const { getEntity } = useEntityStore();
  const { getModulesByIds } = useModuleStore();
  const document = useService(WorkflowDocument);

  // 当选择的实体改变时，立即同步所有Start节点的属性
  useEffect(() => {
    if (!selectedEntityId || !document) return;

    const currentEntity = getEntity(selectedEntityId);
    if (!currentEntity) return;

    // 使用setTimeout避免在渲染过程中更新状态
    const timeoutId = setTimeout(() => {
      try {
        // 构建实体的所有属性（直接属性 + 模块属性）
        const entityProperties: Record<string, any> = {};

        // 添加实体直接属性
        currentEntity.attributes.forEach((attr) => {
          entityProperties[attr.id] = {
            type:
              attr.type === 'n'
                ? 'number'
                : attr.type === 's'
                ? 'string'
                : attr.type?.includes('[')
                ? 'array'
                : 'string',
            title: attr.name || attr.id,
            description: attr.description,
          };
        });

        // 添加模块属性（同级，不带模块前缀）
        if (currentEntity.bundles) {
          const modules = getModulesByIds(currentEntity.bundles);
          modules.forEach((module) => {
            module.attributes.forEach((attr) => {
              // 属性在工作流中都是同级的，不带模块前缀
              entityProperties[attr.id] = {
                type:
                  attr.type === 'n'
                    ? 'number'
                    : attr.type === 's'
                    ? 'string'
                    : attr.type?.includes('[')
                    ? 'array'
                    : 'string',
                title: attr.name || attr.id,
                description: attr.description || `来自模块: ${module.name || module.id}`,
              };
            });
          });
        }

        // 查找所有Start节点并更新其属性
        const allNodes = document.getAllNodes();
        console.log('Found nodes:', allNodes.length);

        allNodes.forEach((node: any, index: number) => {
          try {
            const nodeRegistry = node.getNodeRegistry?.();
            const nodeType = nodeRegistry?.type;
            console.log(`Node ${index}: type=${nodeType}`);

            if (nodeType === 'start') {
              console.log('Processing Start node:', node);

              // 获取节点的form数据
              try {
                const formData = node.getData(FlowNodeFormData);
                const formModel = formData?.getFormModel();

                if (!formModel) {
                  console.warn('No form model found for Start node');
                  return;
                }

                console.log('Found form model for Start node');

                // 获取当前的outputs数据
                const currentOutputs = formModel.getValueIn('outputs') || {};
                const currentProperties = currentOutputs.properties || {};

                // 保留用户自定义的输出属性
                const userProperties: Record<string, any> = {};
                Object.keys(currentProperties).forEach((key) => {
                  if (!entityProperties[key]) {
                    userProperties[key] = currentProperties[key];
                  }
                });

                // 合并实体属性和用户自定义属性
                const mergedProperties = {
                  ...entityProperties,
                  ...userProperties,
                };

                // 构建新的outputs数据
                const newOutputs = {
                  type: 'object',
                  properties: mergedProperties,
                };

                console.log('Updating form outputs with:', newOutputs);

                // 使用form API更新outputs
                formModel.setValueIn('outputs', newOutputs);

                // 同时更新实体定义
                const entityDefinition = {
                  entityId: currentEntity.id,
                  entityName: currentEntity.name,
                  entityDescription: currentEntity.description,
                };

                formModel.setValueIn('data.entityDefinition', entityDefinition);

                console.log('Successfully updated Start node form data');
              } catch (formError) {
                console.error('Failed to update form data:', formError);
              }
            }
          } catch (nodeError) {
            console.error(`Error processing node ${index}:`, nodeError);
          }
        });
      } catch (error) {
        console.error('Error in EntityPropertySyncer:', error);
      }
    }, 100); // 增加延迟确保节点完全初始化

    return () => clearTimeout(timeoutId);
  }, [selectedEntityId, getEntity, getModulesByIds, document]);

  return null; // 这个组件不渲染任何内容，只负责同步数据
};

export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  selectedEntityId,
  style,
  className,
}) => {
  const editorProps = useEditorProps(initialData, nodeRegistries);

  return (
    <div className={`doc-free-feature-overview ${className || ''}`} style={style}>
      <EnumStoreProvider>
        <FreeLayoutEditorProvider {...editorProps}>
          <div className="demo-container">
            <EditorRenderer className="demo-editor" />
          </div>
          <DemoTools />
          <SidebarRenderer />
          <EntityPropertySyncer selectedEntityId={selectedEntityId} />
        </FreeLayoutEditorProvider>
      </EnumStoreProvider>
    </div>
  );
};
