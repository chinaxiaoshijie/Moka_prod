import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Typography, Button, Timeline, Avatar, List, Progress, Tag } from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ArrowRightOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useUser } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const { Title, Text } = Typography;

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

interface ActivityItem {
  title: string;
  description: string;
  time: string;
  type: 'interview' | 'candidate' | 'feedback' | 'hire';
}

const Dashboard: React.FC = () => {
  const { state } = useUser();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // 模拟数据 - 实际应从API获取
  const [stats, setStats] = useState({
    totalCandidates: 156,
    todayInterviews: 12,
    pendingFeedback: 8,
    monthlyHires: 5
  });

  const quickActions: QuickAction[] = [
    {
      title: '创建面试',
      description: '安排新的面试',
      icon: <PlusOutlined />,
      path: '/interviews/create',
      color: '#1890ff'
    },
    {
      title: '添加候选人',
      description: '录入候选人信息',
      icon: <UserOutlined />,
      path: '/candidates/create',
      color: '#52c41a'
    },
    {
      title: '查看日历',
      description: '查看面试安排',
      icon: <CalendarOutlined />,
      path: '/interviews',
      color: '#fa8c16'
    },
    {
      title: '待反馈',
      description: '完成面试反馈',
      icon: <CheckCircleOutlined />,
      path: '/feedbacks',
      color: '#722ed1'
    }
  ];

  const recentActivities: ActivityItem[] = [
    {
      title: '张三 - 技术面试',
      description: '前端开发工程师岗位',
      time: '10分钟前',
      type: 'interview'
    },
    {
      title: '李四通过终面',
      description: '后端开发工程师岗位',
      time: '1小时前',
      type: 'hire'
    },
    {
      title: '新候选人：王五',
      description: '投递了产品经理岗位',
      time: '2小时前',
      type: 'candidate'
    },
    {
      title: '赵六面试反馈已提交',
      description: 'UI设计师岗位',
      time: '3小时前',
      type: 'feedback'
    },
    {
      title: '钱七通过初试',
      description: '测试工程师岗位',
      time: '5小时前',
      type: 'interview'
    }
  ];

  const topCandidates = [
    { name: '张三', position: '前端开发工程师', score: 92, status: '面试中' },
    { name: '李四', position: '后端开发工程师', score: 88, status: '待面试' },
    { name: '王五', position: '产品经理', score: 85, status: '待面试' },
    { name: '赵六', position: 'UI设计师', score: 82, status: '已通过' }
  ];

  const getActivityIcon = (type: string) => {
    const icons: Record<string, { icon: React.ReactNode; color: string }> = {
      interview: { icon: <CalendarOutlined />, color: '#1890ff' },
      candidate: { icon: <UserOutlined />, color: '#52c41a' },
      feedback: { icon: <CheckCircleOutlined />, color: '#fa8c16' },
      hire: { icon: <TrophyOutlined />, color: '#722ed1' }
    };
    return icons[type] || icons.interview;
  };

  return (
    <div className="dashboard-container">
      {/* 欢迎区域 */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-greeting">
            <Title level={2} className="greeting-title">
              欢迎回来，{state.user?.username}！
            </Title>
            <Text className="greeting-date">
              {new Date().toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </Text>
          </div>
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className="create-button"
            onClick={() => navigate('/interviews/create')}
          >
            快速创建面试
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[24, 24]} className="stats-row">
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card stat-card-1"
            hoverable
            bordered={false}
          >
            <div className="stat-content">
              <div className="stat-icon stat-icon-1">
                <TeamOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalCandidates}</div>
                <div className="stat-label">总候选人</div>
                <div className="stat-trend">
                  <RiseOutlined />
                  <span>较上月 +12%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card stat-card-2"
            hoverable
            bordered={false}
          >
            <div className="stat-content">
              <div className="stat-icon stat-icon-2">
                <CalendarOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.todayInterviews}</div>
                <div className="stat-label">今日面试</div>
                <div className="stat-trend">
                  <ClockCircleOutlined />
                  <span>3场待开始</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card stat-card-3"
            hoverable
            bordered={false}
          >
            <div className="stat-content">
              <div className="stat-icon stat-icon-3">
                <CheckCircleOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.pendingFeedback}</div>
                <div className="stat-label">待反馈</div>
                <div className="stat-trend stat-trend-urgent">
                  <ArrowRightOutlined />
                  <span>需尽快处理</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card
            className="stat-card stat-card-4"
            hoverable
            bordered={false}
          >
            <div className="stat-content">
              <div className="stat-icon stat-icon-4">
                <TrophyOutlined />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.monthlyHires}</div>
                <div className="stat-label">本月入职</div>
                <div className="stat-trend">
                  <StarOutlined />
                  <span>目标完成 50%</span>
                </div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* 快捷操作 */}
      <Card className="quick-actions-card" bordered={false} title={<Title level={4} style={{ margin: 0 }}>快捷操作</Title>}>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} lg={6} key={index}>
              <Card
                className="action-card"
                hoverable
                bordered={false}
                onClick={() => navigate(action.path)}
                style={{ borderTop: `3px solid ${action.color}` }}
              >
                <div className="action-icon" style={{ color: action.color }}>
                  {action.icon}
                </div>
                <div className="action-title">{action.title}</div>
                <div className="action-description">{action.description}</div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* 内容区域 */}
      <Row gutter={[24, 24]} style={{ marginTop: 24 }}>
        {/* 最近活动 */}
        <Col xs={24} lg={12}>
          <Card
            className="activity-card"
            bordered={false}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ClockCircleOutlined style={{ color: '#1890ff' }} />
                <Title level={4} style={{ margin: 0 }}>最近活动</Title>
              </div>
            }
          >
            <Timeline
              className="activity-timeline"
              items={recentActivities.map((activity, index) => ({
                dot: (
                  <div className="timeline-dot" style={{ backgroundColor: getActivityIcon(activity.type).color }}>
                    {getActivityIcon(activity.type).icon}
                  </div>
                ),
                children: (
                  <div key={index} className="timeline-item">
                    <div className="timeline-title">{activity.title}</div>
                    <div className="timeline-description">{activity.description}</div>
                    <div className="timeline-time">{activity.time}</div>
                  </div>
                )
              }))}
            />
          </Card>
        </Col>

        {/* 优秀候选人 */}
        <Col xs={24} lg={12}>
          <Card
            className="top-candidates-card"
            bordered={false}
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <TrophyOutlined style={{ color: '#faad14' }} />
                <Title level={4} style={{ margin: 0 }}>优秀候选人</Title>
              </div>
            }
          >
            <List
              className="candidates-list"
              dataSource={topCandidates}
              renderItem={(candidate, index) => (
                <List.Item className="candidate-item">
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        className={`candidate-avatar candidate-avatar-${index + 1}`}
                        size={48}
                      >
                        {candidate.name[0]}
                      </Avatar>
                    }
                    title={
                      <div className="candidate-header">
                        <span className="candidate-name">{candidate.name}</span>
                        <Tag color={candidate.score >= 90 ? 'green' : candidate.score >= 80 ? 'blue' : 'default'}>
                          {candidate.score}分
                        </Tag>
                      </div>
                    }
                    description={
                      <div>
                        <div className="candidate-position">{candidate.position}</div>
                        <Progress
                          percent={candidate.score}
                          size="small"
                          showInfo={false}
                          strokeColor={candidate.score >= 90 ? '#52c41a' : candidate.score >= 80 ? '#1890ff' : '#faad14'}
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* 数据概览 */}
      <Card
        className="overview-card"
        bordered={false}
        style={{ marginTop: 24 }}
        title={<Title level={4} style={{ margin: 0 }}>本周招聘数据</Title>}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <div className="overview-item">
              <div className="overview-label">面试完成率</div>
              <Progress type="circle" percent={75} strokeColor="#1890ff" width={120} />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div className="overview-item">
              <div className="overview-label">候选人质量分布</div>
              <div className="quality-bars">
                <div className="quality-bar-item">
                  <span>优秀 (90+)</span>
                  <Progress percent={30} strokeColor="#52c41a" showInfo={false} />
                  <span>30%</span>
                </div>
                <div className="quality-bar-item">
                  <span>良好 (80-89)</span>
                  <Progress percent={45} strokeColor="#1890ff" showInfo={false} />
                  <span>45%</span>
                </div>
                <div className="quality-bar-item">
                  <span>一般 (70-79)</span>
                  <Progress percent={20} strokeColor="#faad14" showInfo={false} />
                  <span>20%</span>
                </div>
                <div className="quality-bar-item">
                  <span>待改进 (&lt;70)</span>
                  <Progress percent={5} strokeColor="#ff4d4f" showInfo={false} />
                  <span>5%</span>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Dashboard;
