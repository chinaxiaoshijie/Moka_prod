import React from 'react';
import {
  Descriptions,
  Card,
  Space,
  Tag,
  Button,
  Progress,
  Rate,
  Typography,
  Row,
  Col,
  Avatar,
  Divider,
  Tooltip,
  Alert,
} from 'antd';
import {
  EditOutlined,
  UserOutlined,
  CalendarOutlined,
  StarOutlined,
  TrophyOutlined,
  BookOutlined,
  BulbOutlined,
  CommentOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  HeartOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useUser } from '../../hooks/useAuth';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

interface Feedback {
  id: number;
  interview_id: number;
  interviewer_id: number;
  interviewer_name: string;
  candidate_id: number;
  candidate_name: string;
  position_id: number;
  position_title: string;
  interview_round: number;
  template_id: number | null;
  technical_score: number | null;
  communication_score: number | null;
  problem_solving_score: number | null;
  cultural_fit_score: number | null;
  leadership_score: number | null;
  creativity_score: number | null;
  strengths: string;
  weaknesses: string;
  technical_assessment: string;
  behavioral_assessment: string;
  improvement_suggestions: string;
  additional_notes: string;
  overall_rating: 'excellent' | 'good' | 'average' | 'poor';
  overall_score: number | null;
  recommendation: 'strong_hire' | 'hire' | 'no_hire' | 'strong_no_hire';
  confidence_level: number | null;
  status: 'draft' | 'submitted' | 'reviewed';
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: number | null;
  created_at: string;
  updated_at: string;
}

interface FeedbackDetailProps {
  feedback: Feedback;
  onEdit?: () => void;
}

