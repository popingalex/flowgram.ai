import { useState } from 'react';

import { createRoot } from 'react-dom/client';
import { Button, Space } from '@douyinfe/semi-ui';

import { Editor } from './editor';
import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';

const App = () => {
  const [currentPage, setCurrentPage] = useState<'editor' | 'test'>('test');

  return (
    <div>
      <div
        style={{
          padding: '12px 24px',
          borderBottom: '1px solid var(--semi-color-border)',
          backgroundColor: 'var(--semi-color-bg-1)',
        }}
      >
        <Space>
          <Button
            type={currentPage === 'editor' ? 'primary' : 'tertiary'}
            onClick={() => setCurrentPage('editor')}
          >
            流程图编辑器
          </Button>
          <Button
            type={currentPage === 'test' ? 'primary' : 'tertiary'}
            onClick={() => setCurrentPage('test')}
          >
            实体属性编辑器测试
          </Button>
        </Space>
      </div>

      {currentPage === 'editor' && <Editor />}
      {currentPage === 'test' && <EntityPropertiesEditorTestPage />}
    </div>
  );
};

const app = createRoot(document.getElementById('root')!);

app.render(<App />);
