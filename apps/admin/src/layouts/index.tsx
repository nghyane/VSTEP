import {
  BookOutlined,
  DashboardOutlined,
  FileTextOutlined,
  SettingOutlined,
  SoundOutlined,
  TeamOutlined,
  EditOutlined,
  AudioOutlined,
  MessageOutlined,
  BankOutlined,
  LogoutOutlined,
  GiftOutlined,
} from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import { ConfigProvider, Dropdown, theme } from 'antd';
import { Outlet, history, useLocation } from 'umi';
import { clearAuth, getToken, getUser } from '@/services/auth';
import { useEffect } from 'react';
import './index.less';

const route = {
  path: '/',
  children: [
    { path: '/', name: 'Tổng quan', icon: <DashboardOutlined /> },
    {
      name: 'Nội dung',
      icon: <BookOutlined />,
      children: [
        { path: '/vocab', name: 'Từ vựng' },
        { path: '/grammar', name: 'Ngữ pháp' },
      ],
    },
    {
      name: 'Đề thi',
      icon: <FileTextOutlined />,
      children: [
        { path: '/exams', name: 'Danh sách đề' },
      ],
    },
    {
      name: 'Luyện tập',
      icon: <EditOutlined />,
      children: [
        { path: '/practice/listening', name: 'Nghe', icon: <SoundOutlined /> },
        { path: '/practice/reading', name: 'Đọc' },
        { path: '/practice/writing', name: 'Viết' },
        { path: '/practice/speaking-drills', name: 'Phát âm', icon: <AudioOutlined /> },
        { path: '/practice/speaking-tasks', name: 'Nói', icon: <MessageOutlined /> },
      ],
    },
    {
      name: 'Quản lý',
      icon: <TeamOutlined />,
      children: [
        { path: '/users', name: 'Người dùng' },
        { path: '/courses', name: 'Khóa học', icon: <BankOutlined /> },
        { path: '/promo', name: 'Mã khuyến mãi', icon: <GiftOutlined /> },
      ],
    },
    {
      name: 'Hệ thống',
      icon: <SettingOutlined />,
      children: [
        { path: '/settings', name: 'Cấu hình' },
      ],
    },
  ],
};

export default function Layout() {
  const location = useLocation();
  const user = getUser();

  useEffect(() => {
    if (!getToken() && location.pathname !== '/login') {
      history.push('/login');
    }
  }, [location.pathname]);

  if (location.pathname === '/login') {
    return <Outlet />;
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
          borderRadius: 6,
        },
      }}
    >
      <ProLayout
        title="VSTEP"
        logo={false}
        layout="side"
        fixSiderbar
        siderWidth={216}
        route={route}
        location={{ pathname: location.pathname }}
        menuItemRender={(item, dom) => (
          <a onClick={() => item.path && history.push(item.path)}>{dom}</a>
        )}
        menuProps={{ defaultOpenAll: true }}
        avatarProps={{
          title: user?.full_name ?? 'Admin',
          size: 'small',
          render: (_, dom) => (
            <Dropdown
              menu={{
                items: [
                  { key: 'role', label: user?.role?.toUpperCase(), disabled: true },
                  { type: 'divider' },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Đăng xuất',
                    onClick: () => { clearAuth(); history.push('/login'); },
                  },
                ],
              }}
            >
              {dom}
            </Dropdown>
          ),
        }}
      >
        <Outlet />
      </ProLayout>
    </ConfigProvider>
  );
}
