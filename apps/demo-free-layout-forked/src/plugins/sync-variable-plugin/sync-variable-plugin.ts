import {
  definePluginCreator,
  FlowNodeVariableData,
  getNodeForm,
  PluginCreator,
  FreeLayoutPluginContext,
  ASTFactory,
} from '@flowgram.ai/free-layout-editor';
import { JsonSchemaUtils } from '@flowgram.ai/form-materials';

export interface SyncVariablePluginOptions {}

/**
 * Creates a plugin to synchronize output data to the variable engine when nodes are created or updated.
 * @param ctx - The plugin context, containing the document and other relevant information.
 * @param options - Plugin options, currently an empty object.
 */
export const createSyncVariablePlugin: PluginCreator<SyncVariablePluginOptions> =
  definePluginCreator<SyncVariablePluginOptions, FreeLayoutPluginContext>({
    onInit(ctx, options) {
      const flowDocument = ctx.document;

      // Listen for node creation events
      flowDocument.onNodeCreate(({ node }) => {
        const form = getNodeForm(node);
        const variableData = node.getData(FlowNodeVariableData);

        /**
         * 检查数据是否为有效的JSON Schema
         */
        const isValidJsonSchema = (value: any): boolean => {
          if (!value || typeof value !== 'object') return false;
          if (!value.type) return false;
          if (value.type === 'object' && !value.properties) return false;
          return true;
        };

        /**
         * Synchronizes output data to the variable engine.
         * @param value - The output data to synchronize.
         */
        const syncOutputs = (value: any) => {
          // 静默处理无效数据
          if (!isValidJsonSchema(value)) {
            variableData.clearVar();
            return;
          }

          // Create an Type AST from the output data's JSON schema
          const typeAST = JsonSchemaUtils.schemaToAST(value);

          if (typeAST) {
            // Use the node's title or its ID as the title for the variable
            const title = form?.getValueIn('title') || node.id;

            // Set the variable in the variable engine
            variableData.setVar(
              ASTFactory.createVariableDeclaration({
                meta: {
                  title: `${title}`,
                  icon: node.getNodeRegistry()?.info?.icon,
                },
                key: `${node.id}`,
                type: typeAST,
              })
            );
          } else {
            variableData.clearVar();
          }
        };

        if (form) {
          // 安全地同步outputs数据
          const safeSync = (fieldPath: string) => {
            const value = form.getValueIn(fieldPath);
            if (isValidJsonSchema(value)) {
              syncOutputs(value);
            }
          };

          // Initially synchronize the output data
          safeSync('outputs');

          // Listen for changes in the form values and re-synchronize when outputs change
          form.onFormValuesChange((props) => {
            if (props.name.match(/^outputs/) || props.name.match(/^title/)) {
              safeSync('outputs');
            }
          });

          // For Start nodes, also listen for data.outputs changes (entity property sync)
          const nodeRegistry = node.getNodeRegistry?.();
          if (nodeRegistry?.type === 'start') {
            form.onFormValuesChange((props) => {
              if (props.name.match(/^data\.outputs/)) {
                safeSync('data.outputs');
              }
            });

            // 立即同步一次当前的data.outputs
            safeSync('data.outputs');
          }
        }
      });
    },
  });
