import React from 'react';

import Editor from '@monaco-editor/react';
import { Select, Space, Typography } from '@douyinfe/semi-ui';

import { CodeLanguage } from '../../../typings/behavior';

const { Text } = Typography;

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: CodeLanguage;
  onLanguageChange: (language: CodeLanguage) => void;
  readonly?: boolean;
  height?: number;
}

// 语言选项
const LANGUAGE_OPTIONS = [
  { value: CodeLanguage.JAVASCRIPT, label: 'JavaScript', monacoLanguage: 'javascript' },
  { value: CodeLanguage.TYPESCRIPT, label: 'TypeScript', monacoLanguage: 'typescript' },
  { value: CodeLanguage.PYTHON, label: 'Python', monacoLanguage: 'python' },
  { value: CodeLanguage.JAVA, label: 'Java', monacoLanguage: 'java' },
];

// 语言默认模板
const LANGUAGE_TEMPLATES: Record<CodeLanguage, string> = {
  [CodeLanguage.JAVASCRIPT]: `// JavaScript 行为函数
function executeBehavior(entities) {
  // 在这里实现你的逻辑
  entities.forEach(entity => {
    // 处理每个实体
    console.log('Processing entity:', entity.id);
  });

  return entities;
}`,
  [CodeLanguage.TYPESCRIPT]: `// TypeScript 行为函数
interface Entity {
  id: string;
  [key: string]: any;
}

function executeBehavior(entities: Entity[]): Entity[] {
  // 在这里实现你的逻辑
  entities.forEach(entity => {
    // 处理每个实体
    console.log('Processing entity:', entity.id);
  });

  return entities;
}`,
  [CodeLanguage.PYTHON]: `# Python 行为函数
def execute_behavior(entities):
    """执行行为逻辑"""
    # 在这里实现你的逻辑
    for entity in entities:
        # 处理每个实体
        print(f"Processing entity: {entity['id']}")

    return entities`,
  [CodeLanguage.JAVA]: `// Java 行为函数
import java.util.List;
import java.util.Map;

public class BehaviorExecutor {

    public List<Map<String, Object>> executeBehavior(List<Map<String, Object>> entities) {
        // 在这里实现你的逻辑
        for (Map<String, Object> entity : entities) {
            // 处理每个实体
            System.out.println("Processing entity: " + entity.get("id"));
        }

        return entities;
    }
}`,
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  onLanguageChange,
  readonly = false,
  height = 400,
}) => {
  // 获取当前语言配置
  const currentLanguageConfig = LANGUAGE_OPTIONS.find((option) => option.value === language);
  const monacoLanguage = currentLanguageConfig?.monacoLanguage || 'javascript';

  // 处理语言切换
  const handleLanguageChange = (newLanguage: CodeLanguage) => {
    if (newLanguage !== language) {
      onLanguageChange(newLanguage);

      // 如果当前代码为空或者是默认模板，则使用新语言的模板
      if (!value.trim() || value === LANGUAGE_TEMPLATES[language]) {
        onChange(LANGUAGE_TEMPLATES[newLanguage]);
      }
    }
  };

  // Monaco编辑器配置
  const editorOptions = {
    readOnly: readonly,
    minimap: { enabled: false },
    lineNumbers: 'on' as const,
    roundedSelection: false,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    theme: 'vs-dark',
    fontSize: 14,
    wordWrap: 'on' as const,
    contextmenu: true,
    selectOnLineNumbers: true,
    glyphMargin: true,
    folding: true,
    foldingStrategy: 'indentation' as const,
    renderLineHighlight: 'all' as const,
    find: {
      addExtraSpaceOnTop: false,
      autoFindInSelection: 'never' as const,
      seedSearchStringFromSelection: 'always' as const,
    },
  };

  return (
    <div style={{ border: '1px solid var(--semi-color-border)', borderRadius: '6px' }}>
      {/* 语言选择头部 */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: '1px solid var(--semi-color-border)',
          backgroundColor: 'var(--semi-color-bg-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text strong style={{ fontSize: '13px' }}>
          自定义代码
        </Text>

        <Space>
          <Text style={{ fontSize: '12px', color: 'var(--semi-color-text-2)' }}>语言:</Text>
          <Select
            value={language}
            onChange={(val: any) => handleLanguageChange(val as CodeLanguage)}
            style={{ width: 120 }}
            size="small"
            disabled={readonly}
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <Select.Option key={option.value} value={option.value}>
                {option.label}
              </Select.Option>
            ))}
          </Select>
        </Space>
      </div>

      {/* Monaco编辑器 */}
      <div style={{ height: `${height}px` }}>
        <Editor
          height="100%"
          language={monacoLanguage}
          value={value}
          onChange={(newValue) => onChange(newValue || '')}
          options={editorOptions}
          theme="vs-dark"
        />
      </div>

      {/* 底部提示 */}
      <div
        style={{
          padding: '8px 12px',
          borderTop: '1px solid var(--semi-color-border)',
          backgroundColor: 'var(--semi-color-bg-1)',
        }}
      >
        <Text type="tertiary" style={{ fontSize: '11px' }}>
          💡 提示：函数接收一个实体数组作为参数，需要返回处理后的实体数组。 支持{' '}
          {LANGUAGE_OPTIONS.map((opt) => opt.label).join('、')} 等语言。
        </Text>
      </div>
    </div>
  );
};

// 获取语言模板的工具函数
export const getLanguageTemplate = (language: CodeLanguage): string =>
  LANGUAGE_TEMPLATES[language] || LANGUAGE_TEMPLATES[CodeLanguage.JAVASCRIPT];
