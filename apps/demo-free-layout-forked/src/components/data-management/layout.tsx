import React from 'react';

import { Layout } from '@douyinfe/semi-ui';

const { Content, Sider } = Layout;

export interface DataManagementLayoutProps {
  title?: string;
  headerActions?: React.ReactNode;
  sidebarContent: React.ReactNode;
  detailContent: React.ReactNode;
}

export const DataManagementLayout: React.FC<DataManagementLayoutProps> = ({
  title,
  headerActions,
  sidebarContent,
  detailContent,
}) => (
  <Layout style={{ height: '100%' }}>
    {title && (
      <div
        style={{
          backgroundColor: 'var(--semi-color-bg-1)',
          padding: '0 24px',
          height: '48px',
          borderBottom: '1px solid var(--semi-color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {title}
        </h4>
        {headerActions && <div>{headerActions}</div>}
      </div>
    )}
    
    <Layout style={{ flex: 1, overflow: 'hidden' }}>
      <Sider
        style={{
          backgroundColor: 'var(--semi-color-bg-1)',
          borderRight: '1px solid var(--semi-color-border)',
          width: 350,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: '100%', overflow: 'hidden' }}>{sidebarContent}</div>
      </Sider>
      <Content style={{ flex: 1, overflow: 'hidden' }}>{detailContent}</Content>
    </Layout>
  </Layout>
);
