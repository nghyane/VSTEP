import { Card, Col, Row, Statistic } from 'antd';
import { TeamOutlined, FileTextOutlined, BookOutlined, ReadOutlined } from '@ant-design/icons';

const stats = [
  { title: 'Người dùng', value: 5, icon: <TeamOutlined /> },
  { title: 'Đề thi', value: 3, icon: <FileTextOutlined /> },
  { title: 'Từ vựng', value: 12, icon: <BookOutlined /> },
  { title: 'Ngữ pháp', value: 10, icon: <ReadOutlined /> },
];

export default function Page() {
  return (
    <Row gutter={16}>
      {stats.map((s) => (
        <Col span={6} key={s.title}>
          <Card>
            <Statistic title={s.title} value={s.value} prefix={s.icon} />
          </Card>
        </Col>
      ))}
    </Row>
  );
}
