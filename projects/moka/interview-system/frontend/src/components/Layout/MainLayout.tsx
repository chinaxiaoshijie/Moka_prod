import React from 'react';
import { Layout, Menu, Avatar, Dropdown, Typography, Space } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  FileTextOutlined,
  LogoutOutlined,
  SettingOutlined,
  BankOutlined
} from '@ant-design/icons';
import { useUser } from '../../hooks/useAuth';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const MainLayout: React.FC = () => {
  const { state, logout } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: '工作台',
    },
    {
      key: '/candidates',
      icon: <TeamOutlined />,
      label: '候选人管理',
    },
    {
      key: '/positions',
      icon: <BankOutlined />,
      label: '职位管理',
    },
    {
      key: '/interviews',
      icon: <CalendarOutlined />,
      label: '面试管理',
    },
    {
      key: '/feedbacks',
      icon: <FileTextOutlined />,
      label: '面试反馈',
    },
    {
      key: '/users',
      icon: <UserOutlined />,
      label: '用户管理',
      // 只有admin和hr可以看到
      hidden: !['admin', 'hr'].includes(state.user?.role || ''),
    },
  ].filter(item => !item.hidden);

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleUserMenuClick = ({ key }: { key: string }) => {
    if (key === 'logout') {
      logout();
      navigate('/login');
    } else {
      navigate(`/${key}`);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220}>
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0'
        }}>
          <Typography.Title level={4} style={{ margin: 0, color: '#1890ff' }}>
            面试管理系统
          </Typography.Title>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0, height: 'calc(100vh - 64px)' }}
        />
      </Sider>

      <Layout>
        <Header style={{
          padding: '0 24px',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div />
          <Dropdown
            menu={{
              items: userMenuItems,
              onClick: handleUserMenuClick
            }}
            placement="bottomRight"
          >
            <Space style={{ cursor: 'pointer' }}>
              <Avatar size="small" icon={<UserOutlined />} />
              <div>
                <Text strong>{state.user?.username}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {state.user?.role === 'admin' ? '管理员' :
                   state.user?.role === 'hr' ? 'HR' : '面试官'}
                </Text>
              </div>
            </Space>
          </Dropdown>
        </Header>

        <Content style={{ margin: 0, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
