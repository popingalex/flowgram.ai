import React, { useState } from 'react';

import { createRoot } from 'react-dom/client';
import { Nav } from '@douyinfe/semi-ui';

import { ModuleEntityTestPage } from './components/ext/module-entity-editor/test-page';
import { EntityStoreTestPage } from './components/ext/entity-store/test-page';
import { EntityPropertiesEditorTestPage } from './components/ext/entity-properties-editor/test-page';
import { EditorPage } from './components/editor-page';

type PageType = 'editor' | 'test' | 'store-test' | 'module-entity-test';

export const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<PageType>('editor');

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Nav
        mode="vertical"
        style={{ width: '200px', borderRight: '1px solid #e0e0e0' }}
        defaultSelectedKeys={['editor']}
        onSelect={({ selectedKeys }) => setCurrentPage(selectedKeys[0] as PageType)}
        items={[
          { itemKey: 'editor', text: '流程图编辑器' },
          { itemKey: 'test', text: '属性编辑器测试' },
          { itemKey: 'store-test', text: '实体Store测试' },
          { itemKey: 'module-entity-test', text: '模块实体编辑器' },
        ]}
      />
      <div style={{ flex: 1 }}>
        {currentPage === 'editor' && <EditorPage />}
        {currentPage === 'test' && <EntityPropertiesEditorTestPage />}
        {currentPage === 'store-test' && <EntityStoreTestPage />}
        {currentPage === 'module-entity-test' && <ModuleEntityTestPage />}
      </div>
    </div>
  );
};

const app = createRoot(document.getElementById('root')!);
app.render(<App />);
