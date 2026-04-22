import { PageContainer } from '@ant-design/pro-components';
import { Card, Form, Input, Button } from 'antd';

export default function Page() {
  return (
    <PageContainer title="Cấu hình hệ thống">
      <Card>
        <Form layout="vertical" style={{ maxWidth: 600 }}>
          <Form.Item label="Key"><Input disabled /></Form.Item>
          <Form.Item label="Value"><Input /></Form.Item>
          <Button type="primary">Lưu</Button>
        </Form>
      </Card>
    </PageContainer>
  );
}
