import { App, Alert, Badge, Button, Card, Col, List, Row, Statistic, Table, Tag, Timeline, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { history } from 'umi';
import { getUser } from '@/services/auth';
import {
  fetchStats, fetchAlerts, fetchActionItems, fetchContentStatus, fetchRecentActivity,
  type Stats, type Alert as AlertItem, type ActionItem, type ContentStatusItem, type RecentActivityItem,
} from '@/services/api';
import { useEffect, useState } from 'react';

const ACTION_LABELS: Record<string, string> = {
  user_registered: 'Người dùng đăng ký',
  exam_published: 'Đề thi xuất bản',
  vocab_created: 'Chủ đề từ vựng tạo mới',
  grammar_created: 'Điểm ngữ pháp thêm',
};

function relativeTime(date: string): string {
  const h = Math.floor((Date.now() - new Date(date).getTime()) / 3600000);
  if (h < 1) return 'Vừa xong';
  if (h < 24) return `${h} giờ trước`;
  return `${Math.floor(h / 24)} ngày trước`;
}

export default function DashboardPage() {
  const { message } = App.useApp();
  const user = getUser();
  const role = user?.role ?? 'admin';

  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [contentStatus, setContentStatus] = useState<ContentStatusItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (role === 'teacher') return;
    setLoading(true);
    Promise.all([fetchStats(), fetchAlerts(), fetchActionItems(), fetchContentStatus(), fetchRecentActivity()])
      .then(([s, a, ai, c, r]) => {
        setStats(s); setAlerts(a); setActionItems(ai); setContentStatus(c); setRecentActivity(r);
      })
      .catch((e) => message.error(e.message ?? 'Không tải được dữ liệu'))
      .finally(() => setLoading(false));
  }, [role]);

  const title = role === 'teacher' ? 'Lịch dạy' : role === 'staff' ? 'Tổng quan vận hành' : 'Tổng quan hệ thống';

  return (
    <PageContainer title={title} subTitle={`Xin chào, ${user?.full_name}`} loading={loading}>
      <Row gutter={[16, 16]}>

        {/* Zone 1 — Alerts (only when issues exist) */}
        {alerts.map((a, i) => (
          <Col span={24} key={i}>
            <Alert
              type={a.type}
              message={a.message}
              showIcon
              action={<Button size="small" onClick={() => history.push(a.action)}>Xem</Button>}
              closable
            />
          </Col>
        ))}

        {/* Zone 2 — Key metrics */}
        {stats && (
          <>
            <Col span={6}>
              <Card>
                <Statistic title="Người dùng" value={stats.users_total} />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  +{stats.users_today} hôm nay · +{stats.users_this_week} tuần này
                </Typography.Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Phiên thi" value={stats.sessions_active} suffix="đang thi" />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.sessions_today} phiên hôm nay
                  {stats.sessions_stuck > 0 && <Tag color="red" style={{ marginLeft: 4 }}>{stats.sessions_stuck} stuck</Tag>}
                </Typography.Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Chấm điểm"
                  value={stats.grading_pending}
                  suffix="đang chờ"
                  valueStyle={stats.grading_failed > 0 ? { color: '#ff4d4f' } : undefined}
                />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.grading_failed > 0
                    ? <Tag color="red">{stats.grading_failed} thất bại</Tag>
                    : `${stats.grading_done_today} xong hôm nay`}
                </Typography.Text>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="Nội dung" value={stats.exams_published} suffix="đề đã xuất bản" />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {stats.vocab_topics} chủ đề · {stats.grammar_points} ngữ pháp
                  {stats.exams_draft > 0 && <Tag color="orange" style={{ marginLeft: 4 }}>{stats.exams_draft} nháp</Tag>}
                </Typography.Text>
              </Card>
            </Col>
          </>
        )}

        {/* Zone 3 — Action items + Recent activity */}
        {actionItems.length > 0 && (
          <Col span={8}>
            <Card title="Cần làm ngay">
              <List
                size="small"
                dataSource={actionItems}
                renderItem={(item) => (
                  <List.Item
                    actions={[<Button size="small" type="link" onClick={() => history.push(item.action)}>Xem</Button>]}
                  >
                    <Badge count={item.badge} offset={[8, 0]}>
                      <Typography.Text>{item.label}</Typography.Text>
                    </Badge>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        )}

        <Col span={actionItems.length > 0 ? 8 : 12}>
          <Card title="Trạng thái nội dung">
            <Table
              rowKey="type" size="small" pagination={false}
              dataSource={contentStatus}
              columns={[
                { title: 'Loại', dataIndex: 'type' },
                { title: 'Xuất bản', dataIndex: 'published', render: (v: number) => <Tag color="green">{v}</Tag> },
                { title: 'Nháp', dataIndex: 'draft', render: (v: number) => v > 0 ? <Tag color="orange">{v}</Tag> : <Tag>{v}</Tag> },
              ]}
            />
          </Card>
        </Col>

        <Col span={actionItems.length > 0 ? 8 : 12}>
          <Card title="Hoạt động gần đây">
            <Timeline
              items={recentActivity.map((item) => ({
                color: item.action === 'exam_published' ? 'green' : 'blue',
                children: (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Typography.Text strong style={{ display: 'block', fontSize: 13 }}>
                        {ACTION_LABELS[item.action] ?? item.action}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{item.detail}</Typography.Text>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12, flexShrink: 0, marginLeft: 8 }}>
                      {relativeTime(item.happened_at)}
                    </Typography.Text>
                  </div>
                ),
              }))}
            />
          </Card>
        </Col>

        {/* Zone 4 — Grading queue (admin only) */}
        {role === 'admin' && stats && (
          <Col span={24}>
            <Card title="Hàng đợi chấm điểm">
              <Row gutter={16}>
                <Col span={8}><Statistic title="Đang chờ" value={stats.grading_pending} prefix={<ClockCircleOutlined />} valueStyle={{ color: '#faad14' }} /></Col>
                <Col span={8}><Statistic title="Hoàn thành hôm nay" value={stats.grading_done_today} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Col>
                <Col span={8}><Statistic title="Thất bại" value={stats.grading_failed} prefix={<ExclamationCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} /></Col>
              </Row>
            </Card>
          </Col>
        )}

      </Row>
    </PageContainer>
  );
}
