import { PageContainer } from '@ant-design/pro-components';
import { Card, Descriptions } from 'antd';
import { useParams } from 'umi';

export default function Page() {
  const { id } = useParams<{ id: string }>();
  return (
    <PageContainer title="Chi tiết" onBack={() => history.back()}>
      <Card>
        <Descriptions column={2}>
          <Descriptions.Item label="ID">{id}</Descriptions.Item>
        </Descriptions>
      </Card>
    </PageContainer>
  );
}