const FeedbackDetail: React.FC<FeedbackDetailProps> = ({ feedback, onEdit }) => {
  const { user } = useUser();

  // 状态映射
  const statusMap = {
    draft: { text: '草稿', color: 'default' },
    submitted: { text: '已提交', color: 'blue' },
    reviewed: { text: '已审阅', color: 'green' },
  };

  const ratingMap = {
    excellent: { text: '优秀', color: 'green' },
    good: { text: '良好', color: 'blue' },
    average: { text: '一般', color: 'orange' },
    poor: { text: '较差', color: 'red' },
  };

  const recommendationMap = {
    strong_hire: { text: '强烈推荐', color: 'green', icon: '🎯' },
    hire: { text: '推荐录用', color: 'blue', icon: '✅' },
    no_hire: { text: '不推荐', color: 'orange', icon: '❌' },
    strong_no_hire: { text: '强烈不推荐', color: 'red', icon: '🚫' },
  };

  // 计算平均分
  const scores = [
    feedback.technical_score,
    feedback.communication_score,
    feedback.problem_solving_score,
    feedback.cultural_fit_score,
    feedback.leadership_score,
    feedback.creativity_score,
  ].filter(score => score !== null && score !== undefined);

  const averageScore = scores.length > 0 ? scores.reduce((a, b) => a! + b!, 0)! / scores.length : null;

  // 分数项配置
  const scoreItems = [
    {
      label: '技术能力',
      value: feedback.technical_score,
      icon: <ToolOutlined />,
      color: '#1890ff',
    },
    {
      label: '沟通表达',
      value: feedback.communication_score,
      icon: <CommentOutlined />,
      color: '#52c41a',
    },
    {
      label: '问题解决',
      value: feedback.problem_solving_score,
      icon: <BulbOutlined />,
      color: '#fa8c16',
    },
    {
      label: '文化匹配',
      value: feedback.cultural_fit_score,
      icon: <HeartOutlined />,
      color: '#eb2f96',
    },
    {
      label: '领导潜力',
      value: feedback.leadership_score,
      icon: <TeamOutlined />,
      color: '#722ed1',
    },
    {
      label: '创新思维',
      value: feedback.creativity_score,
      icon: <ThunderboltOutlined />,
      color: '#13c2c2',
    },
  ];

  // 检查编辑权限
  const canEdit = user?.isAdmin || feedback.interviewer_id === user?.id;
  const showEdit = canEdit && feedback.status !== 'submitted' && onEdit;

  return (
    <div style={{ padding: '0 4px' }}>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <Title level={4} style={{ marginBottom: 8, display: 'flex', alignItems: 'center' }}>
              <Avatar size="small" icon={<UserOutlined />} style={{ marginRight: 8 }} />
              {feedback.candidate_name} - {feedback.position_title}
            </Title>
            <Space>
              <Text type="secondary">
                <CalendarOutlined style={{ marginRight: 4 }} />
                第{feedback.interview_round}轮面试
              </Text>
              <Tag color={statusMap[feedback.status].color}>
                {statusMap[feedback.status].text}
              </Tag>
            </Space>
          </div>
          {showEdit && (
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={onEdit}
              size="small"
            >
              编辑
            </Button>
          )}
        </div>

        <Descriptions column={2} size="small">
          <Descriptions.Item label="面试官">
            {feedback.interviewer_name}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {dayjs(feedback.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          {feedback.submitted_at && (
            <Descriptions.Item label="提交时间">
              {dayjs(feedback.submitted_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
          {feedback.reviewed_at && (
            <Descriptions.Item label="审阅时间">
              {dayjs(feedback.reviewed_at).format('YYYY-MM-DD HH:mm:ss')}
            </Descriptions.Item>
          )}
        </Descriptions>
      </Card>

      {/* 评分总览 */}
      <Card title={<><StarOutlined /> 评分总览</>} style={{ marginBottom: 16 }}>
        <Row gutter={16} style={{ marginBottom: 24 }}>
          {scoreItems.map((item) => (
            <Col xs={12} sm={8} md={8} key={item.label} style={{ marginBottom: 16 }}>
              <Card size="small" style={{ textAlign: 'center', height: '100%' }}>
                <div style={{ color: item.color, fontSize: 20, marginBottom: 8 }}>
                  {item.icon}
                </div>
                <Text strong style={{ display: 'block', marginBottom: 4 }}>
                  {item.label}
                </Text>
                <Progress
                  type="circle"
                  percent={item.value ? (item.value / 10) * 100 : 0}
                  width={60}
                  format={() => item.value ? item.value.toFixed(1) : '-'}
                  strokeColor={item.color}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* 综合评估 */}
        <Row gutter={24} style={{ marginTop: 24 }}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text strong>平均分数</Text>
              <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff', marginTop: 8 }}>
                {averageScore ? averageScore.toFixed(1) : '-'}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text strong>综合评级</Text>
              <div style={{ marginTop: 8 }}>
                {feedback.overall_rating ? (
                  <Tag color={ratingMap[feedback.overall_rating].color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {ratingMap[feedback.overall_rating].text}
                  </Tag>
                ) : '-'}
              </div>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text strong>推荐结果</Text>
              <div style={{ marginTop: 8 }}>
                {feedback.recommendation ? (
                  <Tag color={recommendationMap[feedback.recommendation].color} style={{ fontSize: 14, padding: '4px 12px' }}>
                    {recommendationMap[feedback.recommendation].icon} {recommendationMap[feedback.recommendation].text}
                  </Tag>
                ) : '-'}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 信心度 */}
        {feedback.confidence_level && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Text strong>评估信心度：</Text>
            <Rate
              disabled
              value={feedback.confidence_level}
              style={{ marginLeft: 8 }}
            />
            <Text style={{ marginLeft: 8 }}>({feedback.confidence_level}/5)</Text>
          </div>
        )}
      </Card>

      {/* 详细评价 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={<><TrophyOutlined /> 优势亮点</>}
            size="small"
            style={{ marginBottom: 16, height: '200px' }}
          >
            {feedback.strengths ? (
              <Paragraph style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
                {feedback.strengths}
              </Paragraph>
            ) : (
              <Text type="secondary">暂无记录</Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<><BookOutlined /> 待改进点</>}
            size="small"
            style={{ marginBottom: 16, height: '200px' }}
          >
            {feedback.weaknesses ? (
              <Paragraph style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
                {feedback.weaknesses}
              </Paragraph>
            ) : (
              <Text type="secondary">暂无记录</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 专业评估 */}
      <Row gutter={16}>
        <Col span={12}>
          <Card
            title={<><ToolOutlined /> 技术评估</>}
            size="small"
            style={{ marginBottom: 16, height: '200px' }}
          >
            {feedback.technical_assessment ? (
              <Paragraph style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
                {feedback.technical_assessment}
              </Paragraph>
            ) : (
              <Text type="secondary">暂无记录</Text>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card
            title={<><TeamOutlined /> 行为表现</>}
            size="small"
            style={{ marginBottom: 16, height: '200px' }}
          >
            {feedback.behavioral_assessment ? (
              <Paragraph style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
                {feedback.behavioral_assessment}
              </Paragraph>
            ) : (
              <Text type="secondary">暂无记录</Text>
            )}
          </Card>
        </Col>
      </Row>

      {/* 建议和备注 */}
      {feedback.improvement_suggestions && (
        <Card
          title={<><BulbOutlined /> 改进建议</>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Paragraph style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
            {feedback.improvement_suggestions}
          </Paragraph>
        </Card>
      )}

      {feedback.additional_notes && (
        <Card
          title={<><CommentOutlined /> 补充说明</>}
          size="small"
          style={{ marginBottom: 16 }}
        >
          <Paragraph style={{ marginBottom: 0, fontSize: 14, lineHeight: 1.6 }}>
            {feedback.additional_notes}
          </Paragraph>
        </Card>
      )}

      {/* 状态提示 */}
      {feedback.status === 'draft' && canEdit && (
        <Alert
          message="反馈处于草稿状态"
          description="您可以继续编辑此反馈，完成后请提交以供审阅。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {feedback.status === 'submitted' && (
        <Alert
          message="反馈已提交"
          description="反馈已提交等待审阅，提交后无法修改。"
          type="success"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
    </div>
  );
};

export default FeedbackDetail;