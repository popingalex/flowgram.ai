import React, { useContext } from 'react';

import { PlaygroundEntityContext, FlowNodeFormData } from '@flowgram.ai/free-layout-editor';
import { TreeSelect, Tag } from '@douyinfe/semi-ui';

import { useBehaviorStore } from '../../../stores';

interface InvokeFunctionSelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export const InvokeFunctionSelector: React.FC<InvokeFunctionSelectorProps> = ({
  value,
  onChange,
}) => {
  const { behaviors, loadBehaviors, loading } = useBehaviorStore();
  const playgroundEntity = useContext(PlaygroundEntityContext);

  // 添加展开状态管理
  const [expandedKeys, setExpandedKeys] = React.useState<string[]>([]);

  React.useEffect(() => {
    loadBehaviors();
  }, [loadBehaviors]);

  // 计算实际显示的value - 支持从后台functionMeta.id转换为_indexId
  const displayValue = React.useMemo(() => {
    console.log('[InvokeFunctionSelector] displayValue计算开始:', {
      value,
      behaviorsCount: behaviors.length,
      hasPlaygroundEntity: !!playgroundEntity,
    });

    if (value) {
      console.log('[InvokeFunctionSelector] 使用已有的value:', value);
      return value; // 如果已经有_indexId，直接使用
    }

    // 尝试从节点的functionMeta中获取函数ID
    if (playgroundEntity) {
      try {
        const formData = playgroundEntity.getData(FlowNodeFormData);
        console.log('[InvokeFunctionSelector] 获取到formData:', !!formData);

        if (formData) {
          const formModel = formData.getFormModel();
          console.log('[InvokeFunctionSelector] 获取到formModel:', !!formModel);

          if (formModel && formModel.values) {
            console.log('[InvokeFunctionSelector] formModel.values完整结构:', formModel.values);
            console.log(
              '[InvokeFunctionSelector] formModel.values的keys:',
              Object.keys(formModel.values)
            );

            if (formModel.values.data) {
              const functionMeta = formModel.values.data.functionMeta;
              console.log('[InvokeFunctionSelector] functionMeta对象:', functionMeta);

              const functionId = functionMeta?.id;
              console.log('[InvokeFunctionSelector] 提取的functionId:', functionId);

              if (functionId) {
                // 🔧 修复：直接使用functionMeta.id查找对应的behavior，然后返回其_indexId
                const matchedBehavior = behaviors.find((b) => b.id === functionId);
                if (matchedBehavior) {
                  console.log(
                    `[InvokeFunctionSelector] 找到匹配的函数: ${functionId} -> ${matchedBehavior._indexId}`
                  );
                  return matchedBehavior._indexId;
                } else {
                  console.warn(`[InvokeFunctionSelector] 未找到匹配的函数: ${functionId}`);
                  console.log(
                    '[InvokeFunctionSelector] 可用的behavior IDs:',
                    behaviors.map((b) => b.id)
                  );
                }
              } else {
                console.warn('[InvokeFunctionSelector] functionMeta.id为空');
              }
            } else {
              console.warn('[InvokeFunctionSelector] formModel.values.data不存在');
              // 🔧 尝试直接从formModel.values中获取functionMeta
              const functionMeta = formModel.values.functionMeta;
              console.log('[InvokeFunctionSelector] 尝试直接获取functionMeta:', functionMeta);

              if (functionMeta && functionMeta.id) {
                const functionId = functionMeta.id;
                console.log('[InvokeFunctionSelector] 从根级别获取的functionId:', functionId);

                const matchedBehavior = behaviors.find((b) => b.id === functionId);
                if (matchedBehavior) {
                  console.log(
                    `[InvokeFunctionSelector] 找到匹配的函数: ${functionId} -> ${matchedBehavior._indexId}`
                  );
                  return matchedBehavior._indexId;
                } else {
                  console.warn(`[InvokeFunctionSelector] 未找到匹配的函数: ${functionId}`);
                }
              }
            }
          } else {
            console.warn('[InvokeFunctionSelector] formModel.values不存在');
          }
        }
      } catch (error) {
        console.error('[InvokeFunctionSelector] 获取functionMeta失败:', error);
      }
    }

    console.log('[InvokeFunctionSelector] displayValue计算结束，返回undefined');
    return undefined;
  }, [value, behaviors, playgroundEntity]);

  // 构建树形数据结构，按Java类名分组
  const treeData = React.useMemo(() => {
    const grouped: Record<string, any[]> = {};

    // 🔧 找到当前选中函数所属的类别
    const selectedBehavior = behaviors.find((b) => b._indexId === displayValue);
    const selectedCategory = selectedBehavior?.category;

    behaviors.forEach((behavior) => {
      // 🔧 修复：使用category字段进行分组，而不是className
      const categoryName = behavior.category || '其他';

      if (!grouped[categoryName]) {
        grouped[categoryName] = [];
      }

      grouped[categoryName].push({
        label: (
          <div
            style={{ width: '100%', paddingRight: '12px' }}
            title={behavior.fullClassName || behavior.id} // 在tooltip中显示完整类名
          >
            {/* 只显示方法名，简洁明了 */}
            <span style={{ fontWeight: 500, fontSize: '14px' }}>
              {behavior.methodName || behavior.name}
            </span>
          </div>
        ),
        value: behavior._indexId,
        key: behavior._indexId,
      });
    });

    return Object.keys(grouped)
      .sort()
      .map((categoryName) => {
        // 🔧 判断当前类别是否包含选中的函数
        const isSelectedCategory = categoryName === selectedCategory;

        return {
          label: (
            <div
              style={{
                cursor: 'pointer',
                width: '100%',
                padding: '4px 0',
                // 🔧 添加选中高亮效果
                backgroundColor: isSelectedCategory ? '#e6f7ff' : 'transparent',
                borderRadius: '4px',
                fontWeight: isSelectedCategory ? 600 : 400,
                color: isSelectedCategory ? '#1890ff' : 'inherit',
                transition: 'all 0.2s ease',
              }}
              onClick={(e) => {
                e.stopPropagation();
                const nodeKey = categoryName;

                if (expandedKeys.includes(nodeKey)) {
                  // 如果已展开，则收缩
                  setExpandedKeys(expandedKeys.filter((key) => key !== nodeKey));
                } else {
                  // 如果未展开，则展开
                  setExpandedKeys([...expandedKeys, nodeKey]);
                }
              }}
            >
              {categoryName}
            </div>
          ),
          value: categoryName,
          key: categoryName,
          disabled: true, // 保持禁用，防止选择分类节点
          isLeaf: false,
          children: grouped[categoryName],
        };
      });
  }, [behaviors, expandedKeys, displayValue]); // 🔧 添加displayValue为依赖，确保选中状态变化时重新渲染

  // 处理函数选择，动态更新inputs和outputs
  const handleFunctionSelect = (selectedValue: string) => {
    const selectedBehavior = behaviors.find((b) => b._indexId === selectedValue);
    if (!selectedBehavior) {
      return;
    }

    if (!playgroundEntity) {
      return;
    }

    try {
      // 使用正确的方式获取节点表单数据
      const formData = playgroundEntity.getData(FlowNodeFormData);
      if (!formData) {
        return;
      }

      // 获取当前表单值
      const formModel = formData.getFormModel();
      const currentValues = formModel.values;

      // 构建新的inputs schema - 只包含函数特定的参数
      const newInputs: any = {
        type: 'object',
        required: [],
        properties: {},
      };

      // 只添加函数特定的参数，不添加基础API参数
      selectedBehavior.parameters.forEach((param) => {
        newInputs.properties[param.name] = {
          type: param.type,
          title: param.name,
          description: param.description,
        };

        if (param.required) {
          newInputs.required.push(param.name);
        }
      });

      // 构建新的outputs schema
      const newOutputs: any = {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            title: '调用成功',
            description: '函数调用是否成功',
          },
          statusCode: {
            type: 'number',
            title: 'HTTP状态码',
            description: 'API调用返回的HTTP状态码',
          },
          responseTime: {
            type: 'number',
            title: '响应时间(ms)',
            description: 'API调用的响应时间',
          },
          error: {
            type: 'string',
            title: '错误信息',
            description: '调用失败时的错误信息',
          },
          result: {
            type: selectedBehavior.returns.type,
            title: '调用结果',
            description: selectedBehavior.returns.description || '函数返回的结果数据',
          },
        },
      };

      // 更新节点数据，保留其他现有数据，同时设置title
      const updatedData = {
        ...currentValues.data,
        title: selectedBehavior.methodName || selectedBehavior.name, // 使用函数名作为标题
        inputs: newInputs,
        outputs: newOutputs,
        functionMeta: {
          id: selectedBehavior.id,
          name: selectedBehavior.name,
          description: selectedBehavior.description,
          category: selectedBehavior.category,
          // Java函数没有HTTP端点和方法概念
          functionType: 'java-function',
          parameters: selectedBehavior.parameters,
          returns: selectedBehavior.returns,
        },
      };

      // 使用正确的更新方法 - 只传入data部分
      formData.updateFormValues(updatedData);
    } catch (error) {
      console.error('InvokeFunctionSelector: 更新节点数据失败:', error);
    }
  };

  // 处理展开状态变化
  const handleExpand = (expandedKeys: string[]) => {
    setExpandedKeys(expandedKeys);
  };

  const handleChange = (value: string | number | any[] | Record<string, any> | undefined) => {
    const selectedValue = value as string;

    // 只有当选择的是叶子节点（实际的函数）时，才执行相关逻辑
    const selectedBehavior = behaviors.find((b) => b._indexId === selectedValue);
    if (selectedBehavior) {
      onChange?.(selectedValue);
      handleFunctionSelect(selectedValue);
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <TreeSelect
        placeholder="选择要调用的函数"
        style={{ width: '100%' }}
        value={displayValue}
        onChange={handleChange}
        showClear
        filterTreeNode
        treeData={treeData}
        expandedKeys={expandedKeys}
        onExpand={handleExpand}
        dropdownStyle={{
          maxHeight: '400px',
          overflow: 'auto',
        }}
        disabled={loading}
        treeNodeFilterProp="label"
        expandAll={false} // 默认不展开
      />
    </div>
  );
};
