import React, { useState } from 'react';
import {
  Descriptions,
  Tag,
  Button,
  Space,
  Typography,
  Card,
  Row,
  Col,
  Form,
  Input,
  InputNumber,
  Select,
  Modal,
  message,
  Divider,
  Timeline
} from 'antd';
import {
  EditOutlined,
  CalendarOutlined,
  UserOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  StarOutlined
} from '@ant-design/icons';
import { Interview } from '../../types';
import { interviewService } from '../../services/interview';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

interface InterviewDetailProps {
  interview: Interview;
  onEdit: () => void;
  onFeedback: (feedback: any) => void;
}

interface FeedbackFormData {
  feedback: string;
  score: number;
  result: 'pass' | 'fail' | 'pending';
}

const InterviewDetail: React.FC<InterviewDetailProps> = ({
  interview,
  onEdit,
  onFeedback
}) => {
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [feedbackForm] = Form.useForm();
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // 状态映射
  const statusMap = {
    scheduled: { text: '已安排', color: 'blue' },
    in_progress: { text: '进行中', color: 'orange' },
    completed: { text: '已完成', color: 'green' },
    cancelled: { text: '已取消', color: 'red' },
    no_show: { text: '缺席', color: 'gray' },
  };

  // 面试类型映射
  const typeMap = {
    phone: '电话面试',
    video: '视频面试',
    onsite: '现场面试',
  };

  // 结果映射
  const resultMap = {
    pass: { text: '通过', color: 'green' },
    fail: { text: '未通过', color: 'red' },
    pending: { text: '待定', color: 'orange' },
  };

  const statusInfo = statusMap[interview.status as keyof typeof statusMap];
  const typeText = typeMap[interview.interview_type as keyof typeof typeMap];
  const resultInfo = interview.result ? resultMap[interview.result as keyof typeof resultMap] : null;

  // 计算面试持续时间
  const getInterviewDuration = () => {
    const start = dayjs(interview.scheduled_time);
    const end = start.add(interview.duration, 'minute');
    return `${start.format('YYYY-MM-DD HH:mm')} - ${end.format('HH:mm')}`;
  };

  // 提交反馈
  const handleFeedbackSubmit = async (values: FeedbackFormData) => {
    try {
      setSubmittingFeedback(true);
      const response = await interviewService.submitFeedback(interview.id, values);

      if (response.success) {
        message.success('反馈提交成功');
        setFeedbackModalVisible(false);
        feedbackForm.resetFields();
        onFeedback(values);
      }
    } catch (error: any) {
      message.error(error.message || '反馈提交失败');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // 打开反馈模态框
  const handleOpenFeedback = () => {
    if (interview.feedback || interview.score || interview.result) {
      // 如果已有反馈，填充表单
      feedbackForm.setFieldsValue({
        feedback: interview.feedback || '',
        score: interview.score || undefined,
        result: interview.result || 'pending',
      });
    }
    setFeedbackModalVisible(true);
  };

  return (
    <div>
      {/* 头部信息 */}
      <Card style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4} style={{ margin: 0 }}>
              面试详情 - {interview.candidate_name}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              <Text type="secondary">
                <CalendarOutlined /> {getInterviewDuration()}
              </Text>
              <Text type="secondary">
                <UserOutlined /> {interview.interviewer_name}
              </Text>
            </Space>
          </Col>
          <Col>
            <Space>
              {interview.status === 'completed' && (
                <Button
                  type="default"
                  icon={<StarOutlined />}
                  onClick={handleOpenFeedback}
                >
                  {interview.feedback ? '查看反馈' : '提交反馈'}
                </Button>
              )}
              <Button type="primary" icon={<EditOutlined />} onClick={onEdit}>
                编辑
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={16}>
        {/* 基本信息 */}
        <Col xs={24} lg={12}>
          <Card title="基本信息" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="候选人姓名">
                {interview.candidate_name}
              </Descriptions.Item>
              <Descriptions.Item label="候选人邮箱">
                {interview.candidate_email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="候选人电话">
                {interview.candidate_phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="应聘职位">
                {interview.position_title || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="面试官">
                {interview.interviewer_name}
              </Descriptions.Item>
              <Descriptions.Item label="创建人">
                {interview.created_by_name || '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* 面试安排 */}
        <Col xs={24} lg={12}>
          <Card title="面试安排" style={{ marginBottom: 16 }}>
            <Descriptions column={1} size="small">
              <Descriptions.Item label="面试时间">
                {dayjs(interview.scheduled_time).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label="面试时长">
                {interview.duration}分钟
              </Descriptions.Item>
              <Descriptions.Item label="面试轮次">
                第{interview.interview_round}轮
              </Descriptions.Item>
              <Descriptions.Item label="面试类型">
                {typeText}
              </Descriptions.Item>
              <Descriptions.Item label="面试状态">
                <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="面试地点">
                {interview.location ? (
                  <Space>
                    <EnvironmentOutlined />
                    {interview.location}
                  </Space>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="会议链接">
                {interview.meeting_link ? (
                  <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                    <LinkOutlined /> 点击加入会议
                  </a>
                ) : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      {/* 面试反馈 */}
      {interview.feedback && (
        <Card title="面试反馈" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col xs={24} lg={16}>
              <Text strong>反馈内容：</Text>
              <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', borderRadius: 4 }}>
                {interview.feedback}
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <Space direction="vertical" style={{ width: '100%' }}>
                {interview.score && (
                  <div>
                    <Text strong>评分：</Text>
                    <Tag color="blue" style={{ marginLeft: 8 }}>
                      {interview.score}/10分
                    </Tag>
                  </div>
                )}
                {interview.result && (
                  <div>
                    <Text strong>面试结果：</Text>
                    <Tag color={resultInfo!.color} style={{ marginLeft: 8 }}>
                      {resultInfo!.text}
                    </Tag>
                  </div>
                )}
              </Space>
            </Col>
          </Row>
        </Card>
      )}

      {/* 备注信息 */}
      {interview.notes && (
        <Card title="备注信息" style={{ marginBottom: 16 }}>
          <Text>{interview.notes}</Text>
        </Card>
      )}

      {/* 时间信息 */}
      <Card title="时间信息">
        <Timeline>
          <Timeline.Item>
            <Text strong>创建时间：</Text>
            {dayjs(interview.created_at).format('YYYY-MM-DD HH:mm:ss')}
          </Timeline.Item>
          <Timeline.Item>
            <Text strong>更新时间：</Text>
            {dayjs(interview.updated_at).format('YYYY-MM-DD HH:mm:ss')}
          </Timeline.Item>
          {interview.status === 'completed' && interview.feedback && (
            <Timeline.Item color="green">
              <Text strong>反馈完成</Text>
            </Timeline.Item>
          )}
        </Timeline>
      </Card>

      {/* 反馈提交模态框 */}
      <Modal
        title="面试反馈"
        open={feedbackModalVisible}
        onCancel={() => setFeedbackModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={feedbackForm}
          layout="vertical"
          onFinish={handleFeedbackSubmit}
        >
          <Form.Item
            name="feedback"
            label="反馈内容"
            rules={[{ required: true, message: '请输入面试反馈' }]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述候选人在面试中的表现，包括技术能力、沟通能力、解决问题的思路等..."
            />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="score"
                label="面试评分"
                rules={[{ required: true, message: '请给出面试评分' }]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  step={0.5}
                  style={{ width: '100%' }}
                  placeholder="1-10分"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="result"
                label="面试结果"
                rules={[{ required: true, message: '请选择面试结果' }]}
              >
                <Select placeholder="请选择面试结果">
                  <Option value="pass">通过</Option>
                  <Option value="fail">未通过</Option>
                  <Option value="pending">待定</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Divider />

          <div style={{ textAlign: 'right' }}>
            <Button
              onClick={() => setFeedbackModalVisible(false)}
              style={{ marginRight: 8 }}
            >
              取消
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submittingFeedback}
            >
              提交反馈
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewDetail;