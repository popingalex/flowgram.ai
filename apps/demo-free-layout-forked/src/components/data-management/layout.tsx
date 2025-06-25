import React from 'react';

import { Layout, Typography } from '@douyinfe/semi-ui';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

export interface DataManagementLayoutProps {
  title: string;
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
    <Header
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
      <Title heading={4} style={{ margin: 0 }}>
        {title}
      </Title>
      {headerActions && <div>{headerActions}</div>}
    </Header>
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
