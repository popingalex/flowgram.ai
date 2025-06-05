import React from 'react';

import { SidebarPropertyEditor } from './sidebar-property-editor';
import { PropertyTableAdapter } from './property-table-adapter';
import { DrawerPropertyTable } from './drawer-property-table';

const mockProperties = [
  {
    id: 'vehicle_yard_id',
    name: '集结点id',
    type: 's',
    description: '车辆集结点的唯一标识符',
  },
  {
    id: 'task_id',
    name: '任务id',
    type: 's',
    description: '当前执行任务的标识符',
  },
  {
    id: 'mobile/path',
    name: '路径',
    type: 'array',
    description: '移动路径点列表',
    isModuleProperty: true,
    moduleId: 'mobile',
  },
];

export const TestPage: React.FC = () => (
  <div style={{ padding: '20px', maxWidth: '800px' }}>
    <h2>属性表格组件测试页面</h2>

    <div style={{ marginBottom: '40px' }}>
      <h3>节点模式 (PropertyTableAdapter - node)</h3>
      <PropertyTableAdapter title="实体属性" properties={mockProperties} mode="node" />
    </div>

    <div style={{ marginBottom: '40px' }}>
      <h3>抽屉模式 (PropertyTableAdapter - drawer)</h3>
      <PropertyTableAdapter title="实体属性" properties={mockProperties} mode="drawer" />
    </div>

    <div style={{ marginBottom: '40px' }}>
      <h3>抽屉专用组件 (DrawerPropertyTable)</h3>
      <DrawerPropertyTable title="实体属性详情" properties={mockProperties} />
    </div>

    <div style={{ marginBottom: '40px' }}>
      <h3>侧边栏编辑器 (SidebarPropertyEditor)</h3>
      <SidebarPropertyEditor
        title="属性编辑器"
        properties={mockProperties}
        onAdd={() => console.log('添加属性')}
        onEdit={(prop) => console.log('编辑属性:', prop)}
        onDelete={(prop) => console.log('删除属性:', prop)}
      />
    </div>
  </div>
);
