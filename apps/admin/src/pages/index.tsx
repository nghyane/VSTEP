import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Table, Tag, Typography, Calendar, List, Badge } from 'antd';
import {
  TeamOutlined,
  FileTextOutlined,
  BookOutlined,
  ReadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  SoundOutlined,
  EditOutlined,
} from '@ant-design/icons';
import { getUser } from '@/services/auth';

function AdminStats() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={6}><Card><Statistic title="Người dùng" value={5} prefix={<TeamOutlined />} /></Card></Col>
      <Col span={6}><Card><Statistic title="Đề thi" value={3} prefix={<FileTextOutlined />} /></Card></Col>
      <Col span={6}><Card><Statistic title="Chủ đề từ vựng" value={12} prefix={<BookOutlined />} /></Card></Col>
      <Col span={6}><Card><Statistic title="Điểm ngữ pháp" value={10} prefix={<ReadOutlined />} /></Card></Col>
    </Row>
  );
}

function StaffStats() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={8}><Card><Statistic title="Đề thi" value={3} prefix={<FileTextOutlined />} /></Card></Col>
      <Col span={8}><Card><Statistic title="Chủ đề từ vựng" value={12} prefix={<BookOutlined />} /></Card></Col>
      <Col span={8}><Card><Statistic title="Điểm ngữ pháp" value={10} prefix={<ReadOutlined />} /></Card></Col>
    </Row>
  );
}

function GradingQueue() {
  return (
    <Card title="Hàng đợi chấm điểm" style={{ marginTop: 16 }}>
      <Row gutter={16}>
        <Col span={8}><Statistic title="Đang chờ" value={0} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Col>
        <Col span={8}><Statistic title="Hoàn thành" value={0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Col>
        <Col span={8}><Statistic title="Thất bại" value={0} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Col>
      </Row>
    </Card>
  );
}

function ContentStatus() {
  const data = [
    { type: 'Đề thi', published: 3, draft: 0 },
    { type: 'Bài nghe', published: 6, draft: 0 },
    { type: 'Bài đọc', published: 5, draft: 0 },
    { type: 'Bài viết', published: 5, draft: 0 },
    { type: 'Bài phát âm', published: 4, draft: 0 },
    { type: 'Bài nói', published: 5, draft: 0 },
  ];

  return (
    <Card title="Trạng thái nội dung" style={{ marginTop: 16 }}>
      <Table
        dataSource={data}
        rowKey="type"
        pagination={false}
        size="small"
        columns={[
          { title: 'Loại', dataIndex: 'type' },
          { title: 'Đã xuất bản', dataIndex: 'published', render: (v: number) => <Tag color="green">{v}</Tag> },
          { title: 'Bản nháp', dataIndex: 'draft', render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : <Tag>{v}</Tag> },
        ]}
      />
    </Card>
  );
}

function RecentActivity() {
  const data = [
    { action: 'Người dùng đăng ký', detail: 'learner@vstep.test', time: '2 giờ trước' },
    { action: 'Đề thi xuất bản', detail: 'VSTEP Practice Test 3', time: '5 giờ trước' },
    { action: 'Chủ đề từ vựng tạo mới', detail: 'Economy & Business', time: '1 ngày trước' },
    { action: 'Điểm ngữ pháp thêm', detail: 'Conjunctions & Linking', time: '1 ngày trước' },
  ];

  return (
    <Card title="Hoạt động gần đây" style={{ marginTop: 16 }}>
      <List
        size="small"
        dataSource={data}
        renderItem={(item) => (
          <List.Item extra={<Typography.Text type="secondary">{item.time}</Typography.Text>}>
            <List.Item.Meta title={item.action} description={item.detail} />
          </List.Item>
        )}
      />
    </Card>
  );
}

function TeacherDashboard() {
  const slots = [
    { time: '09:00 - 10:30', course: 'VSTEP B2 Sáng', student: 'Nguyễn Văn A', meetUrl: '' },
    { time: '14:00 - 15:30', course: 'VSTEP C1 Chiều', student: 'Trần Thị B', meetUrl: '' },
  ];

  const leaveRequests = [
    { date: '25/04/2026', reason: 'Việc cá nhân', status: 'pending' },
  ];

  return (
    <>
      <Card title="Lịch dạy hôm nay">
        <Table
          dataSource={slots}
          rowKey="time"
          pagination={false}
          size="small"
          columns={[
            { title: 'Thời gian', dataIndex: 'time' },
            { title: 'Khóa học', dataIndex: 'course' },
            { title: 'Học viên', dataIndex: 'student' },
            { title: 'Meet URL', dataIndex: 'meetUrl', render: (v: string) => v || <Tag>Chưa có</Tag> },
          ]}
        />
      </Card>

      <Card title="Yêu cầu nghỉ phép" style={{ marginTop: 16 }}>
        <List
          size="small"
          dataSource={leaveRequests}
          renderItem={(item) => (
            <List.Item extra={
              item.status === 'pending' ? <Tag color="orange">Đang chờ</Tag> :
              item.status === 'approved' ? <Tag color="green">Đã duyệt</Tag> :
              <Tag color="red">Từ chối</Tag>
            }>
              <List.Item.Meta title={item.date} description={item.reason} />
            </List.Item>
          )}
        />
      </Card>
    </>
  );
}

export default function DashboardPage() {
  const user = getUser();
  const role = user?.role ?? 'admin';

  const title = role === 'teacher' ? 'Lịch dạy' :
                role === 'staff' ? 'Tổng quan vận hành' :
                'Tổng quan hệ thống';

  return (
    <PageContainer title={title} subTitle={`Xin chào, ${user?.full_name ?? 'Admin'}`}>
      {role === 'teacher' ? (
        <TeacherDashboard />
      ) : (
        <>
          {role === 'admin' ? <AdminStats /> : <StaffStats />}
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}><ContentStatus /></Col>
            <Col span={12}><RecentActivity /></Col>
          </Row>
          {role === 'admin' && <GradingQueue />}
        </>
      )}
    </PageContainer>
  );
}
