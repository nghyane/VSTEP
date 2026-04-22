import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Table } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function Page() {
  return (
    <PageContainer
      title="Khóa học"
      extra={<Button type="primary" icon={<PlusOutlined />}>Thêm mới</Button>}
    >
      <Card>
        <Table columns={[]} dataSource={[]} />
      </Card>
    </PageContainer>
  );
}
