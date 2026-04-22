import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { history } from 'umi';
import { login, setAuth } from '@/services/auth';
import { useState } from 'react';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await login(values.email, values.password);
      if (!['admin', 'staff', 'teacher'].includes(data.user.role)) {
        message.error('Không có quyền truy cập.');
        return;
      }
      setAuth(data.access_token, data.user);
      history.push('/');
    } catch (e: any) {
      message.error(e.message ?? 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
      <div style={{ width: 320 }}>
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 600, color: '#111' }}>VSTEP Admin</div>
          <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Đăng nhập để tiếp tục</div>
        </div>

        <Form onFinish={onFinish} layout="vertical" requiredMark={false}>
          <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
            <Input prefix={<MailOutlined style={{ color: '#bbb' }} />} placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Mật khẩu" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Đăng nhập
          </Button>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#aaa' }}>
          Demo: admin@vstep.test / password
        </div>
      </div>
    </div>
  );
}
