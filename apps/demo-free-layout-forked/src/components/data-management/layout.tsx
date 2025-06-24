import React, { ReactNode } from 'react';

import { Layout, Typography } from '@douyinfe/semi-ui';

const { Sider, Content, Header } = Layout;
const { Title } = Typography;

interface DataManagementLayoutProps {
  // 页面标题
  title: string;
  // 操作按钮
  headerActions?: ReactNode;

  // 左侧面板
  sidebarWidth?: number;
  sidebarContent: ReactNode;

  // 右侧面板
  detailContent: ReactNode;

  // 额外的样式
  style?: React.CSSProperties;
}

export const DataManagementLayout: React.FC<DataManagementLayoutProps> = ({
  title,
  headerActions,
  sidebarWidth = 320,
  sidebarContent,
  detailContent,
  style,
}) => (
  <Layout style={{ height: '100%', display: 'flex', flexDirection: 'column', ...style }}>
    <Header
      style={{
        padding: '16px 24px',
        backgroundColor: 'var(--semi-color-bg-1)',
        flexShrink: 0,
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
          width: sidebarWidth,
          minWidth: sidebarWidth,
          maxWidth: sidebarWidth,
          flexShrink: 0,
          backgroundColor: 'var(--semi-color-bg-1)',
        }}
      >
        {sidebarContent}
      </Sider>
      <Content
        style={{
          flex: 1,
          backgroundColor: 'var(--semi-color-bg-0)',
          overflow: 'hidden',
        }}
      >
        {detailContent}
      </Content>
    </Layout>
  </Layout>
);
