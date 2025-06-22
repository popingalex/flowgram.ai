import React from 'react';

import { Tabs, TabPane } from '@douyinfe/semi-ui';

import { ApiParametersTab } from './api-parameters-tab';
import { ApiDescriptionTab } from './api-description-tab';
import { ApiBodyTab } from './api-body-tab';

interface ApiTabsProps {
  currentEditingApi: any;
  onFieldChange?: (field: string, value: any) => void;
  onParameterChange?: (parameterIndexId: string, field: string, value: any) => void;
  onAddParameter?: (scope: 'query' | 'header' | 'path') => void; // 🔧 修复大小写
  onDeleteParameter?: (parameterIndexId: string) => void;
}

export const ApiTabs: React.FC<ApiTabsProps> = ({
  currentEditingApi,
  onFieldChange,
  onParameterChange,
  onAddParameter,
  onDeleteParameter,
}) => (
  <div style={{ flex: 1, overflow: 'hidden' }}>
    <Tabs defaultActiveKey="params" style={{ height: '100%' }}>
      <TabPane tab="参数" itemKey="params">
        <ApiParametersTab
          currentEditingApi={currentEditingApi}
          onParameterChange={onParameterChange}
          onAddParameter={onAddParameter}
          onDeleteParameter={onDeleteParameter}
        />
      </TabPane>

      <TabPane tab="Body" itemKey="body">
        <ApiBodyTab currentEditingApi={currentEditingApi} onFieldChange={onFieldChange} />
      </TabPane>

      <TabPane tab="描述" itemKey="description">
        <ApiDescriptionTab currentEditingApi={currentEditingApi} onFieldChange={onFieldChange} />
      </TabPane>
    </Tabs>
  </div>
);
